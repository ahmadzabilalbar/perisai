// Adds or removes dummy members (with children and payments) for testing.
//
//   node --env-file=.env.local scripts/dummy-members.mjs add       # adds members, children (with OKU details) and payments
//   node --env-file=.env.local scripts/dummy-members.mjs details   # re-picks specific OKU conditions on dummy children
//   node --env-file=.env.local scripts/dummy-members.mjs remove
//
// Every dummy member has a name starting with "[UJIAN]" and notes equal to MARKER, and an
// @example.com email. "remove" deletes only those members plus their children and payments.
import { appendRows, deleteRows, OKU_DETAILS, readRows, setColumn } from "./sheet-lib.mjs";

const MARKER = "DATA UJIAN - boleh dipadam";

// paidDaysAgo: days since last payment (null = never paid). Child ages are in years.
const MEMBERS = [
  { name: "Ahmad Faizal bin Rahman", type: "Annual", fee: "Paid", paidDaysAgo: 60, joinDaysAgo: 400,
    children: [["Aisyah", 8, "Perempuan", ["Masalah Pembelajaran"]], ["Adam", 4, "Lelaki", ["Pertuturan", "Masalah Pembelajaran"]]] },
  { name: "Nurul Huda binti Ismail", type: "Annual", fee: "Paid", paidDaysAgo: 346, joinDaysAgo: 700,
    children: [["Irfan", 14, "Lelaki", ["Pendengaran", "Pertuturan"]]] },
  { name: "Lim Wei Ling", type: "Lifetime", fee: "Paid", paidDaysAgo: 200, joinDaysAgo: 900,
    children: [["Jia Hui", 19, "Perempuan", ["Fizikal"]], ["Jun Hao", 11, "Lelaki", ["Masalah Pembelajaran"]], ["Mei Xin", 6, "Perempuan", ["Penglihatan"]]] },
  { name: "Rajesh a/l Subramaniam", type: "Annual", fee: "Paid", paidDaysAgo: 420, joinDaysAgo: 1100,
    children: [["Kavin", 27, "Lelaki", ["Mental"]]] },
  { name: "Siti Aminah binti Yusof", type: "Annual", fee: "Unpaid", paidDaysAgo: null, joinDaysAgo: 30, children: [] },
  { name: "Mohd Hafiz bin Abdullah", type: "Annual", fee: "Pending", paidDaysAgo: null, joinDaysAgo: 3,
    children: [["Danish", 3, "Lelaki", ["Masalah Pembelajaran", "Pertuturan", "Fizikal"]]] },
  { name: "Farah Nadia binti Kamal", type: "Annual", fee: "Paid", paidDaysAgo: 10, joinDaysAgo: 10,
    children: [["Hana", 16, "Perempuan", ["Pendengaran"]], ["Haziq", 9, "Lelaki", ["Masalah Pembelajaran"]]] },
  // Batch 2
  { name: "Zulkifli bin Hassan", type: "Annual", fee: "Paid", paidDaysAgo: 120, joinDaysAgo: 500,
    children: [["Amirul", 12, "Lelaki", ["Masalah Pembelajaran"]]] },
  { name: "Tan Mei Ling", type: "Lifetime", fee: "Paid", paidDaysAgo: 600, joinDaysAgo: 1500,
    children: [["Kai Wen", 22, "Lelaki", ["Fizikal", "Pertuturan"]]] },
  { name: "Noraini binti Osman", type: "Annual", fee: "Paid", paidDaysAgo: 355, joinDaysAgo: 720,
    children: [["Nur Iman", 5, "Perempuan", ["Masalah Pembelajaran"]], ["Nur Imani", 5, "Perempuan", ["Masalah Pembelajaran"]]] },
  { name: "Kamarul Ariffin bin Daud", type: "Annual", fee: "Paid", paidDaysAgo: 500, joinDaysAgo: 1200,
    children: [["Syafiq", 17, "Lelaki", ["Penglihatan"]]] },
  { name: "Priya a/p Ramasamy", type: "Annual", fee: "Paid", paidDaysAgo: 30, joinDaysAgo: 30,
    children: [["Divya", 7, "Perempuan", ["Pendengaran", "Pertuturan"]]] },
  { name: "Roslan bin Ahmad", type: "Annual", fee: "Unpaid", paidDaysAgo: null, joinDaysAgo: 90,
    children: [["Luqman", 10, "Lelaki", ["Masalah Pembelajaran"]]] },
  { name: "Hazlina binti Mat Zin", type: "Annual", fee: "Pending", paidDaysAgo: null, joinDaysAgo: 1, children: [] },
  { name: "Wong Kok Keong", type: "Lifetime", fee: "Paid", paidDaysAgo: 50, joinDaysAgo: 50,
    children: [["Ethan", 2, "Lelaki", ["Fizikal"]], ["Emily", 15, "Perempuan", ["Mental"]]] },
  { name: "Azizah binti Ibrahim", type: "Annual", fee: "Paid", paidDaysAgo: 200, joinDaysAgo: 900,
    children: [["Alya", 13, "Perempuan", ["Masalah Pembelajaran", "Fizikal"]], ["Arif", 20, "Lelaki", ["Masalah Pembelajaran"]], ["Ain", 1, "Perempuan", ["Pendengaran"]]] },
  { name: "Shahrul Nizam bin Yaakob", type: "Annual", fee: "Paid", paidDaysAgo: 340, joinDaysAgo: 340,
    children: [["Rayyan", 9, "Lelaki", ["Penglihatan", "Masalah Pembelajaran"]]] },
  // Batch 3
  { name: "Mohd Rizal bin Salleh", type: "Annual", fee: "Paid", paidDaysAgo: 90, joinDaysAgo: 450,
    children: [["Irdina", 6, "Perempuan", ["Masalah Pembelajaran"]]] },
  { name: "Suhaila binti Ramli", type: "Annual", fee: "Paid", paidDaysAgo: 180, joinDaysAgo: 800,
    children: [["Harith", 11, "Lelaki", ["Pertuturan"]], ["Hannah", 8, "Perempuan", ["Masalah Pembelajaran"]]] },
  { name: "Chong Siew Mei", type: "Annual", fee: "Paid", paidDaysAgo: 352, joinDaysAgo: 1000,
    children: [["Ryan", 18, "Lelaki", ["Masalah Pembelajaran", "Mental"]]] },
  { name: "Abdul Rahim bin Mohamad", type: "Lifetime", fee: "Paid", paidDaysAgo: 1000, joinDaysAgo: 2000,
    children: [["Faris", 30, "Lelaki", ["Fizikal"]]] },
  { name: "Norhayati binti Che Mat", type: "Annual", fee: "Paid", paidDaysAgo: 450, joinDaysAgo: 1300,
    children: [["Nabila", 15, "Perempuan", ["Penglihatan"]]] },
  { name: "Saravanan a/l Muthu", type: "Annual", fee: "Paid", paidDaysAgo: 15, joinDaysAgo: 600,
    children: [["Tharun", 4, "Lelaki", ["Pendengaran"]], ["Tanisha", 7, "Perempuan", ["Pertuturan"]]] },
  { name: "Khairul Anuar bin Zakaria", type: "Annual", fee: "Unpaid", paidDaysAgo: null, joinDaysAgo: 200,
    children: [["Hakimi", 13, "Lelaki", ["Masalah Pembelajaran"]]] },
  { name: "Rohana binti Abu Bakar", type: "Annual", fee: "Pending", paidDaysAgo: null, joinDaysAgo: 5,
    children: [["Qistina", 2, "Perempuan", ["Fizikal", "Penglihatan"]]] },
  { name: "Lee Chee Wai", type: "Annual", fee: "Paid", paidDaysAgo: 250, joinDaysAgo: 250,
    children: [["Jayden", 10, "Lelaki", ["Masalah Pembelajaran"]]] },
  { name: "Fatimah binti Hamzah", type: "Annual", fee: "Paid", paidDaysAgo: 70, joinDaysAgo: 1100,
    children: [["Aqil", 21, "Lelaki", ["Mental"]], ["Aqilah", 16, "Perempuan", ["Masalah Pembelajaran"]], ["Amsyar", 12, "Lelaki", ["Pendengaran"]]] },
  { name: "Mohd Nazri bin Othman", type: "Annual", fee: "Pending", paidDaysAgo: null, joinDaysAgo: 2, children: [] },
  { name: "Kavitha a/p Krishnan", type: "Lifetime", fee: "Paid", paidDaysAgo: 20, joinDaysAgo: 20,
    children: [["Arjun", 5, "Lelaki", ["Masalah Pembelajaran", "Pertuturan"]]] },
  { name: "Ismail bin Yahya", type: "Annual", fee: "Paid", paidDaysAgo: 300, joinDaysAgo: 650,
    children: [["Insyirah", 9, "Perempuan", ["Fizikal"]]] },
];

