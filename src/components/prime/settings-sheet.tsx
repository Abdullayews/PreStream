"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Copy,
  ImagePlus,
  KeyRound,
  Layers3,
  Loader2,
  LogOut,
  LogOutIcon,
  MonitorSmartphone,
  Moon,
  Pencil,
  Settings as SettingsIcon,
  ShieldAlert,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { avatarUrl } from "@/lib/account-client-types";
import { cn } from "@/lib/utils";
import { AUTO_THEME_ID, THEMES, THEME_CATEGORIES, seasonalSuggestion } from "@/themes/registry";
import type { ThemeDefinition } from "@/themes/core/types";
import { useAccountMutation, useAccountSettings, useAvatarUpload } from "./hooks/use-account";
import { useMounted } from "./hooks/use-mounted";
import { useUser, useUserHydrated } from "./stores/user";

/* ------------------------------------------------------------------ */
/* Open state — window-event channel                                   */
/* ------------------------------------------------------------------ */

/**
 * The settings sheet is opened through a WINDOW CUSTOM EVENT rather than
 * a module-scoped zustand store. Why: in the dev preview (and with hot
 * reloads generally) the bundler can end up with two copies of a module
 * chunk — a store created at module scope would then exist TWICE, the
 * trigger writing to one copy while the sheet subscribes to the other,
 * and the click would silently do nothing. `window` is process-global and
 * shared by every chunk copy, so an event can never be split. This is the
 * same pattern the search spotlight and the watchlist drawer already use.
 */
const SETTINGS_OPEN_EVENT = "primestream:open-settings";

/** Open the settings sheet from anywhere (client-only by nature). */
export function openSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SETTINGS_OPEN_EVENT));
}

function useSettingsOpenEvent(onOpen: () => void) {
  useEffect(() => {
    window.addEventListener(SETTINGS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SETTINGS_OPEN_EVENT, onOpen);
  }, [onOpen]);
}

type SectionId = "account" | "profile" | "appearance";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
];

/**
 * Settings — Shiopa-style right sheet with three sections: Account
 * (avatar, PrimeWire API key, password, sessions), Profile (PrimeWire
 * profile fields) and Appearance (the 18-theme gallery).
 */
export function SettingsSheet() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionId>("account");
  useSettingsOpenEvent(useCallback(() => setOpen(true), []));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5">
            <SettingsIcon className="size-5 text-muted-foreground" aria-hidden />
            Settings
          </SheetTitle>
          <SheetDescription className="sr-only">
            Manage your PrimeWire account, profile and PreStream appearance.
          </SheetDescription>
        </SheetHeader>

        {/* quick actions — watchlist and appearance live here
            so the header keeps only the account chip */}
        <QuickActions onClose={() => setOpen(false)} />

        {/* section pills */}
        <div className="thin-scrollbar sticky top-0 z-10 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Settings sections"
          >
            {SECTIONS.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="thin-scrollbar flex-1 overflow-y-auto">
          {/* Boundary: a crash inside any section must degrade to a card in
              the sheet — it can never blank the sheet or take the page down
              (which would look exactly like "the panel doesn't open"). */}
          <SettingsErrorBoundary key={section}>
            {section === "account" && <AccountSection onClose={() => setOpen(false)} />}
            {section === "profile" && <ProfileSection />}
            {section === "appearance" && <AppearanceSection />}
          </SettingsErrorBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Header trigger that keeps the old palette-button position ("Settings"). */
export function SettingsTrigger() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Settings"
      title="Settings"
      className="size-11 rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      onClick={openSettings}
    >
      <SettingsIcon className="size-5" aria-hidden />
    </Button>
  );
}

/**
 * Error boundary scoped to the sheet's section content. If a section
 * throws during render (bad avatar data, corrupted cache, …) the sheet
 * stays open and usable instead of killing the page.
 */
class SettingsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // surfaced in dev, never fatal
    console.error("[PreStream] settings section failed to render", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-semibold">This section hit a snag</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Something failed while loading it. The rest of PreStream keeps
              working — try another section or reopen settings.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Quick actions — the header's former controls live here              */
/* ------------------------------------------------------------------ */

function QuickActions({ onClose }: { onClose: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const openWatchlist = () => {
    onClose();
    window.dispatchEvent(new Event("primestream:open-watchlist"));
  };

  const isDark = mounted && resolvedTheme !== "light";

  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
      <button
        type="button"
        onClick={openWatchlist}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bookmark className="size-4" aria-hidden />
        Watchlist
      </button>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle light/dark theme"
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isDark ? (
          <Sun className="size-4" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )}
        {isDark ? "Light" : "Dark"} mode
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Account section                                                     */
/* ------------------------------------------------------------------ */

function AccountSection({ onClose }: { onClose: () => void }) {
  const hydrated = useUserHydrated();
  const apiKey = useUser((s) => s.apiKey);
  const username = useUser((s) => s.username);
  const avatar = useUser((s) => s.avatar);
  const pwApiKey = useUser((s) => s.pwApiKey);
  const logout = useUser((s) => s.logout);

  const settingsQuery = useAccountSettings();
  const upload = useAvatarUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBust, setAvatarBust] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // password change form
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const resetKey = useAccountMutation<{ ok: boolean; apiKey: string | null }>("settings", {
    invalidates: [["account", "settings"]],
  });
  const changePassword = useAccountMutation<{ ok: boolean }>("settings");
  const logoutEverywhere = useAccountMutation<{ ok: boolean; signedOut?: boolean }>("settings");

  if (!hydrated) return null;

  if (!apiKey) {
    return (
      <section aria-label="Account" className="px-5 py-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          No PrimeWire account on this device yet — sign in to manage your
          profile, library and playlists.
        </p>
        <Button
          className="mt-3 h-10 w-full rounded-xl font-semibold"
          onClick={onClose}
        >
          Set up account
        </Button>
      </section>
    );
  }

  const avatarSrc = avatarUrl(avatar, avatarBust || null);

  const pickFile = () => fileRef.current?.click();

  const onFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Avatar must be under 4 MB");
      return;
    }
    if (file.type && !/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      toast.error("Only JPEG, PNG, GIF or WebP images are allowed");
      return;
    }
    upload.mutate(
      { file },
      {
        onSuccess: () => {
          setAvatarBust(Date.now());
          toast.success("Profile picture updated");
        },
        onError: (err) =>
          toast.error("Couldn't upload the picture", {
            description: err.message,
          }),
      },
    );
  };

  const shownKey = settingsQuery.data?.settings?.apiKey ?? pwApiKey;

  const copyKey = () => {
    if (!shownKey) return;
    navigator.clipboard
      .writeText(shownKey)
      .then(() => {
        setCopied(true);
        toast.success("API key copied to clipboard");
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => toast.error("Couldn't copy — select the key manually"));
  };

  const submitPassword = async () => {
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwError(null);
    try {
      await changePassword.mutateAsync({
        action: "password",
        currentPassword,
        newPassword,
      });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setPwOpen(false);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Couldn't change the password");
    }
  };

  return (
    <section aria-label="Account" className="px-5 py-5">
      {/* avatar + upload */}
      <div className="flex items-center gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={`${username ?? "Your"} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="size-8 text-muted-foreground/60" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {username ?? "Signed in"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            JPEG, PNG, GIF or WebP · max 4 MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={(e) => {
              onFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={pickFile}
            disabled={upload.isPending}
            className="mt-2 h-9 rounded-full"
          >
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-4" aria-hidden />
            )}
            Upload new picture
          </Button>
        </div>
      </div>

      {/* username (readonly — comes from PrimeWire) */}
      <Field label="Username" className="mt-5">
        <Input
          readOnly
          value={username ?? ""}
          aria-readonly
          className="h-10 rounded-xl bg-muted/40 text-sm"
        />
      </Field>

      {/* PrimeWire API key */}
      <Field label="PrimeWire API key" className="mt-4">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shownKey ?? "—"}
            spellCheck={false}
            aria-label="PrimeWire API key"
            className="h-10 min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/40 px-3 font-mono text-xs text-foreground outline-none"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyKey}
            disabled={!shownKey}
            aria-label="Copy PrimeWire API key"
            title="Copy PrimeWire API key"
            className="size-10 shrink-0 rounded-lg"
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Reset PrimeWire API key"
                title="Reset PrimeWire API key"
                className="size-10 shrink-0 rounded-lg"
              >
                <KeyRound className="size-4" aria-hidden />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset your PrimeWire API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current key stops working immediately. Any app using it
                  will need the new key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    resetKey.mutate(
                      { action: "reset-key" },
                      {
                        onSuccess: (data) => {
                          toast.success("API key reset", {
                            description: data.apiKey
                              ? `New key: ${data.apiKey}`
                              : "Open PrimeWire to view the new key.",
                          });
                        },
                        onError: (err) =>
                          toast.error("Couldn't reset the key", {
                            description: err.message,
                          }),
                      },
                    )
                  }
                >
                  Reset key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
          PrimeWire&apos;s own v1 API key — used by the /api/v1 show &amp; sources
          endpoints.
        </p>
      </Field>

      {/* change password */}
      <div className="mt-4">
        {!pwOpen ? (
          <Button
            variant="outline"
            onClick={() => setPwOpen(true)}
            className="h-10 w-full rounded-xl"
          >
            <Pencil className="size-4" aria-hidden />
            Change password
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-border/60 p-3">
            <Field label="Current password">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (pwError) setPwError(null);
                }}
                autoComplete="current-password"
                className="h-10 rounded-xl bg-background/60 text-sm"
              />
            </Field>
            <Field label="New password (min 6 characters)">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (pwError) setPwError(null);
                }}
                autoComplete="new-password"
                className="h-10 rounded-xl bg-background/60 text-sm"
              />
            </Field>
            {pwError && (
              <p role="alert" className="text-xs text-destructive">
                {pwError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={() => {
                  setPwOpen(false);
                  setPwError(null);
                }}
                disabled={changePassword.isPending}
              >
                Cancel
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl"
                onClick={() => void submitPassword()}
                disabled={changePassword.isPending || !currentPassword || !newPassword}
              >
                {changePassword.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                Update password
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* sessions */}
      <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-full rounded-xl text-muted-foreground hover:text-destructive"
              disabled={logoutEverywhere.isPending}
            >
              {logoutEverywhere.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <MonitorSmartphone className="size-4" aria-hidden />
              )}
              Log out of PrimeWire everywhere
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Log out of PrimeWire everywhere?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This ends ALL PrimeWire sessions, including this one. You&apos;ll
                need your password to sign back in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  logoutEverywhere.mutate(
                    { action: "logout-everywhere" },
                    {
                      onSuccess: () => {
                        logout();
                        onClose();
                        toast.success("Logged out everywhere", {
                          description: "Sign in again to continue.",
                        });
                      },
                      onError: (err) =>
                        toast.error("Couldn't log out everywhere", {
                          description: err.message,
                        }),
                    },
                  )
                }
              >
                Log out everywhere
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-full rounded-xl text-muted-foreground hover:text-destructive"
            >
              <LogOutIcon className="size-4" aria-hidden />
              Sign out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of PreStream?</AlertDialogTitle>
              <AlertDialogDescription>
                Your PrimeWire session is detached. Themes and your watchlist
                stay cached on this account for the next sign-in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  logout();
                  onClose();
                  toast.success("Signed out", {
                    description: "Your PrimeWire session was detached.",
                  });
                }}
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Profile section (PrimeWire /registrations/edit fields)              */
/* ------------------------------------------------------------------ */

