export interface ExtractedItem {
  id: string;
  name: string;
  price: string;
  description: string;
}

const NAME_FIELDS = [
  "product name", "product", "name", "item", "service", "title", "label", "item name", "service name",
  "الاسم", "اسم المنتج", "الخدمة", "اسم الخدمة", "الصنف", "اسم"
];

const PRICE_FIELDS = [
  "price", "cost", "rate", "amount", "unit price", "value", "price_egp",
  "السعر", "القيمة", "سعر", "التكلفة", "سعر الخدمة"
];

const DESC_FIELDS = [
  "description", "desc", "details", "info", "notes", "about",
  "الوصف", "تفاصيل", "ملاحظات", "شرح", "وصف"
];

const CATEGORY_FIELDS = [
  "category", "type", "group", "class", "genre",
  "القسم", "الفئة", "التصنيف", "النوع", "تصنيف"
];

/**
 * Detects indices for structured headers.
 */
export function detectStructuredColumns(headers: string[]) {
  let nameIdx = -1;
  let priceIdx = -1;
  let descIdx = -1;
  let catIdx = -1;

  const normalized = headers.map(h => String(h || "").trim().toLowerCase());

  // 1. Try exact matches first
  for (let i = 0; i < normalized.length; i++) {
    const header = normalized[i];
    if (!header) continue;

    if (nameIdx === -1 && NAME_FIELDS.includes(header)) nameIdx = i;
    else if (priceIdx === -1 && PRICE_FIELDS.includes(header)) priceIdx = i;
    else if (descIdx === -1 && DESC_FIELDS.includes(header)) descIdx = i;
    else if (catIdx === -1 && CATEGORY_FIELDS.includes(header)) catIdx = i;
  }

  // 2. Fall back to substring match
  for (let i = 0; i < normalized.length; i++) {
    const header = normalized[i];
    if (!header) continue;

    if (nameIdx === -1 && NAME_FIELDS.some(f => header.includes(f))) nameIdx = i;
    else if (priceIdx === -1 && PRICE_FIELDS.some(f => header.includes(f))) priceIdx = i;
    else if (descIdx === -1 && DESC_FIELDS.some(f => header.includes(f))) descIdx = i;
    else if (catIdx === -1 && CATEGORY_FIELDS.some(f => header.includes(f))) catIdx = i;
  }

  return { nameIdx, priceIdx, descIdx, catIdx };
}

/**
 * Maps a grid of rows (Excel/CSV) into normalized ExtractedItem.
 * Returns empty array if Name column cannot be matched.
 */
export function mapStructuredGrid(grid: string[][]): ExtractedItem[] {
  if (grid.length < 2) return [];

  const headers = grid[0];
  const { nameIdx, priceIdx, descIdx, catIdx } = detectStructuredColumns(headers);

  if (nameIdx === -1) {
    return [];
  }

  const items: ExtractedItem[] = [];
  const rows = grid.slice(1);

  for (const row of rows) {
    if (row.length === 0) continue;
    const name = String(row[nameIdx] || "").trim();
    if (!name) continue;

    const priceVal = priceIdx !== -1 ? String(row[priceIdx] || "") : "";
    const price = priceVal.replace(/[^\d.]/g, "");

    let description = descIdx !== -1 ? String(row[descIdx] || "").trim() : "";
    const category = catIdx !== -1 ? String(row[catIdx] || "").trim() : "";

    if (category) {
      description = description ? `${description} (Category: ${category})` : `Category: ${category}`;
    }

    items.push({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      price,
      description: description.slice(0, 500)
    });
  }

  return items;
}

/**
 * Normalizes and maps raw JSON objects returned by OpenRouter AI.
 * Category, variants, extras, duration, and notes are merged into the description.
 */
export function mapRawItemsToOnboardingItems(rawList: any[], type: "products" | "services"): ExtractedItem[] {
  return rawList
    .map(raw => {
      const name = String(raw.name || "").trim();
      const priceVal = raw.price !== undefined ? String(raw.price) : "";
      const price = priceVal.replace(/[^\d.]/g, "");

      let description = String(raw.description || "").trim();
      const extraParts: string[] = [];

      if (raw.category) {
        extraParts.push(`Category: ${raw.category}`);
      }

      if (type === "products") {
        if (raw.variants && Array.isArray(raw.variants) && raw.variants.length > 0) {
          extraParts.push(`Variants: ${raw.variants.join(", ")}`);
        }
        if (raw.extras && Array.isArray(raw.extras) && raw.extras.length > 0) {
          extraParts.push(`Extras: ${raw.extras.join(", ")}`);
        }
      } else {
        if (raw.duration) {
          extraParts.push(`Duration: ${raw.duration}`);
        }
        if (raw.notes) {
          extraParts.push(`Notes: ${raw.notes}`);
        }
      }

      if (extraParts.length > 0) {
        const extraText = extraParts.join(" | ");
        description = description ? `${description} (${extraText})` : extraText;
      }

      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name,
        price,
        description: description.slice(0, 500)
      };
    })
    .filter(item => item.name);
}
