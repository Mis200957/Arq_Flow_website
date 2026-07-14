import {
  parseCSVText,
  parseExcelText,
  parsePDFText,
  parseDocxText,
  parsePlainText,
  extractGoogleSheetId,
  extractGoogleDocId
} from "./parser";
import { callOpenRouter, normalizeAiOutput } from "./ai";
import { mapStructuredGrid, mapRawItemsToOnboardingItems, ExtractedItem } from "./mapper";

/**
 * Downloads and parses content from a Google Doc or Google Sheet shareable link.
 */
export async function parseGoogleDocOrSheet(
  url: string,
  importType: "products" | "services"
): Promise<ExtractedItem[]> {
  const sheetId = extractGoogleSheetId(url);
  if (sheetId) {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const res = await fetch(exportUrl);
    if (!res.ok) {
      throw new Error(`FAILED_TO_FETCH_GOOGLE_SHEET: ${res.statusText}`);
    }
    const csvText = await res.text();
    const grid = parseCSVText(csvText);

    // Try structured mapping first
    const items = mapStructuredGrid(grid);
    if (items.length > 0) {
      return items;
    }

    // Structured failed, run AI extraction
    const rawText = grid.map(r => r.join(" | ")).join("\n");
    return runAiExtraction(rawText, importType);
  }

  const docId = extractGoogleDocId(url);
  if (docId) {
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const res = await fetch(exportUrl);
    if (!res.ok) {
      throw new Error(`FAILED_TO_FETCH_GOOGLE_DOC: ${res.statusText}`);
    }
    const docText = await res.text();
    return runAiExtraction(docText, importType);
  }

  throw new Error("INVALID_GOOGLE_URL");
}

/**
 * Parses an uploaded file buffer depending on its extension/mime type.
 */
export async function parseUploadedFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  importType: "products" | "services"
): Promise<ExtractedItem[]> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Structured files: CSV or Excel
  if (ext === "csv" || mimeType === "text/csv") {
    const text = buffer.toString("utf-8");
    const grid = parseCSVText(text);
    const items = mapStructuredGrid(grid);
    if (items.length > 0) return items;

    // Structured failed, format grid to text and run AI
    const rawText = grid.map(r => r.join(" | ")).join("\n");
    return runAiExtraction(rawText, importType);
  }

  if (ext === "xlsx" || ext === "xls" || mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    const grid = parseExcelText(buffer);
    const items = mapStructuredGrid(grid);
    if (items.length > 0) return items;

    // Structured failed, format grid to text and run AI
    const rawText = grid.map(r => r.join(" | ")).join("\n");
    return runAiExtraction(rawText, importType);
  }

  // 2. Unstructured files
  let extractedText = "";

  if (ext === "pdf" || mimeType === "application/pdf") {
    extractedText = await parsePDFText(buffer);
  } else if (ext === "docx" || mimeType.includes("word") || mimeType.includes("officedocument.wordprocessingml")) {
    extractedText = await parseDocxText(buffer);
  } else if (ext === "txt" || mimeType.startsWith("text/")) {
    extractedText = parsePlainText(buffer);
  } else {
    throw new Error("UNSUPPORTED_FORMAT");
  }

  if (!extractedText.trim()) {
    throw new Error("EMPTY_FILE_CONTENT");
  }

  return runAiExtraction(extractedText, importType);
}

/**
 * Sends plain text to OpenRouter to parse into the required schema.
 */
export async function runAiExtraction(
  text: string,
  importType: "products" | "services"
): Promise<ExtractedItem[]> {
  const systemPrompt = importType === "products"
    ? `You are an expert data extraction assistant. Your task is to extract products from the provided text and convert them into a strict JSON array.
Each product in the array must strictly match the following schema:
[
  {
    "name": "string (product name)",
    "description": "string (product description)",
    "category": "string (product category)",
    "price": number (price as a number, default to 0),
    "currency": "string (currency, default to 'EGP')",
    "variants": ["string"],
    "extras": ["string"]
  }
]

Rules:
1. Extract ALL products from the text.
2. For price, extract only numerical values. If no price is mentioned, set it to 0.
3. Keep descriptions concise.
4. Output ONLY the raw JSON array.
5. Do NOT wrap the output in markdown code blocks (e.g. do NOT use \`\`\`json).
6. Do NOT include any introductory or explanatory text.`
    : `You are an expert data extraction assistant. Your task is to extract services from the provided text and convert them into a strict JSON array.
Each service in the array must strictly match the following schema:
[
  {
    "name": "string (service name)",
    "description": "string (service description)",
    "category": "string (service category)",
    "price": number (price as a number, default to 0),
    "duration": "string (duration, e.g. '30 mins')",
    "notes": "string (any extra notes or conditions)"
  }
]

Rules:
1. Extract ALL services from the text.
2. For price, extract only numerical values. If no price is mentioned, set it to 0.
3. Keep descriptions concise.
4. Output ONLY the raw JSON array.
5. Do NOT wrap the output in markdown code blocks (e.g. do NOT use \`\`\`json).
6. Do NOT include any introductory or explanatory text.`;

  // Avoid exceeding context limits
  const trimmedText = text.slice(0, 30000);
  const rawResponse = await callOpenRouter(trimmedText, systemPrompt);
  const rawList = normalizeAiOutput(rawResponse);
  return mapRawItemsToOnboardingItems(rawList, importType);
}
