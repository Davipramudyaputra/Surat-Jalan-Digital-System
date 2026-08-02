"use client";

import { useActionState } from "react";
import { PurchaseOrder } from "@/generated/prisma/client";
import { editPurchaseOrderAction } from "../actions";
import Link from "next/link";

const initialState = {
  error: "",
};

export function PurchaseOrderEditForm({
  po,
}: {
  po: PurchaseOrder & { _count: { deliveryNotes: number } };
}) {
  const [state, formAction, isPending] = useActionState(
    editPurchaseOrderAction.bind(null, po.id),
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <input name="expectedUpdatedAt" type="hidden" value={po.updatedAt.toISOString()} />
      {state?.error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Perhatian saat mengubah Identitas PO
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Perubahan akan diterapkan pada <strong>{po._count.deliveryNotes} surat jalan</strong> di PO ini. Surat jalan berstatus &quot;Sudah Dicetak&quot; akan kembali menjadi &quot;Belum Dicetak&quot;, sementara audit waktu dan jumlah cetak tetap dipertahankan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">
            Nomor PO
          </label>
          <input
            id="poNumber"
            name="poNumber"
            type="text"
            required
            defaultValue={po.poNumber}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="period" className="block text-sm font-medium text-gray-700">
            Periode
          </label>
          <input
            id="period"
            name="period"
            type="text"
            defaultValue={po.period || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700">
            Kode Perusahaan
          </label>
          <input
            id="companyCode"
            name="companyCode"
            type="text"
            required
            defaultValue={po.companyCode}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Nama Perusahaan
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            defaultValue={po.companyName}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
        <Link
          href={`/po/${po.id}`}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
