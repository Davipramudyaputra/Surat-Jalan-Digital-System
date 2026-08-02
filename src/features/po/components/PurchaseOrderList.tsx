"use client";

import { PurchaseOrder } from "@/generated/prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { POStats } from "../utils/stats";

type POWithStats = PurchaseOrder & {
  _count: {
    deliveryNotes: number;
  };
  stats: POStats;
};

export function PurchaseOrderList({ purchaseOrders }: { purchaseOrders: POWithStats[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRowClick = (id: string) => {
    startTransition(() => {
      router.push(`/po/${id}`);
    });
  };

  if (purchaseOrders.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-gray-300 m-6">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada Purchase Order</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Belum ada Purchase Order yang sesuai dengan pencarian atau filter Anda. Silakan upload file Excel baru.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nomor PO
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Perusahaan
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SJ / Item
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
              Progres Pencetakan
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
          {purchaseOrders.map((po) => {
            const { stats } = po;

            return (
              <tr
                key={po.id}
                onClick={() => handleRowClick(po.id)}
                className={`hover:bg-blue-50 cursor-pointer transition-colors ${isPending ? 'opacity-50' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="max-w-xs break-words text-sm font-medium text-gray-900">{po.poNumber}</div>
                  <div className="text-xs text-gray-500">
                    Periode: {po.period || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs break-words text-sm text-gray-900">{po.companyName}</div>
                  <div className="text-xs text-gray-500">Kode: {po.companyCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{stats.totalCount} surat jalan</div>
                  <div className="text-xs">{stats.totalItemCount} item</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-700 font-medium">Sudah: {stats.printedCount} ({stats.printedPercentage}%)</span>
                      <span className="text-orange-600 font-medium">Belum: {stats.notPrintedCount} ({stats.notPrintedPercentage}%)</span>
                    </div>
                    <div
                      className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={stats.printedPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stats.printedPercentage}% selesai`}
                    >
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.printedPercentage}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {stats.status === "Selesai" && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Selesai
                    </span>
                  )}
                  {stats.status === "Dalam Proses" && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Dalam Proses
                    </span>
                  )}
                  {stats.status === "Belum Dimulai" && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                      Belum Dimulai
                    </span>
                  )}
                  {stats.status === "Kosong" && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Kosong
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(po.updatedAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/po/${po.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
