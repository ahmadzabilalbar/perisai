// Wipes test data so the live site can start fresh. Header rows stay; the app keeps working.
//
//   node --env-file=.env.local scripts/reset-data.mjs                  # dry run: shows what would be deleted
//   node --env-file=.env.local scripts/reset-data.mjs --apply          # deletes it
//   node --env-file=.env.local scripts/reset-data.mjs --apply --keep-content   # keeps pages and news
//
// Cleared: Members, Children, Payments, LoginCodes and (unless --keep-content) Content.
// Never touched: Settings (website text, fees, bank details) and Users (admin accounts and passwords).
//
// Unlike dummy-*.mjs, this removes EVERY row in those tabs, including real records and anything
// typed in by testers. To undo, use File → Version history in the Google Sheet.
// Member numbers restart at M0001 because they are computed from the highest existing one.
import { api, readRows } from "./sheet-lib.mjs";

const apply = process.argv.includes("--apply");
const keepContent = process.argv.includes("--keep-content");
const TABS = ["Members", "Children", "Payments", "LoginCodes", ...(keepContent ? [] : ["Content"])];

const meta = await api("?fields=properties.title,sheets.properties(title,sheetId,gridProperties.rowCount)");
const sheets = Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties]));
console.log(`Sheet: "${meta.properties.title}" (${process.env.GOOGLE_SHEET_ID})\n`);

const requests = [];
for (const tab of TABS) {
  const props = sheets[tab];
  if (!props) {
    console.log(`  ${tab.padEnd(11)} (tab missing, skipped)`);
    continue;
  }
  const rows = await readRows(tab); // also refuses to run if the columns don't match the app
  let detail = "";
  if (tab === "Members") {
    const dummy = rows.filter((r) => r.row.email.endsWith("@example.com")).length;
    detail = ` (${dummy} test @example.com, ${rows.length - dummy} other)`;
  }
  if (tab === "Content" && rows.length) {
    detail = "\n" + rows.map((r) => `      - ${r.row.type}: ${r.row.title}`).join("\n");
  }
  console.log(`  ${tab.padEnd(11)} ${rows.length} row(s)${detail}`);
  const rowCount = props.gridProperties.rowCount;
  if (rowCount > 1) {
    requests.push({ deleteDimension: { range: { sheetId: props.sheetId, dimension: "ROWS", startIndex: 1, endIndex: rowCount } } });
  }
}
console.log(`\n  Kept: Settings, Users${keepContent ? ", Content" : ""}`);

if (!apply) {
  console.log("\nDry run: nothing deleted. Add --apply to delete the rows above.");
} else if (!requests.length) {
  console.log("\nNothing to delete.");
} else {
  // Delete every row below the header, then add blank rows back so the tab is easy to read and edit by hand
  for (const r of [...requests]) {
    requests.push({ appendDimension: { sheetId: r.deleteDimension.range.sheetId, dimension: "ROWS", length: 50 } });
  }
  await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
  console.log("\nDone. The live site shows the change within ~5 minutes, or straight away after any admin save.");
}
