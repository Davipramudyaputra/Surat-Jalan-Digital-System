"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  FileText,
  RotateCcw,
  Ruler,
  TriangleAlert,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { DownloadPdfButton } from "@/features/pdf/components/DownloadPdfButton";
import { formatAuditDateTime } from "@/lib/delivery-note-template/formatter";
import {
  DELIVERY_NOTE_PREVIEW_PAGE_GAP_MM,
} from "@/lib/delivery-note-template/constants";
import {
  buildPrintPageCss,
  calculatePreviewScale,
  DEFAULT_PAPER_PROFILE,
  getPaperCssVariables,
  PAPER_SIZE_OPTIONS,
  paperMillimetresToPixels,
  resolvePaperProfile,
  type PaperOrientation,
  type PaperSizeId,
} from "@/lib/delivery-note-template/paper-profiles";
import { paginateDeliveryNoteItems } from "@/lib/delivery-note-template/pagination";
import type { DeliveryNoteDocumentData } from "@/lib/delivery-note-template/types";

import { DeliveryNoteDocument } from "./DeliveryNoteDocument";
import { PrintDeliveryNoteButton } from "./PrintDeliveryNoteButton";
import styles from "./delivery-note-template.module.css";

type PrintAudit = {
  status: "PRINTED" | "NOT_PRINTED";
  firstPrintedAt: Date | null;
  lastPrintedAt: Date | null;
  printCount: number;
};

