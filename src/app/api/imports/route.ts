import "server-only";

import { NextResponse } from "next/server";

import {
  MAX_IMPORT_FILES,
  MAX_IMPORT_FILE_BYTES,
} from "@/features/imports/config/import-limits";
import { processImportFile } from "@/features/imports/services/process-import-file";
import type { ImportFileResult } from "@/features/imports/types/import-types";
import { sanitizeFileName } from "@/features/imports/validation/file-validation";
import { actorFromSession } from "@/features/audit/lib/actor";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function invalidRequest(message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_UPLOAD_REQUEST",
        message,
      },
      results: [],
    },
    {
      headers: noStoreHeaders,
      status,
    },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Sesi admin tidak valid. Silakan login kembali.",
        },
        results: [],
      },
      { headers: noStoreHeaders, status: 401 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return invalidRequest("Request upload tidak dapat dibaca.");
  }

  const modeParam = formData.get("mode");
  const mode = modeParam === "commit" ? "commit" : "preview";

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return invalidRequest("Pilih minimal satu file Excel.");
  }

  if (files.length > MAX_IMPORT_FILES) {
    return invalidRequest(
      `Maksimal ${MAX_IMPORT_FILES} file dalam satu proses import.`,
    );
  }

  const results: ImportFileResult[] = [];

  for (const file of files) {
    const fileName = sanitizeFileName(file.name);

    try {
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        results.push({
          confidence: null,
          deliveryNotes: 0,
          detectedSheet: null,
          errors: [
            {
              code: "FILE_TOO_LARGE",
              message: "Ukuran file melebihi batas 10 MB.",
            },
          ],
          fileName,
          fileSize: file.size,
          extension: fileName.slice(fileName.lastIndexOf(".")).toLocaleLowerCase("en-US"),
          items: 0,
          purchaseOrders: 0,
          status: "FAILED",
          warnings: [],
        });
        continue;
      }

      const buffer = new Uint8Array(await file.arrayBuffer());

      results.push(
        await processImportFile({
          buffer,
          name: fileName,
          size: file.size,
          type: file.type,
          mode,
          actor: actorFromSession(session!),
        }),
      );
    } catch {
      results.push({
        confidence: null,
        deliveryNotes: 0,
        detectedSheet: null,
        errors: [
          {
            code: "IMPORT_FAILED",
            message:
              "Import gagal dan tidak ada data dari file ini yang disimpan.",
          },
        ],
        fileName,
        items: 0,
        purchaseOrders: 0,
        status: "FAILED",
        warnings: [],
      });
    }
  }

  const hasSuccessfulResult = results.some(
    (result) => result.status !== "FAILED",
  );

  return NextResponse.json(
    { results },
    {
      headers: noStoreHeaders,
      status: hasSuccessfulResult ? 200 : 400,
    },
  );
}
