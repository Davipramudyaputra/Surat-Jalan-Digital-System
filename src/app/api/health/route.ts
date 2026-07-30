import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        application: "ok",
        database: "ok",
      },
      {
        status: 200,
        headers: noStoreHeaders,
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        application: "ok",
        database: "unavailable",
      },
      {
        status: 503,
        headers: noStoreHeaders,
      },
    );
  }
}
