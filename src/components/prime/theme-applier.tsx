"use client";

import { useEffect, useLayoutEffect } from "react";
import { getTheme } from "@/themes/registry";
import { useUser } from "./stores/user";

/**
 * useLayoutEffect on the client, useEffect during SSR — avoids the React
 * server warning while keeping the attribute swap pre-paint on the client.
 *
 * The new theme engine applies themes with a SINGLE attribute switch:
 * `data-theme="<id>"` on <html>. All tokens (colors, fonts, radii,
 * backgrounds) live in src/themes/themes.generated.css keyed on that
 * attribute — so switching is instant, leaves zero residue (no inline
 * styles to clean up), and the pre-paint script in layout.tsx applies
 * the saved choice before first paint (flash-free).
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeApplier() {
  const themeId = useUser((s) => s.themeId);
  const transparency = useUser((s) => s.transparency);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    // "auto" (and unknown ids) → NO attribute → the neutral default tokens
    // follow the system light/dark scheme (next-themes handles the scheme).
    const theme = getTheme(themeId);
    if (theme) root.setAttribute("data-theme", theme.id);
    else root.removeAttribute("data-theme");
  }, [themeId]);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (transparency) root.setAttribute("data-transparency", "on");
    else root.removeAttribute("data-transparency");
  }, [transparency]);

  return null;
}
