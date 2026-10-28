"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useAccountMessages, useAccountMutation, type AccountParams } from "../hooks/use-account";
import { TabEmpty, TabError, TabLoading } from "./account-states";

/** DM inbox + new-message dialog (PrimeWire private messages). */
export function MessagesTab() {
  const messages = useAccountMessages();
  const [composeOpen, setComposeOpen] = useState(false);

  if (messages.isLoading && !messages.data) {
    return <TabLoading rows={5} />;
  }
  if (messages.isError) {
    return (
      <TabError
        message={messages.error.message}
        onRetry={() => void messages.refetch()}
        icon={Mail}
      />
    );
  }
  const threads = messages.data?.threads ?? [];
  if (threads.length === 0) {
    return (
      <>
        <TabEmpty
          icon={Mail}
          title="No messages yet"
          description="Private conversations with other PrimeWire members will appear here. Open a profile on PrimeWire to send the first message."
          action={{ label: "Write a message", onClick: () => setComposeOpen(true) }}
        />
        <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
      </>
    );
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex justify-end">
        <Button className="rounded-full" onClick={() => setComposeOpen(true)}>
          <Send className="size-4" aria-hidden />
          New message
        </Button>
      </div>
      {threads.map((t) => (
        <a
          key={t.id}
          href={t.withUser ? `/?view=user&name=${encodeURIComponent(t.withUser)}` : "#"}
          className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-sm font-bold">
            {(t.withUser ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate font-semibold">{t.withUser}</span>
              {t.unread && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  New
                </span>
              )}
            </span>
            {t.lastBody && (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {t.lastBody}
              </span>
            )}
          </span>
        </a>
      ))}
      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const send = useAccountMutation<{ ok: boolean }>("messages");
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    const recipient = to.trim();
    const text = body.trim();
    if (!recipient || !text) {
      toast.error("Recipient and message are required");
      return;
    }
    send.mutate(
      { toName: recipient, body: text },
      {
        onSuccess: () => {
          toast.success(`Message sent to ${recipient}`);
          setTo("");
          setBody("");
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error("Couldn't send the message", { description: err.message }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Send a private PrimeWire message to any username.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="dm-to">To (username)</Label>
            <Input
              id="dm-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="e.g. Alien"
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dm-body">Message</Label>
            <Textarea
              id="dm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={5}
              maxLength={8000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="rounded-full"
            onClick={submit}
            disabled={send.isPending}
          >
            {send.isPending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* re-export so the type is considered used (mirrors other tabs) */
export type { AccountParams };
