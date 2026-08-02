"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizePoNumber } from "@/features/imports/normalization/normalize-po-number";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { editPurchaseOrderSchema } from "../schemas";
import { canDeletePurchaseOrder } from "../utils/delete-policy";

type ActionState = { error: string };

class ConcurrencyError extends Error {}

export async function editPurchaseOrderAction(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const parsed = editPurchaseOrderSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    return { error: "Data form tidak valid. Periksa kembali seluruh field." };
  }

  const {
    poNumber,
    companyCode,
    companyName,
    period,
    expectedUpdatedAt,
  } = parsed.data;
  const normalizedPoNumber = normalizePoNumber(poNumber);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingPo = await tx.purchaseOrder.findUnique({ where: { id } });

      if (!existingPo) {
        return { error: "Purchase Order tidak ditemukan.", changed: false };
      }

      if (existingPo.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConcurrencyError();
      }

      const changed =
        existingPo.poNumber !== poNumber ||
        existingPo.normalizedPoNumber !== normalizedPoNumber ||
        existingPo.companyCode !== companyCode ||
        existingPo.companyName !== companyName ||
        existingPo.period !== period;

      if (!changed) {
        return { error: "", changed: false };
      }

      const duplicate = await tx.purchaseOrder.findUnique({
        where: {
          companyCode_normalizedPoNumber: {
            companyCode,
            normalizedPoNumber,
          },
        },
        select: { id: true },
      });

      if (duplicate && duplicate.id !== id) {
        return {
          error: "Purchase Order dengan nomor dan kode perusahaan tersebut sudah ada.",
          changed: false,
        };
      }

      const updated = await tx.purchaseOrder.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: {
          poNumber,
          normalizedPoNumber,
          companyCode,
          companyName,
          period,
        },
      });

      if (updated.count !== 1) {
        throw new ConcurrencyError();
      }

      await tx.deliveryNote.updateMany({
        where: { purchaseOrderId: id },
        data: {
          ...(existingPo.companyName !== companyName
            ? { recipientCompanyName: companyName }
            : {}),
          printStatus: "NOT_PRINTED",
        },
      });

      return { error: "", changed: true };
    });

    if (result.error) {
      return { error: result.error };
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        error:
          "Data PO sudah diperbarui dari sesi lain. Muat ulang halaman sebelum menyimpan kembali.",
      };
    }
    console.error("Pembaruan PO gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan sistem saat memperbarui Purchase Order." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath(`/po/${id}`);
  redirect(`/po/${id}`);
}

export async function deletePurchaseOrderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const id = formData.get("id");
  const confirmationPoNumber = formData.get("confirmationPoNumber");
  const expectedUpdatedAtValue = formData.get("expectedUpdatedAt");
  const acknowledgment = formData.get("acknowledgment") === "true";

  if (
    typeof id !== "string" ||
    typeof confirmationPoNumber !== "string" ||
    typeof expectedUpdatedAtValue !== "string"
  ) {
    return { error: "Data konfirmasi penghapusan tidak valid." };
  }

  const expectedUpdatedAt = new Date(expectedUpdatedAtValue);
  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    return { error: "Snapshot data PO tidak valid. Muat ulang halaman." };
  }

  if (!acknowledgment) {
    return { error: "Persetujuan penghapusan wajib dicentang." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id } });

      if (!po) {
        throw new Error("NOT_FOUND");
      }

      if (po.poNumber !== confirmationPoNumber) {
        throw new Error("CONFIRMATION_MISMATCH");
      }

      if (po.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new ConcurrencyError();
      }

      // Hitung ulang status cetak di dalam transaksi. Nilai UI tidak pernah
      // dipakai sebagai dasar penghapusan.
      const [totalCount, printedCount, notPrintedCount] = await Promise.all([
        tx.deliveryNote.count({ where: { purchaseOrderId: id } }),
        tx.deliveryNote.count({
          where: { purchaseOrderId: id, printStatus: "PRINTED" },
        }),
        tx.deliveryNote.count({
          where: { purchaseOrderId: id, printStatus: "NOT_PRINTED" },
        }),
      ]);

      if (
        !canDeletePurchaseOrder({
          totalCount,
          printedCount,
          notPrintedCount,
        })
      ) {
        throw new Error("NOT_ALL_PRINTED");
      }

      await tx.deliveryNoteItem.deleteMany({
        where: { deliveryNote: { purchaseOrderId: id } },
      });
      await tx.deliveryNote.deleteMany({ where: { purchaseOrderId: id } });

      const deleted = await tx.purchaseOrder.deleteMany({
        where: { id, updatedAt: expectedUpdatedAt },
      });
      if (deleted.count !== 1) {
        throw new ConcurrencyError();
      }
    });
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        error:
          "Data PO sudah berubah. Muat ulang halaman dan periksa ringkasan sebelum menghapus.",
      };
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "Purchase Order tidak ditemukan." };
    }
    if (error instanceof Error && error.message === "CONFIRMATION_MISMATCH") {
      return { error: "Nomor PO konfirmasi harus sama persis." };
    }
    if (error instanceof Error && error.message === "NOT_ALL_PRINTED") {
      return {
        error:
          "Purchase Order hanya dapat dihapus setelah seluruh surat jalan berstatus Sudah Dicetak.",
      };
    }
    console.error("Penghapusan PO gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan sistem saat menghapus Purchase Order." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  redirect("/po");
}
