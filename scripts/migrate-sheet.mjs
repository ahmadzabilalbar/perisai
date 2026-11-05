// Brings every tab of the Google Sheet in line with TABLES in src/lib/sheets.ts.
//
//   node --env-file=.env.local scripts/migrate-sheet.mjs           # dry run: reports what would change
//   node --env-file=.env.local scripts/migrate-sheet.mjs --apply   # rewrites the tabs that differ
//
// Columns are matched by their header name, so data follows its column when columns are added,
// removed or reordered. Columns no longer in TABLES are dropped (the dry run lists them, with how
// many rows hold a value). Missing tabs are left to the app, which creates them on first use.
// Run this while the old app version is not writing to the sheet: it rewrites whole tabs.
import { api, colLetter, TABLES } from "./sheet-lib.mjs";

const APPLY = process.argv.includes("--apply");
const meta = await api("?fields=sheets.properties(title,gridProperties)");
const tabs = new Map(meta.sheets.map((s) => [s.properties.title, s.properties.gridProperties]));
let changes = 0;

for (const [table, target] of Object.entries(TABLES)) {
  if (!tabs.has(table)) {
    console.log(`${table}: tab missing (the app creates it on first use)`);
    continue;
  }
  const width = Math.max(tabs.get(table).columnCount, target.length);
  const data = await api(`/values/${encodeURIComponent(`${table}!A1:${colLetter(width)}`)}`);
  const [header = [], ...rows] = data.values ?? [];
  const records = rows.filter((r) => r.some((c) => c !== ""));
  const current = header.map((h) => String(h).trim());

  if (current.length === target.length && current.every((h, i) => h === target[i])) {
    console.log(`${table}: OK (${records.length} rows)`);
    continue;
  }
  changes++;
  const added = target.filter((h) => !current.includes(h));
  const dropped = current.map((h, i) => ({ h: h || `(no header, column ${colLetter(i + 1)})`, i })).filter(({ h }) => !target.includes(h));
  console.log(`${table}: needs update (${records.length} rows)`);
  console.log(`  now:    ${current.join(", ") || "(empty)"}`);
  console.log(`  target: ${target.join(", ")}`);
  if (added.length) console.log(`  + new columns: ${added.join(", ")}`);
  for (const { h, i } of dropped) {
    const filled = records.filter((r) => (r[i] ?? "") !== "").length;
    console.log(`  - drop column "${h}" (${filled} row(s) hold a value${filled ? " — these values will be DELETED" : ""})`);
  }
  if (!APPLY) continue;

  const out = records.map((r) => target.map((h) => (current.indexOf(h) >= 0 ? (r[current.indexOf(h)] ?? "") : "")));
  // Write header + rows, then clear anything left to the right of / below them
  await api(`/values/${encodeURIComponent(`${table}!A1:${colLetter(target.length)}${out.length + 1}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [target, ...out] }),
  });
  if (width > target.length) {
    await api(`/values/${encodeURIComponent(`${table}!${colLetter(target.length + 1)}1:${colLetter(width)}`)}:clear`, { method: "POST" });
  }
  await api(`/values/${encodeURIComponent(`${table}!A${out.length + 2}:${colLetter(width)}`)}:clear`, { method: "POST" });
  console.log(`  ✓ rewritten`);
}

console.log(changes === 0 ? "\nAll tabs match." : APPLY ? "\nDone." : "\nDry run only. Re-run with --apply to make these changes.");
