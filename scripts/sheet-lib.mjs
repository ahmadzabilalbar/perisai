// Shared helpers for the maintenance scripts in this folder. Run scripts with --env-file=.env.local.
// Table layouts and OKU options are read from the app's own source, so scripts never drift from it.
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/** TABLES from src/lib/sheets.ts: { Members: ["id", ...], Children: [...], ... } */
export const TABLES = (() => {
  const src = source("src/lib/sheets.ts");
  const start = src.indexOf("export const TABLES = {");
  const block = src.slice(start, src.indexOf("} as const;", start)).replace(/\/\/.*$/gm, ""); // drop comments
  const tables = {};
  for (const m of block.matchAll(/(\w+): \[([\s\S]*?)\]/g)) tables[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  if (!tables.Members) throw new Error("Could not read TABLES from src/lib/sheets.ts");
  return tables;
})();

/** OKU_DETAILS from src/lib/format.ts: { Pendengaran: [...], ... } */
export const OKU_DETAILS = (() => {
  const src = source("src/lib/format.ts");
  const start = src.indexOf("export const OKU_DETAILS");
  const block = src.slice(start, src.indexOf("\n};", start));
  const out = {};
  for (const m of block.matchAll(/(?:"([^"]+)"|(\w+)): \[([\s\S]*?)\]/g)) {
    out[m[1] ?? m[2]] = [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
  if (!Object.keys(out).length) throw new Error("Could not read OKU_DETAILS from src/lib/format.ts");
  return out;
})();

const env = (n) => {
  if (!process.env[n]) throw new Error(`Missing ${n} (run with --env-file=.env.local)`);
  return process.env[n];
};
let jwt;
export async function api(path, init = {}) {
  jwt ??= new JWT({
    email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: env("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await jwt.getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env("GOOGLE_SHEET_ID")}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const colLetter = (n) => {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

/** Rows of a tab as { rowNumber, row } keyed by column name. Refuses to run if the header doesn't match TABLES. */
export async function readRows(table) {
  const cols = TABLES[table];
  const data = await api(`/values/${encodeURIComponent(`${table}!A1:${colLetter(cols.length)}`)}`);
  const [header = [], ...rows] = data.values ?? [];
  if (cols.some((c, i) => header[i] !== c)) {
    throw new Error(`${table} columns don't match the app. Run scripts/migrate-sheet.mjs first.\n  sheet: ${header.join(", ")}`);
  }
  return rows
    .map((r, i) => ({ rowNumber: i + 2, row: Object.fromEntries(cols.map((c, j) => [c, r[j] ?? ""])) }))
    .filter(({ row }) => Object.values(row).some((v) => v !== ""));
}

/** Appends records (objects keyed by column name) to a tab. */
export async function appendRows(table, rows) {
  if (!rows.length) return;
  await api(`/values/${encodeURIComponent(`${table}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows.map((r) => TABLES[table].map((c) => r[c] ?? "")) }),
  });
}

/** Sets one column on the given sheet rows: [{ rowNumber, value }]. */
export async function setColumn(table, column, cells) {
  if (!cells.length) return;
  const col = colLetter(TABLES[table].indexOf(column) + 1);
  await api(`/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: cells.map(({ rowNumber, value }) => ({ range: `${table}!${col}${rowNumber}`, values: [[value]] })),
    }),
  });
}

/** Deletes whole sheet rows (bottom-up, so row numbers stay valid). */
export async function deleteRows(table, rowNumbers) {
  if (!rowNumbers.length) return;
  const meta = await api("?fields=sheets.properties(title,sheetId)");
  const sheetId = meta.sheets.find((s) => s.properties.title === table).properties.sheetId;
  await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [...new Set(rowNumbers)]
        .sort((a, b) => b - a)
        .map((n) => ({ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: n - 1, endIndex: n } } })),
    }),
  });
}
