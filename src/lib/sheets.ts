import "server-only";
import { JWT } from "google-auth-library";
import { serialize } from "./throttle";

/**
 * Minimal Google Sheets "database".
 * Each tab is a table: row 1 holds the headers, every following row is a record.
 * Records are plain string maps keyed by header name.
 */

export type Row = Record<string, string>;

/**
 * Column layout of each tab. Columns are read and written by position, so after changing a list
 * here run `node --env-file=.env.local scripts/migrate-sheet.mjs` to move existing data to match.
 * Members deliberately has no IC number column: IC numbers are never collected (PDPA).
 */
export const TABLES = {
  Members: [
    "id",
    "memberNo",
    "staffNo", // UUM staff number (membership is for UUM staff only)
    "name",
    "email",
    "phone",
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
    "editToken", // secret for the member's private update link (/kemaskini/<token>); blank = no link
  ],
  // A member's children with special needs (one row per child, linked by memberId)
  Children: [
    "id",
    "memberId",
    "name",
    "dob", // YYYY-MM-DD
    "gender", // Lelaki | Perempuan
    "okuType", // one or more of OKU_TYPES, "; "-separated
    "okuDetail", // optional specific conditions from OKU_DETAILS, "; "-separated
    "createdAt",
    "updatedAt",
  ],
  // previous: JSON of the member's fee fields just before this payment, restored if the payment is deleted
  Payments: ["id", "memberId", "memberName", "date", "type", "amount", "coverage", "note", "previous"],
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
  // role: admin | viewer. username: optional, unique, lowercase; lets them sign in without typing their email
  // sessionsValidAfter: sessions signed in before this time are rejected (set when the password changes)
  Users: [
    "email",
    "role",
    "name",
    "addedBy",
    "createdAt",
    "passwordHash",
    "passwordUpdatedAt",
    "username",
    "sessionsValidAfter",
  ],
  // One-time sign-in codes for email login (only a hash of the code is stored)
  LoginCodes: ["email", "codeHash", "expiresAt", "attempts", "createdAt"],
  // Failed password sign-ins per account (key = "pw:<email>"); the row is removed after a successful sign-in
  LoginAttempts: ["key", "failures", "firstFailureAt", "lockedUntil"],
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

export type NumberedRow = { rowNumber: number; row: Row };

/**
 * Every non-blank record with its real 1-based sheet row number.
 * Blank rows (e.g. a row cleared by hand in the sheet) are skipped but still counted,
 * so row numbers always point at the right record.
 */
export async function readRows(table: TableName): Promise<NumberedRow[]> {
  await ensureSchema();
  const data = await api<{ values?: string[][] }>(
    `/values/${encodeURIComponent(`${table}!A2:${lastCol(table)}`)}`,
  );
  const headers = TABLES[table];
  const out: NumberedRow[] = [];
  (data.values ?? []).forEach((r, i) => {
    if (!r.some((c) => c !== "")) return;
    out.push({ rowNumber: i + 2, row: Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ""])) });
  });
  return out;
}

export async function readAll(table: TableName): Promise<Row[]> {
  return (await readRows(table)).map((r) => r.row);
}

function toValues(table: TableName, row: Row) {
  return TABLES[table].map((h) => row[h] ?? "");
}

export async function insert(table: TableName, row: Row) {
  await appendRows(table, [row]);
  return row;
}

/** Appends records after the last row of the table (one request). */
export async function appendRows(table: TableName, rows: Row[]) {
  if (!rows.length) return;
  await ensureSchema();
  await api(
    `/values/${encodeURIComponent(`${table}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows.map((r) => toValues(table, r)) }) },
  );
}

/**
 * Row numbers come from an earlier readRows(), and a deletion (another server instance, or someone editing
 * the sheet by hand) shifts the rows below it. Before writing or deleting by row number, check that each row
 * still holds the same record (first column, the table's key) so we never overwrite or delete the wrong one.
 */
