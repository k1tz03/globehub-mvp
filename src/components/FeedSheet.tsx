"use client";

import { clsx } from "clsx";
import type { Post, User } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { IconHeart, IconMessage, IconX, IconImage, IconVideo } from "./icons";

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const categoryDots: Record<string, string> = {
  vibe: "bg-fuchsia-400",
  news: "bg-sky-400",
  event: "bg-amber-400",
  alert: "bg-rose-400",
};

export default function FeedSheet({
  open,
  posts,
  currentUser,
  onClose,
  onPick,
  onFocus,
  onToggleLike,
}: {
  open: boolean;
  posts: Post[];
  currentUser: User | null;
  onClose: () => void;
  onPick: (id: string) => void;
  onFocus: (p: Post) => void;
  onToggleLike: (postId: string, userHandle: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-start sm:justify-end sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:mt-14 sm:max-h-[calc(100vh-80px)] sm:max-w-sm sm:rounded-3xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold">Flux</h2>
            <p className="text-xs text-neutral-500">{posts.length} posts</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Posts */}
        <div className="flex-1 overflow-y-auto">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl">🌍</div>
              <p className="mt-3 text-sm text-neutral-500">Aucun post</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {posts.slice(0, 50).map((p) => {
                const hasGeo = typeof p.lon === "number" && typeof p.lat === "number";
                const hasLiked = currentUser ? (p.likedBy || []).includes(currentUser.handle) : false;

                return (
                  <div key={p.id} className="p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    {/* Header */}
                    <button
                      onClick={() => {
                        if (hasGeo) onFocus(p);
                        onPick(p.id);
                        onClose();
                      }}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                        {p.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.author}</span>
                          <span className="text-sm text-neutral-500">@{p.handle}</span>
                          <span className="text-xs text-neutral-400">· {timeAgo(p.createdAtISO)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm">{p.text}</p>
                      </div>
                    </button>

                    {/* Tags & Actions */}
                    <div className="mt-3 flex items-center justify-between pl-13">
                      <div className="flex items-center gap-2">
                        <span className={clsx("h-2 w-2 rounded-full", categoryDots[p.category])} />
                        {p.kind === "promoted" && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50">
                            Sponsorisé
                          </span>
                        )}
                        {p.media && (
                          <span className="text-neutral-400">
                            {p.media.type === "image" ? <IconImage className="h-3.5 w-3.5" /> : <IconVideo className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser) onToggleLike(p.id, currentUser.handle);
                          }}
                          disabled={!currentUser}
                          className={clsx(
                            "flex items-center gap-1 text-sm",
                            hasLiked ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
                          )}
                        >
                          <IconHeart className="h-4 w-4" filled={hasLiked} />
                          {formatNumber(p.likes)}
                        </button>
                        <span className="flex items-center gap-1 text-sm text-neutral-500">
                          <IconMessage className="h-4 w-4" />
                          {p.comments.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
