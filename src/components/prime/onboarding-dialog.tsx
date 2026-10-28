"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Loader2, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { LoginResponse } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { useRelogin, useReloginGuard, RELOGIN_EVENT } from "./stores/relogin";
import { useUser, useUserHydrated } from "./stores/user";

export { useReloginGuard };

/** Window event that re-opens the sign-in dialog from anywhere in the UI. */
const SIGNIN_OPEN_EVENT = "primestream:open-sign-in";

/** Open the PrimeWire sign-in dialog (guest Account panel, header pill). */
export function openSignIn() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIGNIN_OPEN_EVENT));
}


/**
 * PrimeWire sign-in. Opens on first visit (dismissable — public
 * browsing must never be locked behind a third-party account) and
 * whenever an account call fails with an expired session (`useRelogin`
 * store) — then a notice line explains why. Username, avatar and the
 * PrimeWire API key all come from PrimeWire.
 *
 * USER-JOURNEY FIX (2026-10-28): a first-time visitor without a
 * PrimeWire account was hard-locked behind this dialog (no close, no
 * Esc, no outside click) and could not browse at all. Now a "Continue
 * without an account" option (and Esc/outside-click) dismisses it, and
 * the dismissal is remembered in localStorage so it does not nag again
 * on every page load. The sign-in prompt itself stays.
 */
export function OnboardingDialog() {
  const hydrated = useUserHydrated();
  const apiKey = useUser((s) => s.apiKey);
  const username = useUser((s) => s.username);
  const setProfileFromLogin = useUser((s) => s.setProfileFromLogin);

  const reloginOpen = useRelogin((s) => s.open);
  const reloginReason = useRelogin((s) => s.reason);
  const closeRelogin = useRelogin((s) => s.close);
  const qc = useQueryClient();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A user who dismissed the onboarding prompt can still ask for the
  // sign-in form later (guest Account panel / header pill) — this event
  // forces the dialog open regardless of the remembered dismissal.
  const [forcedOpen, setForcedOpen] = useState(false);
  useEffect(() => {
    const onOpenSignIn = () => setForcedOpen(true);
    window.addEventListener(SIGNIN_OPEN_EVENT, onOpenSignIn);
    return () => window.removeEventListener(SIGNIN_OPEN_EVENT, onOpenSignIn);
  }, []);

  // Cross-chunk bridge: the fetch layer signals session-expiry through a
  // window event (see stores/relogin.ts) — listening here guarantees the
  // prompt opens on THIS component's store copy even after hot reloads
  // left duplicate module chunks in memory.
  useEffect(() => {
    const onOpenRelogin = (e: Event) => {
      const reason = (e as CustomEvent<string | null>).detail ?? null;
      useRelogin.getState().openWith(reason);
    };
    window.addEventListener(RELOGIN_EVENT, onOpenRelogin);
    return () => window.removeEventListener(RELOGIN_EVENT, onOpenRelogin);
  }, []);

  // First visit (or a legacy key without a PrimeWire identity) → prompt,
  // but always dismissable (public browsing must work for everyone).
  // A dismissal is remembered in localStorage so we only prompt once.
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("primestream:onboarding-dismissed") === "1";
    } catch {
      return false;
    }
  });
  const firstRun = hydrated && (apiKey === null || username === null);
  // Session-expired re-prompt → dismissable (public browsing still works).
  const open = (firstRun && !onboardingDismissed) || reloginOpen || forcedOpen;
  const dismissable = true;

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    setForcedOpen(false);
    try {
      window.localStorage.setItem("primestream:onboarding-dismissed", "1");
    } catch {
      /* storage may be unavailable — the dialog just re-prompts next visit */
    }
    closeRelogin();
  };

  const submit = async () => {
    const loginTrimmed = login.trim();
    if (!loginTrimmed || !password) {
      setError("Enter your PrimeWire email/username and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginTrimmed, password }),
      });
      const body = (await res.json().catch(() => null)) as
        | (LoginResponse & { error?: string })
        | null;
      if (!res.ok) {
        throw new Error(body?.error ?? "Sign-in failed — please try again");
      }
      if (!body || !body.user) {
        throw new Error("Unexpected response from PrimeWire");
      }
      setProfileFromLogin(body);
      closeRelogin();
      setForcedOpen(false);
      // account data was failing against the old session — refetch it all
      void qc.invalidateQueries({ queryKey: ["account"] });
      toast.success(`Signed in as ${body.user.username}`, {
        description: "Your PrimeWire library, playlists and settings are live.",
      });
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismissOnboarding();
      }}
    >
      <DialogContent
        showCloseButton={dismissable}
        onPointerDownOutside={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        // no exit animation wiring — it closes on success
        className="glass max-w-[calc(100%-2rem)] gap-0 rounded-2xl border-border/60 p-0 sm:max-w-md"
      >
        <DialogHeader className="border-b border-border/60 px-6 pt-6 pb-5">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Clapperboard className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-left text-2xl font-semibold tracking-tight">
            {reloginOpen ? "Sign in again" : "Welcome to PreStream"}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-left text-sm leading-relaxed text-muted-foreground">
            Sign in with your PrimeWire account to sync your library,
            playlists and settings — they&apos;ll follow you to any device.
          </DialogDescription>
          {reloginOpen && reloginReason && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-foreground/5 px-3 py-2.5 text-xs leading-relaxed text-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {reloginReason}
            </p>
          )}
        </DialogHeader>

        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="pw-login"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              PrimeWire email or username
            </label>
            <Input
              id="pw-login"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!error}
              className={cn(
                "h-11 rounded-xl bg-background/60 text-sm",
                error && "border-destructive focus-visible:ring-destructive/40",
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pw-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password
            </label>
            <Input
              id="pw-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Your PrimeWire password"
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "pw-login-error" : undefined}
              className={cn(
                "h-11 rounded-xl bg-background/60 text-sm",
                error && "border-destructive focus-visible:ring-destructive/40",
              )}
            />
          </div>

          {error && (
            <p
              id="pw-login-error"
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl font-semibold"
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Sign in
          </Button>

          {/* Public browsing is never locked behind the PrimeWire account —
              a regular visitor can always continue as a guest. */}
          <button
            type="button"
            onClick={dismissOnboarding}
            className="w-full rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continue without an account
          </button>

        </form>
      </DialogContent>
    </Dialog>
  );
}
