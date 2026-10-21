import { getDb } from "./db";
import { filterSql, listInput } from "@/functions/enquiries";

/** Admin: CSV export of the current filter (used by /api/admin/enquiries.csv). */
export async function enquiriesCsv(filters: unknown): Promise<string> {
  const f = listInput.parse(filters ?? {});
  const db = await getDb();
  const { clause, params } = filterSql(f);
  const rows = await db.all<Record<string, unknown>>(
    `SELECT id, created_at, kind, status, name, company, email, country, product, volume,
            incoterm, samples, lang, source_page, message, notes
     FROM enquiries ${clause} ORDER BY created_at DESC`,
    params,
  );
  const cols = [
    "id",
    "created_at",
    "kind",
    "status",
    "name",
    "company",
    "email",
    "country",
    "product",
    "volume",
    "incoterm",
    "samples",
    "lang",
    "source_page",
    "message",
    "notes",
  ];
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    // Neutralise spreadsheet formula injection.
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  // BOM so Excel opens UTF-8 (Vietnamese) correctly.
  return (
    "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n")
  );
}
