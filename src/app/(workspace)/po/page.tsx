import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UploadImportForm } from "@/features/imports/components/upload-import-form";
import Link from "next/link";
import { PurchaseOrderSearch } from "@/features/po/components/PurchaseOrderSearch";
import { PurchaseOrderList } from "@/features/po/components/PurchaseOrderList";
import { attachPOStats } from "@/features/po/services/po-stats";
import { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Data PO - Sistem Surat Jalan",
};

export default async function DataPOPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const parsedPage = typeof resolvedSearchParams.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const allowedStatuses = new Set(["Semua", "Belum Dimulai", "Dalam Proses", "Selesai", "Kosong"]);
  const requestedStatus = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "Semua";
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "Semua";
  const showUpload = resolvedSearchParams.upload === "true";

  const parsedLimit = typeof resolvedSearchParams.limit === "string" ? Number.parseInt(resolvedSearchParams.limit, 10) : 20;
  const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
  const skip = (page - 1) * limit;

  const where: Prisma.PurchaseOrderWhereInput = {};

  if (q) {
    where.OR = [
      { poNumber: { contains: q, mode: "insensitive" } },
      { companyCode: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { period: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status === "Belum Dimulai") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { deliveryNotes: { some: {} } },
      { NOT: { deliveryNotes: { some: { printStatus: "PRINTED" } } } }
    ];
  } else if (status === "Dalam Proses") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { deliveryNotes: { some: { printStatus: "PRINTED" } } },
      { deliveryNotes: { some: { printStatus: "NOT_PRINTED" } } }
    ];
  } else if (status === "Selesai") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { deliveryNotes: { some: {} } },
      { NOT: { deliveryNotes: { some: { printStatus: "NOT_PRINTED" } } } }
    ];
  } else if (status === "Kosong") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { deliveryNotes: { none: {} } }
    ];
  }

  const [total, purchaseOrders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: {
        _count: {
          select: {
            deliveryNotes: true,
          },
        },
      },
    }),
  ]);

  const purchaseOrdersWithStats = await attachPOStats(purchaseOrders);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Purchase Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola PO dan import data surat jalan dari Excel
          </p>
        </div>
        <Link
          href={showUpload ? "/po" : "/po?upload=true"}
          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          {showUpload ? "Tutup Upload" : "Upload Excel Baru"}
        </Link>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <UploadImportForm />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <PurchaseOrderSearch defaultValue={q} defaultStatus={status} />
        </div>

        <PurchaseOrderList purchaseOrders={purchaseOrdersWithStats} />

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Menampilkan {skip + 1} sampai {Math.min(skip + limit, total)} dari {total} data
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ pathname: "/po", query: { ...(q ? { q } : {}), ...(status !== "Semua" ? { status } : {}), page: page - 1, limit } }}
                  className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Sebelumnya
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={{ pathname: "/po", query: { ...(q ? { q } : {}), ...(status !== "Semua" ? { status } : {}), page: page + 1, limit } }}
                  className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Selanjutnya
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
