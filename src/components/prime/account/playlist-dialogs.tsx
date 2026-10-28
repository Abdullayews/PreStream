"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAccountMutation } from "../hooks/use-account";

export interface PlaylistDraftTarget {
  id: number;
  title: string;
  description: string | null;
  private: boolean;
}

/**
 * Create / edit a PrimeWire playlist — title, description, private flag
 * and comment settings (POST /api/account/playlists actions create|edit).
 */
export function PlaylistFormDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null → create mode; otherwise the playlist being edited. */
  target: PlaylistDraftTarget | null;
}) {
  const editing = !!target;
  const [title, setTitle] = useState(target?.title ?? "");
  const [description, setDescription] = useState(target?.description ?? "");
  const [isPrivate, setPrivate] = useState(target?.private ?? false);
  const [allowComments, setAllowComments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const save = useAccountMutation<{ ok: boolean }>("playlists", {
    invalidates: [["account", "playlists"]],
  });

  // remount (key=playlist id) whenever the dialog targets a different
  // playlist so the seeded state resets — no effects needed

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give your playlist a title.");
      return;
    }
    setError(null);
    try {
      await save.mutateAsync({
        action: editing ? "edit" : "create",
        ...(editing ? { id: target.id } : {}),
        title: trimmed,
        description: description.trim(),
        private: isPrivate,
        allowComments,
      });
      toast.success(editing ? "Playlist updated" : "Playlist created", {
        description: trimmed,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit playlist" : "New playlist"}</DialogTitle>
          <DialogDescription className="sr-only">
            {editing
              ? "Update your PrimeWire playlist."
              : "Create a PrimeWire playlist you can add titles to."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="playlist-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              id="playlist-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              maxLength={120}
              placeholder="e.g. Cozy autumn picks"
              autoFocus
              aria-invalid={!!error}
              className={cn(
                "h-11 rounded-xl bg-background/60 text-sm",
                error && "border-destructive focus-visible:ring-destructive/40",
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="playlist-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description <span className="normal-case">(optional)</span>
            </Label>
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What belongs in this list?"
              className="rounded-xl bg-background/60 text-sm"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Private</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Only you can see it on PrimeWire
              </span>
            </span>
            <Checkbox
              checked={isPrivate}
              onCheckedChange={(v) => setPrivate(v === true)}
              aria-label="Make playlist private"
              className="size-5"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Allow comments</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Let other members comment on this playlist
              </span>
            </span>
            <Checkbox
              checked={allowComments}
              onCheckedChange={(v) => setAllowComments(v === true)}
              aria-label="Allow comments on the playlist"
              className="size-5"
            />
          </label>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-11 rounded-xl font-semibold"
            onClick={() => void submit()}
            disabled={save.isPending || !title.trim()}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {editing ? "Save changes" : "Create playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Delete-a-playlist button with confirmation. Optionally navigates away
 * after deleting (used on the playlist detail page).
 */
export function DeletePlaylistButton({
  playlist,
  redirectTo,
  className,
  label,
}: {
  playlist: { id: number; title: string };
  /** Called after a successful delete. */
  redirectTo?: () => void;
  className?: string;
  /** When set, renders a labeled button instead of the icon-only one. */
  label?: string;
}) {
  const qc = useQueryClient();
  const del = useAccountMutation<{ ok: boolean }>("playlists", {
    invalidates: [["account", "playlists"]],
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={label ? "outline" : "ghost"}
          size={label ? "sm" : "icon"}
          aria-label={`Delete playlist ${playlist.title}`}
          title="Delete playlist"
          disabled={del.isPending}
          className={cn(
            label
              ? "rounded-full text-xs hover:text-destructive"
              : "size-11 rounded-full text-muted-foreground hover:text-destructive",
            className,
          )}
        >
          {del.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <Trash2 className="size-4" aria-hidden />
              {label}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{playlist.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The playlist and its items are removed from PrimeWire. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() =>
              del.mutate(
                { action: "delete", id: playlist.id },
                {
                  onSuccess: () => {
                    toast.success("Playlist deleted", { description: playlist.title });
                    // drop the public detail cache too
                    void qc.invalidateQueries({ queryKey: ["primewire", "playlist"] });
                    redirectTo?.();
                  },
                  onError: (err) =>
                    toast.error("Couldn't delete the playlist", {
                      description: err.message,
                    }),
                },
              )
            }
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
