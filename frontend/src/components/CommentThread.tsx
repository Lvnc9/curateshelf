"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Comment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Eyebrow } from "./ui/primitives";
import { HeartIcon } from "./ui/Icons";

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

function Monogram({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper-deep font-display text-base text-ink-soft" aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CommentItem({
  comment,
  slug,
  onRefresh,
  depth = 0,
}: {
  comment: Comment;
  slug: string;
  onRefresh: () => void;
  depth?: number;
}) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  const name = comment.author.display_name || comment.author.username;

  async function toggleLike() {
    if (!user) return;
    if (comment.liked_by_me) await api.unlikeComment(comment.id);
    else await api.likeComment(comment.id);
    onRefresh();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    await api.postComment(slug, reply.trim(), comment.id);
    setReply("");
    setOpen(false);
    onRefresh();
  }

  return (
    <article className={depth ? "pt-5" : "border-b border-hairline py-6"}>
      <div className="flex gap-4">
        <Monogram name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <Link href={`/u/${comment.author.username}`} className="text-sm font-normal hover:underline">
              {name}
            </Link>
            <time dateTime={comment.created_at} className="text-xs text-muted">
              {dateFmt.format(new Date(comment.created_at))}
            </time>
          </div>
          <p className="mt-1.5 leading-relaxed text-ink-soft">{comment.body}</p>
          <div className="mt-3 flex gap-5 text-eyebrow uppercase text-muted">
            <button
              type="button"
              onClick={toggleLike}
              disabled={!user}
              aria-pressed={comment.liked_by_me}
              className="inline-flex items-center gap-1.5 uppercase hover:text-ink disabled:hover:text-muted"
            >
              <HeartIcon className={`size-3.5 ${comment.liked_by_me ? "text-clay" : ""}`} filled={comment.liked_by_me} />
              {comment.likes_count}
            </button>
            {user && depth < 2 && (
              <button type="button" onClick={() => setOpen((v) => !v)} className="uppercase hover:text-ink" aria-expanded={open}>
                Reply
              </button>
            )}
          </div>
          {open && (
            <form onSubmit={sendReply} className="mt-4 flex items-end gap-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Reply to ${name}`}
                aria-label={`Reply to ${name}`}
                autoFocus
                className="flex-1 border-0 border-b border-ink/25 bg-transparent py-2 text-sm outline-none focus:border-ink"
              />
              <Button type="submit" variant="ghost" className="!px-4 !py-2">
                Send
              </Button>
            </form>
          )}
          {comment.replies?.length > 0 && (
            <div className="mt-2 border-l border-hairline pl-5">
              {comment.replies.map((r) => (
                <CommentItem key={r.id} comment={r} slug={slug} onRefresh={onRefresh} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function CommentThread({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [sort, setSort] = useState<"newest" | "top">("newest");

  useEffect(() => {
    let cancelled = false;
    api
      .comments(slug, sort)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, sort]);

  async function refresh() {
    setComments(await api.comments(slug, sort));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    await api.postComment(slug, body.trim());
    setBody("");
    refresh();
  }

  return (
    <section className="mt-16" aria-labelledby="comments-heading">
      <div className="flex items-end justify-between border-b border-hairline pb-4">
        <div>
          <Eyebrow>Notes from readers</Eyebrow>
          <h2 id="comments-heading" className="mt-2 text-3xl">
            Conversation <span className="text-muted">({comments.length})</span>
          </h2>
        </div>
        <div className="flex gap-4 text-eyebrow uppercase" role="tablist" aria-label="Sort comments">
          {(["newest", "top"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={sort === k}
              onClick={() => setSort(k)}
              className={`pb-1 uppercase transition-colors ${sort === k ? "border-b border-ink text-ink" : "text-muted hover:text-ink"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {user ? (
        <form onSubmit={submit} className="mt-6 flex gap-4">
          <Monogram name={user.display_name || user.username} />
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              aria-label="Add a note"
              placeholder="Share a note on this piece…"
              className="block w-full resize-y border-0 border-b border-ink/25 bg-transparent py-2 leading-relaxed outline-none placeholder:text-muted/70 focus:border-ink"
            />
            <Button type="submit" variant="ghost" className="mt-4" disabled={!body.trim()}>
              Post note
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="border-b border-ink/40 text-ink">
            Sign in
          </Link>{" "}
          to leave a note.
        </p>
      )}

      <div className="mt-2">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} slug={slug} onRefresh={refresh} />
        ))}
        {!comments.length && <p className="py-10 text-center font-display-italic text-xl text-muted">No notes yet. Be the first.</p>}
      </div>
    </section>
  );
}
