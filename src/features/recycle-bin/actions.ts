"use server";

import { revalidatePath } from "next/cache";

import { actorFromSession } from "@/features/audit/lib/actor";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import {
  permanentlyDeleteDeliveryNote,
  permanentlyDeletePurchaseOrder,
  restoreDeliveryNote,
  restorePurchaseOrder,
  softDeleteDeliveryNote,
} from "./services";

type ActionResult = { error?: string; success?: string };

export async function restorePurchaseOrderAction(
  poId: string,
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const result = await restorePurchaseOrder(poId, actorFromSession(session));
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  revalidatePath("/history");
  return { success: "Purchase Order berhasil dipulihkan." };
}

export async function restoreDeliveryNoteAction(
  dnId: string,
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const result = await restoreDeliveryNote(dnId, actorFromSession(session));
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  revalidatePath("/history");
  return { success: "Surat Jalan berhasil dipulihkan." };
}

export async function softDeleteDeliveryNoteAction(
  dnId: string,
  reason?: string,
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const result = await softDeleteDeliveryNote(
    dnId,
    actorFromSession(session),
    reason?.trim() || null,
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  revalidatePath("/history");
  return { success: "Surat Jalan dipindahkan ke Recycle Bin." };
}

const PERMANENT_DELETE_PHRASE = "HAPUS PERMANEN";

export async function permanentlyDeletePurchaseOrderAction(
  poId: string,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const phrase = formData.get("phrase");
  const identity = formData.get("identity");
  const acknowledgment = formData.get("acknowledgment") === "true";

  if (phrase !== PERMANENT_DELETE_PHRASE) {
    return { error: "Teks konfirmasi harus HAPUS PERMANEN." };
  }
  if (!acknowledgment) {
    return { error: "Persetujuan wajib dicentang." };
  }
  if (typeof identity !== "string" || identity.trim() === "") {
    return { error: "Nomor PO wajib diketik untuk konfirmasi." };
  }

  // Validasi identity di server (tidak mempercayai client).
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, deletedAt: { not: null } },
    select: { poNumber: true },
  });
  if (!po) {
    return { error: "Purchase Order tidak ditemukan di Recycle Bin." };
  }
  if (po.poNumber !== identity.trim()) {
    return { error: "Nomor PO konfirmasi tidak sama." };
  }

  const result = await permanentlyDeletePurchaseOrder(
    poId,
    actorFromSession(session),
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  revalidatePath("/history");
  return { success: "Purchase Order dihapus permanen." };
}

export async function permanentlyDeleteDeliveryNoteAction(
  dnId: string,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const phrase = formData.get("phrase");
  const identity = formData.get("identity");
  const acknowledgment = formData.get("acknowledgment") === "true";

  if (phrase !== PERMANENT_DELETE_PHRASE) {
    return { error: "Teks konfirmasi harus HAPUS PERMANEN." };
  }
  if (!acknowledgment) {
    return { error: "Persetujuan wajib dicentang." };
  }
  if (typeof identity !== "string" || identity.trim() === "") {
    return { error: "Kode Surat Jalan wajib diketik untuk konfirmasi." };
  }

  const dn = await prisma.deliveryNote.findFirst({
    where: { id: dnId, deletedAt: { not: null } },
    select: { uniqueCode: true },
  });
  if (!dn) {
    return { error: "Surat Jalan tidak ditemukan di Recycle Bin." };
  }
  if (dn.uniqueCode !== identity.trim()) {
    return { error: "Kode Surat Jalan konfirmasi tidak sama." };
  }

  const result = await permanentlyDeleteDeliveryNote(
    dnId,
    actorFromSession(session),
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath("/recycle-bin");
  revalidatePath("/history");
  return { success: "Surat Jalan dihapus permanen." };
}
