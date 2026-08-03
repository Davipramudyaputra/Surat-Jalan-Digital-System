"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/session";
import {
  confirmDeliveryNotePrintedSchema,
  type DeliveryNoteEditInput,
} from "../schemas";
import { markDeliveryNotePrinted } from "../services/mark-delivery-note-printed";
import { updateDeliveryNote } from "../services";

export async function updateDeliveryNoteAction(data: DeliveryNoteEditInput) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali." };
  }

  const result = await updateDeliveryNote(data);
  if ("success" in result && result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/po");
    revalidatePath(`/po/${result.purchaseOrderId}`);
    revalidatePath("/surat-jalan");
    revalidatePath(`/surat-jalan/${data.id}`);
    revalidatePath(`/surat-jalan/${data.id}/preview`);
  }
  return result;
}

export async function confirmDeliveryNotePrintedAction(input: {
  id: string;
  expectedUpdatedAt: string;
}) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sesi Anda telah berakhir. Silakan login kembali." };
  }

  const parsed = confirmDeliveryNotePrintedSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Permintaan konfirmasi cetak tidak valid." };
  }

  const result = await markDeliveryNotePrinted(parsed.data);
  if (!("success" in result) || !result.success) {
    return result;
  }

  revalidatePath("/dashboard");
  revalidatePath("/po");
  revalidatePath(`/po/${result.purchaseOrderId}`);
  revalidatePath("/surat-jalan");
  revalidatePath(`/surat-jalan/${input.id}`);
  revalidatePath(`/surat-jalan/${input.id}/preview`);

  return { success: true };
}
