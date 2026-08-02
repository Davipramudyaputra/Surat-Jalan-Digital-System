"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/session";
import type { DeliveryNoteEditInput } from "../schemas";
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
  }
  return result;
}
