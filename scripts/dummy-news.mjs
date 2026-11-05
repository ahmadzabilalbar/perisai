// Adds or removes dummy news posts and pages for testing.
//
//   node --env-file=.env.local scripts/dummy-news.mjs add      # adds unpublished "[UJIAN]" posts
//   node --env-file=.env.local scripts/dummy-news.mjs covers   # adds placeholder cover images to them
//   node --env-file=.env.local scripts/dummy-news.mjs publish  # makes them live ("unpublish" = back to drafts)
//   node --env-file=.env.local scripts/dummy-news.mjs remove   # deletes them again
//
// Posts are drafts (published = FALSE) so they never show on the public site until you
// publish one in /admin/content. Only rows whose slug starts with "ujian-" AND whose title
// starts with "[UJIAN]" are ever removed.
import { appendRows, deleteRows, readRows, setColumn } from "./sheet-lib.mjs";

const POSTS = [
  {
    slug: "ujian-mesyuarat-agung-tahunan",
    title: "[UJIAN] Mesyuarat Agung Tahunan 2026",
    excerpt: "Semua ahli dijemput hadir ke Mesyuarat Agung Tahunan persatuan.",
    daysAgo: 2,
    body: `Mesyuarat Agung Tahunan persatuan akan diadakan seperti berikut:

- **Tarikh:** Sabtu, 21 November 2026
- **Masa:** 9.00 pagi
- **Tempat:** Dewan Seminar, UUM

## Agenda

1. Ucapan aluan Pengerusi
2. Pembentangan laporan tahunan
3. Pembentangan penyata kewangan
4. Pemilihan AJK baharu

Sila sahkan kehadiran sebelum 14 November 2026.`,
  },
  {
    slug: "ujian-hari-keluarga",
    title: "[UJIAN] Hari Keluarga Bersama Anak Istimewa",
    excerpt: "Aktiviti santai untuk ibu bapa dan anak-anak istimewa di Taman Rekreasi UUM.",
    daysAgo: 9,
    body: `Persatuan menganjurkan **Hari Keluarga** untuk mengeratkan hubungan sesama ahli.

Antara aktiviti:

- Sukaneka mesra OKU
- Sesi melukis dan mewarna
- Jamuan makan tengah hari

Penyertaan adalah **percuma** untuk ahli dan keluarga.`,
  },
  {
    slug: "ujian-bengkel-terapi-pertuturan",
    title: "[UJIAN] Bengkel Terapi Pertuturan untuk Ibu Bapa",
    excerpt: "Pelajari teknik asas terapi pertuturan yang boleh dilakukan di rumah.",
    daysAgo: 18,
    body: `Bengkel ini dikendalikan oleh ahli terapi pertuturan bertauliah.

> Tempat adalah terhad kepada 30 peserta sahaja.

Bawa bersama buku nota dan alat tulis.`,
  },
  {
    slug: "ujian-sumbangan-persekolahan",
    title: "[UJIAN] Sumbangan Persekolahan 2027 Kini Dibuka",
    excerpt: "Permohonan sumbangan persekolahan untuk anak OKU ahli kini dibuka.",
    daysAgo: 30,
    body: `Ahli yang mempunyai anak OKU bersekolah boleh memohon **sumbangan persekolahan**.

## Syarat

- Ahli berdaftar dan yuran terkini
- Maklumat anak telah dikemas kini dalam sistem

Tarikh tutup permohonan: 31 Disember 2026.`,
  },
  {
    slug: "ujian-kemas-kini-maklumat-anak",
    title: "[UJIAN] Peringatan: Kemas Kini Maklumat Anak",
    excerpt: "Sila semak dan kemas kini maklumat anak OKU anda melalui pautan peribadi.",
    daysAgo: 45,
    body: `Untuk memudahkan perancangan program, ahli diminta menyemak maklumat anak masing-masing.

Pautan kemas kini peribadi akan dihantar melalui e-mel. Jika anda tidak menerimanya, sila hubungi setiausaha.`,
  },
  {
    slug: "ujian-ceramah-hak-oku",
    title: "[UJIAN] Ceramah: Hak dan Kemudahan untuk OKU",
    excerpt: "Ketahui hak, bantuan dan kemudahan yang disediakan untuk anak OKU dan keluarga.",
    daysAgo: 55,
    body: `Ceramah ini akan menerangkan:

- Pendaftaran kad OKU di JKM
- Bantuan kewangan yang boleh dipohon
- Kemudahan pendidikan khas

Penceramah jemputan daripada Jabatan Kebajikan Masyarakat.`,
  },
  {
    slug: "ujian-lawatan-pusat-pemulihan",
    title: "[UJIAN] Lawatan ke Pusat Pemulihan Dalam Komuniti",
    excerpt: "Lawatan sambil belajar ke PDK berhampiran bersama ahli dan anak-anak.",
    daysAgo: 70,
    body: `Lawatan ini memberi peluang kepada ahli mengenali program di **Pusat Pemulihan Dalam Komuniti (PDK)**.

Pengangkutan disediakan. Tempat terhad kepada 40 orang.`,
  },
  {
    slug: "ujian-sambutan-hari-oku",
    title: "[UJIAN] Sambutan Hari OKU Peringkat UUM",
    excerpt: "Sertai sambutan Hari OKU dengan pameran, persembahan dan aktiviti keluarga.",
    daysAgo: 85,
    body: `Sambutan Hari OKU akan diadakan dengan pelbagai aktiviti menarik:

1. Pameran hasil kerja tangan anak-anak istimewa
2. Persembahan pentas
3. Cabutan bertuah

Semua warga UUM dialu-alukan hadir.`,
  },
  {
    slug: "ujian-kongsi-pengalaman-ibu-bapa",
    title: "[UJIAN] Sesi Kongsi Pengalaman Ibu Bapa",
    excerpt: "Ruang santai untuk ibu bapa berkongsi cabaran dan tips membesarkan anak istimewa.",
    daysAgo: 100,
    body: `Sesi ini dijalankan secara santai dan tertutup untuk ahli sahaja.

> "Kita tidak bersendirian dalam perjalanan ini."

Minum petang disediakan.`,
  },
  {
    slug: "ujian-laporan-aktiviti-tahunan",
    title: "[UJIAN] Laporan Aktiviti Persatuan Tahun Lalu",
    excerpt: "Ringkasan program dan pencapaian persatuan sepanjang tahun lalu.",
    daysAgo: 120,
    body: `Sepanjang tahun lalu, persatuan telah menganjurkan:

- **12** program dan bengkel
- **3** lawatan sambil belajar
- **1** hari keluarga

Terima kasih kepada semua ahli dan penaja atas sokongan anda.`,
  },
];

