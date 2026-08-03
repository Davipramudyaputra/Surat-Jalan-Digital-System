import type { Metadata } from "next";

import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
};

export default async function SettingsPage() {
  const session = await requireAdmin();

  return (
    <div className="brand-page form-page">
      <header className="brand-page-header">
        <div>
        <p className="brand-eyebrow">Keamanan akun</p>
        <h1>Pengaturan Akun</h1>
        <p>
          Kelola keamanan akun admin {session.user.username}.
        </p>
        </div>
      </header>
      <section className="brand-card settings-card">
        <div className="brand-section-heading"><div>
        <h2>Ubah Password</h2>
        <p>
          Password tidak pernah ditampilkan kembali oleh aplikasi.
        </p>
        </div></div>
        <div className="settings-form-wrap">
        <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
