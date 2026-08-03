import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDeliveryNotes } from "@/features/delivery-notes/queries";
import { deliveryNoteSearchSchema } from "@/features/delivery-notes/schemas";
import { SearchAndFilter } from "@/features/delivery-notes/components/SearchAndFilter";
import { attachSinglePOStats } from "@/features/po/services/po-stats";
import { DeletePODialog } from "@/features/po/components/DeletePODialog";
import {
  ArrowLeft,
  Edit3,
  Eye,
  FileText,
  PackageOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Detail PO - Sistem Surat Jalan",
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedParams = await searchParams;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      _count: {
        select: { deliveryNotes: true },
      },
    },
  });

  if (!po) {
    notFound();
  }

  // Parse params and forcefully set purchaseOrderId
  const parsed = deliveryNoteSearchSchema.safeParse(resolvedParams);
  const searchConfig = parsed.success ? parsed.data : deliveryNoteSearchSchema.parse({});
  searchConfig.purchaseOrderId = id;

  const { data: deliveryNotes, meta } = await getDeliveryNotes(searchConfig);

  const poWithStats = await attachSinglePOStats(po);
  const totalItemCount = poWithStats.stats.totalItemCount;

  return (
    <div className="brand-page po-detail-page">
      <header className="brand-page-header po-detail-header">
        <div>
          <Link className="detail-back-link" href="/po">
            <ArrowLeft aria-hidden="true" size={15} /> Kembali ke Data PO
          </Link>
          <p className="brand-eyebrow">{po.companyCode} · Detail Purchase Order</p>
          <h1>{po.poNumber}</h1>
          <p>
            {po.companyName} {po.period ? `— Periode: ${po.period}` : ""}
          </p>
        </div>
        <div className="detail-header-actions">
          <Link
            href={`/po/${po.id}/edit`}
            className="brand-secondary-button"
          >
            <Edit3 aria-hidden="true" size={16} />
            Edit PO
          </Link>
          <DeletePODialog props={{
            purchaseOrderId: po.id,
            poNumber: po.poNumber,
            companyName: po.companyName,
            totalCount: poWithStats.stats.totalCount,
            printedCount: poWithStats.stats.printedCount,
            notPrintedCount: poWithStats.stats.notPrintedCount,
            printedPercentage: poWithStats.stats.printedPercentage,
            notPrintedPercentage: poWithStats.stats.notPrintedPercentage,
            totalItemCount,
            expectedUpdatedAt: po.updatedAt.toISOString(),
          }} />
        </div>
      </header>

      <section className="brand-card po-summary-card">
        <div className="brand-section-heading">
          <div><h2>Ringkasan Pencetakan</h2><p>Status seluruh Surat Jalan pada PO ini.</p></div>
          <span className={`brand-status ${
            poWithStats.stats.status === "Selesai" ? "brand-status-success" :
            poWithStats.stats.status === "Dalam Proses" ? "brand-status-progress" :
            poWithStats.stats.status === "Belum Dimulai" ? "brand-status-warning" :
            "brand-status-neutral"
          }`}>{poWithStats.stats.status}</span>
        </div>
        <div className="po-summary-grid">
          <div>
            <span>Total SJ</span><strong>{poWithStats.stats.totalCount}</strong>
          </div>
          <div>
            <span>Sudah Dicetak</span><strong>{poWithStats.stats.printedCount}</strong><small>{poWithStats.stats.printedPercentage}%</small>
          </div>
          <div>
            <span>Belum Dicetak</span><strong>{poWithStats.stats.notPrintedCount}</strong><small>{poWithStats.stats.notPrintedPercentage}%</small>
          </div>
          <div>
            <span>Total Item</span><strong>{totalItemCount}</strong>
          </div>
        </div>
        <div className="po-summary-progress">
          <div>
            <span>Progres Keseluruhan</span>
            <strong>{poWithStats.stats.printedPercentage}%</strong>
          </div>
          <div
            className="brand-progress"
            role="progressbar"
            aria-valuenow={poWithStats.stats.printedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${poWithStats.stats.printedPercentage}% selesai`}
          >
            <span style={{ width: `${poWithStats.stats.printedPercentage}%` }} />
          </div>
        </div>
      </section>

      <section className="brand-card po-notes-card">
        <div className="po-notes-toolbar">
          <div className="brand-section-heading">
            <div>
              <h2>Surat Jalan ({po._count.deliveryNotes})</h2>
              <p>Cari dan kelola Surat Jalan dalam PO ini.</p>
            </div>
            <span className="list-icon"><FileText aria-hidden="true" size={17} /></span>
          </div>
          <SearchAndFilter initialParams={searchConfig} />
        </div>

        {deliveryNotes.length === 0 ? (
          <div className="brand-empty-state"><div>
            <span className="empty-icon-tile"><PackageOpen aria-hidden="true" size={22} /></span>
            <h3>Data tidak ditemukan</h3>
            <p>
              Tidak ada surat jalan yang cocok dengan pencarian Anda.
            </p>
          </div></div>
        ) : (
          <div className="brand-table-wrap">
            <table className="brand-table delivery-note-list-table">
              <thead>
                <tr>
                  <th scope="col">
                    Kode Unik
                  </th>
                  <th scope="col">
                    Nomor Surat Jalan
                  </th>
                  <th scope="col">
                    Cabang
                  </th>
                  <th scope="col">
                    Status
                  </th>
                  <th scope="col">
                    Diperbarui
                  </th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {deliveryNotes.map((dn) => (
                  <tr key={dn.id}>
                    <td className="po-primary-cell">
                      {dn.uniqueCode}
                    </td>
                    <td>
                      {dn.documentNumber || "-"}
                    </td>
                    <td>
                      <div className="po-primary-cell">{dn.branchName}</div>
                      <div className="po-secondary-cell">{dn._count.items} barang</div>
                    </td>
                    <td>
                      <span className={`brand-status ${
                        dn.printStatus === "PRINTED"
                          ? "brand-status-success"
                          : "brand-status-neutral"
                      }`}>
                        {dn.printStatus === "PRINTED" ? "Sudah Dicetak" : "Belum Dicetak"}
                      </span>
                    </td>
                    <td className="po-date-cell">
                      {new Date(dn.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td>
                      <div className="table-actions">
                      <Link href={`/surat-jalan/${dn.id}/preview`} className="po-open-link">
                        <Eye aria-hidden="true" size={14} /> Preview
                      </Link>
                      <Link href={`/surat-jalan/${dn.id}`} className="po-open-link">
                        Buka
                      </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="brand-pagination">
            <div>
              Halaman {meta.page} dari {meta.totalPages}
            </div>
            <div>
              <Link
                href={`/po/${id}?page=${meta.page - 1}&limit=${meta.limit}&q=${encodeURIComponent(searchConfig.q || "")}&status=${searchConfig.status}`}
                className={`brand-secondary-button ${meta.page <= 1 ? "pagination-disabled" : ""}`}
                aria-disabled={meta.page <= 1}
              >
                Sebelumnya
              </Link>
              <Link
                href={`/po/${id}?page=${meta.page + 1}&limit=${meta.limit}&q=${encodeURIComponent(searchConfig.q || "")}&status=${searchConfig.status}`}
                className={`brand-secondary-button ${meta.page >= meta.totalPages ? "pagination-disabled" : ""}`}
                aria-disabled={meta.page >= meta.totalPages}
              >
                Selanjutnya
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