// Dummy pages (shown in the site menu, ordered by `order`)
const PAGES = [
  {
    type: "page", order: 1, daysAgo: 150,
    slug: "ujian-tentang-kami",
    title: "[UJIAN] Tentang Kami",
    excerpt: "Mengenali persatuan, visi dan misi kami.",
    body: `## Visi

Menjadi komuniti sokongan utama bagi staf UUM yang membesarkan anak istimewa.

## Misi

- Menyediakan rangkaian sokongan sesama ibu bapa
- Berkongsi maklumat, sumber dan peluang bantuan
- Menganjurkan program untuk ahli dan anak-anak
- Memperjuangkan kampus yang lebih inklusif

## Jawatankuasa

| Jawatan | Nama |
|---|---|
| Pengerusi | Nama Contoh 1 |
| Setiausaha | Nama Contoh 2 |
| Bendahari | Nama Contoh 3 |`,
  },
  {
    type: "page", order: 2, daysAgo: 150,
    slug: "ujian-yuran-keahlian",
    title: "[UJIAN] Yuran & Keahlian",
    excerpt: "Maklumat yuran dan cara menjadi ahli.",
    body: `Keahlian dibuka kepada **staf UUM** yang mempunyai anak istimewa (OKU).

## Jenis keahlian

- **Tahunan:** sah selama 12 bulan dari tarikh bayaran
- **Seumur hidup:** sekali bayar, sah selamanya

## Cara memohon

1. Isi borang di halaman *Sertai*
2. Buat bayaran yuran
3. Keahlian disahkan oleh setiausaha`,
  },
  {
    type: "page", order: 3, daysAgo: 150,
    slug: "ujian-soalan-lazim",
    title: "[UJIAN] Soalan Lazim",
    excerpt: "Jawapan kepada soalan yang kerap ditanya.",
    body: `### Siapa yang boleh menjadi ahli?

Staf UUM yang mempunyai anak berkeperluan khas.

### Adakah anak saya perlu mempunyai kad OKU?

Tidak wajib, tetapi digalakkan untuk memudahkan permohonan bantuan.

### Bagaimana saya mengemas kini maklumat anak?

Setiausaha akan menghantar pautan kemas kini peribadi kepada anda.`,
  },
  {
    type: "page", order: 4, daysAgo: 150,
    slug: "ujian-hubungi-kami",
    title: "[UJIAN] Hubungi Kami",
    excerpt: "Cara menghubungi persatuan.",
    body: `**Alamat:**
Universiti Utara Malaysia
06010 UUM Sintok, Kedah

**E-mel:** contoh@example.com
**Telefon:** 04-000 0000

Waktu pejabat: Isnin hingga Jumaat, 8.00 pagi – 5.00 petang.`,
  },
];