const id = () => crypto.randomUUID().slice(0, 8);
const day = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const addYears = (date, years) => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const isDummy = (m) => m.notes === MARKER && m.name.startsWith("[UJIAN]");

/** Varied specific conditions for a child's OKU types; `seed` keeps it stable. About 1 in 5 types left unspecified. */
let seed = 0;
function pickDetails(okuType) {
  const picked = [];
  for (const t of okuType.split("; ").filter(Boolean)) {
    const opts = OKU_DETAILS[t] ?? [];
    seed++;
    if (!opts.length || seed % 5 === 0) continue;
    picked.push(opts[seed % opts.length]);
    if (t === "Masalah Pembelajaran" && seed % 3 === 0) picked.push(opts[(seed + 2) % opts.length]); // some have two
  }
  return [...new Set(picked)].join("; ");
}

async function add() {
  const members = (await readRows("Members")).map((r) => r.row);
  const existingNames = new Set(members.filter(isDummy).map((m) => m.name));
  const usedStaff = new Set(members.map((m) => m.staffNo));
  let maxNo = members.reduce((n, m) => Math.max(n, Number(m.memberNo.replace(/\D/g, "")) || 0), 0);
  let staff = 9900;
  const now = new Date().toISOString();
  const outMembers = [], outChildren = [], outPayments = [];

  MEMBERS.forEach((d, i) => {
    const name = `[UJIAN] ${d.name}`;
    if (existingNames.has(name)) return; // already added by an earlier run
    while (usedStaff.has(String(staff))) staff++;
    const memberId = id();
    const paid = d.paidDaysAgo === null ? "" : day(-d.paidDaysAgo);
    const amount = !paid ? "" : d.type === "Lifetime" ? "300" : "30";
    const paidUntil = paid && d.type === "Annual" ? addYears(paid, 1) : "";
    outMembers.push({
      id: memberId, memberNo: `M${String(++maxNo).padStart(4, "0")}`, staffNo: String(staff++), name,
      email: `ujian${i + 1}@example.com`, phone: `012-000 00${String(i + 1).padStart(2, "0")}`,
      address: "Universiti Utara Malaysia, 06010 Sintok, Kedah", membershipType: d.type, feeStatus: d.fee,
      paidUntil, lastPaymentDate: paid, lastPaymentAmount: amount, joinDate: day(-d.joinDaysAgo),
      notes: MARKER, createdAt: now, updatedAt: now, editToken: "",
    });
    if (paid) {
      outPayments.push({
        id: id(), memberId, memberName: name, date: paid, type: d.type, amount,
        coverage: d.type === "Lifetime" ? "Lifetime" : `${paid} → ${paidUntil}`, note: MARKER,
      });
    }
    for (const [cname, age, gender, types] of d.children) {
      const okuType = types.join("; ");
      outChildren.push({
        id: id(), memberId, name: cname, dob: day(-Math.round(age * 365.25) - 40), gender,
        okuType, okuDetail: pickDetails(okuType), createdAt: now, updatedAt: now,
      });
    }
  });

  if (!outMembers.length) return console.log("All dummy members already exist.");
  await appendRows("Members", outMembers);
  await appendRows("Children", outChildren);
  await appendRows("Payments", outPayments);
  console.log(`Added ${outMembers.length} members, ${outChildren.length} children, ${outPayments.length} payments.`);
}

