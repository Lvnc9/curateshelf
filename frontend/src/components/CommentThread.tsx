"use client";

import { useEffect, useState } from "react";
import { api, type Comment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

function CommentItem({
  comment,
  slug,
  onRefresh,
}: {
  comment: Comment;
  slug: string;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);

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
    <article className="border-t border-[var(--ink)]/10 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={`/u/${comment.author.username}`} className="text-sm font-medium">
          {comment.author.display_name || comment.author.username}
        </Link>
        <time className="text-xs text-[var(--muted)]">
          {new Date(comment.created_at).toLocaleDateString()}
        </time>
      </div>
      <p className="mt-2 text-[var(--ink)]/90">{comment.body}</p>
      <div className="mt-3 flex gap-4 text-xs uppercase tracking-wider text-[var(--muted)]">
        <button type="button" onClick={toggleLike} className="hover:text-[var(--ink)]">
          {comment.liked_by_me ? "Liked" : "Like"} · {comment.likes_count}
        </button>
        {user && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="hover:text-[var(--ink)]">
            Reply
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={sendReply} className="mt-3 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply"
            className="flex-1 border border-[var(--ink)]/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button type="submit" className="bg-[var(--ink)] px-3 py-2 text-xs text-[var(--paper)]">
            Send
          </button>
        </form>
      )}
      {comment.replies?.length > 0 && (
        <div className="ml-4 mt-2 border-l border-[var(--ink)]/10 pl-4">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} slug={slug} onRefresh={onRefresh} />
          ))}
        </div>
      )}
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
    api.comments(slug, sort).then((data) => {
      if (!cancelled) setComments(data);
    }).catch(() => {
      if (!cancelled) setComments([]);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, sort]);

  async function refresh() {
    const data = await api.comments(slug, sort);
    setComments(data);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    await api.postComment(slug, body.trim());
    setBody("");
    refresh();
  }

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Comments</h2>
        <div className="flex gap-3 text-xs uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setSort("newest")}
            className={sort === "newest" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSort("top")}
            className={sort === "top" ? "text-[var(--ink)]" : "text-[var(--muted)]"}
          >
            Top
          </button>
        </div>
      </div>

      {user ? (
        <form onSubmit={submit} className="mt-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share a note on this piece…"
            className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="mt-3 bg-[var(--ink)] px-5 py-2 text-sm text-[var(--paper)] hover:bg-[var(--accent-deep)]"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <div className="mt-6">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} slug={slug} onRefresh={refresh} />
        ))}
        {!comments.length && <p className="py-8 text-[var(--muted)]">No comments yet.</p>}
      </div>
    </section>
  );
}