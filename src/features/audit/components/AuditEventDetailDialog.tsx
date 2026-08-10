"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  AUDIT_SOURCE_LABELS,
} from "../constants";
import type { AuditEventDetail } from "./types";

type Props = {
  event: AuditEventDetail | null;
  onClose: () => void;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }
  if (value instanceof Date) {
    return value.toLocaleString("id-ID");
  }
  return String(value);
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    poNumber: "Nomor PO",
    companyCode: "Kode Perusahaan",
    companyName: "Nama Perusahaan",
    period: "Periode",
    documentNumber: "Nomor Surat Jalan",
    documentDate: "Tanggal Surat Jalan",
    recipientCompanyName: "Perusahaan Penerima",
    branchName: "Nama Cabang",
    recipientName: "Nama Penerima",
    vehicleName: "Kendaraan",
    vehicleNumber: "Nomor Kendaraan",
    additionalPoNumber: "Nomor PO Tambahan",
    printStatus: "Status Cetak",
    printCount: "Jumlah Cetak",
    quantity: "Kuantitas",
    unit: "Satuan",
    displayProductName: "Nama Barang",
    description: "Keterangan",
    sortOrder: "Urutan",
    purchaseOrderId: "ID Purchase Order",
    paperProfile: "Profil Kertas",
    paperWidthMm: "Lebar Kertas (mm)",
    paperHeightMm: "Tinggi Kertas (mm)",
    orientation: "Orientasi",
    pageCount: "Jumlah Halaman",
    filename: "Nama File",
    outputSizeBytes: "Ukuran File (byte)",
    durationMs: "Durasi Proses (ms)",
    deliveryNoteCount: "Jumlah Surat Jalan",
    itemCount: "Jumlah Barang",
    status: "Status",
  };
  return (
    labels[field] ??
    field
      .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
      .replace(/[_-]+/gu, " ")
      .replace(/^./u, (character) => character.toUpperCase())
  );
}

function AuditValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>—</span>;
    return (
      <ul className="audit-structured-list">
        {value.map((entry, index) => (
          <li key={index}>
            <AuditValue value={entry} />
          </li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>—</span>;
    return (
      <dl className="audit-structured-group">
        {entries.map(([key, entry]) => (
          <div key={key}>
            <dt>{fieldLabel(key)}</dt>
            <dd>
              <AuditValue value={entry} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span>{formatValue(value)}</span>;
}

export function AuditEventDetailDialog({ event, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    if (event && !openRef.current) {
      dialogRef.current?.showModal();
      openRef.current = true;
    }
    if (!event && openRef.current) {
      dialogRef.current?.close();
      openRef.current = false;
    }
  }, [event]);

  if (!event) {
    return null;
  }

  const changedFields = Array.isArray(event.changedFields)
    ? event.changedFields
    : [];

  const renderBeforeAfter = (field: string) => {
    return (
      <div className="audit-detail-field" key={field}>
        <div className="audit-detail-field-name">{fieldLabel(field)}</div>
        <div className="audit-detail-field-values">
          <div>
            <span>Sebelum</span>
            <div className="audit-value audit-before">
              <AuditValue value={event.beforeData?.[field]} />
            </div>
          </div>
          <div>
            <span>Sesudah</span>
            <div className="audit-value audit-after">
              <AuditValue value={event.afterData?.[field]} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <dialog
      aria-labelledby="audit-detail-title"
      className="audit-detail-dialog"
      ref={dialogRef}
      onClose={() => {
        openRef.current = false;
        onClose();
      }}
    >
      <div className="audit-detail-content">
        <div className="audit-detail-header">
          <div>
            <p className="brand-eyebrow">Detail Audit Event</p>
            <h2 id="audit-detail-title">
              {AUDIT_ACTION_LABELS[event.action] ?? event.action}
            </h2>
            <p className="audit-detail-subtitle">
              {event.entityLabelSnapshot || event.entityId}
            </p>
          </div>
          <button
            aria-label="Tutup detail"
            className="audit-detail-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <dl className="audit-detail-meta">
          <div><dt>Event ID</dt><dd>{event.id}</dd></div>
          <div><dt>Waktu</dt><dd>{new Date(event.occurredAt).toLocaleString("id-ID")}</dd></div>
          <div><dt>Actor</dt><dd>{event.actorNameSnapshot || "SYSTEM"}</dd></div>
          <div><dt>Role</dt><dd>{event.actorRoleSnapshot || "-"}</dd></div>
          <div><dt>Jenis Data</dt><dd>{AUDIT_ENTITY_TYPE_LABELS[event.entityType] ?? event.entityType}</dd></div>
          <div><dt>Entity ID</dt><dd>{event.entityId}</dd></div>
          <div><dt>Source</dt><dd>{AUDIT_SOURCE_LABELS[event.source] ?? event.source}</dd></div>
          {event.requestId ? <div><dt>Request ID</dt><dd>{event.requestId}</dd></div> : null}
          {event.batchId ? <div><dt>Batch ID</dt><dd>{event.batchId}</dd></div> : null}
        </dl>

        {changedFields.length > 0 ? (
          <section className="audit-detail-section">
            <h3>Perubahan Field</h3>
            <div className="audit-changed-fields">
              {changedFields.map((field) => renderBeforeAfter(field))}
            </div>
          </section>
        ) : null}

        {event.metadata ? (
          <section className="audit-detail-section">
            <h3>Metadata</h3>
            <dl className="audit-metadata-grid">
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key}>
                  <dt>{fieldLabel(key)}</dt>
                  <dd>
                    <AuditValue value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </dialog>
  );
}
