import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sistem Surat Jalan",
    template: "%s | Sistem Surat Jalan",
  },
  description:
    "Aplikasi internal CV. Pramudya Putra untuk pengelolaan surat jalan berbasis data purchase order.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
