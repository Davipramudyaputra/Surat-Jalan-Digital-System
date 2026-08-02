import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PurchaseOrderEditForm } from "@/features/po/components/PurchaseOrderEditForm";

export const metadata: Metadata = {
  title: "Edit PO - Sistem Surat Jalan",
};

export default async function PurchaseOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { _count: { select: { deliveryNotes: true } } },
  });

  if (!po) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Purchase Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ubah informasi Purchase Order. Perubahan identitas dapat mempengaruhi status cetak surat jalan.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <PurchaseOrderEditForm po={po} />
      </div>
    </div>
  );
}
