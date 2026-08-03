import { prisma } from "@/lib/prisma";

import { calculateNextPrintAudit } from "./print-audit";

class PrintConcurrencyError extends Error {}

export type MarkDeliveryNotePrintedInput = {
  id: string;
  expectedUpdatedAt: Date;
};

export async function markDeliveryNotePrinted({
  id,
  expectedUpdatedAt,
}: MarkDeliveryNotePrintedInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.deliveryNote.findUnique({
        where: { id },
        select: {
          id: true,
          purchaseOrderId: true,
          updatedAt: true,
          firstPrintedAt: true,
          printCount: true,
        },
      });

      if (!current) {
        return { error: "Data Surat Jalan tidak ditemukan." } as const;
      }

      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new PrintConcurrencyError();
      }

      const nextAudit = calculateNextPrintAudit(current, new Date());
      const updated = await tx.deliveryNote.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: nextAudit,
      });

      if (updated.count !== 1) {
        throw new PrintConcurrencyError();
      }

      return {
        success: true,
        purchaseOrderId: current.purchaseOrderId,
        audit: nextAudit,
      } as const;
    });
  } catch (error) {
    if (error instanceof PrintConcurrencyError) {
      return {
        error:
          "Data Surat Jalan telah berubah. Muat ulang preview sebelum mengonfirmasi hasil cetak.",
      } as const;
    }

    console.error("Status cetak gagal diperbarui karena kesalahan internal.");
    return { error: "Status cetak gagal diperbarui." } as const;
  }
}
