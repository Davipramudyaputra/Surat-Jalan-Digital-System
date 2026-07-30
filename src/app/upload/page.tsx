import type { Metadata } from "next";

import { UploadImportForm } from "@/features/imports/components/upload-import-form";

export const metadata: Metadata = {
  title: "Upload Excel",
};

export default function UploadPage() {
  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Import purchase order</p>
          <h1 id="page-title">Upload Excel</h1>
          <p className="page-description">
            Pilih satu atau beberapa file PO. Sistem akan mendeteksi sheet,
            header, cabang, dan produk secara otomatis sebelum menyimpan hasil
            yang valid.
          </p>
        </div>
        <span className="active-phase-badge">Import adaptif aktif</span>
      </section>

      <UploadImportForm />
    </div>
  );
}
