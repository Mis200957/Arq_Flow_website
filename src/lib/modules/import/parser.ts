import * as XLSX from "xlsx";
import mammoth from "mammoth";
// @ts-ignore
import * as pdfParser from "pdf-parse";
const pdf = (pdfParser as any).default || pdfParser;



/**
 * Parses raw CSV text into a grid of strings, handling quotes and escaped quotes.
 */
export function parseCSVText(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      lines.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines.filter(r => r.length > 0 && r.some(cell => cell !== ""));
}

/**
 * Parses an Excel buffer into a grid of strings.
 */
export function parseExcelText(buffer: Buffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  return jsonData
    .map(row =>
      Array.isArray(row)
        ? row.map(cell => String(cell === null || cell === undefined ? "" : cell).trim())
        : []
    )
    .filter(r => r.length > 0 && r.some(cell => cell !== ""));
}

/**
 * Extracts plain text from a PDF buffer, throwing PASSWORD_PROTECTED if encrypted.
 */
export async function parsePDFText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (err: any) {
    const errMsg = String(err?.message || err || "").toLowerCase();
    if (
      err?.name === "PasswordException" ||
      errMsg.includes("password") ||
      errMsg.includes("decrypt") ||
      errMsg.includes("encrypt")
    ) {
      throw new Error("PASSWORD_PROTECTED");
    }
    throw new Error(`Failed to parse PDF: ${err?.message || err}`);
  }
}

/**
 * Extracts plain text from a Word document (.docx) buffer.
 */
export async function parseDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

/**
 * Extracts plain text from a plain text buffer.
 */
export function parsePlainText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

/**
 * Helper to extract Google Sheet ID from a shareable link.
 */
export function extractGoogleSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Helper to extract Google Doc ID from a shareable link.
 */
export function extractGoogleDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
