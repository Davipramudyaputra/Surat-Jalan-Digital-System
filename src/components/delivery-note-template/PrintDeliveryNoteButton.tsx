"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { confirmDeliveryNotePrintedAction } from "@/features/delivery-notes/actions";
import type { PaperOrientation } from "@/lib/delivery-note-template/paper-profiles";
import { CheckCircle2, Printer, X } from "lucide-react";

import styles from "./delivery-note-template.module.css";

export function PrintDeliveryNoteButton({
  deliveryNoteId,
  expectedUpdatedAt,
  isPrintSafe,
  paperHeightMm,
  paperLabel,
  paperOrientation,
  paperWidthMm,
  pageCount,
  itemCount,
  validationMessage,
  registerOpenTrigger,
}: {
  deliveryNoteId: string;
  expectedUpdatedAt: string;
  isPrintSafe: boolean;
  paperHeightMm: number;
  paperLabel: string;
  paperOrientation: PaperOrientation;
  paperWidthMm: number;
  pageCount: number;
  itemCount: number;
  validationMessage?: string;
  registerOpenTrigger?: (open: () => void) => void;
}) {
  const router = useRouter();
  const initialDialogRef = useRef<HTMLDialogElement>(null);
  const resultDialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openInitialDialog = useCallback(() => {
    if (!isPrintSafe) {
      return;
    }
    setError("");
    setSuccess("");
    initialDialogRef.current?.showModal();
  }, [isPrintSafe]);

  // Jaga referensi terbaru agar trigger yang diregistrasikan (mis. Ctrl + P)
  // selalu memakai `openInitialDialog` dari render terkini.
  const openInitialDialogRef = useRef(openInitialDialog);
  useEffect(() => {
    openInitialDialogRef.current = openInitialDialog;
  }, [openInitialDialog]);

  useEffect(() => {
    if (registerOpenTrigger) {
      const trigger = () => openInitialDialogRef.current();
      registerOpenTrigger(trigger);
      return () => {
        registerOpenTrigger(() => undefined);
      };
    }
    return undefined;
  }, [registerOpenTrigger]);

  const continueToPrint = () => {
    initialDialogRef.current?.close();
    window.print();
    window.setTimeout(() => resultDialogRef.current?.showModal(), 0);
  };

  const confirmPrinted = () => {
    setError("");
    startTransition(async () => {
      const result = await confirmDeliveryNotePrintedAction({
        id: deliveryNoteId,
        expectedUpdatedAt,
        paper: {
          paperProfile: paperLabel,
          paperWidthMm: paperWidthMm,
          paperHeightMm: paperHeightMm,
          orientation: paperOrientation,
          pageCount,
        },
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resultDialogRef.current?.close();
      setSuccess("Status dan audit cetak berhasil diperbarui.");
      router.refresh();
    });
  };

  return (
    <>
      <button
        className="primary-button"
        disabled={!isPrintSafe}
        onClick={openInitialDialog}
        title={!isPrintSafe ? validationMessage : undefined}
        type="button"
      >
        <Printer aria-hidden="true" size={17} />
        Cetak Surat Jalan
      </button>

      {success ? (
        <p className={styles.successMessage} role="status">
          {success}
        </p>
      ) : null}

      <dialog
        aria-labelledby="confirm-print-title"
        className={styles.confirmDialog}
        ref={initialDialogRef}
      >
        <div className={styles.dialogContent}>
          <div>
            <p className={styles.dialogEyebrow}>Konfirmasi cetak</p>
            <h2 id="confirm-print-title">Periksa Data Surat Jalan</h2>
            <p>
              Pastikan seluruh informasi, ukuran kertas, dan daftar barang sudah
              benar sebelum membuka dialog cetak.
            </p>
          </div>
          <dl className={styles.printSummary}>
            <div><dt>Ukuran</dt><dd>{paperLabel}<small>{paperWidthMm} × {paperHeightMm} mm</small></dd></div>
            <div><dt>Orientasi</dt><dd>{paperOrientation === "LANDSCAPE" ? "Landscape" : "Portrait"}</dd></div>
            <div><dt>Halaman</dt><dd>{pageCount}</dd></div>
            <div><dt>Jumlah item</dt><dd>{itemCount}</dd></div>
          </dl>
          <div className={styles.printInstructions}>
            <strong>Pengaturan yang disarankan</strong>
            <ul>
              <li>
                Profil {paperLabel} ({paperWidthMm} × {paperHeightMm} mm)
              </li>
              <li>Scale 100%</li>
              <li>Margin None</li>
              <li>
                Orientation{" "}
                {paperOrientation === "LANDSCAPE" ? "Landscape" : "Portrait"}
              </li>
              <li>Matikan Headers and Footers</li>
              <li>Pilih ukuran kertas printer yang sama dengan profil aplikasi</li>
              <li>Jangan gunakan Fit to Page</li>
            </ul>
          </div>
          <div className={styles.dialogActions}>
            <button
              className="secondary-button"
              onClick={() => initialDialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={16} />
              Batal
            </button>
            <button
              className="primary-button"
              onClick={continueToPrint}
              type="button"
            >
              <Printer aria-hidden="true" size={16} />
              Lanjutkan Cetak
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        aria-labelledby="confirm-print-result-title"
        className={styles.confirmDialog}
        ref={resultDialogRef}
      >
        <div className={styles.dialogContent}>
          <div>
            <p className={styles.dialogEyebrow}>Hasil cetak</p>
            <h2 id="confirm-print-result-title">Konfirmasi Hasil Cetak</h2>
            <p>Apakah Surat Jalan berhasil dicetak?</p>
          </div>

          {error ? (
            <p className={styles.errorMessage} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.dialogActions}>
            <button
              className="secondary-button"
              disabled={isPending}
              onClick={() => resultDialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={16} />
              Belum / Batal
            </button>
            <button
              className="primary-button"
              disabled={isPending}
              onClick={confirmPrinted}
              type="button"
            >
              <CheckCircle2 aria-hidden="true" size={16} />
              {isPending ? "Menyimpan..." : "Ya, Tandai Sudah Dicetak"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
