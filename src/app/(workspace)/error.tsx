"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <div className="brand-card workspace-error" role="alert">
      <span className="empty-icon-tile"><AlertTriangle aria-hidden="true" size={22} /></span>
      <p className="brand-eyebrow">Terjadi kendala</p>
      <h1>Halaman belum dapat ditampilkan</h1>
      <p>Data Anda tidak diubah. Coba muat kembali halaman atau kembali ke Dashboard.</p>
      <div>
        <Link className="brand-secondary-button" href="/dashboard"><ArrowLeft aria-hidden="true" size={16} /> Dashboard</Link>
        <button className="brand-primary-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={16} /> Coba Lagi</button>
      </div>
    </div>
  );
}
