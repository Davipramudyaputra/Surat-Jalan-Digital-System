"use client";

import { useActionState } from "react";
import { PurchaseOrder } from "@/generated/prisma/client";
import { editPurchaseOrderAction } from "../actions";
import Link from "next/link";
import { AlertTriangle, Save, X } from "lucide-react";

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
    <form action={formAction} className="brand-form">
      <input name="expectedUpdatedAt" type="hidden" value={po.updatedAt.toISOString()} />
      {state?.error && (
        <div className="form-message form-message-error" role="alert">
          {state.error}
        </div>
      )}

      <div className="form-warning">
        <AlertTriangle aria-hidden="true" size={20} />
          <div>
            <h3>
              Perhatian saat mengubah Identitas PO
            </h3>
            <div>
              <p>
                Perubahan akan diterapkan pada <strong>{po._count.deliveryNotes} surat jalan</strong> di PO ini. Surat jalan berstatus &quot;Sudah Dicetak&quot; akan kembali menjadi &quot;Belum Dicetak&quot;, sementara audit waktu dan jumlah cetak tetap dipertahankan.
              </p>
            </div>
          </div>
      </div>

      <div className="brand-form-grid">
        <div className="form-field">
          <label htmlFor="poNumber">
            Nomor PO
          </label>
          <input
            id="poNumber"
            name="poNumber"
            type="text"
            required
            defaultValue={po.poNumber}
            className="brand-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="period">
            Periode
          </label>
          <input
            id="period"
            name="period"
            type="text"
            defaultValue={po.period || ""}
            className="brand-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="companyCode">
            Kode Perusahaan
          </label>
          <input
            id="companyCode"
            name="companyCode"
            type="text"
            required
            defaultValue={po.companyCode}
            className="brand-input"
          />
        </div>

        <div className="form-field">
          <label htmlFor="companyName">
            Nama Perusahaan
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            defaultValue={po.companyName}
            className="brand-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <Link
          href={`/po/${po.id}`}
          className="brand-secondary-button"
        >
          <X aria-hidden="true" size={16} />
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="brand-primary-button"
        >
          <Save aria-hidden="true" size={16} />
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
