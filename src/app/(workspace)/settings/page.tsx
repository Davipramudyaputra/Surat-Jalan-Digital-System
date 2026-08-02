import type { Metadata } from "next";

import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
};

export default async function SettingsPage() {
  const session = await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola keamanan akun admin {session.user.username}.
        </p>
      </div>
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Ubah Password</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Password tidak pernah ditampilkan kembali oleh aplikasi.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
