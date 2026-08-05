"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  History,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Trash2,
  X,
} from "lucide-react";
import brandLogo from "../../../public/brand/logo-pp-transparent.png";

import { logoutAction } from "@/features/auth/actions";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Data PO", href: "/po", icon: PackageOpen },
  { name: "History", href: "/history", icon: History },
  { name: "Recycle Bin", href: "/recycle-bin", icon: Trash2 },
];

export function Sidebar({
  isOpen,
  onClose,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logoutAction();
    });
  };

  return (
    <>
      <button
        aria-label="Tutup menu navigasi"
        className="sidebar-backdrop"
        data-open={isOpen}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-label="Navigasi utama"
        className="application-sidebar"
        data-app-sidebar
        data-open={isOpen}
      >
        <div className="sidebar-brand">
          <Link href="/dashboard" onClick={onClose}>
            <span className="sidebar-logo">
              <Image
                alt="Logo PP CV. Pramudya Putra"
                className="sidebar-logo-img"
                priority
                src={brandLogo}
                unoptimized
              />
            </span>
            <span className="sidebar-brand-copy">
              <strong>Sistem Surat Jalan</strong>
              <small>CV. Pramudya Putra</small>
            </span>
          </Link>
          <button aria-label="Tutup menu" onClick={onClose} type="button">
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-nav-heading">
            <span>Ruang Kerja</span>
            <small>Operasional pengiriman</small>
          </div>
          <nav>
          {navigation.map((item) => {
            const isActive =
              pathname.startsWith(item.href) ||
              (item.href === "/po" && pathname.startsWith("/surat-jalan"));
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                data-active={isActive}
                href={item.href}
                key={item.name}
                onClick={onClose}
              >
                <item.icon aria-hidden="true" size={19} strokeWidth={1.8} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span>{userName.slice(0, 1).toLocaleUpperCase("id-ID")}</span>
            <p><strong>{userName}</strong><small>Administrator</small></p>
          </div>
          <button
            aria-label="Keluar dari aplikasi"
            disabled={isPending}
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            <span>{isPending ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
