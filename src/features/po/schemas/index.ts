import { z } from "zod";
import { collapseWhitespace } from "@/features/imports/normalization/normalize-key";

export const editPurchaseOrderSchema = z.object({
  companyCode: z.string().trim().min(1, "Kode Perusahaan wajib diisi").max(50).transform((value) => value.toLocaleUpperCase("id-ID")),
  companyName: z.string().trim().min(1, "Nama Perusahaan wajib diisi").max(255).transform(collapseWhitespace),
  poNumber: z.string().trim().min(1, "Nomor PO wajib diisi").max(100).transform(collapseWhitespace),
  period: z.string().trim().max(100).transform((value) => value || null),
  expectedUpdatedAt: z.coerce.date(),
});

export type EditPurchaseOrderInput = z.infer<typeof editPurchaseOrderSchema>;
