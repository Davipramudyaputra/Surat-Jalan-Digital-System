"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTransition } from "react";
import { Filter, Search } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="po-search-form">
      <label className="po-search-input">
        <span className="visually-hidden">Cari Purchase Order</span>
        <Search aria-hidden="true" size={17} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor PO, kode, perusahaan, atau periode..."
        />
      </label>

      <label className="po-filter-select">
        <span className="visually-hidden">Filter status</span>
        <Filter aria-hidden="true" size={16} />
        <select value={status} onChange={handleStatusChange}>
          <option value="Semua">Semua Status</option>
          <option value="Belum Dimulai">Belum Dimulai</option>
          <option value="Dalam Proses">Dalam Proses</option>
          <option value="Selesai">Selesai</option>
          <option value="Kosong">Kosong</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="brand-secondary-button"
      >
        <Search aria-hidden="true" size={16} />
        Cari
      </button>
    </form>
  );
}
