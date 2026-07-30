import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Surat Jalan",
};

const statusOptions = ["Semua", "Belum Dicetak", "Sudah Dicetak"] as const;

export default function DeliveryNotesPage() {
  return (
    <div className="page-stack">
      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Pengelolaan dokumen</p>
          <h1 id="page-title">Surat Jalan</h1>
          <p className="page-description">
            Cari, periksa, dan kelola surat jalan yang dibuat dari data purchase
            order.
          </p>
        </div>
        <Link className="primary-button" href="/upload">
          Buka halaman upload
        </Link>
      </section>

      <section className="workspace-card" aria-labelledby="search-title">
        <div className="card-heading">
          <div>
            <h2 id="search-title">Cari surat jalan</h2>
            <p>Fitur pencarian akan aktif setelah data dapat diimpor.</p>
          </div>
          <span className="coming-soon-badge">Tersedia di Phase 3</span>
        </div>

        <div className="search-controls">
          <div className="field-group">
            <label htmlFor="delivery-note-search">Pencarian</label>
            <input
              aria-describedby="search-help"
              disabled
              id="delivery-note-search"
              placeholder="Cari cabang, nomor PO, perusahaan, atau kode unik"
              type="search"
            />
            <p className="field-help" id="search-help">
              Pencarian belum tersedia pada fase fondasi.
            </p>
          </div>

          <fieldset className="status-filter" disabled>
            <legend>Status cetak</legend>
            <div className="status-options">
              {statusOptions.map((status, index) => (
                <button
                  className="status-option"
                  data-selected={index === 0}
                  key={status}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="empty-state" aria-labelledby="empty-state-title">
        <div className="empty-state-symbol" aria-hidden="true">
          SJ
        </div>
        <p className="empty-state-kicker">Belum ada data</p>
        <h2 id="empty-state-title">Surat jalan akan tampil di sini</h2>
        <p>
          Setelah fitur import tersedia, data dari file Excel akan tersusun
          otomatis berdasarkan perusahaan, nomor PO, dan cabang.
        </p>
        <Link className="secondary-button" href="/upload">
          Lihat persiapan upload
        </Link>
      </section>
    </div>
  );
}
