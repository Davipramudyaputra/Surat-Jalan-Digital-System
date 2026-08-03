"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";
import { DeliveryNoteSearchParams } from "../schemas";

export function SearchAndFilter({
  initialParams,
}: {
  initialParams: DeliveryNoteSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialParams.q || "");
  const [status, setStatus] = useState(initialParams.status || "all");

  const updateUrl = useCallback(
    (newQ: string, newStatus: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQ) {
        params.set("q", newQ);
      } else {
        params.delete("q");
      }

      if (newStatus && newStatus !== "all") {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }

      // Reset to page 1 on filter/search change
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialParams.q) {
        updateUrl(query, status);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, status, initialParams.q, updateUrl]);

  return (
    <div className="search-controls">
      <div className="field-group">
        <label htmlFor="delivery-note-search">Pencarian</label>
        <input
          id="delivery-note-search"
          placeholder="Cari cabang, nomor PO, perusahaan, atau kode unik"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isPending && <p className="field-help">Memperbarui hasil...</p>}
      </div>

      <fieldset className="status-filter">
        <legend>Status cetak</legend>
        <div className="status-options">
          {([
            { value: "all", label: "Semua" },
            { value: "not-printed", label: "Belum Dicetak" },
            { value: "printed", label: "Sudah Dicetak" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              className="status-option"
              data-selected={status === opt.value}
              type="button"
              onClick={() => {
                setStatus(opt.value);
                updateUrl(query, opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
