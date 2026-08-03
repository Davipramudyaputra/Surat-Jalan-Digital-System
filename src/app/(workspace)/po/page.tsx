import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UploadImportForm } from "@/features/imports/components/upload-import-form";
import Link from "next/link";
import { PurchaseOrderSearch } from "@/features/po/components/PurchaseOrderSearch";
import { PurchaseOrderList } from "@/features/po/components/PurchaseOrderList";
import { attachPOStats } from "@/features/po/services/po-stats";
import { Prisma } from "@/generated/prisma/client";
import { Upload, X } from "lucide-react";

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
    <div className="brand-page po-page">
      <header className="brand-page-header">
        <div>
          <p className="brand-eyebrow">Manajemen data</p>
          <h1>Data Purchase Order</h1>
          <p>
            Kelola PO dan import data surat jalan dari Excel
          </p>
        </div>
        <Link
          href={showUpload ? "/po" : "/po?upload=true"}
          className={showUpload ? "brand-secondary-button" : "brand-primary-button"}
        >
          {showUpload ? <X aria-hidden="true" size={17} /> : <Upload aria-hidden="true" size={17} />}
          {showUpload ? "Tutup Upload" : "Upload Excel Baru"}
        </Link>
      </header>

      {showUpload && (
        <div className="po-upload-panel">
          <UploadImportForm />
        </div>
      )}

      <section className="brand-card po-data-card">
        <div className="po-toolbar">
          <PurchaseOrderSearch defaultValue={q} defaultStatus={status} />
        </div>

        <PurchaseOrderList purchaseOrders={purchaseOrdersWithStats} />

        {totalPages > 1 && (
          <div className="brand-pagination">
            <div>
              Menampilkan {skip + 1} sampai {Math.min(skip + limit, total)} dari {total} data
            </div>
            <div>
              {page > 1 && (
                <Link
                  href={{ pathname: "/po", query: { ...(q ? { q } : {}), ...(status !== "Semua" ? { status } : {}), page: page - 1, limit } }}
                  className="brand-secondary-button"
                >
                  Sebelumnya
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={{ pathname: "/po", query: { ...(q ? { q } : {}), ...(status !== "Semua" ? { status } : {}), page: page + 1, limit } }}
                  className="brand-secondary-button"
                >
                  Selanjutnya
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
