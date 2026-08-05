import type { Metadata } from "next";
import Link from "next/link";
import { History, Search } from "lucide-react";

import { AuditHistoryList } from "@/features/audit/components/AuditHistoryList";
import { getAuditEventDetailAction } from "@/features/audit/actions/get-audit-event";
import {
  auditHistorySearchSchema,
  AUDIT_ACTION_FILTER_OPTIONS,
  AUDIT_ENTITY_FILTER_OPTIONS,
} from "@/features/audit/schemas";
import { queryAuditHistory } from "@/features/audit/queries";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
} from "@/features/audit/constants";

export const metadata: Metadata = {
  title: "History - Sistem Surat Jalan",
};

function buildQueryString(
  params: Record<string, string>,
  page: number,
  limit: number,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  return `/history?${qs.toString()}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const parsed = auditHistorySearchSchema.safeParse(resolvedParams);
  const params = parsed.success
    ? parsed.data
    : auditHistorySearchSchema.parse({});

  const { data, meta } = await queryAuditHistory(params);

  const activeFilters: Array<{ label: string }> = [];
  if (params.action) {
    activeFilters.push({
      label: AUDIT_ACTION_LABELS[params.action] ?? params.action,
    });
  }
  if (params.entity) {
    activeFilters.push({
      label: AUDIT_ENTITY_TYPE_LABELS[params.entity] ?? params.entity,
    });
  }
  if (params.actor) activeFilters.push({ label: `Actor: ${params.actor}` });
  if (params.q) activeFilters.push({ label: `Cari: ${params.q}` });
  if (params.from) activeFilters.push({ label: `Dari ${params.from}` });
  if (params.to) activeFilters.push({ label: `Sampai ${params.to}` });

  const hasFilter = activeFilters.length > 0;
  const filterParams: Record<string, string> = {
    q: params.q,
    actor: params.actor,
    action: params.action,
    entity: params.entity,
    from: params.from,
    to: params.to,
  };

  return (
    <div className="brand-page history-page">
      <header className="brand-page-header">
        <div>
          <p className="brand-eyebrow">Audit Trail</p>
          <h1>History</h1>
          <p>Riwayat perubahan penting pada data bisnis.</p>
        </div>
        <span className="history-header-count">
          <History aria-hidden="true" size={16} />
          {meta.total} event
        </span>
      </header>

      {/* Filter */}
      <section className="brand-card history-filter-card">
        <div className="brand-section-heading">
          <div>
            <h2>Filter History</h2>
            <p>Persempit hasil menggunakan pencarian dan filter.</p>
          </div>
        </div>

        <form className="history-filter-wrap" method="get" action="/history">
          <div className="history-field-search">
            <label className="brand-field">
              <span>Cari</span>
              <div className="history-input-with-icon">
                <Search aria-hidden="true" size={15} />
                <input
                  name="q"
                  type="search"
                  defaultValue={params.q}
                  placeholder="Nomor PO, cabang, atau actor"
                />
              </div>
            </label>
          </div>

          <div className="history-filter-grid">
            <label className="brand-field">
              <span>Actor</span>
              <input
                name="actor"
                type="search"
                defaultValue={params.actor}
                placeholder="Nama actor"
              />
            </label>
            <label className="brand-field">
              <span>Aksi</span>
              <select name="action" defaultValue={params.action}>
                {AUDIT_ACTION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="brand-field">
              <span>Jenis Data</span>
              <select name="entity" defaultValue={params.entity}>
                {AUDIT_ENTITY_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="brand-field">
              <span>Dari tanggal</span>
              <input name="from" type="date" defaultValue={params.from} />
            </label>
            <label className="brand-field">
              <span>Sampai tanggal</span>
              <input name="to" type="date" defaultValue={params.to} />
            </label>
          </div>

          <div className="history-filter-actions">
            <button className="brand-primary-button" type="submit">
              Terapkan
            </button>
            <Link className="brand-secondary-button" href="/history">
              Reset
            </Link>
          </div>
        </form>
      </section>

      {/* Hasil */}
      <section className="brand-card history-list-card">
        <div className="brand-section-heading">
          <div>
            <h2>Aktivitas</h2>
            <p>
              Menampilkan {data.length} dari {meta.total} event.
            </p>
          </div>
          <span className="history-result-count">{meta.total}</span>
        </div>

        {hasFilter ? (
          <div className="history-active-filters">
            {activeFilters.map((filter) => (
              <span className="history-chip" key={filter.label}>
                {filter.label}
              </span>
            ))}
            <Link className="history-chip history-chip-clear" href="/history">
              Hapus semua
            </Link>
          </div>
        ) : null}

        <AuditHistoryList
          events={data}
          onLoadDetail={getAuditEventDetailAction}
        />

        {meta.totalPages > 1 ? (
          <div className="brand-pagination history-pagination">
            <div>
              Halaman {meta.page} dari {meta.totalPages}
            </div>
            <div>
              <Link
                href={buildQueryString(filterParams, meta.page - 1, params.limit)}
                className={`brand-secondary-button ${meta.page <= 1 ? "pagination-disabled" : ""}`}
                aria-disabled={meta.page <= 1}
              >
                Sebelumnya
              </Link>
              <Link
                href={buildQueryString(filterParams, meta.page + 1, params.limit)}
                className={`brand-secondary-button ${meta.page >= meta.totalPages ? "pagination-disabled" : ""}`}
                aria-disabled={meta.page >= meta.totalPages}
              >
                Selanjutnya
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
