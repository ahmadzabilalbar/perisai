import "server-only";
import { JWT } from "google-auth-library";

/**
 * Minimal Google Sheets "database".
 * Each tab is a table: row 1 holds the headers, every following row is a record.
 * Records are plain string maps keyed by header name.
 */

export type Row = Record<string, string>;

export const TABLES = {
  Members: [
    "id",
    "memberNo",
    "staffNo", // UUM staff number (membership is for UUM staff only)
    "name",
    "email",
    "phone",
    "icNo",
    "address",
    "membershipType", // Annual | Lifetime
    "feeStatus", // Paid | Unpaid | Pending
    "paidUntil", // YYYY-MM-DD (Annual only)
    "lastPaymentDate",
    "lastPaymentAmount",
    "joinDate",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  Payments: ["id", "memberId", "memberName", "date", "type", "amount", "coverage", "note"],
  Content: [
    "id",
    "type", // page | post
    "slug",
    "title",
    "excerpt",
    "body", // markdown
    "coverImage",
    "published", // TRUE | FALSE
    "showInNav", // TRUE | FALSE (pages)
    "order",
    "createdAt",
    "updatedAt",
  ],
  Settings: ["key", "value"],
  // Google accounts allowed into /admin (super admins come from SUPERADMIN_EMAILS instead)
  Users: ["email", "role", "name", "addedBy", "createdAt", "passwordHash", "passwordUpdatedAt"], // role: admin | viewer
  // One-time sign-in codes for email login (only a hash of the code is stored)
  LoginCodes: ["email", "codeHash", "expiresAt", "attempts", "createdAt"],
} as const;

export type TableName = keyof typeof TABLES;

const API = "https://sheets.googleapis.com/v4/spreadsheets";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export function isSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

let jwt: JWT | null = null;
function client() {
  if (!jwt) {
    jwt = new JWT({
      email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      key: env("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return jwt;
}

async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = await client().getAccessToken();
  const res = await fetch(`${API}/${env("GOOGLE_SHEET_ID")}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Google Sheets API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

function colLetter(n: number) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const lastCol = (t: TableName) => colLetter(TABLES[t].length);

// ---- Schema bootstrap: creates missing tabs + header rows on first use ----

type SheetIds = Partial<Record<TableName, number>>;
let schema: Promise<SheetIds> | null = null;

/** Runs once per server instance; concurrent callers share the same promise. */
function ensureSchema() {
  schema ??= setupSchema().catch((e) => {
    schema = null; // retry on the next call
    throw e;
  });
  return schema;
}

async function setupSchema(): Promise<SheetIds> {
  type Meta = { sheets: { properties: { title: string; sheetId: number } }[] };
  let meta = await api<Meta>("?fields=sheets.properties(title,sheetId)");
  const existing = new Set(meta.sheets.map((s) => s.properties.title));
  const missing = (Object.keys(TABLES) as TableName[]).filter((t) => !existing.has(t));

  if (missing.length) {
    try {
      await api(":batchUpdate", {
        method: "POST",
        body: JSON.stringify({
          requests: missing.map((title) => ({
            addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } },
          })),
        }),
      });
    } catch (e) {
      // Another server instance created it at the same moment; that's fine
      if (!String(e).includes("already exists")) throw e;
    }
    meta = await api<Meta>("?fields=sheets.properties(title,sheetId)");
  }

  // Always make sure header rows are present and up to date
  await api(`/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: (Object.keys(TABLES) as TableName[]).map((t) => ({
        range: `${t}!A1:${lastCol(t)}1`,
        values: [TABLES[t]],
      })),
    }),
  });

  const ids: SheetIds = {};
  for (const s of meta.sheets) {
    if (s.properties.title in TABLES) {
      ids[s.properties.title as TableName] = s.properties.sheetId;
    }
  }
  return ids;
}

// ---- CRUD ----

export async function readAll(table: TableName): Promise<Row[]> {
  await ensureSchema();
  const data = await api<{ values?: string[][] }>(
    `/values/${encodeURIComponent(`${table}!A2:${lastCol(table)}`)}`,
  );
  const headers = TABLES[table];
  return (data.values ?? [])
    .filter((r) => r.some((c) => c !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function toValues(table: TableName, row: Row) {
  return TABLES[table].map((h) => row[h] ?? "");
}

export async function insert(table: TableName, row: Row) {
  await ensureSchema();
  await api(
    `/values/${encodeURIComponent(`${table}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [toValues(table, row)] }) },
  );
  return row;
}

/** Finds the 1-based sheet row number for a record whose `key` column equals `value`. */
async function findRowNumber(table: TableName, key: string, value: string) {
  const rows = await readAll(table);
  const idx = rows.findIndex((r) => r[key] === value);
  return idx === -1 ? null : { rowNumber: idx + 2, row: rows[idx] };
}

export async function update(table: TableName, id: string, patch: Row, key = "id") {
  const found = await findRowNumber(table, key, id);
  if (!found) throw new Error(`${table} record ${id} not found`);
  const merged = { ...found.row, ...patch };
  await api(
    `/values/${encodeURIComponent(`${table}!A${found.rowNumber}:${lastCol(table)}${found.rowNumber}`)}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: [toValues(table, merged)] }) },
  );
  return merged;
}

/** Overwrites all data rows of a table in two requests (clear + write). */
export async function replaceAll(table: TableName, rows: Row[]) {
  await ensureSchema();
  await api(`/values/${encodeURIComponent(`${table}!A2:${lastCol(table)}`)}:clear`, { method: "POST" });
  if (!rows.length) return;
  await api(
    `/values/${encodeURIComponent(`${table}!A2:${lastCol(table)}${rows.length + 1}`)}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: rows.map((r) => toValues(table, r)) }) },
  );
}

export async function remove(table: TableName, id: string, key = "id") {
  const ids = await ensureSchema();
  const found = await findRowNumber(table, key, id);
  if (!found) return;
  await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: ids[table],
              dimension: "ROWS",
              startIndex: found.rowNumber - 1,
              endIndex: found.rowNumber,
            },
          },
        },
      ],
    }),
  });
}

export function newId() {
  return crypto.randomUUID().slice(0, 8);
}

export function nowIso() {
  return new Date().toISOString();
}