export function DeliveryNotePreviewShell({
  data,
  audit,
  hasBeenDownloaded = false,
}: {
  data: DeliveryNoteDocumentData;
  audit: PrintAudit;
  hasBeenDownloaded?: boolean;
}) {
  const isPrinted = audit.status === "PRINTED";
  // Pernah dicetak, namun status sudah kembali Belum Dicetak => data telah
  // diubah setelah cetak terakhir sehingga perlu dicetak ulang.
  const editedAfterPrint =
    !isPrinted && (audit.printCount > 0 || audit.firstPrintedAt !== null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const printOpenTriggerRef = useRef<(() => void) | null>(null);
  const [paperSize, setPaperSize] =
    useState<PaperSizeId>("HALF_FOLIO");
  const [orientation, setOrientation] =
    useState<PaperOrientation>("LANDSCAPE");
  const [customWidthMm, setCustomWidthMm] = useState("250");
  const [customHeightMm, setCustomHeightMm] = useState("180");
  const [customMarginMm, setCustomMarginMm] = useState("7");
  const [previewScale, setPreviewScale] = useState(1);

  const profileResolution = useMemo(
    () =>
      resolvePaperProfile(paperSize, orientation, {
        widthMm: customWidthMm,
        heightMm: customHeightMm,
        marginMm: customMarginMm,
        orientation,
      }),
    [
      customHeightMm,
      customMarginMm,
      customWidthMm,
      orientation,
      paperSize,
    ],
  );
  const { profile } = profileResolution;
  const pageCount = paginateDeliveryNoteItems(data.items).length;
  const paperCssVariables = getPaperCssVariables(
    profile,
  ) as CSSProperties;
  const previewFrameWidth =
    paperMillimetresToPixels(profile.widthMm) * previewScale;
  const previewFrameHeight =
    paperMillimetresToPixels(
      profile.heightMm * pageCount +
        DELIVERY_NOTE_PREVIEW_PAGE_GAP_MM * (pageCount - 1),
    ) * previewScale;

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) {
      return;
    }

    const updateScale = () => {
      setPreviewScale(
        calculatePreviewScale(viewport.clientWidth, profile.widthMm),
      );
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [profile.widthMm]);

  // Ctrl + P (Windows/Linux) dan Command + P (macOS) memakai workflow yang
  // sama dengan tombol Cetak. Handler tidak mengintersep saat fokus berada di
  // input, textarea, select, atau contenteditable. Listener dibersihkan saat
  // unmount agar tidak terdaftar ganda.
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      );
    };

    const handlePrintShortcut = (event: KeyboardEvent) => {
      const isPrintShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "p";

      if (!isPrintShortcut) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      printOpenTriggerRef.current?.();
    };

    window.addEventListener("keydown", handlePrintShortcut);
    return () => {
      window.removeEventListener("keydown", handlePrintShortcut);
    };
  }, []);

  const handlePaperSizeChange = (nextPaperSize: PaperSizeId) => {
    setPaperSize(nextPaperSize);
    if (nextPaperSize === "HALF_FOLIO") {
      setOrientation("LANDSCAPE");
    }
  };

  const resetPaperSettings = () => {
    setPaperSize("HALF_FOLIO");
    setOrientation("LANDSCAPE");
    setCustomWidthMm("250");
    setCustomHeightMm("180");
    setCustomMarginMm("7");
  };

  return (
    <div
      className={styles.previewPage}
      data-active-paper-profile={profile.id}
      style={paperCssVariables}
    >
      <style data-dynamic-paper-page>{buildPrintPageCss(profile)}</style>
      <div className={styles.previewChrome}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <Link href="/po">Data PO</Link>
          <span>/</span>
          <Link href={`/po/${data.purchaseOrderId}`}>{data.poNumber}</Link>
          <span>/</span>
          <Link href={`/surat-jalan/${data.id}`}>{data.branchName}</Link>
          <span>/</span>
          <span aria-current="page">Preview</span>
        </nav>

        <section className={styles.previewHeading}>
          <div>
            <p className={styles.previewEyebrow}>Preview Surat Jalan</p>
            <h1>{data.branchName}</h1>
            <p>
              Preview aktif: {profile.label}, {profile.widthMm} ×{" "}
              {profile.heightMm} mm · {pageCount} halaman.
            </p>
          </div>
          <span
            aria-label={`Status cetak: ${isPrinted ? "Sudah Dicetak" : "Belum Dicetak"}`}
            className={`${styles.statusBadge} ${
              isPrinted ? styles.statusPrinted : styles.statusNotPrinted
            }`}
          >
            {isPrinted ? "Sudah Dicetak" : "Belum Dicetak"}
          </span>
        </section>

        <section
          aria-labelledby="paper-settings-title"
          className={styles.paperSettings}
        >
          <div className={styles.paperSettingsHeading}>
            <div>
              <p className={styles.previewEyebrow}>Pengaturan preview</p>
              <h2 id="paper-settings-title">Pengaturan Kertas</h2>
              <p>
                Berlaku hanya untuk sesi preview dan cetak aktif. Data Surat
                Jalan tidak berubah.
              </p>
            </div>
            <button
              className="secondary-button"
              onClick={resetPaperSettings}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Kembalikan Default
            </button>
          </div>

          <div className={styles.paperControls}>
            <label className={styles.paperControl}>
              <span>Ukuran kertas</span>
              <select
                onChange={(event) =>
                  handlePaperSizeChange(event.target.value as PaperSizeId)
                }
                value={paperSize}
              >
                {PAPER_SIZE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.paperControl}>
              <span>Orientasi</span>
              <select
                disabled={paperSize === "HALF_FOLIO"}
                onChange={(event) =>
                  setOrientation(event.target.value as PaperOrientation)
                }
                value={orientation}
              >
                <option value="PORTRAIT">Portrait</option>
                <option value="LANDSCAPE">Landscape</option>
              </select>
            </label>

            <div className={styles.activePaperSummary}>
              <span className={styles.activePaperIcon}><Ruler aria-hidden="true" size={18} /></span>
              <div>
              <span>Profil aktif</span>
              <strong>{profile.label}</strong>
              <small>
                {profile.widthMm} × {profile.heightMm} mm · Scale preview{" "}
                {Math.round(previewScale * 100)}%
              </small>
              </div>
              {paperSize === "HALF_FOLIO" ? <em>Format Utama</em> : null}
            </div>
          </div>

          {paperSize === "CUSTOM" ? (
            <div className={styles.customPaperControls}>
              <label className={styles.paperControl}>
                <span>Lebar (mm)</span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setCustomWidthMm(event.target.value)}
                  step="0.1"
                  type="number"
                  value={customWidthMm}
                />
              </label>
              <label className={styles.paperControl}>
                <span>Tinggi (mm)</span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setCustomHeightMm(event.target.value)}
                  step="0.1"
                  type="number"
                  value={customHeightMm}
                />
              </label>
              <label className={styles.paperControl}>
                <span>Margin internal (mm)</span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setCustomMarginMm(event.target.value)}
                  step="0.1"
                  type="number"
                  value={customMarginMm}
                />
              </label>
            </div>
          ) : null}

          {profileResolution.errors.length > 0 ? (
            <div className={styles.paperError} role="alert">
              <strong>Ukuran custom belum dapat digunakan.</strong>
              <ul>
                {profileResolution.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
              <p>
                Preview dan Ctrl + P sementara menggunakan profil aman{" "}
                {DEFAULT_PAPER_PROFILE.label}.
              </p>
            </div>
          ) : null}

          {profileResolution.warnings.length > 0 ? (
            <div className={styles.paperWarning} role="status">
              {profileResolution.warnings.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.previewToolbar}>
          <div className={styles.toolbarActions}>
            <Link
              className="secondary-button"
              href={`/surat-jalan/${data.id}`}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Kembali ke Detail
            </Link>
            <Link
              className="secondary-button"
              href={`/surat-jalan/${data.id}/edit`}
            >
              <Edit3 aria-hidden="true" size={16} />
              Edit Data
            </Link>
            {profileResolution.errors.length === 0 ? (
              <DownloadPdfButton
                deliveryNoteId={data.id}
                hasBeenDownloaded={hasBeenDownloaded}
                paper={paperSize}
                orientation={orientation}
                width={paperSize === "CUSTOM" ? Number(customWidthMm) : undefined}
                height={paperSize === "CUSTOM" ? Number(customHeightMm) : undefined}
                margin={paperSize === "CUSTOM" ? Number(customMarginMm) : undefined}
              />
            ) : null}
            <PrintDeliveryNoteButton
              deliveryNoteId={data.id}
              expectedUpdatedAt={data.updatedAt.toISOString()}
              isPrintSafe={profileResolution.errors.length === 0}
              paperHeightMm={profile.heightMm}
              paperLabel={profile.label}
              paperOrientation={profile.orientation}
              paperWidthMm={profile.widthMm}
              pageCount={pageCount}
              itemCount={data.items.length}
              validationMessage={profileResolution.errors[0]}
              registerOpenTrigger={(open) => {
                printOpenTriggerRef.current = open;
              }}
            />
          </div>
          <p className={styles.toolbarHint}>
            Pilih ukuran printer yang sama dengan profil aplikasi, gunakan
            Scale 100%/Actual Size, Margin None, dan matikan Headers and
            Footers. Jangan gunakan Fit to Page.
          </p>
        </section>

        <section className={styles.auditPanel} aria-label="Audit cetak">
          <span className={styles.auditIcon}><FileText aria-hidden="true" size={18} /></span>
          <div>
            <span>Pertama dicetak</span>
            <strong>{formatAuditDateTime(audit.firstPrintedAt)}</strong>
          </div>
          <div>
            <span>Terakhir dicetak</span>
            <strong>{formatAuditDateTime(audit.lastPrintedAt)}</strong>
          </div>
          <div>
            <span>Jumlah cetak</span>
            <strong>{audit.printCount} kali</strong>
          </div>
          {editedAfterPrint ? (
            <p className={styles.auditWarning} role="status">
              <TriangleAlert aria-hidden="true" size={16} />
              Data telah diubah setelah dicetak. Cetak ulang untuk memperbarui
              dokumen.
            </p>
          ) : null}
        </section>
      </div>

      <div className={styles.previewViewport} ref={previewViewportRef}>
        <div
          className={styles.previewScaleFrame}
          data-preview-scale={previewScale}
          style={{
            height: `${previewFrameHeight}px`,
            width: `${previewFrameWidth}px`,
          }}
        >
          <div
            className={styles.previewScaleContent}
            style={{ transform: `scale(${previewScale})` }}
          >
            <DeliveryNoteDocument data={data} paperProfile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
