import "server-only";

import { NextResponse } from "next/server";

import { actorFromSession } from "@/features/audit/lib/actor";
import {
  generateDeliveryNotePdf,
} from "@/features/pdf/services/generate-delivery-note-pdf";
import {
  pdfDownloadQuerySchema,
} from "@/features/pdf/schemas";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const noStoreHeaders = { "Cache-Control": "no-store" };

function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { error: { message } },
    { headers: noStoreHeaders, status },
  );
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return errorResponse("Anda tidak memiliki izin.", 401);
  }

  const { id } = await context.params;
  const url = new URL(_request.url);
  const query = pdfDownloadQuerySchema.safeParse({
    id,
    paper: url.searchParams.get("paper") ?? undefined,
    orientation: url.searchParams.get("orientation") ?? undefined,
    width: url.searchParams.get("width") ?? undefined,
    height: url.searchParams.get("height") ?? undefined,
    margin: url.searchParams.get("margin") ?? undefined,
  });

  if (!query.success) {
    return errorResponse("Parameter download PDF tidak valid.", 400);
  }

  try {
    const result = await generateDeliveryNotePdf({
      deliveryNoteId: query.data.id,
      paper: query.data.paper,
      orientation: query.data.orientation,
      widthMm: query.data.width,
      heightMm: query.data.height,
      marginMm: query.data.margin,
      actor: actorFromSession(session),
    });

    const body = new Uint8Array(result.buffer);
    return new NextResponse(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(result.buffer.length),
        ...noStoreHeaders,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF gagal dibuat.";
    return errorResponse(message, 500);
  }
}
