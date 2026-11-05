// Adds or removes a dummy "Penyunting" (editor) account for testing the editor role.
//
//   node --env-file=.env.local scripts/dummy-editor.mjs add [password]   # prints the password (random if not given)
//   node --env-file=.env.local scripts/dummy-editor.mjs remove
//
// Sign in at /admin/login with username "penyunting" (or the email below). An editor only sees
// Halaman & Berita. Only the row with EMAIL below is ever touched.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { appendRows, deleteRows, readRows } from "./sheet-lib.mjs";

const SHEET = "Users";
const EMAIL = "penyunting@example.com";
const USERNAME = "penyunting";

/** Same format as src/lib/passwords.ts: scrypt$<salt hex>$<hash hex> */
async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await promisify(scrypt)(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function add(password) {
  const rows = await readRows(SHEET);
  if (rows.some((r) => (r.row.email ?? "").trim().toLowerCase() === EMAIL)) {
    return console.log(`${EMAIL} already exists. Run "remove" first to recreate it with a new password.`);
  }
  if (rows.some((r) => (r.row.username ?? "").trim().toLowerCase() === USERNAME)) {
    return console.log(`Username "${USERNAME}" is already used by another account.`);
  }
  if (password && (password.length < 8 || password.length > 128)) return console.log("Password must be 8–128 characters.");
  const pw = password || randomBytes(9).toString("base64url");
  const now = new Date().toISOString();
  await appendRows(SHEET, [
    {
      email: EMAIL,
      role: "editor",
      name: "Penyunting",
      addedBy: "scripts/dummy-editor.mjs",
      createdAt: now,
      passwordHash: await hashPassword(pw),
      passwordUpdatedAt: now,
      username: USERNAME,
      sessionsValidAfter: "",
    },
  ]);
  console.log(`Added editor account.\n  Username: ${USERNAME}  (or ${EMAIL})\n  Password: ${pw}`);
}

async function remove() {
  const targets = (await readRows(SHEET)).filter((r) => (r.row.email ?? "").trim().toLowerCase() === EMAIL);
  if (!targets.length) return console.log("No dummy editor found.");
  await deleteRows(SHEET, targets.map((r) => r.rowNumber));
  console.log(`Removed ${EMAIL}.`);
}

const cmd = process.argv[2];
if (cmd === "add") await add(process.argv[3]);
else if (cmd === "remove") await remove();
else console.log("Usage: node --env-file=.env.local scripts/dummy-editor.mjs add [password] | remove");
