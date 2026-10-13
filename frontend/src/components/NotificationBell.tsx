"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, timeAgo, type NotificationItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { BellIcon } from "./ui/Icons";

const POLL_MS = 60_000;

/**
 * Nav bell for reply and digest notifications (GET /notifications/).
 * Polls every minute while the tab is visible and on open; clicking an item marks it read.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    api.notifications().then(setItems).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [user, load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const unread = items.filter((n) => !n.is_read).length;

  async function markRead(ids?: number[]) {
    const before = items;
    setItems((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, is_read: true } : n)));
    try {
      await api.markNotificationsRead(ids);
    } catch {
      setItems(before);
      toast.error("Couldn't update notifications", { description: "Please try again in a moment." });
    }
  }

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative grid size-9 place-items-center rounded-full opacity-80 hover:opacity-100"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <BellIcon className="size-[1.15rem]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-clay px-1 text-[0.6rem] font-normal leading-4 tabular-nums text-night">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <p className="font-display text-xl font-light">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markRead()}
              className="text-eyebrow uppercase text-muted hover:text-ink"
            >
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center font-display-italic text-lg text-muted">
            All quiet. Replies to your notes land here.
          </p>
        ) : (
          <ul className="max-h-[min(26rem,70vh)] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="border-b border-hairline last:border-0">
                <NotificationRow item={n} onOpen={() => (n.is_read ? undefined : markRead([n.id]))} close={() => setOpen(false)} />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ item, onOpen, close }: { item: NotificationItem; onOpen: () => void; close: () => void }) {
  const dot = !item.is_read && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-clay" aria-label="Unread" />;
  const when = (
    <time dateTime={item.created_at} className="text-xs text-muted">
      {timeAgo(item.created_at)}
    </time>
  );

  if (item.type === "comment_reply") {
    const p = item.payload;
    return (
      <Link
        href={`/p/${p.product_slug}#comments-heading`}
        onClick={() => {
          onOpen();
          close();
        }}
        className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-paper-deep"
      >
        {dot || <span className="w-1.5 shrink-0" />}
        <span className="min-w-0">
          <span className="block text-sm">
            <span className="font-normal">@{p.from_username}</span> replied on{" "}
            <span className="font-display italic">{p.product_title}</span>
          </span>
          <span className="mt-1 block truncate text-sm text-ink-soft">&ldquo;{p.body_preview}&rdquo;</span>
          {when}
        </span>
      </Link>
    );
  }

  if (item.type === "digest") {
    return (
      <div className="flex gap-3 px-4 py-3.5">
        {dot || <span className="w-1.5 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm">This week&rsquo;s editorial picks</p>
          <ul className="mt-1.5 space-y-1">
            {item.payload.products.map((pr) => (
              <li key={pr.slug}>
                <Link
                  href={`/p/${pr.slug}`}
                  onClick={() => {
                    onOpen();
                    close();
                  }}
                  className="font-display text-[0.95rem] italic text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                >
                  {pr.title}
                </Link>
              </li>
            ))}
          </ul>
          {when}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-3.5 text-sm">
      {dot || <span className="w-1.5 shrink-0" />}
      <span>
        A new piece was published. {when}
      </span>
    </div>
  );
}
