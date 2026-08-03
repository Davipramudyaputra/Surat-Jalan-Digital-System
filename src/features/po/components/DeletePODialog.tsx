"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deletePurchaseOrderAction } from "../actions";
import { canSubmitDeleteConfirmation } from "../utils/delete-confirmation";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

export type DeletePODialogProps = {
  purchaseOrderId: string;
  poNumber: string;
  companyName: string;
  totalCount: number;
  printedCount: number;
  notPrintedCount: number;
  printedPercentage: number;
  notPrintedPercentage: number;
  totalItemCount: number;
  expectedUpdatedAt: string;
};

export function DeletePODialog({ props }: { props: DeletePODialogProps }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(deletePurchaseOrderAction, { error: "" });

  const hasNotPrinted = props.notPrintedCount > 0;
  const isComplete = !hasNotPrinted;
  const canSubmit = canSubmitDeleteConfirmation({
    confirmationText: confirmText,
    isAcknowledged,
    isPending,
    notPrintedCount: props.notPrintedCount,
    poNumber: props.poNumber,
  });

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!isPending) setIsOpen(false);
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [isPending]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="brand-danger-button"
        title="Hapus seluruh data PO, surat jalan, dan barang di dalamnya."
      >
        <Trash2 aria-hidden="true" size={16} />
        Hapus Data PO
      </button>

      <dialog
        ref={dialogRef}
        className="delete-dialog"
      >
        <div>
          <div className="delete-dialog-heading">
            <span className="delete-dialog-icon"><AlertTriangle aria-hidden="true" size={20} /></span>
            <div>
            <p>Tindakan permanen</p>
            <h2>
              {isComplete ? "Hapus Data PO?" : "Hapus Data PO Secara Permanen?"}
            </h2>
            </div>
            {!isPending && (
              <button
                aria-label="Tutup dialog hapus"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            )}
          </div>

          <div className="delete-dialog-body">
            {!isComplete && (
              <div className="delete-warning">
                <p>Peringatan Bahaya:</p>
                <p>PO ini masih memiliki surat jalan yang <strong>belum dicetak</strong>.</p>
              </div>
            )}

            <div className="delete-identity">
              <p><span>Nomor PO</span> <strong>{props.poNumber}</strong></p>
              <p><span>Perusahaan</span> {props.companyName}</p>
            </div>

            <div className="delete-summary">
              <h3>Ringkasan Data</h3>
              <ul>
                <li>Total surat jalan: <strong>{props.totalCount}</strong></li>
                <li>Sudah dicetak: <strong>{props.printedCount}</strong> ({props.printedPercentage}%)</li>
                <li>Belum dicetak: <strong data-danger={!isComplete}>{props.notPrintedCount}</strong> ({props.notPrintedPercentage}%)</li>
                <li>Total barang: <strong>{props.totalItemCount}</strong></li>
              </ul>
            </div>

            <p className="delete-explanation">
              {isComplete
                ? "Seluruh data PO akan dihapus permanen dan tindakan ini tidak dapat dibatalkan."
                : `Sebanyak ${props.notPrintedCount} surat jalan belum dicetak. Jika Anda melanjutkan, seluruh PO, surat jalan, dan daftar barang di dalamnya akan dihapus secara permanen.`
              }
            </p>

            <form action={formAction} className="delete-form">
              <input type="hidden" name="id" value={props.purchaseOrderId} />
              <input type="hidden" name="expectedUpdatedAt" value={props.expectedUpdatedAt} />

              <label className="delete-acknowledgment">
                <input
                  type="checkbox"
                  name="acknowledgment"
                  value="true"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  disabled={isPending}
                />
                <span>
                  Saya memahami bahwa {hasNotPrinted ? "surat jalan yang belum dicetak" : "seluruh data PO"} akan ikut terhapus secara permanen.
                </span>
              </label>

              <div className="form-field">
                <label htmlFor="confirmPoNumber">
                  Ketik nomor PO berikut untuk melanjutkan:<br/>
                  <strong className="delete-confirmation-code">{props.poNumber}</strong>
                </label>
                <input
                  type="text"
                  id="confirmPoNumber"
                  name="confirmationPoNumber"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Masukkan nomor PO secara persis"
                  disabled={isPending}
                  className="brand-input"
                  autoComplete="off"
                />
              </div>

              {state.error && (
                <div className="form-message form-message-error" role="alert">
                  {state.error}
                </div>
              )}

              <div className="delete-dialog-actions">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="brand-secondary-button"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="brand-danger-button"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="dialog-loader" size={16} />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus Data PO"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
