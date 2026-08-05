"use client";

import { useState } from "react";
import { History } from "lucide-react";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  AUDIT_SOURCE_LABELS,
} from "../constants";
import { AuditEventDetailDialog } from "./AuditEventDetailDialog";
import type { AuditEventDetail } from "./types";

type AuditListItem = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabelSnapshot: string | null;
  action: string;
  actorNameSnapshot: string | null;
  actorRoleSnapshot: string | null;
  occurredAt: Date;
  source: string;
  changedFields: string[] | null;
  batchId: string | null;
};

export function AuditHistoryList({
  events,
  onLoadDetail,
}: {
  events: AuditListItem[];
  onLoadDetail: (id: string) => Promise<AuditEventDetail | null>;
}) {
  const [detail, setDetail] = useState<AuditEventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const handleDetail = async (id: string) => {
    setLoadingDetail(id);
    const result = await onLoadDetail(id);
    setLoadingDetail(null);
    if (result) {
      setDetail(result);
    }
  };

  return (
    <>
      {events.length === 0 ? (
        <div className="brand-empty-state history-empty-state">
          <div>
            <span className="empty-icon-tile">
              <History aria-hidden="true" size={22} />
            </span>
            <h3>Tidak ada aktivitas</h3>
            <p>
              Belum ada catatan audit, atau tidak ada yang cocok dengan filter
              yang dipilih. Coba ubah kata kunci atau reset filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="brand-table-wrap">
          <table className="brand-table audit-history-table">
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Actor</th>
                <th scope="col">Aksi</th>
                <th scope="col">Jenis Data</th>
                <th scope="col">Identitas</th>
                <th scope="col">Source</th>
                <th scope="col">
                  <span className="sr-only">Detail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="audit-date-cell">
                    {new Date(event.occurredAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <div className="audit-actor-cell">
                      <span className="audit-actor-avatar">
                        {(event.actorNameSnapshot || "S").slice(0, 1).toUpperCase()}
                      </span>
                      <span>{event.actorNameSnapshot || "SYSTEM"}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`brand-status audit-action audit-action-${event.action.toLowerCase()}`}
                    >
                      {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                    </span>
                  </td>
                  <td>
                    {AUDIT_ENTITY_TYPE_LABELS[event.entityType] ??
                      event.entityType}
                  </td>
                  <td className="audit-identity-cell">
                    {event.entityLabelSnapshot || event.entityId}
                  </td>
                  <td>
                    {AUDIT_SOURCE_LABELS[event.source] ?? event.source}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        aria-label="Lihat detail event"
                        className="po-open-link audit-detail-trigger"
                        disabled={loadingDetail === event.id}
                        onClick={() => handleDetail(event.id)}
                        type="button"
                      >
                        {loadingDetail === event.id ? "Memuat..." : "Detail"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AuditEventDetailDialog
        event={detail}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