const NONE = "__none";
const GENDERS = [
  { value: NONE, label: "Prefer not to say" },
  { value: "1", label: "Male" },
  { value: "2", label: "Female" },
  { value: "3", label: "Other" },
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((name, i) => ({ value: String(i + 1), label: name }));
const YEARS = Array.from({ length: 2020 - 1920 + 1 }, (_, i) => String(2020 - i));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const WALL_ACCESS = [
  { value: "0", label: "Anyone" },
  { value: "1", label: "Friends only" },
  { value: "2", label: "No one" },
];

interface ProfileForm {
  gender: string;
  birthdayYear: string;
  birthdayMonth: string;
  birthdayDay: string;
  countryId: string;
  city: string;
  bio: string;
  hobbies: string;
  pmMessage: string;
  wallViewAccess: string;
  wallPostAccess: string;
}

const EMPTY_FORM: ProfileForm = {
  gender: NONE,
  birthdayYear: NONE,
  birthdayMonth: NONE,
  birthdayDay: NONE,
  countryId: NONE,
  city: "",
  bio: "",
  hobbies: "",
  pmMessage: "",
  wallViewAccess: "0",
  wallPostAccess: "0",
};

function ProfileSection() {
  const { data, isLoading, isError, error, refetch } = useAccountSettings();
  // draft is null until the user edits — until then the form shows the
  // server values directly (no state-sync effects needed)
  const [draft, setDraft] = useState<ProfileForm | null>(null);

  const save = useAccountMutation<{ ok: boolean }>("settings", {
    invalidates: [["account", "settings"]],
    onOk: () => setDraft(null),
  });

  const serverForm: ProfileForm = data?.settings
    ? {
        gender: data.settings.gender || NONE,
        birthdayYear: data.settings.birthdayYear || NONE,
        birthdayMonth: data.settings.birthdayMonth || NONE,
        birthdayDay: data.settings.birthdayDay || NONE,
        countryId: data.settings.countryId || NONE,
        city: data.settings.city ?? "",
        bio: data.settings.bio ?? "",
        hobbies: data.settings.hobbies ?? "",
        pmMessage: data.settings.pmMessage ?? "",
        wallViewAccess: data.settings.wallViewAccess || "0",
        wallPostAccess: data.settings.wallPostAccess || "0",
      }
    : EMPTY_FORM;
  const form = draft ?? serverForm;
  const setForm = (updater: (prev: ProfileForm) => ProfileForm) => {
    setDraft(updater(form));
  };

  if (isLoading) {
    return (
      <section aria-label="Profile" className="space-y-4 px-5 py-5" aria-busy="true">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section aria-label="Profile" className="px-5 py-8 text-center">
        <ShieldAlert className="mx-auto size-8 text-destructive" aria-hidden />
        <p className="mt-3 text-sm font-medium">Couldn&apos;t load your profile</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {error instanceof Error ? error.message : "PrimeWire could not be reached."}
        </p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => refetch()}>
          Retry
        </Button>
      </section>
    );
  }

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    try {
      await save.mutateAsync({
        action: "update",
        gender: form.gender === NONE ? "" : form.gender,
        birthdayYear: form.birthdayYear === NONE ? "" : form.birthdayYear,
        birthdayMonth: form.birthdayMonth === NONE ? "" : form.birthdayMonth,
        birthdayDay: form.birthdayDay === NONE ? "" : form.birthdayDay,
        countryId: form.countryId === NONE ? "" : form.countryId,
        city: form.city,
        bio: form.bio,
        hobbies: form.hobbies,
        pmMessage: form.pmMessage,
        wallViewAccess: form.wallViewAccess,
        wallPostAccess: form.wallPostAccess,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error("Couldn't save your profile", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <section aria-label="Profile" className="px-5 py-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        PrimeWire profile
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
        These fields appear on your public PrimeWire profile page.
      </p>

      <div className="mt-4 space-y-4">
        <Field label="Gender">
          <SettingsSelect
            value={form.gender}
            onChange={(v) => set("gender", v)}
            items={GENDERS}
            ariaLabel="Gender"
          />
        </Field>

        <Field label="Birthday">
          <div className="grid grid-cols-3 gap-2">
            <SettingsSelect
              value={form.birthdayMonth}
              onChange={(v) => set("birthdayMonth", v)}
              items={MONTHS}
              ariaLabel="Birth month"
              placeholder="Month"
            />
            <SettingsSelect
              value={form.birthdayDay}
              onChange={(v) => set("birthdayDay", v)}
              items={DAYS}
              ariaLabel="Birth day"
              placeholder="Day"
            />
            <SettingsSelect
              value={form.birthdayYear}
              onChange={(v) => set("birthdayYear", v)}
              items={YEARS}
              ariaLabel="Birth year"
              placeholder="Year"
            />
          </div>
        </Field>

        <Field label="Country">
          <SettingsSelect
            value={form.countryId}
            onChange={(v) => set("countryId", v)}
            items={[
              { value: NONE, label: "Prefer not to say" },
              ...((data.settings.countryOptions ?? []).map((c) => ({
                value: c.id,
                label: c.name,
              }))),
            ]}
            ariaLabel="Country"
          />
        </Field>

        <Field label="City">
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            maxLength={120}
            placeholder="e.g. Baku"
            className="h-10 rounded-xl bg-background/60 text-sm"
          />
        </Field>

        <Field label="About me">
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            maxLength={4000}
            rows={4}
            placeholder="Tell the community about yourself…"
            className="rounded-xl bg-background/60 text-sm"
          />
        </Field>

        <Field label="Hobbies">
          <Textarea
            value={form.hobbies}
            onChange={(e) => set("hobbies", e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Movies, hiking, chess…"
            className="rounded-xl bg-background/60 text-sm"
          />
        </Field>

        <Field label="Message above PM box">
          <Textarea
            value={form.pmMessage}
            onChange={(e) => set("pmMessage", e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Shown to members who open a private message to you…"
            className="rounded-xl bg-background/60 text-sm"
          />
        </Field>

        <Field label="Who can see my wall">
          <SettingsSelect
            value={form.wallViewAccess}
            onChange={(v) => set("wallViewAccess", v)}
            items={WALL_ACCESS}
            ariaLabel="Who can see my wall"
          />
        </Field>

        <Field label="Who can post on my wall">
          <SettingsSelect
            value={form.wallPostAccess}
            onChange={(v) => set("wallPostAccess", v)}
            items={WALL_ACCESS}
            ariaLabel="Who can post on my wall"
          />
        </Field>

        <Button
          className="h-11 w-full rounded-xl font-semibold"
          onClick={() => void submit()}
          disabled={save.isPending}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save profile
        </Button>
      </div>
    </section>
  );
}

function SettingsSelect({
  value,
  onChange,
  items,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  items: ReadonlyArray<string | { value: string; label: string }>;
  ariaLabel: string;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-10 w-full rounded-xl bg-background/60 text-sm"
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder ?? "Select…"} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {items.map((item) => {
          const option =
            typeof item === "string" ? { value: item, label: item } : item;
          return (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Appearance section — the theme switcher (40 themes, 4 categories)  */
/* ------------------------------------------------------------------ */

function AppearanceSection() {
  const themeId = useUser((s) => s.themeId);
  const setTheme = useUser((s) => s.setTheme);
  const transparency = useUser((s) => s.transparency);
  const setTransparency = useUser((s) => s.setTransparency);

  // Seasonal suggestion (never forced — surfaced as a one-tap Try it)
  const [seasonal] = useState(() => seasonalSuggestion());
  const seasonalActive = seasonal && themeId === seasonal.theme.id;

  const select = (theme: { id: string }) => {
    // No toast: the entire site re-theming instantly IS the feedback — and
    // it keeps theme switching at CLS ~0 (toast chrome would shift layout).
    setTheme(theme.id);
  };

  return (
    <section aria-label="Appearance" className="px-5 py-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Appearance
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
        Themes change the whole site — palette, typography, backgrounds and
        ambient atmosphere. Your choice is saved to this browser and your
        account.
      </p>

      {/* ---------- Auto (follow system) ---------- */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium text-muted-foreground/70">
          Default
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <AutoCard
            active={themeId === AUTO_THEME_ID}
            onSelect={() => select({ id: AUTO_THEME_ID })}
          />
        </div>
      </div>

      {/* ---------- seasonal suggestion (consent-based) ---------- */}
      {seasonal && !seasonalActive && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">
            <span className="font-semibold">Seasonal pick:</span>{" "}
            {seasonal.theme.name} — {seasonal.note}
          </p>
          <Button
            size="sm"
            className="h-8 shrink-0 rounded-full text-xs"
            onClick={() => select(seasonal.theme)}
          >
            Try it
          </Button>
        </div>
      )}

      {/* ---------- themed categories ---------- */}
      <div className="mt-5 space-y-5">
        {THEME_CATEGORIES.map((category) => {
          const themes = THEMES.filter(
            (t) => t.category === category.id && t.id !== "neutral",
          );
          if (!themes.length) return null;
          return (
            <div key={category.id}>
              <p className="mb-2 text-[11px] font-medium text-muted-foreground/70">
                {category.label}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {themes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    active={themeId === theme.id}
                    onSelect={() => select(theme)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- extra appearance toggles ---------- */}
      <div className="mt-7 space-y-3 border-t border-border/60 pt-5">
        <ToggleRow
          icon={<Layers3 className="size-4" aria-hidden />}
          label="Transparency"
          description="Zen-browser mode — page background becomes see-through so the browser's wallpaper shows through."
          checked={transparency}
          onChange={(v) => setTransparency(v)}
        />
      </div>
    </section>
  );
}

/** "Auto" pseudo-theme card — follows the system light/dark scheme. */
function AutoCard({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label="Theme: Auto — follows your system's light and dark setting"
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary ring-1 ring-primary"
          : "border-border/60 hover:border-foreground/25 hover:bg-muted/40",
      )}
    >
      {active && (
        <span
          className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden
        >
          <Check className="size-3" />
        </span>
      )}
      <span
        className="flex h-9 items-center justify-center rounded-lg text-sm font-bold"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0c 0 50%, #fafafc 50% 100%)",
          color: "transparent",
        }}
        aria-hidden
      >
        <span style={{ color: "#f2f2f2" }}>A</span>
        <span style={{ color: "#1c1c20" }}>a</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">
          Auto
        </span>
        <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
          Follows your system
        </span>
      </span>
    </button>
  );
}

/** One theme entry: live palette preview (dark + light halves), name, description. */
function ThemeCard({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeDefinition;
  active: boolean;
  onSelect: () => void;
}) {
  const d = theme.dark;
  const l = theme.light;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Theme: ${theme.name} — ${theme.description}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary ring-1 ring-primary"
          : "border-border/60 hover:border-foreground/25 hover:bg-muted/40",
      )}
    >
      {active && (
        <span
          className="absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden
        >
          <Check className="size-3" />
        </span>
      )}

      {/* live palette preview: dark scheme (left) + light scheme (right) */}
      <span
        className="relative flex h-9 overflow-hidden rounded-lg"
        aria-hidden
      >
        <span
          className="flex w-1/2 items-center justify-center"
          style={{ background: d.bg, color: d.text }}
        >
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold"
            style={{ background: d.primary, color: d.primaryFg }}
          >
            Aa
          </span>
        </span>
        <span
          className="flex w-1/2 items-center justify-center"
          style={{ background: l.bg, color: l.text }}
        >
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold"
            style={{ background: l.primary, color: l.primaryFg }}
          >
            Aa
          </span>
        </span>
        <span
          className="absolute top-1 right-1.5 size-2 rounded-full"
          style={{ background: d.accent }}
        />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">
          {theme.name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
          {theme.description}
        </span>
      </span>
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
        className="mt-1.5 shrink-0"
      />
    </div>
  );
}
