"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { RequestGuard } from "./request-guard";
import { ThemeApplier } from "./theme-applier";
import { useUser } from "./stores/user";
import { ThemeDecorationsRoot } from "./theme-decorations";

/**
 * Global client providers: TanStack Query, theme (dark-first) and toasts.
 * ThemeApplier (inside ThemeProvider) maps the active user theme onto the
 * CSS primary/ring/accent tokens; ThemeDecorationsRoot renders ambient decor;
 * RequestGuard keeps the origin's request-filter service worker registered.
 *
 * Query policy: data always comes fresh from PrimeWire on every site
 * opening — staleTime 0 refetches whenever a view mounts. Only account
 * info and settings are cached (localStorage, see stores/user.ts).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AccountCacheGuard queryClient={queryClient} />
      <ProvidersInner>{children}</ProvidersInner>
    </QueryClientProvider>
  );
}

/**
 * Purges ALL user-scoped query cache when the signed-in account changes or
 * signs out (a cache entry for one user must never be served
 * to another — belt AND suspenders with the user-scoped query keys).
 */
function AccountCacheGuard({ queryClient }: { queryClient: QueryClient }) {
  const apiKey = useUser((s) => s.apiKey);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (prev.current !== null && prev.current !== apiKey) {
      // account switched or signed out — drop every cached query
      queryClient.clear();
    }
    prev.current = apiKey;
  }, [apiKey, queryClient]);
  return null;
}

function ProvidersInner({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeApplier />
      <ThemeDecorationsRoot />
      <RequestGuard />
      {children}
      {/* Toasts float above the reserved dock lane. The numeric offset is a
          safe fallback; the exact clearance (dock footprint + 1rem gap,
          measured live incl. mobile safe-area) is applied via the CSS
          override on [data-sonner-toaster] in globals.css — a calc string
          here breaks this sonner build's inline-style pipeline. */}
      <Toaster richColors position="bottom-right" offset={{ bottom: 88 }} />
    </ThemeProvider>
  );
}
