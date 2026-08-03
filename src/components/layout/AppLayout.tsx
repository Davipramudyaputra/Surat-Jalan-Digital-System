"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <div
      className="application-shell"
      data-app-shell
    >
      <Sidebar
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
        userName={userName}
      />
      <div className="application-workspace" data-app-content>
        <Header
          onMenuClick={() => setIsNavigationOpen(true)}
          userName={userName}
        />
        <main
          className="application-main"
          data-app-main
        >
          {children}
        </main>
      </div>
    </div>
  );
}
