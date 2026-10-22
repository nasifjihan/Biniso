/**
 * Minimal CSV writer for the admin exports. Fields containing a comma, quote or
 * newline are quoted and their quotes doubled, so a product name or an address
 * can never break the file layout.
 */

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * `columns` is `[{ label, value }]` where `value` is a key on the row or a
 * function that derives the cell from the row.
 */
export function toCsv(columns, rows) {
  const cell = (column, row) =>
    escapeCell(typeof column.value === "function" ? column.value(row) : row[column.value]);

  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = (rows || []).map((row) =>
    columns.map((column) => cell(column, row)).join(","),
  );

  return [header, ...body].join("\r\n");
}

/** A download response. The BOM keeps Excel reading the file as UTF-8 (৳). */
export function csvResponse(filename, csv) {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** `orders-2026-10-23.csv` */
export function csvFilename(prefix) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