async function remove() {
  const members = (await readRows("Members")).filter((r) => isDummy(r.row));
  if (!members.length) return console.log("No dummy members found.");
  const ids = new Set(members.map((r) => r.row.id));
  const children = (await readRows("Children")).filter((r) => ids.has(r.row.memberId));
  const payments = (await readRows("Payments")).filter((r) => ids.has(r.row.memberId) && r.row.note === MARKER);
  await deleteRows("Payments", payments.map((r) => r.rowNumber));
  await deleteRows("Children", children.map((r) => r.rowNumber));
  await deleteRows("Members", members.map((r) => r.rowNumber));
  console.log(`Removed ${members.length} members, ${children.length} children, ${payments.length} payments.`);
}

/** Re-picks specific conditions on all dummy children (e.g. after the option list in format.ts changes). */
async function details() {
  const ids = new Set((await readRows("Members")).filter((r) => isDummy(r.row)).map((r) => r.row.id));
  const kids = (await readRows("Children")).filter((r) => ids.has(r.row.memberId));
  if (!kids.length) return console.log("No dummy children found.");
  await setColumn("Children", "okuDetail", kids.map((r) => ({ rowNumber: r.rowNumber, value: pickDetails(r.row.okuType) })));
  console.log(`Set OKU details on ${kids.length} dummy children.`);
}

const cmd = process.argv[2];
if (cmd === "add") await add();
else if (cmd === "details") await details();
else if (cmd === "remove") await remove();
else console.log("Usage: node --env-file=.env.local scripts/dummy-members.mjs add|details|remove");