async function assertRowsUnchanged(table: TableName, rows: NumberedRow[]) {
  const key = TABLES[table][0];
  const ranges = rows.map(({ rowNumber }) => `ranges=${encodeURIComponent(`${table}!A${rowNumber}`)}`).join("&");
  const data = await api<{ valueRanges?: { values?: string[][] }[] }>(`/values:batchGet?${ranges}`);
  rows.forEach(({ row }, i) => {
    const actual = data.valueRanges?.[i]?.values?.[0]?.[0] ?? "";
    if (actual !== (row[key] ?? "")) {
      throw new Error("Data dalam Google Sheet baru sahaja berubah. Sila muat semula halaman dan cuba lagi.");
    }
  });
}

/**
 * Runs `fn` with exclusive access to `table` on this server instance, for read-then-write sequences that
 * depend on row numbers. update(), remove() and replaceAll() take the lock themselves, so don't call them
 * inside `fn`; use readRows/writeRows/appendRows/deleteRows instead.
 */
export function withTableLock<T>(table: TableName, fn: () => Promise<T>) {
  return serialize(`sheet:${table}`, fn);
}

/** Overwrites the given sheet rows in place (one request). Row numbers must come from readRows(). */
export async function writeRows(table: TableName, rows: NumberedRow[]) {
  if (!rows.length) return;
  await ensureSchema();
  await assertRowsUnchanged(table, rows);
  await api(`/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: rows.map(({ rowNumber, row }) => ({
        range: `${table}!A${rowNumber}:${lastCol(table)}${rowNumber}`,
        values: [toValues(table, row)],
      })),
    }),
  });
}

/** Deletes the given sheet rows (one request). The rows must come from readRows(). */
export async function deleteRows(table: TableName, rows: NumberedRow[]) {
  if (!rows.length) return;
  const ids = await ensureSchema();
  await assertRowsUnchanged(table, rows);
  // Bottom-up, so each deletion doesn't shift the rows still to be deleted
  const sorted = [...new Set(rows.map((r) => r.rowNumber))].sort((a, b) => b - a);
  await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: sorted.map((n) => ({
        deleteDimension: {
          range: { sheetId: ids[table], dimension: "ROWS", startIndex: n - 1, endIndex: n },
        },
      })),
    }),
  });
}

/** Finds the record whose `key` column equals `value`, with its real sheet row number. */
async function findRow(table: TableName, key: string, value: string) {
  return (await readRows(table)).find((r) => r.row[key] === value) ?? null;
}

export function update(table: TableName, id: string, patch: Row, key = "id") {
  return withTableLock(table, async () => {
    const found = await findRow(table, key, id);
    if (!found) throw new Error(`${table} record ${id} not found`);
    // The key column is never changed by a patch, so assertRowsUnchanged can match it
    const merged = { ...found.row, ...patch, [TABLES[table][0]]: found.row[TABLES[table][0]] };
    await writeRows(table, [{ rowNumber: found.rowNumber, row: merged }]);
    return merged;
  });
}

/**
 * Overwrites all data rows of a table. Writes the new rows first and only then clears
 * whatever is left below them, so a failure never leaves the table empty.
 */
export function replaceAll(table: TableName, rows: Row[]) {
  return withTableLock(table, async () => {
    await ensureSchema();
    if (rows.length) {
      await api(
        `/values/${encodeURIComponent(`${table}!A2:${lastCol(table)}${rows.length + 1}`)}?valueInputOption=RAW`,
        { method: "PUT", body: JSON.stringify({ values: rows.map((r) => toValues(table, r)) }) },
      );
    }
    await api(`/values/${encodeURIComponent(`${table}!A${rows.length + 2}:${lastCol(table)}`)}:clear`, {
      method: "POST",
    });
  });
}

export function remove(table: TableName, id: string, key = "id") {
  return withTableLock(table, async () => {
    const found = await findRow(table, key, id);
    if (found) await deleteRows(table, [found]);
  });
}

export function newId() {
  return crypto.randomUUID().slice(0, 8);
}

export function nowIso() {
  return new Date().toISOString();
}
