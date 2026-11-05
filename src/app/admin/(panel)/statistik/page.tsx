import Link from "next/link";
import { IconArrowRight } from "@/components/Icons";
import { PrintButton } from "@/components/PrintButton";
import {
  GENDERS,
  getChildren,
  getMembers,
  memberState,
  MEMBERSHIP_LABEL,
  OKU_DETAILS,
  OKU_EXAMPLES,
  OKU_TYPES,
  STATE_LABEL,
  type MemberState,
} from "@/lib/data";
import { AGE_GROUPS, childrenHref, matches, toChildRows, TYPE_COUNTS, type ChildFilters } from "./children-filter";

/** `note` sits beside the label; `detail` is a second line under it. */
type Item = { label: string; value: number; note?: string; detail?: string; href?: string };

const printedAt = () =>
  new Date().toLocaleString("ms-MY", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" });

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export default async function Statistik() {
  const [members, allChildren] = await Promise.all([getMembers(), getChildren()]);
  const children = toChildRows(allChildren, new Set(members.map((m) => m.id)));
  const total = children.length;
  // Each bar counts the children matching a filter and links to exactly that list
  const childItem = (label: string, f: ChildFilters, note?: string): Item => ({
    label,
    note,
    value: children.filter((c) => matches(c, f)).length,
    href: childrenHref(f),
  });

  const parentsWithChildren = new Set(children.map((c) => c.memberId)).size;
  const multiType = children.filter((c) => c.types.length > 1).length;

  const okuItems = OKU_TYPES.map((t) => ({ ...childItem(t, { oku: t }), detail: OKU_EXAMPLES[t] }));
  const genderItems = GENDERS.map((g) => childItem(g, { jantina: g }));
  // Specific conditions per type; "Tidak dinyatakan" = has the type but no condition ticked for it
  const detailGroups = OKU_TYPES.map((t) => {
    const withType = children.filter((c) => c.types.includes(t));
    const unspecified = withType.filter((c) => !c.details.some((d) => OKU_DETAILS[t].includes(d))).length;
    return {
      type: t,
      total: withType.length,
      items: [
        ...OKU_DETAILS[t].map((d) => childItem(d, { oku: t, butiran: d })),
        ...(unspecified ? [{ label: "Tidak dinyatakan", value: unspecified }] : []),
      ],
    };
  }).filter((g) => g.total > 0);
  const ageItems = AGE_GROUPS.map((g) => childItem(g.label, { umur: g.key }, g.note));
  const typeCountItems = TYPE_COUNTS.filter((t) => t.key !== "2+").map((t) => childItem(t.label, { bilangan: t.key }));

  const states = members.map((m) => memberState(m));
  const stateOrder: MemberState[] = ["Active", "Expiring", "Lifetime", "Expired", "Unpaid", "Pending"];
  const stateItems: Item[] = stateOrder.map((s) => ({
    label: STATE_LABEL[s],
    value: states.filter((x) => x === s).length,
    href: `/admin/members?status=${s}`,
  }));
  const typeItems: Item[] = (["Annual", "Lifetime"] as const).map((t) => ({
    label: MEMBERSHIP_LABEL[t],
    value: members.filter((m) => m.membershipType === t).length,
    href: `/admin/members?jenis=${t}`,
  }));

  const tiles = [
    { label: "Jumlah anak OKU", value: total, href: childrenHref({}) },
    {
      label: "Ahli yang mendaftar anak",
      value: `${parentsWithChildren} / ${members.length}`,
      href: "/admin/members?anak=ada",
    },
    { label: "Ahli belum mendaftar anak", value: members.length - parentsWithChildren, href: "/admin/members?anak=tiada" },
    { label: "Anak dengan lebih daripada satu jenis OKU", value: multiType, href: childrenHref({ bilangan: "2+" }) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Statistik</h1>
          <p className="text-sm text-slate-500">Ringkasan anak OKU dan keahlian berdasarkan rekod semasa</p>
          <p className="hidden text-xs text-slate-500 print:block">Dijana pada {printedAt()}</p>
        </div>
        <PrintButton />
      </div>

      <GroupHeading
        title="Anak OKU"
        subtitle="Maklumat anak istimewa yang didaftarkan oleh ahli: jenis OKU, jantina dan umur."
        first
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-sm text-slate-500">{t.label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">{t.value}</p>
            </>
          );
          return t.href ? (
            <Link
              key={t.label}
              href={t.href}
              className="card group relative break-inside-avoid p-5 pr-10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
            >
              {body}
              <IconArrowRight className="absolute top-5 right-5 size-4 text-slate-300 transition group-hover:text-brand-600 print:hidden" />
            </Link>
          ) : (
            <div key={t.label} className="card break-inside-avoid p-5">
              {body}
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="card px-5 py-10 text-center text-sm text-slate-500">Belum ada maklumat anak direkodkan.</div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            <Section
              title="Jenis OKU"
              subtitle="Seorang anak boleh mempunyai lebih daripada satu jenis, jadi jumlah peratus boleh melebihi 100%."
            >
              <Bars items={okuItems} total={total} />
            </Section>
            <Section title="Jantina anak">
              <Bars items={genderItems} total={total} />
            </Section>
            <Section title="Kumpulan umur anak" subtitle="Dikira daripada tarikh lahir pada hari ini.">
              <Bars items={ageItems} total={total} />
            </Section>
            <Section title="Bilangan jenis OKU bagi setiap anak">
              <Bars items={typeCountItems} total={total} />
            </Section>
          </div>

          <Section title="Jenis OKU mengikut jantina" subtitle="Klik pada angka untuk melihat senarai anak.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-5 py-2.5 font-medium">Jenis OKU</th>
                    {GENDERS.map((g) => (
                      <th key={g} className="px-5 py-2.5 text-right font-medium">{g}</th>
                    ))}
                    <th className="px-5 py-2.5 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {OKU_TYPES.map((t) => {
                    const withType = children.filter((c) => c.types.includes(t));
                    return (
                      <tr key={t}>
                        <td className="px-5 py-2.5 text-slate-900">
                          {t}
                          <span className="mt-0.5 block text-xs text-slate-400">{OKU_EXAMPLES[t]}</span>
                        </td>
                        {GENDERS.map((g) => (
                          <td key={g} className="text-right tabular-nums text-slate-700">
                            <CellLink href={childrenHref({ oku: t, jantina: g })}>
                              {withType.filter((c) => c.gender === g).length}
                            </CellLink>
                          </td>
                        ))}
                        <td className="text-right font-semibold tabular-nums text-slate-900">
                          <CellLink href={childrenHref({ oku: t })}>{withType.length}</CellLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Butiran jenis OKU"
            subtitle="Keadaan khusus yang ditandakan oleh ibu bapa. Peratus dikira daripada anak dalam jenis OKU tersebut."
          >
            <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-y-0 print:grid-cols-2 print:divide-y-0">
              {detailGroups.map((g) => (
                <div key={g.type} className="break-inside-avoid">
                  <h3 className="px-5 pt-4 text-sm font-semibold text-slate-900">
                    {g.type} <span className="font-normal text-slate-500">· {g.total} anak</span>
                  </h3>
                  <Bars items={g.items} total={g.total} />
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      <GroupHeading title="Keahlian" subtitle={`Status dan jenis keahlian bagi ${members.length} ahli berdaftar.`} />

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
        <Section title="Status keahlian">
          <Bars items={stateItems} total={members.length} />
        </Section>
        <Section title="Jenis keahlian">
          <Bars items={typeItems} total={members.length} />
        </Section>
      </div>
    </div>
  );
}

/** Divider heading between groups of statistics. */
function GroupHeading({ title, subtitle, first }: { title: string; subtitle: string; first?: boolean }) {
  return (
    <div className={first ? "" : "border-t border-slate-200 pt-8 print:break-before-page print:border-0 print:pt-0"}>
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-slate-900">
        <span className="h-6 w-1.5 rounded-full bg-brand-600" aria-hidden />
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card break-inside-avoid overflow-hidden">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function CellLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-5 py-2.5 hover:bg-brand-50 hover:text-brand-700 hover:underline">
      {children}
    </Link>
  );
}

/** Horizontal bars; width is the share of `total`, so bars compare across sections too. Rows with `href` are links. */
function Bars({ items, total }: { items: Item[]; total: number }) {
  return (
    <ul className="space-y-1 px-2 py-3">
      {items.map((it) => {
        const p = pct(it.value, total);
        const row = (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="text-slate-700 group-hover:text-brand-700">{it.label}</span>
                {it.note && <span className="ml-1.5 text-xs text-slate-400">{it.note}</span>}
                {it.detail && <span className="mt-0.5 block text-xs text-slate-400">{it.detail}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 tabular-nums text-slate-900">
                <strong className="font-semibold">{it.value}</strong>
                <span className="text-xs text-slate-500">{p}%</span>
                {it.href && (
                  <IconArrowRight className="size-3.5 text-slate-300 transition group-hover:text-brand-600 print:hidden" />
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${p}%` }} />
            </div>
          </>
        );
        return (
          <li key={it.label} title={`${it.label}: ${it.value} (${p}%)`}>
            {it.href ? (
              <Link href={it.href} className="group block rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                {row}
              </Link>
            ) : (
              <div className="px-3 py-2.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
