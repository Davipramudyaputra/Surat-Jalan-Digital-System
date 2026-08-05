import { prisma } from "@/lib/prisma";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import { ACTIVE_DN_FILTER } from "@/features/soft-delete/active";
import type { AuditActor } from "@/features/audit/services/audit-service";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { calculateNextPrintAudit } from "./print-audit";

class PrintConcurrencyError extends Error {}

export type PrintPaperContext = {
  paperProfile?: string | null;
  paperWidthMm?: number | null;
  paperHeightMm?: number | null;
  orientation?: string | null;
  pageCount?: number | null;
};

export type MarkDeliveryNotePrintedInput = {
  id: string;
  expectedUpdatedAt: Date;
  actor: AuditActor;
  paper?: PrintPaperContext;
};

export async function markDeliveryNotePrinted({
  id,
  expectedUpdatedAt,
  actor,
  paper,
}: MarkDeliveryNotePrintedInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.deliveryNote.findFirst({
        where: { id, ...ACTIVE_DN_FILTER },
        select: {
          id: true,
          purchaseOrderId: true,
          uniqueCode: true,
          branchName: true,
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

      const isReprint = current.printCount > 0;
      await recordAuditEvent(
        {
          actor,
          entity: {
            type: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
            id,
            label: current.branchName || current.uniqueCode,
          },
          action: isReprint ? AUDIT_ACTION.REPRINT : AUDIT_ACTION.PRINT,
          source: AUDIT_SOURCE.DELIVERY_NOTE_PRINT,
          after: {
            printStatus: nextAudit.printStatus,
            firstPrintedAt: nextAudit.firstPrintedAt.toISOString(),
            lastPrintedAt: nextAudit.lastPrintedAt.toISOString(),
            printCount: nextAudit.printCount,
          },
          metadata: {
            paperProfile: paper?.paperProfile ?? null,
            paperWidthMm: paper?.paperWidthMm ?? null,
            paperHeightMm: paper?.paperHeightMm ?? null,
            orientation: paper?.orientation ?? null,
            pageCount: paper?.pageCount ?? null,
            previousPrintCount: current.printCount,
            newPrintCount: nextAudit.printCount,
          },
        },
        tx,
      );

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
