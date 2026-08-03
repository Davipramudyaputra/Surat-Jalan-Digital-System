import { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getSession } from "@/lib/session";
import Image from "next/image";
import { FileCheck2, ShieldCheck, Workflow } from "lucide-react";
import brandLogo from "../../../public/brand/logo-cv-pramudya-putra.png";

export const metadata: Metadata = {
  title: "Login - Sistem Surat Jalan",
  description: "Sistem Manajemen Surat Jalan Digital",
};

export default async function LoginPage() {
  const session = await getSession().catch(() => null);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Tentang aplikasi">
        <div className="login-corner" aria-hidden="true" />
        <div className="login-brand-content">
          <Image
            alt="Logo CV. Pramudya Putra"
            className="login-logo"
            height={170}
            priority
            src={brandLogo}
            width={430}
          />
          <p className="login-kicker">Sistem internal perusahaan</p>
          <h2>Pengiriman yang lebih tertib, jelas, dan siap dicetak.</h2>
          <p className="login-brand-description">
            Kelola data Purchase Order dan Surat Jalan dalam satu ruang kerja
            operasional CV. Pramudya Putra.
          </p>
          <div className="login-feature-list">
            <span><Workflow aria-hidden="true" size={19} /> Alur data terpusat</span>
            <span><FileCheck2 aria-hidden="true" size={19} /> Dokumen siap cetak</span>
            <span><ShieldCheck aria-hidden="true" size={19} /> Akses admin terlindungi</span>
          </div>
        </div>
      </section>
      <section className="login-form-panel">
        <LoginForm />
        <p className="login-footer">Sistem Surat Jalan Digital · CV. Pramudya Putra</p>
      </section>
    </main>
  );
}
