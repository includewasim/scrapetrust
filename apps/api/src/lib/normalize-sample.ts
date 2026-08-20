// Strips our own database bookkeeping fields, and flattens Bright Data's raw
// nested price object into the same flat shape our own DB stores — so the
// risk-gate compares apples to apples: our canonical listing shape on both
// sides, not our storage format vs Bright Data's raw wire format.

const SCRAPED_FIELDS = ["productId", "productName", "price", "currency", "inStock"];

export function normalizeListing(listing: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const field of SCRAPED_FIELDS) {
    if (field in listing) out[field] = listing[field];
  }
  return out;
}

export function normalizeListings(listings: Record<string, any>[]): Record<string, any>[] {
  return listings.map(normalizeListing);
}

// Converts a raw row straight from Bright Data (price as {value, currency})
// into our canonical flat shape (price as a plain number).
export function flattenRawRow(row: Record<string, any>): Record<string, any> {
  return {
    productId: row.productId ?? null,
    productName: row.productName ?? null,
    price: row.price && typeof row.price === "object" ? row.price.value ?? null : row.price ?? null,
    currency: row.price && typeof row.price === "object" ? row.price.currency ?? null : row.currency ?? null,
    inStock: row.inStock ?? null,
  };
}

export function flattenRawRows(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(flattenRawRow);
}
