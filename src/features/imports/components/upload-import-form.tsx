"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import {
  MAX_IMPORT_FILES,
} from "@/features/imports/config/import-limits";
import type { ImportFileResult } from "@/features/imports/types/import-types";
import { useRouter } from "next/navigation";

type SelectedFile = {
  file: File;
  id: string;
};

type ApiResponse = {
  error?: {
    code: string;
    message: string;
  };
  results?: ImportFileResult[];
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  })} MB`;
}

function createFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function UploadImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const [previewResults, setPreviewResults] = useState<ImportFileResult[]>([]);
  const [commitResults, setCommitResults] = useState<ImportFileResult[]>([]);
  const [step, setStep] = useState<"select" | "preview" | "commit">("select");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [reimportAgreements, setReimportAgreements] = useState<Record<string, boolean>>({});

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const existingIds = new Set(selectedFiles.map((entry) => entry.id));
    const uniqueIncoming = incoming
      .map((file) => ({ file, id: createFileId(file) }))
      .filter((entry) => !existingIds.has(entry.id));
    const availableSlots = MAX_IMPORT_FILES - selectedFiles.length;

    if (availableSlots <= 0) {
      setFormError(`Maksimal ${MAX_IMPORT_FILES} file dalam satu import.`);
      return;
    }

    if (uniqueIncoming.length > availableSlots) {
      setFormError(
        `Hanya ${availableSlots} file tambahan yang dapat dipilih. Maksimal ${MAX_IMPORT_FILES} file.`,
      );
    } else {
      setFormError(null);
    }

    setSelectedFiles((current) => [
      ...current,
      ...uniqueIncoming.slice(0, availableSlots),
    ]);
    setStep("select");
    setPreviewResults([]);
    setCommitResults([]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedFiles.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("mode", "preview");
      selectedFiles.forEach(({ file }) => {
        formData.append("files", file, file.name);
      });

      const response = await fetch("/api/imports", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse;

      if (payload.results && payload.results.length > 0) {
        setPreviewResults(payload.results);
        setStep("preview");

        // Setup agreements map
        const initialAgreements: Record<string, boolean> = {};
        payload.results.forEach(res => {
          if (res.status === "REIMPORT_AFTER_DELETE") {
            initialAgreements[res.fileName] = false;
          }
        });
        setReimportAgreements(initialAgreements);
      } else {
        setFormError(
          payload.error?.message ??
            "Preview tidak dapat diproses. Silakan periksa file dan coba lagi.",
        );
      }
    } catch {
      setFormError("Koneksi ke server terputus saat memproses preview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCommit() {
    if (isSubmitting) return;

    // Check if all reimports are agreed
    const unagreed = previewResults.some(
      res => res.status === "REIMPORT_AFTER_DELETE" && !reimportAgreements[res.fileName]
    );
    if (unagreed) {
      setFormError("Mohon centang konfirmasi untuk file yang pernah di-import sebelumnya.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("mode", "commit");
      selectedFiles.forEach(({ file }) => {
        // Only submit files that are NOT duplicate active or failed in preview
        const preview = previewResults.find(r => r.fileName === file.name);
        if (preview && preview.status !== "DUPLICATE_ACTIVE" && preview.status !== "FAILED") {
          formData.append("files", file, file.name);
        }
      });

      const hasFilesToCommit = Array.from(formData.getAll("files")).length > 0;
      if (!hasFilesToCommit) {
        setFormError("Tidak ada file valid yang dapat di-import.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/imports", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse;

      if (payload.results && payload.results.length > 0) {
        setCommitResults(payload.results);
        setStep("commit");
        router.refresh();
      } else {
        setFormError(
          payload.error?.message ??
            "Import gagal diproses.",
        );
      }
    } catch {
      setFormError("Koneksi ke server terputus saat import.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasImportableFiles = previewResults.some(r => ["NEW_FILE", "REIMPORT_AFTER_DELETE", "REVISION"].includes(r.status));
  const activeResults = step === "commit" ? commitResults : previewResults;

  return (
    <>
      {step === "select" && (
        <section className="upload-workspace" aria-labelledby="upload-form-title">
          <form className="upload-form" onSubmit={handlePreview}>
            <div className="upload-form-heading">
              <div>
                <p className="section-kicker">File purchase order</p>
                <h2 id="upload-form-title">Pilih file untuk di-import</h2>
              </div>
              <span className="file-count">
                {selectedFiles.length}/{MAX_IMPORT_FILES} file
              </span>
            </div>

            <label
              className="drop-zone"
              data-dragging={isDragging}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="visually-hidden"
                disabled={isSubmitting}
                multiple
                onChange={handleFileChange}
                ref={inputRef}
                type="file"
              />
              <span className="upload-file-mark" aria-hidden="true">XLS</span>
              <span className="drop-zone-title">Tarik file Excel ke area ini</span>
              <span className="drop-zone-description">atau klik untuk memilih file dari komputer</span>
              <span className="file-picker-action">Pilih file Excel</span>
            </label>

            {selectedFiles.length > 0 && (
              <div className="selected-files" aria-live="polite">
                <div className="selected-files-heading">
                  <h3>File terpilih</h3>
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedFiles([]);
                      setFormError(null);
                    }}
                    type="button"
                  >
                    Hapus semua
                  </button>
                </div>
                <ul>
                  {selectedFiles.map(({ file, id }) => (
                    <li key={id}>
                      <span className="file-type-mark" aria-hidden="true">
                        {file.name.toLowerCase().endsWith(".xlsx") ? "XLSX" : "XLS"}
                      </span>
                      <span className="selected-file-copy">
                        <strong>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                      </span>
                      <button
                        aria-label={`Hapus ${file.name}`}
                        disabled={isSubmitting}
                        onClick={() => setSelectedFiles(cur => cur.filter(e => e.id !== id))}
                        type="button"
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formError && (
              <p className="form-alert form-alert-error" role="alert">{formError}</p>
            )}

            <button
              className="import-button"
              disabled={selectedFiles.length === 0 || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Membaca file..." : "Review Data PO"}
            </button>
          </form>
        </section>
      )}

      {(step === "preview" || step === "commit") && activeResults.length > 0 && (
        <section className="import-results" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="section-kicker">
                {step === "preview" ? "Konfirmasi Preview" : "Hasil Import"}
              </p>
              <h2 id="results-title">
                {step === "preview" ? "Konfirmasi Import Data PO" : "Ringkasan Import"}
              </h2>
            </div>
            {step === "preview" ? (
              <button className="secondary-button" onClick={() => setStep("select")} disabled={isSubmitting}>
                Kembali
              </button>
            ) : (
              <Link className="secondary-button" href="/po">
                Buka Data PO
              </Link>
            )}
          </div>

          <div className="result-list">
            {activeResults.map((result, index) => {
              const isDuplicateActive = result.status === "DUPLICATE_ACTIVE";
              const isReimport = result.status === "REIMPORT_AFTER_DELETE";
              const isFailed = result.status === "FAILED";
              const isRevision = result.status === "REVISION";
              const isNew = result.status === "NEW_FILE";
              const isSameNameDifferentHash = result.classification === "SAME_NAME_DIFFERENT_HASH";
              const isDifferentNameSameHash = result.classification === "DIFFERENT_NAME_SAME_HASH";

              const isSuccessStatus = result.status === "IMPORTED" || result.status === "REIMPORT_AFTER_DELETE" && step === "commit";

              return (
                <article
                  className="result-card"
                  data-status={result.status}
                  key={`${result.fileName}-${index}`}
                  style={{ border: isDuplicateActive ? "1px solid #ef4444" : undefined }}
                >
                  <div className="result-card-heading">
                    <div>
                      <span className="result-status" style={{ color: isDuplicateActive ? "#ef4444" : undefined }}>
                        {step === "commit" && isSuccessStatus
                          ? "Import Berhasil"
                          : isDuplicateActive
                          ? "File Sudah Pernah Di-import"
                          : isReimport && step === "preview"
                          ? "File Pernah Di-import Sebelumnya"
                          : isRevision && step === "preview"
                          ? "Terdeteksi Versi File yang Berbeda"
                          : isNew && step === "preview"
                          ? "Siap Di-import"
                          : isFailed
                          ? "Import Gagal"
                          : result.status}
                      </span>
                      <h3>{result.fileName}</h3>
                    </div>
                    {result.confidence !== null ? (
                      <span className="confidence-badge">Confidence {result.confidence}%</span>
                    ) : null}
                  </div>

                  {!isFailed && (
                    <div className="result-messages" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                      {isDuplicateActive && step === "preview" && (
                        <p>File dengan isi yang sama sudah pernah diproses dan data PO-nya masih tersedia dalam sistem.</p>
                      )}
                      {isReimport && step === "preview" && (
                        <p>File ini pernah di-import, tetapi data Purchase Order hasil import sebelumnya sudah tidak tersedia dalam sistem. Melanjutkan proses ini akan membuat kembali data PO dari file tersebut.</p>
                      )}
                      {isSameNameDifferentHash && step === "preview" && (
                        <p>Nama file pernah digunakan, tetapi hash isi file berbeda. File diperlakukan sebagai versi/revisi dan tetap memerlukan konfirmasi.</p>
                      )}
                      {isDifferentNameSameHash && step === "preview" && (
                        <p>Nama file berbeda, tetapi hash isinya identik dengan file yang pernah di-import. Keberadaan PO aktif menentukan apakah import diblokir atau diizinkan kembali.</p>
                      )}
                      {isRevision && !isSameNameDifferentHash && step === "preview" && (
                        <p>PO yang sama sudah tersedia, sedangkan hash file ini baru. File diperlakukan sebagai revisi dan tidak sebagai duplikat identik.</p>
                      )}
                    </div>
                  )}

                  {!isFailed && step === "preview" && (
                    <dl className="result-metrics">
                      <div><dt>Ukuran / Format</dt><dd>{formatFileSize(result.fileSize ?? 0)} / {(result.extension || "-").toUpperCase()}</dd></div>
                      <div><dt>Sheet</dt><dd>{result.detectedSheet || "-"}</dd></div>
                      <div><dt>Nomor PO</dt><dd>{result.poNumber || "-"}</dd></div>
                      <div><dt>Perusahaan</dt><dd>{result.companyCode ? `${result.companyCode} — ${result.companyName}` : "-"}</dd></div>
                      <div><dt>Periode</dt><dd>{result.period || "-"}</dd></div>
                      <div><dt>PO Terdeteksi</dt><dd>{result.purchaseOrders}</dd></div>
                      <div><dt>Cabang Terdeteksi</dt><dd>{result.deliveryNotes}</dd></div>
                      <div><dt>Item Terdeteksi</dt><dd>{result.items}</dd></div>
                    </dl>
                  )}

                  {!isFailed && step === "commit" && result.databaseChanges && (
                    <dl className="result-metrics">
                      <div><dt>PO Dibuat/Diperbarui</dt><dd>{result.databaseChanges.purchaseOrdersCreated} / {result.databaseChanges.purchaseOrdersUpdated}</dd></div>
                      <div><dt>Surat Jalan Dibuat/Diperbarui</dt><dd>{result.databaseChanges.deliveryNotesCreated} / {result.databaseChanges.deliveryNotesUpdated}</dd></div>
                      <div><dt>Item Dibuat/Diperbarui</dt><dd>{result.databaseChanges.itemsCreated} / {result.databaseChanges.itemsUpdated}</dd></div>
                    </dl>
                  )}

                  {isReimport && step === "preview" && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
                      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={reimportAgreements[result.fileName] || false}
                          onChange={(e) => setReimportAgreements(prev => ({...prev, [result.fileName]: e.target.checked}))}
                          style={{ marginTop: '0.25rem' }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>Saya memahami bahwa data PO akan dibuat kembali dari file ini.</span>
                      </label>
                    </div>
                  )}

                  {isDuplicateActive && result.existingPurchaseOrderId && (
                    <div style={{ marginTop: '1rem' }}>
                      <Link href={`/po/${result.existingPurchaseOrderId}`} className="secondary-button" style={{ display: 'inline-block' }}>
                        Buka Data PO
                      </Link>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="result-messages result-errors" role="alert" style={{ marginTop: '1rem' }}>
                      <strong>File belum dapat di-import</strong>
                      <ul>
                        {result.errors.map((error, idx) => (
                          <li key={idx}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="result-messages result-warnings" role="status">
                      <strong>Catatan parser</strong>
                      <ul>
                        {result.warnings.map((warning, idx) => (
                          <li key={`${warning.code}-${idx}`}>{warning.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {step === "preview" && hasImportableFiles && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <p className="form-alert form-alert-error" role="alert">{formError}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="secondary-button"
                  onClick={() => setStep("select")}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  className="import-button"
                  onClick={handleCommit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan ke Database..." : "Import Data PO"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
