"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export function Header({ userName }: { userName: string }) {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <nav className="min-w-0 overflow-x-auto" aria-label="Breadcrumb">
            <ol role="list" className="flex w-max items-center space-x-2">
              <li>
                <div>
                  <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    <span className="text-xl">🏠</span>
                    <span className="sr-only">Home</span>
                  </Link>
                </div>
              </li>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const href = `/${paths.slice(0, index + 1).join("/")}`;

                // Exclude some common path slugs from being capitalized nicely or just capitalize it
                const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

                return (
                  <React.Fragment key={path}>
                    <li>
                      <div className="flex items-center">
                        <span className="text-gray-300 text-sm mx-2">/</span>
                        <Link
                          href={href}
                          className={`text-sm font-medium ${
                            isLast ? "text-gray-700" : "text-gray-500 hover:text-gray-700"
                          }`}
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
        <div className="hidden items-center gap-x-4 sm:flex lg:gap-x-6">
          <div className="flex items-center gap-x-4">
            <Link className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-700" href="/settings">
              {userName}
            </Link>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {userName.slice(0, 1).toLocaleUpperCase("id-ID")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
