"use client";

import { usePathname } from "next/navigation";

export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main
      key={pathname}
      className="flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto overflow-x-hidden overscroll-y-contain no-scrollbar"
    >
      <div className="max-w-7xl mx-auto w-full">
        {children}
      </div>
    </main>
  );
}