const SHEET = "Content";
const isDummy = (r) => r.slug.startsWith("ujian-") && r.title.startsWith("[UJIAN]");
// Placeholder photo, fixed per post (same seed = same picture), 16:9 like the site's image frames
const coverFor = (slug) => `https://picsum.photos/seed/${slug}/1200/675`;

/** Publishes (or unpublishes) every dummy post and page. Other content is never touched. */
async function setPublished(on) {
  const value = on ? "TRUE" : "FALSE";
  const rows = await readRows(SHEET);
  const targets = rows.filter((r) => isDummy(r.row) && r.row.published !== value);
  await setColumn(SHEET, "published", targets.map((r) => ({ rowNumber: r.rowNumber, value })));
  console.log(`${on ? "Published" : "Unpublished"} ${targets.length} dummy item(s).`);
  const otherDrafts = rows.filter((r) => !isDummy(r.row) && r.row.published !== "TRUE");
  if (otherDrafts.length) console.log(`Other (non-dummy) drafts left untouched: ${otherDrafts.map((r) => `${r.row.type}: ${r.row.title}`).join(" | ")}`);
}

/** Gives every dummy item a placeholder cover image (only fills empty ones). */
async function covers() {
  const targets = (await readRows(SHEET)).filter((r) => isDummy(r.row) && !r.row.coverImage);
  if (!targets.length) return console.log("All dummy items already have a cover image.");
  await setColumn(SHEET, "coverImage", targets.map((r) => ({ rowNumber: r.rowNumber, value: coverFor(r.row.slug) })));
  console.log(`Set cover image on ${targets.length} dummy item(s).`);
}

async function add() {
  const existing = new Set((await readRows(SHEET)).map((r) => r.row.slug));
  const now = Date.now();
  const rows = [...POSTS, ...PAGES]
    .filter((p) => !existing.has(p.slug))
    .map((p) => {
      const at = new Date(now - p.daysAgo * 86_400_000).toISOString();
      const page = p.type === "page";
      // Pages are added live and in the site menu; posts are added as drafts
      return {
        id: crypto.randomUUID().slice(0, 8), type: page ? "page" : "post", slug: p.slug, title: p.title,
        excerpt: p.excerpt, body: p.body, coverImage: coverFor(p.slug), published: page ? "TRUE" : "FALSE",
        showInNav: page ? "TRUE" : "FALSE", order: String(p.order ?? 0), createdAt: at, updatedAt: at,
      };
    });
  if (!rows.length) return console.log("All dummy items already exist.");
  await appendRows(SHEET, rows);
  console.log(`Added ${rows.length} item(s) (posts as drafts, pages live in the menu).`);
}

async function remove() {
  const targets = (await readRows(SHEET)).filter((r) => isDummy(r.row));
  if (!targets.length) return console.log("No dummy items found.");
  await deleteRows(SHEET, targets.map((r) => r.rowNumber));
  console.log(`Removed ${targets.length} dummy item(s).`);
}

const cmd = process.argv[2];
if (cmd === "add") await add();
else if (cmd === "covers") await covers();
else if (cmd === "publish" || cmd === "unpublish") await setPublished(cmd === "publish");
else if (cmd === "remove") await remove();
else console.log("Usage: node --env-file=.env.local scripts/dummy-news.mjs add|covers|publish|unpublish|remove");
