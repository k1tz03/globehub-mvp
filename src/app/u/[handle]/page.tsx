"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { usePostsStore } from "@/lib/usePostsStore";
import { useGroupsStore } from "@/lib/useGroupsStore";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/lib/types";
import { IconHeart, IconMessage, IconImage, IconVideo } from "@/components/icons";

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

export default function ProfilePage({ params }: { params: { handle: string } }) {
  const router = useRouter();
  const handle = decodeURIComponent(params.handle ?? "");
  
  const { currentUser, getUserByHandle, toggleFollow, isFollowing, ready: authReady } = useAuthStore();
  const { posts, toggleLike, ready: postsReady } = usePostsStore(currentUser?.handle);
  const { groups, ready: groupsReady } = useGroupsStore(currentUser?.handle);

  const profileUser = useMemo(() => getUserByHandle(handle), [getUserByHandle, handle]);
  
  const userPosts = useMemo(() => 
    posts
      .filter((p) => p.handle === handle)
      .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()), 
    [posts, handle]
  );

  // Groupes publics de l'utilisateur
  const userPublicGroups = useMemo(() => 
    groups.filter(g => 
      g.visibility === "public" && 
      g.members.some(m => m.userHandle === handle)
    ),
    [groups, handle]
  );

  const totalLikes = useMemo(() => userPosts.reduce((sum, p) => sum + p.likes, 0), [userPosts]);
  const following = isFollowing(handle);
  const isOwnProfile = currentUser?.handle === handle;

  if (!authReady || !postsReady || !groupsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold">{profileUser?.username ?? handle}</h1>
            <p className="text-xs text-neutral-500">{userPosts.length} posts</p>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="mx-auto max-w-2xl">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 sm:h-40" />

        {/* Avatar & Info */}
        <div className="relative px-4 pb-4">
          <div className="flex justify-between">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-sky-500/30 via-fuchsia-500/30 to-amber-500/30 text-3xl font-bold dark:border-neutral-900">
              {(profileUser?.username ?? handle).charAt(0).toUpperCase()}
            </div>

            {!isOwnProfile && currentUser && (
              <button
                onClick={() => toggleFollow(handle)}
                className={clsx(
                  "mt-3 rounded-full px-5 py-2 text-sm font-semibold transition-all",
                  following
                    ? "bg-neutral-100 text-neutral-900 hover:bg-rose-100 hover:text-rose-600 dark:bg-neutral-800 dark:text-white"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                )}
              >
                {following ? "Abonné" : "Suivre"}
              </button>
            )}
          </div>

          <div className="mt-3">
            <h2 className="text-xl font-bold">
              {profileUser?.username ?? handle}
              {profileUser?.isVerified && <span className="ml-1 text-sky-500">✓</span>}
            </h2>
            <p className="text-neutral-500">@{handle}</p>
          </div>

          {profileUser?.bio && (
            <p className="mt-3 text-sm">{profileUser.bio}</p>
          )}

          {profileUser?.location && (
            <p className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {profileUser.location}
            </p>
          )}

          {/* Stats */}
          <div className="mt-4 flex gap-5">
            <div>
              <span className="font-bold">{profileUser?.following.length ?? 0}</span>
              <span className="ml-1 text-neutral-500">abonnements</span>
            </div>
            <div>
              <span className="font-bold">{profileUser?.followers.length ?? 0}</span>
              <span className="ml-1 text-neutral-500">abonnés</span>
            </div>
            <div>
              <span className="font-bold text-rose-500">{formatNumber(totalLikes)}</span>
              <span className="ml-1 text-neutral-500">likes</span>
            </div>
          </div>

          {/* Groupes publics */}
          {userPublicGroups.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-500 mb-2">👥 Groupes</p>
              <div className="flex flex-wrap gap-2">
                {userPublicGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="flex items-center gap-2 rounded-xl bg-fuchsia-50 px-3 py-1.5 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950/50"
                  >
                    <span>{group.name}</span>
                    <span className="text-xs text-fuchsia-400">• {group.memberCount}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          {userPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl">🌍</div>
              <p className="mt-3 text-neutral-500">Aucun post</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {userPosts.map((p) => {
                const hasLiked = currentUser ? (p.likedBy || []).includes(currentUser.handle) : false;

                return (
                  <div key={p.id} className="bg-white p-4 transition-colors hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/50">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                        {p.author.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.author}</span>
                          <span className="text-neutral-500">@{p.handle}</span>
                          <span className="text-neutral-400">· {timeAgo(p.createdAtISO)}</span>
                        </div>

                        <p className="mt-1">{p.text}</p>

                        {/* Media */}
                        {p.media?.type === "image" && (
                          <div className="mt-3 overflow-hidden rounded-xl">
                            <img src={p.media.url} alt="" className="w-full" />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-6">
                          <button
                            onClick={() => currentUser && toggleLike(p.id, currentUser.handle)}
                            disabled={!currentUser}
                            className={clsx(
                              "flex items-center gap-2 text-sm",
                              hasLiked ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
                            )}
                          >
                            <IconHeart className="h-5 w-5" filled={hasLiked} />
                            {formatNumber(p.likes)}
                          </button>
                          <span className="flex items-center gap-2 text-sm text-neutral-500">
                            <IconMessage className="h-5 w-5" />
                            {p.comments.length}
                          </span>
                          <span className={clsx("h-2 w-2 rounded-full", categoryDots[p.category])} />
                        </div>
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
