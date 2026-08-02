"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTransition } from "react";

export function PurchaseOrderSearch({ defaultValue, defaultStatus }: { defaultValue: string, defaultStatus: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [status, setStatus] = useState(defaultStatus);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params;
    },
    [searchParams]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = createQueryString("q", searchTerm.trim());
      if (status && status !== "Semua") {
        params.set("status", status);
      } else {
        params.delete("status");
      }
      params.delete("page");
      router.push(`/po?${params.toString()}`);
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    startTransition(() => {
      const params = createQueryString("q", searchTerm.trim());
      if (newStatus && newStatus !== "Semua") {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }
      params.delete("page");
      router.push(`/po?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor PO, kode, perusahaan, atau periode..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      <select
        value={status}
        onChange={handleStatusChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[150px]"
      >
        <option value="Semua">Semua Status</option>
        <option value="Belum Dimulai">Belum Dimulai</option>
        <option value="Dalam Proses">Dalam Proses</option>
        <option value="Selesai">Selesai</option>
        <option value="Kosong">Kosong</option>
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
      >
        Cari
      </button>
    </form>
  );
}
