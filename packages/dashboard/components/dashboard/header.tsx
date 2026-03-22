"use client";

import { Icons } from "../icons";

export function Header({
  pageTitle,
  isDesktop,
  onOpenSidebar,
}: {
  pageTitle: string;
  isDesktop: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-ranger-border bg-ranger-bg px-4 md:px-6">
      <div className="flex h-full items-center">
        <div className="flex items-center gap-4">
          {!isDesktop && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Open navigation"
              className="text-ranger-muted hover:text-ranger-text"
            >
              <Icons.Menu />
            </button>
          )}
          <h1 className="text-xl font-semibold text-ranger-text md:text-2xl">
            {pageTitle}
          </h1>
        </div>
      </div>
    </header>
  );
}
