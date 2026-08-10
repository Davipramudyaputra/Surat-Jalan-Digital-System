"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";

import { ActionDialog } from "@/components/ActionDialog";

type Props = {
  deliveryNoteId: string;
  paper?: string;
  orientation?: string;
  width?: number;
  height?: number;
  margin?: number;
  label?: string;
  hasBeenDownloaded?: boolean;
};

type QueryParams = Omit<Props, "deliveryNoteId" | "label" | "hasBeenDownloaded">;

function buildQuery(params: QueryParams): string {
  const qs = new URLSearchParams();
  if (params.paper) qs.set("paper", params.paper);
  if (params.orientation) qs.set("orientation", params.orientation);
  if (params.width !== undefined) qs.set("width", String(params.width));
  if (params.height !== undefined) qs.set("height", String(params.height));
  if (params.margin !== undefined) qs.set("margin", String(params.margin));
  return qs.toString();
}

export function DownloadPdfButton({
  deliveryNoteId,
  paper,
  orientation,
  width,
  height,
  margin,
  label = "Download PDF",
  hasBeenDownloaded = false,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [alreadyDownloaded, setAlreadyDownloaded] = useState(hasBeenDownloaded);
  const [showDownloadAgainDialog, setShowDownloadAgainDialog] = useState(false);
  const busyRef = useRef(false);

  const downloadPdf = async () => {
    if (busyRef.current) return;

    busyRef.current = true;
    setIsPending(true);
    setError("");

    try {
      const query = buildQuery({ paper, orientation, width, height, margin });
      const res = await fetch(`/api/delivery-notes/${deliveryNoteId}/pdf${query ? `?${query}` : ""}`, {
        headers: { Accept: "application/pdf" },
      });

      if (!res.ok) {
        let message = "PDF gagal dibuat. Silakan coba kembali.";
        try {
          const data = await res.json();
          if (data?.error?.message) message = data.error.message;
        } catch {
          // fallback ke pesan default
        }
        setError(message);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/u.exec(disposition);
      const filename = match?.[1] ?? "Surat-Jalan.pdf";

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setAlreadyDownloaded(true);
    } catch {
      setError("PDF gagal dibuat. Silakan coba kembali.");
    } finally {
      busyRef.current = false;
      setIsPending(false);
    }
  };

  const handleDownload = () => {
    if (busyRef.current) return;
    if (alreadyDownloaded) {
      setShowDownloadAgainDialog(true);
      return;
    }
    void downloadPdf();
  };

  const handleDownloadAgain = async () => {
    await downloadPdf();
    setShowDownloadAgainDialog(false);
  };

  return (
    <>
      <div className="pdf-download-wrap">
        <button
          className="brand-secondary-button"
          disabled={isPending}
          onClick={handleDownload}
          type="button"
        >
          <Download aria-hidden="true" size={16} />
          {isPending ? "Sedang menyiapkan PDF..." : label}
        </button>
        {error ? (
          <p className="pdf-download-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ActionDialog
        confirmLabel="Download Kembali"
        description="File PDF untuk Surat Jalan ini sudah pernah di-download. Anda tetap dapat membuat salinan PDF terbaru dengan pengaturan saat ini."
        eyebrow="Riwayat download"
        isPending={isPending}
        onClose={() => setShowDownloadAgainDialog(false)}
        onConfirm={() => void handleDownloadAgain()}
        open={showDownloadAgainDialog}
        pendingLabel="Menyiapkan PDF..."
        title="Download PDF kembali?"
        variant="warning"
      >
        <span className="action-dialog-file-note">
          <Download aria-hidden="true" size={16} />
          Aktivitas download baru akan dicatat pada riwayat audit.
        </span>
      </ActionDialog>
    </>
  );
}
