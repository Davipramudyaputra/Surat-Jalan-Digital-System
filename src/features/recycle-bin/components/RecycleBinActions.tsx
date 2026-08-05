"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2, X } from "lucide-react";

import {
  permanentlyDeleteDeliveryNoteAction,
  permanentlyDeletePurchaseOrderAction,
  restoreDeliveryNoteAction,
  restorePurchaseOrderAction,
} from "../actions";

type Props = {
  kind: "purchase-order" | "delivery-note";
  id: string;
  identity: string;
  deliveryNoteCount?: number;
  itemCount?: number;
  parentDeleted?: boolean;
};

export function RecycleBinActions({
  kind,
  id,
  identity,
  deliveryNoteCount,
  itemCount,
  parentDeleted,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [restoreError, setRestoreError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phrase, setPhrase] = useState("");
  const [identityInput, setIdentityInput] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [permanentError, setPermanentError] = useState("");

  const handleRestore = () => {
    setRestoreError("");
    startTransition(async () => {
      const result =
        kind === "purchase-order"
          ? await restorePurchaseOrderAction(id)
          : await restoreDeliveryNoteAction(id);
      if (result.error) {
        setRestoreError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const openPermanent = () => {
    setPhrase("");
    setIdentityInput("");
    setAcknowledged(false);
    setPermanentError("");
    dialogRef.current?.showModal();
  };

  const handlePermanent = () => {
    setPermanentError("");
    const formData = new FormData();
    formData.set("phrase", phrase);
    formData.set("identity", identityInput);
    formData.set("acknowledgment", acknowledged ? "true" : "false");

    startTransition(async () => {
      const result =
        kind === "purchase-order"
          ? await permanentlyDeletePurchaseOrderAction(id, formData)
          : await permanentlyDeleteDeliveryNoteAction(id, formData);
      if (result.error) {
        setPermanentError(result.error);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    });
  };

  const cannotRestore = kind === "delivery-note" && parentDeleted;

  return (
    <div className="table-actions">
      <button
        className="po-open-link"
        disabled={cannotRestore || isPending}
        onClick={handleRestore}
        title={
          cannotRestore
            ? "Pulihkan Purchase Order terlebih dahulu"
            : "Pulihkan data"
        }
        type="button"
      >
        <RotateCcw aria-hidden="true" size={14} />
        Pulihkan
      </button>
      <button
        aria-label="Hapus permanen"
        className="recycle-permanent-trigger"
        disabled={isPending}
        onClick={openPermanent}
        type="button"
      >
        <Trash2 aria-hidden="true" size={14} />
        Hapus Permanen
      </button>

      {restoreError ? (
        <p className="recycle-error" role="alert">{restoreError}</p>
      ) : null}

      <dialog
        aria-labelledby="permanent-delete-title"
        className="recycle-dialog"
        ref={dialogRef}
      >
        <div className="recycle-dialog-content">
          <div className="recycle-dialog-header">
            <div>
              <p className="brand-eyebrow">Hapus Permanen</p>
              <h2 id="permanent-delete-title">Hapus Permanen</h2>
              <p className="audit-detail-subtitle">
                {identity}
                {kind === "purchase-order"
                  ? ` · ${deliveryNoteCount ?? 0} Surat Jalan · ${itemCount ?? 0} item`
                  : ` · ${itemCount ?? 0} item`}
              </p>
            </div>
            <button
              aria-label="Tutup"
              className="audit-detail-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="recycle-dialog-warning" role="alert">
            <strong>Tindakan ini tidak dapat dibatalkan.</strong>
            <p>
              Data akan dihapus permanen dari database dan tidak dapat
              dipulihkan. History audit akan tetap tersedia.
            </p>
          </div>

          <label className="recycle-confirm-field">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>Saya mengerti data ini akan dihapus permanen.</span>
          </label>

          <label className="brand-field">
            <span>Ketik HAPUS PERMANEN</span>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="HAPUS PERMANEN"
            />
          </label>

          <label className="brand-field">
            <span>
              Ketik {kind === "purchase-order" ? "nomor PO" : "kode Surat Jalan"}
            </span>
            <input
              value={identityInput}
              onChange={(e) => setIdentityInput(e.target.value)}
              placeholder={identity}
            />
          </label>

          {permanentError ? (
            <p className="recycle-error" role="alert">{permanentError}</p>
          ) : null}

          <div className="recycle-dialog-actions">
            <button
              className="brand-secondary-button"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Batal
            </button>
            <button
              className="brand-danger-button"
              disabled={
                isPending ||
                phrase !== "HAPUS PERMANEN" ||
                identityInput !== identity ||
                !acknowledged
              }
              onClick={handlePermanent}
              type="button"
            >
              {isPending ? "Menghapus..." : "Hapus Permanen"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
