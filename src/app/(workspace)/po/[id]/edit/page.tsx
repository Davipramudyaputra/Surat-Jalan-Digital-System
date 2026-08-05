import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PurchaseOrderEditForm } from "@/features/po/components/PurchaseOrderEditForm";
import { ACTIVE_PO_FILTER } from "@/features/soft-delete/active";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit PO - Sistem Surat Jalan",
};

export default async function PurchaseOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, ...ACTIVE_PO_FILTER },
    include: { _count: { select: { deliveryNotes: true } } },
  });

  if (!po) {
    notFound();
  }

  return (
    <div className="brand-page form-page">
      <header className="brand-page-header">
        <div>
        <Link className="detail-back-link" href={`/po/${po.id}`}>
          <ArrowLeft aria-hidden="true" size={15} /> Kembali ke Detail PO
        </Link>
        <p className="brand-eyebrow">Perbarui data</p>
        <h1>Edit Purchase Order</h1>
        <p>
          Ubah informasi Purchase Order. Perubahan identitas dapat mempengaruhi status cetak surat jalan.
        </p>
        </div>
      </header>

      <section className="brand-card form-card">
        <PurchaseOrderEditForm po={po} />
      </section>
    </div>
  );
}
