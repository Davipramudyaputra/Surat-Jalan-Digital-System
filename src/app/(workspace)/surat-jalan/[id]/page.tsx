import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryNoteById } from "@/features/delivery-notes/queries";

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

  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">
            <Link href={`/po/${deliveryNote.purchaseOrderId}`}>&larr; Kembali ke PO</Link> / {deliveryNote.uniqueCode}
          </p>
          <h1 id="page-title">Detail Surat Jalan</h1>
          <p className="page-description">
            Informasi detail surat jalan dan daftar barang.
          </p>
        </div>
        <Link className="primary-button" href={`/surat-jalan/${id}/edit`}>
          Edit Data
        </Link>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <h2>Informasi Utama</h2>
            <p>Data surat jalan yang akan dicetak.</p>
          </div>
          <span className={`badge ${deliveryNote.printStatus === "PRINTED" ? "badge-success" : "badge-neutral"}`}>
            {deliveryNote.printStatus === "PRINTED" ? "Sudah Dicetak" : "Belum Dicetak"}
          </span>
        </div>

        <div className="search-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className="text-sm text-gray-500">Kode Unik</p>
            <p className="font-medium">{deliveryNote.uniqueCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nomor Surat Jalan</p>
            <p className="font-medium">{deliveryNote.documentNumber || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Surat Jalan</p>
            <p className="font-medium">
              {deliveryNote.documentDate
                ? new Date(deliveryNote.documentDate).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nama Cabang</p>
            <p className="font-medium">{deliveryNote.branchName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Perusahaan Penerima</p>
            <p className="font-medium">{deliveryNote.recipientCompanyName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Kode Perusahaan</p>
            <p className="font-medium">{deliveryNote.purchaseOrder.companyCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nomor PO</p>
            <p className="font-medium">{deliveryNote.purchaseOrder.poNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Kendaraan</p>
            <p className="font-medium">{deliveryNote.vehicleName || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nomor Kendaraan</p>
            <p className="font-medium">{deliveryNote.vehicleNumber || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nomor PO Tambahan</p>
            <p className="font-medium">{deliveryNote.additionalPoNumber || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nama Penerima</p>
            <p className="font-medium">{deliveryNote.recipientName || "-"}</p>
          </div>
        </div>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <h2>Daftar Barang</h2>
          <p>Terdapat {deliveryNote.items.length} jenis barang pada surat jalan ini.</p>
        </div>

        <div className="table-container">
          <table className="data-table">
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

      <section className="workspace-card">
        <div className="card-heading">
          <h2>Audit & Status Cetak</h2>
        </div>
        <div className="search-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p className="text-sm text-gray-500">Dibuat pada</p>
            <p className="font-medium">
              {new Date(deliveryNote.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Terakhir diperbarui</p>
            <p className="font-medium">
              {new Date(deliveryNote.updatedAt).toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Waktu cetak pertama</p>
            <p className="font-medium">
              {deliveryNote.firstPrintedAt
                ? new Date(deliveryNote.firstPrintedAt).toLocaleString("id-ID")
                : "Belum pernah dicetak"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Waktu cetak terakhir</p>
            <p className="font-medium">
              {deliveryNote.lastPrintedAt
                ? new Date(deliveryNote.lastPrintedAt).toLocaleString("id-ID")
                : "Belum pernah dicetak"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jumlah Print</p>
            <p className="font-medium">{deliveryNote.printCount} kali</p>
          </div>
        </div>
      </section>
    </div>
  );
}
