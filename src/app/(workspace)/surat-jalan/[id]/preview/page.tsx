import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeliveryNotePreviewShell } from "@/components/delivery-note-template/DeliveryNotePreviewShell";
import { getDeliveryNoteForPreview } from "@/features/delivery-notes/queries";
import { mapDeliveryNoteToDocument } from "@/lib/delivery-note-template/mapper";

export const metadata: Metadata = {
  title: "Preview Surat Jalan",
};

export default async function DeliveryNotePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deliveryNote = await getDeliveryNoteForPreview(id);

  if (!deliveryNote) {
    notFound();
  }

  const document = mapDeliveryNoteToDocument(deliveryNote);

  return (
    <DeliveryNotePreviewShell
      audit={{
        status: deliveryNote.printStatus,
        firstPrintedAt: deliveryNote.firstPrintedAt,
        lastPrintedAt: deliveryNote.lastPrintedAt,
        printCount: deliveryNote.printCount,
      }}
      data={document}
    />
  );
}
