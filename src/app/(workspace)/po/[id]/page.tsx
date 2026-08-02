import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDeliveryNotes } from "@/features/delivery-notes/queries";
import { deliveryNoteSearchSchema } from "@/features/delivery-notes/schemas";
import { SearchAndFilter } from "@/features/delivery-notes/components/SearchAndFilter";
import { attachSinglePOStats } from "@/features/po/services/po-stats";
import { DeletePODialog } from "@/features/po/components/DeletePODialog";

export const metadata: Metadata = {
  title: "Detail PO - Sistem Surat Jalan",
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedParams = await searchParams;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      _count: {
        select: { deliveryNotes: true },
      },
    },
  });

  if (!po) {
    notFound();
  }

  // Parse params and forcefully set purchaseOrderId
  const parsed = deliveryNoteSearchSchema.safeParse(resolvedParams);
  const searchConfig = parsed.success ? parsed.data : deliveryNoteSearchSchema.parse({});
  searchConfig.purchaseOrderId = id;

  const { data: deliveryNotes, meta } = await getDeliveryNotes(searchConfig);

  const poWithStats = await attachSinglePOStats(po);
  const totalItemCount = poWithStats.stats.totalItemCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <Link className="hover:text-blue-700" href="/dashboard">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-blue-700" href="/po">Data PO</Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-gray-900">{po.poNumber}</span>
      </nav>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600 mb-1">{po.companyCode}</p>
          <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {po.companyName} {po.period ? `— Periode: ${po.period}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/po/${po.id}/edit`}
            className="inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit PO
          </Link>
          <DeletePODialog props={{
            purchaseOrderId: po.id,
            poNumber: po.poNumber,
            companyName: po.companyName,
            totalCount: poWithStats.stats.totalCount,
            printedCount: poWithStats.stats.printedCount,
            notPrintedCount: poWithStats.stats.notPrintedCount,
            printedPercentage: poWithStats.stats.printedPercentage,
            notPrintedPercentage: poWithStats.stats.notPrintedPercentage,
            totalItemCount,
            expectedUpdatedAt: po.updatedAt.toISOString(),
          }} />
        </div>
      </div>

      {/* Ringkasan Statistik Pencetakan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pencetakan</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Total SJ</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{poWithStats.stats.totalCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sudah Dicetak</p>
            <p className="mt-1 text-xl font-semibold text-green-700">{poWithStats.stats.printedCount} ({poWithStats.stats.printedPercentage}%)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Belum Dicetak</p>
            <p className="mt-1 text-xl font-semibold text-orange-600">{poWithStats.stats.notPrintedCount} ({poWithStats.stats.notPrintedPercentage}%)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Item</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{totalItemCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                poWithStats.stats.status === "Selesai" ? "bg-green-100 text-green-800" :
                poWithStats.stats.status === "Dalam Proses" ? "bg-blue-100 text-blue-800" :
                poWithStats.stats.status === "Belum Dimulai" ? "bg-orange-100 text-orange-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {poWithStats.stats.status}
              </span>
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">Progres Keseluruhan</span>
            <span className="font-medium text-gray-700">{poWithStats.stats.printedPercentage}%</span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={poWithStats.stats.printedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${poWithStats.stats.printedPercentage}% selesai`}
          >
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${poWithStats.stats.printedPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Surat Jalan ({po._count.deliveryNotes})</h2>
              <p className="text-sm text-gray-500">Cari dan kelola surat jalan dalam PO ini.</p>
            </div>
          </div>
          <SearchAndFilter initialParams={searchConfig} />
        </div>

        {deliveryNotes.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-gray-900">Data tidak ditemukan</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tidak ada surat jalan yang cocok dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Unik
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cabang
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor Surat Jalan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diperbarui
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryNotes.map((dn) => (
                  <tr key={dn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dn.uniqueCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {dn.documentNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dn.branchName}</div>
                      <div className="text-xs text-gray-500">{dn._count.items} barang</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        dn.printStatus === "PRINTED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {dn.printStatus === "PRINTED" ? "Sudah Dicetak" : "Belum Dicetak"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dn.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button className="text-gray-400 cursor-not-allowed font-medium" disabled title="Tersedia pada Phase 5">Cetak</button>
                      <Link href={`/surat-jalan/${dn.id}`} className="text-blue-600 hover:text-blue-900">
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {meta.page} dari {meta.totalPages}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/po/${id}?page=${meta.page - 1}&limit=${meta.limit}&q=${encodeURIComponent(searchConfig.q || "")}&status=${searchConfig.status}`}
                className={`px-3 py-1 border border-gray-200 rounded text-sm ${meta.page <= 1 ? "opacity-50 pointer-events-none" : "hover:bg-gray-50"}`}
                aria-disabled={meta.page <= 1}
              >
                Sebelumnya
              </Link>
              <Link
                href={`/po/${id}?page=${meta.page + 1}&limit=${meta.limit}&q=${encodeURIComponent(searchConfig.q || "")}&status=${searchConfig.status}`}
                className={`px-3 py-1 border border-gray-200 rounded text-sm ${meta.page >= meta.totalPages ? "opacity-50 pointer-events-none" : "hover:bg-gray-50"}`}
                aria-disabled={meta.page >= meta.totalPages}
              >
                Selanjutnya
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
