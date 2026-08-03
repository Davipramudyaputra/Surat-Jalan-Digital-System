"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { ChevronRight, Home, Menu, UserRound } from "lucide-react";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  po: "Data PO",
  "surat-jalan": "Surat Jalan",
  edit: "Edit",
  preview: "Preview",
  settings: "Pengaturan",
};

export function Header({
  onMenuClick,
  userName,
}: {
  onMenuClick: () => void;
  userName: string;
}) {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header
      className="application-header"
      data-app-header
    >
      <button
        aria-label="Buka menu navigasi"
        className="header-menu-button"
        onClick={onMenuClick}
        type="button"
      >
        <Menu aria-hidden="true" size={20} />
      </button>
      <div className="header-inner">
        <div className="header-breadcrumb-wrap">
          <nav className="header-breadcrumb" aria-label="Breadcrumb">
            <ol role="list">
              <li>
                <div className="breadcrumb-home">
                  <Link href="/dashboard" aria-label="Dashboard">
                    <Home aria-hidden="true" size={17} />
                    <span className="sr-only">Home</span>
                  </Link>
                </div>
              </li>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const href = `/${paths.slice(0, index + 1).join("/")}`;

                const title = pathLabels[path] ?? path;

                return (
                  <React.Fragment key={path}>
                    <li>
                      <div className="breadcrumb-item">
                        <ChevronRight aria-hidden="true" size={14} />
                        <Link
                          href={href}
                          data-current={isLast}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {title}
                        </Link>
                      </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        </div>
        <div className="header-user">
          <div className="header-user-copy">
            <span>Administrator</span>
            <Link href="/settings">{userName}</Link>
          </div>
          <div className="header-avatar" aria-hidden="true">
            <UserRound size={16} />
            <span className="sr-only">
              {userName.slice(0, 1).toLocaleUpperCase("id-ID")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
