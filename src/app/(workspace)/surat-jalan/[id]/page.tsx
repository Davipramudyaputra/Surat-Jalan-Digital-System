import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryNoteById } from "@/features/delivery-notes/queries";
import { ContextualHistorySection } from "@/features/audit/components/ContextualHistorySection";
import { AUDIT_ENTITY_TYPE } from "@/features/audit/constants";
import { hasDeliveryNotePdfExport } from "@/features/audit/queries";
import { DownloadPdfButton } from "@/features/pdf/components/DownloadPdfButton";
import { formatBusinessDate } from "@/lib/delivery-note-template/formatter";
import {
  ArrowLeft,
  Clock3,
  Edit3,
  Eye,
  PackageOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Surat Jalan - Detail",
};

export default async function DeliveryNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deliveryNote = await getDeliveryNoteById(id);

  if (!deliveryNote) {
    notFound();
  }

  const hasBeenDownloaded = await hasDeliveryNotePdfExport(id);

  return (
    <div className="brand-page delivery-detail-page">
      <header className="brand-page-header" aria-labelledby="page-title">
        <div>
          <Link className="detail-back-link" href={`/po/${deliveryNote.purchaseOrderId}`}>
            <ArrowLeft aria-hidden="true" size={15} /> Kembali ke PO
          </Link>
          <p className="brand-eyebrow">{deliveryNote.uniqueCode} · Surat Jalan</p>
          <h1 id="page-title">Detail Surat Jalan</h1>
          <p>
            Informasi detail surat jalan dan daftar barang.
          </p>
        </div>
        <div className="detail-header-actions">
          <Link
            className="brand-secondary-button"
            href={`/surat-jalan/${id}/edit`}
          >
            <Edit3 aria-hidden="true" size={16} />
            Edit Data
          </Link>
          <DownloadPdfButton
            deliveryNoteId={id}
            hasBeenDownloaded={hasBeenDownloaded}
          />
          <Link
            className="brand-primary-button"
            href={`/surat-jalan/${id}/preview`}
          >
            <Eye aria-hidden="true" size={16} />
            Lihat Preview
          </Link>
        </div>
      </header>

      <section className="brand-card detail-information-card">
        <div className="brand-section-heading">
          <div>
            <h2>Informasi Utama</h2>
            <p>Data surat jalan yang akan dicetak.</p>
          </div>
          <span className={`brand-status ${deliveryNote.printStatus === "PRINTED" ? "brand-status-success" : "brand-status-neutral"}`}>
            {deliveryNote.printStatus === "PRINTED" ? "Sudah Dicetak" : "Belum Dicetak"}
          </span>
        </div>

        <dl className="detail-information-grid">
          <div>
            <dt>Kode Unik</dt><dd>{deliveryNote.uniqueCode}</dd>
          </div>
          <div>
            <dt>Nomor Surat Jalan</dt><dd>{deliveryNote.documentNumber || "-"}</dd>
          </div>
          <div>
            <dt>Tanggal Surat Jalan</dt><dd>
              {deliveryNote.documentDate
                ? formatBusinessDate(deliveryNote.documentDate)
                : "Realtime saat preview/cetak (Asia/Jakarta)"}
            </dd>
          </div>
          <div>
            <dt>Nama Cabang</dt><dd>{deliveryNote.branchName}</dd>
          </div>
          <div>
            <dt>Perusahaan Penerima</dt><dd>{deliveryNote.recipientCompanyName}</dd>
          </div>
          <div>
            <dt>Kode Perusahaan</dt><dd>{deliveryNote.purchaseOrder.companyCode}</dd>
          </div>
          <div>
            <dt>Nomor PO</dt><dd>{deliveryNote.purchaseOrder.poNumber}</dd>
          </div>
          <div>
            <dt>Kendaraan</dt><dd>{deliveryNote.vehicleName || "-"}</dd>
          </div>
          <div>
            <dt>Nomor Kendaraan</dt><dd>{deliveryNote.vehicleNumber || "-"}</dd>
          </div>
          <div>
            <dt>Nomor PO Tambahan</dt><dd>{deliveryNote.additionalPoNumber || "-"}</dd>
          </div>
          <div>
            <dt>Nama Penerima</dt><dd>{deliveryNote.recipientName || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="brand-card detail-items-card">
        <div className="brand-section-heading">
          <div><h2>Daftar Barang</h2><p>Terdapat {deliveryNote.items.length} jenis barang pada Surat Jalan ini.</p></div>
          <span className="list-icon"><PackageOpen aria-hidden="true" size={17} /></span>
        </div>

        <div className="brand-table-wrap">
          <table className="brand-table detail-items-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kuantitas</th>
                <th>Satuan</th>
                <th>Nama Barang</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {deliveryNote.items.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{Number(item.quantity)}</td>
                  <td>{item.unit || "-"}</td>
                  <td>{item.displayProductName}</td>
                  <td>{item.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="brand-card audit-card">
        <div className="brand-section-heading">
          <div><h2>Audit &amp; Status Cetak</h2><p>Riwayat dokumen tersimpan oleh sistem.</p></div>
          <span className="list-icon"><Clock3 aria-hidden="true" size={17} /></span>
        </div>
        <dl className="audit-grid">
          <div>
            <dt>Dibuat pada</dt><dd>
              {new Date(deliveryNote.createdAt).toLocaleString("id-ID")}
            </dd>
          </div>
          <div>
            <dt>Terakhir diperbarui</dt><dd>
              {new Date(deliveryNote.updatedAt).toLocaleString("id-ID")}
            </dd>
          </div>
          <div>
            <dt>Waktu cetak pertama</dt><dd>
              {deliveryNote.firstPrintedAt
                ? new Date(deliveryNote.firstPrintedAt).toLocaleString("id-ID")
                : "Belum pernah dicetak"}
            </dd>
          </div>
          <div>
            <dt>Waktu cetak terakhir</dt><dd>
              {deliveryNote.lastPrintedAt
                ? new Date(deliveryNote.lastPrintedAt).toLocaleString("id-ID")
                : "Belum pernah dicetak"}
            </dd>
          </div>
          <div>
            <dt>Jumlah Print</dt><dd>{deliveryNote.printCount} kali</dd>
          </div>
        </dl>
      </section>

      <ContextualHistorySection
        entityType={AUDIT_ENTITY_TYPE.DELIVERY_NOTE}
        entityId={deliveryNote.id}
        title="History Surat Jalan"
        description="Riwayat perubahan data, item, dan cetak pada Surat Jalan ini."
      />
    </div>
  );
}
