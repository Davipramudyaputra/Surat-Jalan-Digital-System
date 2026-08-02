"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions";

const navigation = [
  { name: "Dashboard", shortName: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Data PO", shortName: "Data PO", href: "/po", icon: "📦" },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logoutAction();
    });
  };

  return (
    <aside className="flex w-full shrink-0 items-stretch bg-slate-900 text-white shadow-xl md:h-full md:w-64 md:flex-col">
      <div className="flex h-14 shrink-0 items-center bg-slate-950 px-3 md:h-16 md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 font-bold">
            SJ
          </span>
          <span className="hidden text-lg font-semibold tracking-tight md:inline">Sistem SJ</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center md:flex-col md:items-stretch md:overflow-y-auto md:pt-6">
        <nav className="flex min-w-0 flex-1 overflow-x-auto px-2 md:block md:space-y-1 md:overflow-visible md:px-4">
          {navigation.map((item) => {
            const isActive =
              pathname.startsWith(item.href) ||
              (item.href === "/po" && pathname.startsWith("/surat-jalan"));
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:gap-3 md:py-2.5 md:text-sm ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                href={item.href}
                key={item.name}
              >
                <span aria-hidden="true" className="text-base md:text-xl">{item.icon}</span>
                {item.shortName}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center px-2 md:mt-auto md:block md:p-4">
          <p className="mb-2 hidden truncate px-3 text-xs text-slate-400 md:block">
            {userName}
          </p>
          <button
            aria-label="Keluar dari aplikasi"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50 md:w-full md:gap-3 md:py-2.5 md:text-sm"
            disabled={isPending}
            onClick={handleLogout}
            type="button"
          >
            <span aria-hidden="true" className="text-base md:text-xl">🚪</span>
            <span className="hidden md:inline">{isPending ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
