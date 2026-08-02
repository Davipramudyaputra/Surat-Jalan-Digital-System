import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryNoteById } from "@/features/delivery-notes/queries";
import { DeliveryNoteForm } from "@/features/delivery-notes/components/DeliveryNoteForm";
import { DeliveryNoteEditInput } from "@/features/delivery-notes/schemas";

export const metadata: Metadata = {
  title: "Surat Jalan - Edit",
};

export default async function DeliveryNoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deliveryNote = await getDeliveryNoteById(id);

  if (!deliveryNote) {
    notFound();
  }

  const initialData: DeliveryNoteEditInput = {
    id: deliveryNote.id,
    documentNumber: deliveryNote.documentNumber || "",
    documentDate: deliveryNote.documentDate ? deliveryNote.documentDate.toISOString().split("T")[0] : "",
    poNumber: deliveryNote.purchaseOrder.poNumber,
    branchName: deliveryNote.branchName,
    recipientCompanyName: deliveryNote.recipientCompanyName,
    recipientName: deliveryNote.recipientName || "",
    vehicleName: deliveryNote.vehicleName || "",
    vehicleNumber: deliveryNote.vehicleNumber || "",
    additionalPoNumber: deliveryNote.additionalPoNumber || "",
    updatedAt: deliveryNote.updatedAt,
    items: deliveryNote.items.map((item) => ({
      id: item.id,
      quantity: item.quantity.toString(),
      unit: item.unit || "",
      displayProductName: item.displayProductName,
      description: item.description || "",
      sortOrder: item.sortOrder,
      isManuallyEdited: item.isManuallyEdited,
    })),
  };

  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">
            <Link href={`/po/${deliveryNote.purchaseOrderId}`}>&larr; PO</Link> /{" "}
            <Link href={`/surat-jalan/${id}`}>Kembali ke Detail</Link>
          </p>
          <h1 id="page-title">Edit Surat Jalan</h1>
          <p className="page-description">
            Ubah data surat jalan. Menyimpan perubahan data akan me-reset status
            cetak menjadi Belum Dicetak apabila dokumen sebelumnya sudah dicetak.
          </p>
        </div>
      </section>

      <DeliveryNoteForm initialData={initialData} />
    </div>
  );
}
