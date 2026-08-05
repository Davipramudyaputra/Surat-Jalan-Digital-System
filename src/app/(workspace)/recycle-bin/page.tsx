import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { RecycleBinActions } from "@/features/recycle-bin/components/RecycleBinActions";
import {
  queryDeletedDeliveryNotes,
  queryDeletedPurchaseOrders,
} from "@/features/recycle-bin/queries";

export const metadata: Metadata = {
  title: "Recycle Bin - Sistem Surat Jalan",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function formatDate(value: Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ageInDays(value: Date | null | undefined): number {
  if (!value) return 0;
  return Math.floor((Date.now() - value.getTime()) / (24 * 60 * 60 * 1000));
}

export default async function RecycleBinPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const tab = resolved.tab === "delivery-note" ? "delivery-note" : "purchase-order";
  const page = typeof resolved.page === "string" && Number.parseInt(resolved.page, 10) > 0
    ? Number.parseInt(resolved.page, 10)
    : 1;
  const q = typeof resolved.q === "string" ? resolved.q : "";
  const limit = 20;

  const buildLink = (nextTab: string, nextPage: number) => {
    const qs = new URLSearchParams();
    qs.set("tab", nextTab);
    if (q) qs.set("q", q);
    qs.set("page", String(nextPage));
    return `/recycle-bin?${qs.toString()}`;
  };

  const poResult =
    tab === "purchase-order"
      ? await queryDeletedPurchaseOrders({ q, page, limit })
      : null;
  const dnResult =
    tab === "delivery-note"
      ? await queryDeletedDeliveryNotes({ q, page, limit })
      : null;

  return (
    <div className="brand-page recycle-bin-page">
      <header className="brand-page-header">
        <div>
          <p className="brand-eyebrow">Data yang dihapus</p>
          <h1>Recycle Bin</h1>
          <p>Kelola data Purchase Order dan Surat Jalan yang telah dihapus.</p>
        </div>
        <span className="history-header-count">
          <Trash2 aria-hidden="true" size={16} />
          {poResult?.meta.total ?? dnResult?.meta.total ?? 0} item
        </span>
      </header>

      <div className="recycle-tabs" role="tablist" aria-label="Jenis data di Recycle Bin">
        <Link
          href={buildLink("purchase-order", 1)}
          role="tab"
          aria-selected={tab === "purchase-order"}
          className={tab === "purchase-order" ? "recycle-tab active" : "recycle-tab"}
        >
          Purchase Order
        </Link>
        <Link
          href={buildLink("delivery-note", 1)}
          role="tab"
          aria-selected={tab === "delivery-note"}
          className={tab === "delivery-note" ? "recycle-tab active" : "recycle-tab"}
        >
          Surat Jalan
        </Link>
      </div>

      {tab === "purchase-order" ? (
        <section className="brand-card recycle-list-card">
          <form className="recycle-search" method="get">
            <input type="hidden" name="tab" value="purchase-order" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari nomor PO, perusahaan, atau kode"
            />
            <button className="brand-secondary-button" type="submit">Cari</button>
          </form>

          {poResult!.data.length === 0 ? (
            <div className="brand-empty-state">
              <div>
                <span className="empty-icon-tile"><Trash2 aria-hidden="true" size={22} /></span>
                <h3>Tidak ada Purchase Order di Recycle Bin</h3>
                <p>Tidak ada data yang cocok dengan kriteria ini.</p>
              </div>
            </div>
          ) : (
            <div className="brand-table-wrap">
              <table className="brand-table">
                <thead>
                  <tr>
                    <th scope="col">Nomor PO</th>
                    <th scope="col">Perusahaan</th>
                    <th scope="col">Surat Jalan</th>
                    <th scope="col">Item</th>
                    <th scope="col">Dihapus oleh</th>
                    <th scope="col">Tanggal dihapus</th>
                    <th scope="col">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {poResult!.data.map((po) => (
                    <tr key={po.id}>
                      <td className="po-primary-cell">{po.poNumber}</td>
                      <td>{po.companyName}</td>
                      <td>{po.deliveryNoteCount}</td>
                      <td>{po.itemCount}</td>
                      <td>{po.deletedBy?.username ?? "-"}</td>
                      <td className="po-date-cell">
                        {formatDate(po.deletedAt)}
                        <span className="recycle-age">
                          {ageInDays(po.deletedAt)} hari
                        </span>
                      </td>
                      <td>
                        <RecycleBinActions
                          kind="purchase-order"
                          id={po.id}
                          identity={po.poNumber}
                          deliveryNoteCount={po.deliveryNoteCount}
                          itemCount={po.itemCount}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {poResult && poResult.meta.totalPages > 1 ? (
            <div className="brand-pagination">
              <div>
                Halaman {poResult.meta.page} dari {poResult.meta.totalPages}
              </div>
              <div>
                <Link
                  href={buildLink("purchase-order", poResult.meta.page - 1)}
                  className={`brand-secondary-button ${poResult.meta.page <= 1 ? "pagination-disabled" : ""}`}
                  aria-disabled={poResult.meta.page <= 1}
                >
                  Sebelumnya
                </Link>
                <Link
                  href={buildLink("purchase-order", poResult.meta.page + 1)}
                  className={`brand-secondary-button ${poResult.meta.page >= poResult.meta.totalPages ? "pagination-disabled" : ""}`}
                  aria-disabled={poResult.meta.page >= poResult.meta.totalPages}
                >
                  Selanjutnya
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="brand-card recycle-list-card">
          <form className="recycle-search" method="get">
            <input type="hidden" name="tab" value="delivery-note" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari kode Surat Jalan, cabang, atau nomor PO"
            />
            <button className="brand-secondary-button" type="submit">Cari</button>
          </form>

          {dnResult && dnResult.data.length === 0 ? (
            <div className="brand-empty-state">
              <div>
                <span className="empty-icon-tile"><Trash2 aria-hidden="true" size={22} /></span>
                <h3>Tidak ada Surat Jalan di Recycle Bin</h3>
                <p>Tidak ada data yang cocok dengan kriteria ini.</p>
              </div>
            </div>
          ) : (
            <div className="brand-table-wrap">
              <table className="brand-table">
                <thead>
                  <tr>
                    <th scope="col">Kode</th>
                    <th scope="col">Cabang</th>
                    <th scope="col">Nomor PO</th>
                    <th scope="col">Item</th>
                    <th scope="col">Status Parent</th>
                    <th scope="col">Dihapus oleh</th>
                    <th scope="col">Tanggal dihapus</th>
                    <th scope="col">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dnResult!.data.map((dn) => {
                    const parentDeleted = dn.purchaseOrder.deletedAt !== null;
                    return (
                      <tr key={dn.id}>
                        <td className="po-primary-cell">{dn.uniqueCode}</td>
                        <td>{dn.branchName}</td>
                        <td>{dn.purchaseOrder.poNumber}</td>
                        <td>{dn._count.items}</td>
                        <td>
                          {parentDeleted ? (
                            <span className="brand-status brand-status-warning">
                              PO di Recycle Bin
                            </span>
                          ) : (
                            <span className="brand-status brand-status-success">
                              PO Aktif
                            </span>
                          )}
                        </td>
                        <td>{dn.deletedBy?.username ?? "-"}</td>
                        <td className="po-date-cell">
                          {formatDate(dn.deletedAt)}
                          <span className="recycle-age">
                            {ageInDays(dn.deletedAt)} hari
                          </span>
                        </td>
                        <td>
                          <RecycleBinActions
                            kind="delivery-note"
                            id={dn.id}
                            identity={dn.uniqueCode}
                            itemCount={dn._count.items}
                            parentDeleted={parentDeleted}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {dnResult && dnResult.meta.totalPages > 1 ? (
            <div className="brand-pagination">
              <div>
                Halaman {dnResult.meta.page} dari {dnResult.meta.totalPages}
              </div>
              <div>
                <Link
                  href={buildLink("delivery-note", dnResult.meta.page - 1)}
                  className={`brand-secondary-button ${dnResult.meta.page <= 1 ? "pagination-disabled" : ""}`}
                  aria-disabled={dnResult.meta.page <= 1}
                >
                  Sebelumnya
                </Link>
                <Link
                  href={buildLink("delivery-note", dnResult.meta.page + 1)}
                  className={`brand-secondary-button ${dnResult.meta.page >= dnResult.meta.totalPages ? "pagination-disabled" : ""}`}
                  aria-disabled={dnResult.meta.page >= dnResult.meta.totalPages}
                >
                  Selanjutnya
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
