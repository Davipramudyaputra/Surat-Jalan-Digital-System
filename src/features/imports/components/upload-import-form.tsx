"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MAX_IMPORT_FILES,
  MAX_IMPORT_FILE_BYTES,
} from "@/features/imports/config/import-limits";
import type { ImportFileResult } from "@/features/imports/types/import-types";

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

function statusLabel(status: ImportFileResult["status"]): string {
  if (status === "IMPORTED") {
    return "Berhasil di-import";
  }

  if (status === "DUPLICATE") {
    return "File duplicate";
  }

  return "Import gagal";
}

export function UploadImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [results, setResults] = useState<ImportFileResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      results.reduce(
        (totals, result) => ({
          deliveryNotes: totals.deliveryNotes + result.deliveryNotes,
          files:
            totals.files + (result.status === "IMPORTED" ? 1 : 0),
          items: totals.items + result.items,
          purchaseOrders: totals.purchaseOrders + result.purchaseOrders,
        }),
        {
          deliveryNotes: 0,
          files: 0,
          items: 0,
          purchaseOrders: 0,
        },
      ),
    [results],
  );

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
    setResults([]);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setResults([]);

    try {
      const formData = new FormData();

      selectedFiles.forEach(({ file }) => {
        formData.append("files", file, file.name);
      });

      const response = await fetch("/api/imports", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse;

      if (payload.results && payload.results.length > 0) {
        setResults(payload.results);
      } else {
        setFormError(
          payload.error?.message ??
            "Import tidak dapat diproses. Silakan periksa file dan coba lagi.",
        );
      }
    } catch {
      setFormError(
        "Koneksi ke server terputus saat import. Tidak ada hasil yang dapat dikonfirmasi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="upload-workspace" aria-labelledby="upload-form-title">
        <form className="upload-form" onSubmit={handleSubmit}>
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
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
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
            <span className="upload-file-mark" aria-hidden="true">
              XLS
            </span>
            <span className="drop-zone-title">
              Tarik file Excel ke area ini
            </span>
            <span className="drop-zone-description">
              atau klik untuk memilih file dari komputer
            </span>
            <span className="file-picker-action">Pilih file Excel</span>
          </label>

          <div className="upload-guidance" aria-label="Ketentuan file">
            <span>.xls dan .xlsx</span>
            <span>Maksimal {MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB/file</span>
            <span>Maksimal {MAX_IMPORT_FILES} file</span>
          </div>

          {selectedFiles.length > 0 ? (
            <div className="selected-files" aria-live="polite">
              <div className="selected-files-heading">
                <h3>File terpilih</h3>
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedFiles([]);
                    setResults([]);
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
                      {file.name.toLocaleLowerCase("en-US").endsWith(".xlsx")
                        ? "XLSX"
                        : "XLS"}
                    </span>
                    <span className="selected-file-copy">
                      <strong>{file.name}</strong>
                      <span>{formatFileSize(file.size)}</span>
                    </span>
                    <button
                      aria-label={`Hapus ${file.name}`}
                      disabled={isSubmitting}
                      onClick={() => {
                        setSelectedFiles((current) =>
                          current.filter((entry) => entry.id !== id),
                        );
                        setResults([]);
                      }}
                      type="button"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {formError ? (
            <p className="form-alert form-alert-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            className="import-button"
            disabled={selectedFiles.length === 0 || isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Membaca dan menyimpan file…"
              : `Import ${selectedFiles.length || ""} file`.trim()}
          </button>
        </form>

        <aside className="import-explanation">
          <p className="section-kicker">Cara kerja</p>
          <h2>Format tidak harus selalu sama</h2>
          <p>
            Sistem memeriksa seluruh sheet, mencari header cabang dan kolom
            produk, lalu hanya menyimpan kuantitas yang valid.
          </p>
          <ol>
            <li>File dibaca hanya di server.</li>
            <li>Struktur dan metadata PO dideteksi otomatis.</li>
            <li>Satu surat jalan dibuat untuk setiap cabang.</li>
            <li>Upload ulang tidak menggandakan data.</li>
          </ol>
          <p className="privacy-note">
            File Excel tidak disimpan permanen; hanya metadata dan hasil import
            yang masuk ke database.
          </p>
        </aside>
      </section>

      {results.length > 0 ? (
        <section className="import-results" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="section-kicker">Hasil proses</p>
              <h2 id="results-title">Ringkasan import</h2>
            </div>
            <Link className="secondary-button" href="/surat-jalan">
              Buka halaman Surat Jalan
            </Link>
          </div>

          <div className="summary-grid" aria-label="Total hasil import">
            <div>
              <span>File baru</span>
              <strong>{summary.files}</strong>
            </div>
            <div>
              <span>Purchase order</span>
              <strong>{summary.purchaseOrders}</strong>
            </div>
            <div>
              <span>Cabang</span>
              <strong>{summary.deliveryNotes}</strong>
            </div>
            <div>
              <span>Item</span>
              <strong>{summary.items}</strong>
            </div>
          </div>

          <div className="result-list">
            {results.map((result, index) => (
              <article
                className="result-card"
                data-status={result.status}
                key={`${result.fileName}-${index}`}
              >
                <div className="result-card-heading">
                  <div>
                    <span className="result-status">
                      {statusLabel(result.status)}
                    </span>
                    <h3>{result.fileName}</h3>
                  </div>
                  {result.confidence !== null ? (
                    <span className="confidence-badge">
                      Confidence {result.confidence}%
                    </span>
                  ) : null}
                </div>

                {result.status !== "FAILED" ? (
                  <dl className="result-metrics">
                    <div>
                      <dt>PO</dt>
                      <dd>{result.purchaseOrders}</dd>
                    </div>
                    <div>
                      <dt>Cabang</dt>
                      <dd>{result.deliveryNotes}</dd>
                    </div>
                    <div>
                      <dt>Item</dt>
                      <dd>{result.items}</dd>
                    </div>
                    <div>
                      <dt>Sheet</dt>
                      <dd>{result.detectedSheet ?? "—"}</dd>
                    </div>
                  </dl>
                ) : null}

                {result.warnings.length > 0 ? (
                  <div className="result-messages result-warnings">
                    <strong>Perhatian</strong>
                    <ul>
                      {result.warnings.map((warning, warningIndex) => (
                        <li key={`${warning.code}-${warningIndex}`}>
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {result.errors.length > 0 ? (
                  <div className="result-messages result-errors" role="alert">
                    <strong>File belum dapat di-import</strong>
                    <ul>
                      {result.errors.map((error, errorIndex) => (
                        <li key={`${error.code}-${errorIndex}`}>
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
