"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the scrollable main container and reset its scroll on every route change
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  return null;
}
