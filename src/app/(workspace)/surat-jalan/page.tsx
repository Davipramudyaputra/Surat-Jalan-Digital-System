import type { Metadata } from "next";
import Link from "next/link";
import { getDeliveryNotes } from "@/features/delivery-notes/queries";
import { deliveryNoteSearchSchema } from "@/features/delivery-notes/schemas";
import { SearchAndFilter } from "@/features/delivery-notes/components/SearchAndFilter";

export const metadata: Metadata = {
  title: "Surat Jalan - Daftar",
};

export default async function DeliveryNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  // Parse params
  const parsed = deliveryNoteSearchSchema.safeParse(resolvedParams);
  const params = parsed.success ? parsed.data : deliveryNoteSearchSchema.parse({});

  const { data: deliveryNotes, meta } = await getDeliveryNotes(params);

  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Pengelolaan dokumen</p>
          <h1 id="page-title">Surat Jalan</h1>
          <p className="page-description">
            Cari, periksa, dan kelola surat jalan yang dibuat dari data purchase
            order.
          </p>
        </div>
        <Link className="primary-button" href="/upload">
          Buka halaman upload
        </Link>
      </section>

      <section className="workspace-card" aria-labelledby="search-title">
        <div className="card-heading">
          <div>
            <h2 id="search-title">Cari surat jalan</h2>
            <p>Gunakan pencarian untuk menemukan data yang spesifik.</p>
          </div>
        </div>

        <SearchAndFilter initialParams={params} />
      </section>

      <section className="workspace-card" aria-labelledby="list-title">
        <div className="card-heading">
          <h2 id="list-title">Daftar Surat Jalan</h2>
          <p>Menampilkan {meta.total} surat jalan</p>
        </div>

        {deliveryNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-symbol" aria-hidden="true">SJ</div>
            {params.q || params.status !== "all" ? (
              <>
                <h3 id="empty-state-title">Data surat jalan tidak ditemukan</h3>
                <p>Coba gunakan nama cabang, nomor PO, perusahaan, atau kode lain.</p>
              </>
            ) : (
              <>
                <h3 id="empty-state-title">Belum ada surat jalan</h3>
                <p>Upload file Excel untuk mulai membuat data surat jalan.</p>
                <Link className="secondary-button" href="/upload">Upload file Excel</Link>
              </>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Unik</th>
                  <th>PO / Perusahaan</th>
                  <th>Cabang</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNotes.map((dn) => (
                  <tr key={dn.id}>
                    <td>{dn.uniqueCode}</td>
                    <td>
                      <div>{dn.purchaseOrder.poNumber}</div>
                      <div className="text-sm text-gray-500">{dn.purchaseOrder.companyName}</div>
                    </td>
                    <td>
                      <div>{dn.branchName}</div>
                      <div className="text-sm text-gray-500">{dn._count.items} barang</div>
                    </td>
                    <td>
                      <span className={`badge ${dn.printStatus === "PRINTED" ? "badge-success" : "badge-neutral"}`}>
                        {dn.printStatus === "PRINTED" ? "Sudah Dicetak" : "Belum Dicetak"}
                      </span>
                    </td>
                    <td>
                      {new Date(dn.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td>
                      <Link href={`/surat-jalan/${dn.id}`} className="secondary-button" style={{ padding: "0.25rem 0.5rem" }}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="pagination">
            <p>Halaman {meta.page} dari {meta.totalPages}</p>
            <div className="pagination-controls" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <Link
                className="secondary-button"
                aria-disabled={meta.page <= 1}
                style={{ pointerEvents: meta.page <= 1 ? "none" : "auto", opacity: meta.page <= 1 ? 0.5 : 1 }}
                href={`/surat-jalan?page=${meta.page - 1}&limit=${meta.limit}&q=${encodeURIComponent(params.q || "")}&status=${params.status}`}
              >
                Sebelumnya
              </Link>
              <Link
                className="secondary-button"
                aria-disabled={meta.page >= meta.totalPages}
                style={{ pointerEvents: meta.page >= meta.totalPages ? "none" : "auto", opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                href={`/surat-jalan?page=${meta.page + 1}&limit=${meta.limit}&q=${encodeURIComponent(params.q || "")}&status=${params.status}`}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
