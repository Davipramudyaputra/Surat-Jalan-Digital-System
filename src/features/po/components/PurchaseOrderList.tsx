"use client";

import { PurchaseOrder } from "@/generated/prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { POStats } from "../utils/stats";
import { ArrowRight, PackageOpen } from "lucide-react";

type POWithStats = PurchaseOrder & {
  _count: {
    deliveryNotes: number;
  };
  stats: POStats;
};

export function PurchaseOrderList({ purchaseOrders }: { purchaseOrders: POWithStats[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRowClick = (id: string) => {
    startTransition(() => {
      router.push(`/po/${id}`);
    });
  };

  if (purchaseOrders.length === 0) {
    return (
      <div className="brand-empty-state">
        <div>
        <span className="empty-icon-tile"><PackageOpen aria-hidden="true" size={22} /></span>
        <h3>Tidak ada Purchase Order</h3>
        <p>
          Belum ada Purchase Order yang sesuai dengan pencarian atau filter Anda. Silakan upload file Excel baru.
        </p>
        <Link className="brand-primary-button empty-state-action" href="/po?upload=true">
          Upload Excel Baru
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-table-wrap">
      <table className="brand-table po-table">
        <thead>
          <tr>
            <th scope="col">
              Nomor PO
            </th>
            <th scope="col">
              Perusahaan
            </th>
            <th scope="col">
              SJ / Item
            </th>
            <th scope="col">
              Progres Pencetakan
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
          {purchaseOrders.map((po) => {
            const { stats } = po;

            return (
              <tr
                key={po.id}
                onClick={() => handleRowClick(po.id)}
                className={isPending ? "po-row-pending" : undefined}
              >
                <td>
                  <div className="po-primary-cell">{po.poNumber}</div>
                  <div className="po-secondary-cell">
                    Periode: {po.period || "-"}
                  </div>
                </td>
                <td>
                  <div className="po-primary-cell po-company-cell">{po.companyName}</div>
                  <div className="po-secondary-cell">Kode: {po.companyCode}</div>
                </td>
                <td className="po-count-cell">
                  <div>{stats.totalCount} surat jalan</div>
                  <div>{stats.totalItemCount} item</div>
                </td>
                <td>
                  <div className="po-progress-cell">
                    <div>
                      <span>Sudah {stats.printedPercentage}%</span>
                      <span>Belum {stats.notPrintedPercentage}%</span>
                    </div>
                    <div
                      className="brand-progress"
                      role="progressbar"
                      aria-valuenow={stats.printedPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stats.printedPercentage}% selesai`}
                    >
                      <span style={{ width: `${stats.printedPercentage}%` }} />
                    </div>
                  </div>
                </td>
                <td>
                  {stats.status === "Selesai" && (
                    <span className="brand-status brand-status-success">
                      Selesai
                    </span>
                  )}
                  {stats.status === "Dalam Proses" && (
                    <span className="brand-status brand-status-progress">
                      Dalam Proses
                    </span>
                  )}
                  {stats.status === "Belum Dimulai" && (
                    <span className="brand-status brand-status-warning">
                      Belum Dimulai
                    </span>
                  )}
                  {stats.status === "Kosong" && (
                    <span className="brand-status brand-status-neutral">
                      Kosong
                    </span>
                  )}
                </td>
                <td className="po-date-cell">
                  {new Date(po.updatedAt).toLocaleDateString('id-ID')}
                </td>
                <td>
                  <Link
                    href={`/po/${po.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="po-open-link"
                  >
                    Buka <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
