import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppNavigation } from "@/components/layout/app-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-frame">
        <aside className="app-sidebar">
          <AppNavigation />
          <div className="sidebar-note">
            <p className="sidebar-note-label">Phase 1</p>
            <p>
              Fondasi aplikasi dan koneksi database sedang dipersiapkan.
            </p>
          </div>
        </aside>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
