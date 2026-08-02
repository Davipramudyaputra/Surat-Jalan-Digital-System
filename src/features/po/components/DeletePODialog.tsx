"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deletePurchaseOrderAction } from "../actions";
import { canSubmitDeleteConfirmation } from "../utils/delete-confirmation";

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
        className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm bg-red-600 hover:bg-red-500"
        title="Hapus seluruh data PO, surat jalan, dan barang di dalamnya."
      >
        Hapus Data PO
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl p-0 shadow-2xl backdrop:bg-gray-900/50"
      >
        <div className="bg-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-red-600">
              {isComplete ? "Hapus Data PO?" : "Hapus Data PO Secara Permanen?"}
            </h2>
            {!isPending && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                ✕
              </button>
            )}
          </div>

          <div className="px-6 py-4">
            {!isComplete && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <p className="font-semibold mb-1">Peringatan Bahaya:</p>
                <p>PO ini masih memiliki surat jalan yang <strong>belum dicetak</strong>.</p>
              </div>
            )}

            <div className="mb-4 text-sm text-gray-900">
              <p><span className="text-gray-500 inline-block w-24">Nomor PO:</span> <strong>{props.poNumber}</strong></p>
              <p><span className="text-gray-500 inline-block w-24">Perusahaan:</span> {props.companyName}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Ringkasan Data:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>Total surat jalan: <strong>{props.totalCount}</strong></li>
                <li>Sudah dicetak: <strong>{props.printedCount}</strong> ({props.printedPercentage}%)</li>
                <li>Belum dicetak: <strong className={!isComplete ? "text-red-600" : ""}>{props.notPrintedCount}</strong> ({props.notPrintedPercentage}%)</li>
                <li>Total barang: <strong>{props.totalItemCount}</strong></li>
              </ul>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              {isComplete
                ? "Seluruh data PO akan dihapus permanen dan tindakan ini tidak dapat dibatalkan."
                : `Sebanyak ${props.notPrintedCount} surat jalan belum dicetak. Jika Anda melanjutkan, seluruh PO, surat jalan, dan daftar barang di dalamnya akan dihapus secara permanen.`
              }
            </p>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="id" value={props.purchaseOrderId} />
              <input type="hidden" name="expectedUpdatedAt" value={props.expectedUpdatedAt} />

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="acknowledgment"
                  value="true"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 text-red-600 rounded border-gray-300 focus:ring-red-600"
                />
                <span className="text-sm text-gray-700 select-none">
                  Saya memahami bahwa {hasNotPrinted ? "surat jalan yang belum dicetak" : "seluruh data PO"} akan ikut terhapus secara permanen.
                </span>
              </label>

              <div>
                <label htmlFor="confirmPoNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Ketik nomor PO berikut untuk melanjutkan:<br/>
                  <strong className="select-all text-red-600 mt-1 block">{props.poNumber}</strong>
                </label>
                <input
                  type="text"
                  id="confirmPoNumber"
                  name="confirmationPoNumber"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Masukkan nomor PO secara persis"
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 sm:text-sm outline-none"
                  autoComplete="off"
                />
              </div>

              {state.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {state.error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
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
