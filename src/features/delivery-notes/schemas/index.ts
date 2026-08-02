import { z } from "zod";

export const deliveryNoteSearchSchema = z.object({
  q: z.string().optional().default("").catch(""),
  status: z.enum(["all", "not-printed", "printed"]).default("all").catch("all"),
  page: z.coerce.number().int().min(1).default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
  purchaseOrderId: z.string().optional(),
});

export type DeliveryNoteSearchParams = z.infer<typeof deliveryNoteSearchSchema>;

export const deliveryNoteItemEditSchema = z.object({
  id: z.string().optional(), // optional for new items
  quantity: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, { message: "Kuantitas harus lebih dari 0" }),
  unit: z.string().optional(),
  displayProductName: z.string().min(1, { message: "Nama barang wajib diisi" }),
  description: z.string().optional(),
  sortOrder: z.number().int(),
  isManuallyEdited: z.boolean().optional(),
});

export type DeliveryNoteItemEditInput = z.infer<typeof deliveryNoteItemEditSchema>;

export const deliveryNoteEditSchema = z.object({
  id: z.string(),
  documentNumber: z.string().optional(),
  documentDate: z.string().refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/u.test(value),
    { message: "Tanggal surat jalan tidak valid" },
  ).optional(),
  poNumber: z.string().min(1, { message: "Nomor PO wajib diisi" }),
  branchName: z.string().min(1, { message: "Nama cabang wajib diisi" }),
  recipientCompanyName: z.string().min(1, { message: "Nama perusahaan penerima wajib diisi" }),
  recipientName: z.string().optional(),
  vehicleName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  additionalPoNumber: z.string().optional(),
  updatedAt: z.coerce.date(), // for optimistic concurrency
  items: z.array(deliveryNoteItemEditSchema).min(1, { message: "Minimal satu barang harus tersedia" }),
});

export type DeliveryNoteEditInput = z.infer<typeof deliveryNoteEditSchema>;
