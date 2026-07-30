import { z } from "zod";

import { MIN_IMPORT_CONFIDENCE } from "@/features/imports/config/import-limits";

const positiveDecimalString = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/u, "Kuantitas harus berupa angka desimal canonical.")
  .refine(
    (value) => !/^0(?:\.0+)?$/u.test(value),
    "Kuantitas harus lebih dari 0.",
  );

const issueSchema = z.object({
  code: z.string().trim().min(1),
  column: z.string().optional(),
  message: z.string().trim().min(1),
  row: z.number().int().positive().optional(),
  sheet: z.string().optional(),
});

const itemSchema = z.object({
  displayProductName: z.string().trim().min(1),
  normalizedProductName: z.string().trim().min(1),
  originalProductName: z.string().min(1),
  quantity: positiveDecimalString,
  sortOrder: z.number().int().nonnegative(),
});

const deliveryNoteSchema = z
  .object({
    branchName: z.string().trim().min(1),
    items: z.array(itemSchema).min(1),
    normalizedBranchName: z.string().trim().min(1),
    originalBranchName: z.string().min(1),
  })
  .superRefine((deliveryNote, context) => {
    const productNames = new Set<string>();

    deliveryNote.items.forEach((item, index) => {
      if (productNames.has(item.normalizedProductName)) {
        context.addIssue({
          code: "custom",
          message: "Produk duplicate ditemukan dalam satu cabang.",
          path: ["items", index, "normalizedProductName"],
        });
      }

      productNames.add(item.normalizedProductName);
    });
  });

export const parsedImportSchema = z
  .object({
    companyCode: z.string().trim().min(1),
    companyName: z.string().trim().min(1),
    confidence: z.number().min(MIN_IMPORT_CONFIDENCE).max(100),
    deliveryNotes: z.array(deliveryNoteSchema).min(1),
    detectedSheet: z.string().trim().min(1),
    diagnostics: z.object({
      errors: z.array(issueSchema).max(0),
      headerRow: z.number().int().positive(),
      skippedCells: z.array(
        z.object({
          column: z.string().min(1),
          reason: z.string().min(1),
          row: z.number().int().positive(),
          sheet: z.string().min(1),
        }),
      ),
      skippedRows: z.array(
        z.object({
          reason: z.string().min(1),
          row: z.number().int().positive(),
          sheet: z.string().min(1),
        }),
      ),
      warnings: z.array(issueSchema),
    }),
    normalizedPoNumber: z.string().trim().min(1),
    period: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/u).nullable(),
    poNumber: z.string().trim().min(1),
    summary: z.object({
      deliveryNoteCount: z.number().int().positive(),
      itemCount: z.number().int().positive(),
      productColumnCount: z.number().int().positive(),
    }),
  })
  .superRefine((parsedImport, context) => {
    const branchNames = new Set<string>();

    parsedImport.deliveryNotes.forEach((deliveryNote, index) => {
      if (branchNames.has(deliveryNote.normalizedBranchName)) {
        context.addIssue({
          code: "custom",
          message: "Cabang duplicate ditemukan dalam hasil parse.",
          path: ["deliveryNotes", index, "normalizedBranchName"],
        });
      }

      branchNames.add(deliveryNote.normalizedBranchName);
    });

    const actualItemCount = parsedImport.deliveryNotes.reduce(
      (total, deliveryNote) => total + deliveryNote.items.length,
      0,
    );

    if (
      parsedImport.summary.deliveryNoteCount !==
        parsedImport.deliveryNotes.length ||
      parsedImport.summary.itemCount !== actualItemCount
    ) {
      context.addIssue({
        code: "custom",
        message: "Ringkasan parser tidak konsisten dengan data hasil parse.",
        path: ["summary"],
      });
    }
  });
