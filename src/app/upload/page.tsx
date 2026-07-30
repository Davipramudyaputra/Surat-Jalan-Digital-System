import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Excel",
};

export default function UploadPage() {
  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Sumber data</p>
          <h1 id="page-title">Upload Excel</h1>
          <p className="page-description">
            Halaman ini akan digunakan untuk membaca dan memvalidasi data
            purchase order sebelum disimpan.
          </p>
        </div>
        <span className="coming-soon-badge">Dibangun pada Phase 2</span>
      </section>

      <section className="upload-card" aria-labelledby="upload-title">
        <div className="upload-placeholder" aria-disabled="true">
          <div className="upload-file-mark" aria-hidden="true">
            XLS
          </div>
          <p className="upload-kicker">Area upload belum aktif</p>
          <h2 id="upload-title">File Excel akan dipilih di sini</h2>
          <p>
            Sistem direncanakan mendukung satu atau beberapa file dalam format
            Excel lama maupun baru.
          </p>
          <div className="format-list" aria-label="Format yang akan didukung">
            <span>.xls</span>
            <span>.xlsx</span>
          </div>
          <button className="disabled-button" disabled type="button">
            Pilih file Excel
          </button>
        </div>

        <aside className="phase-notice" aria-labelledby="phase-notice-title">
          <p className="phase-notice-label">Informasi pengembangan</p>
          <h2 id="phase-notice-title">Upload tersedia pada Phase 2</h2>
          <p>
            Phase 1 hanya menyiapkan fondasi aplikasi dan database. File belum
            dapat dipilih, dibaca, atau disimpan pada halaman ini.
          </p>
        </aside>
      </section>
    </div>
  );
}
