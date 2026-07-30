"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/surat-jalan",
    label: "Surat Jalan",
    description: "Cari dan kelola dokumen",
  },
  {
    href: "/upload",
    label: "Upload Excel",
    description: "Impor data purchase order",
  },
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi utama" className="app-navigation">
      <p className="navigation-label">Menu utama</p>
      <ul className="navigation-list">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className="navigation-link"
                data-active={isActive}
                href={item.href}
              >
                <span className="navigation-marker" aria-hidden="true" />
                <span>
                  <span className="navigation-title">{item.label}</span>
                  <span className="navigation-description">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
