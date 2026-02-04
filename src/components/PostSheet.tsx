"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { Post, User, ReportReason } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { IconHeart, IconMessage, IconShare, IconX, IconSend } from "./icons";
import ShareMenu from "./ShareMenu";
import ReportModal from "./ReportModal";

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export default function PostSheet({
  open,
  post,
  currentUser,
  isFollowing,
  onClose,
  onToggleLike,
  onAddComment,
  onToggleFollow,
  onShare,
  onReport,
}: {
  open: boolean;
  post: Post | null;
  currentUser: User | null;
  isFollowing: boolean;
  onClose: () => void;
  onToggleLike: (postId: string, userHandle: string) => void;
  onAddComment: (postId: string, text: string, authorId: string, author: string, handle: string) => void;
  onToggleFollow: (handle: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string, reason: ReportReason, details?: string) => void;
}) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!open || !post) return null;

  const hasLiked = currentUser ? (post.likedBy || []).includes(currentUser.handle) : false;

  const handleLike = () => {
    if (!currentUser) return;
    onToggleLike(post.id, currentUser.handle);
  };

  const handleComment = () => {
    if (!currentUser || commentText.trim().length < 2) return;
    onAddComment(post.id, commentText, currentUser.id, currentUser.username, currentUser.handle);
    setCommentText("");
  };

  const handleShare = () => {
    setShowShareMenu(true);
    onShare?.(post.id);
  };

  const handleReport = (reason: ReportReason, details?: string) => {
    onReport?.(post.id, reason, details);
    setShowReportModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-base font-bold">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{post.author}</div>
                <div className="text-sm text-neutral-500">@{post.handle} · {timeAgo(post.createdAtISO)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* More menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl bg-white py-2 shadow-xl dark:bg-neutral-800">
                    {currentUser && currentUser.handle !== post.handle && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowReportModal(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        🚨 Signaler
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://globehub.app/post/${post.id}`);
                        setShowMoreMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      🔗 Copier le lien
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <IconX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[15px] leading-relaxed">{post.text}</p>

            {/* Virality score badge */}
            {post.viralityScore > 50 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-xs font-medium text-amber-700 dark:from-amber-950/50 dark:to-orange-950/50 dark:text-amber-400">
                🔥 Viral • Score {post.viralityScore}
              </div>
            )}

            {/* Media */}
            {post.media?.type === "image" && (
              <div className="mt-3 overflow-hidden rounded-xl">
                <img src={post.media.url} alt="" className="w-full" />
              </div>
            )}
            {post.media?.type === "youtube" && (
              <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(post.media.url)}`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <button
                onClick={handleLike}
                disabled={!currentUser}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  hasLiked
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <IconHeart className="h-5 w-5" filled={hasLiked} />
                {formatNumber(post.likes)}
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  showComments
                    ? "bg-sky-100 text-sky-600 dark:bg-sky-950/50"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <IconMessage className="h-5 w-5" />
                {post.comments.length}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <IconShare className="h-5 w-5" />
                {post.shares > 0 && formatNumber(post.shares)}
              </button>
            </div>

            {/* Comments */}
            {showComments && (
              <div className="mt-4 space-y-3">
                {post.comments.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500">Aucun commentaire</p>
                ) : (
                  post.comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{c.author}</span>
                        <span className="text-neutral-500">· {timeAgo(c.createdAtISO)}</span>
                      </div>
                      <p className="mt-1 text-sm">{c.text}</p>
                    </div>
                  ))
                )}

                {currentUser && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    />
                    <button
                      onClick={handleComment}
                      disabled={commentText.trim().length < 2}
                      className="rounded-xl bg-gradient-to-r from-sky-500 to-fuchsia-500 p-2.5 text-white disabled:opacity-50"
                    >
                      <IconSend className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  router.push(`/u/${post.handle}`);
                  onClose();
                }}
                className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
              >
                Voir le profil
              </button>
              {currentUser && currentUser.handle !== post.handle && (
                <button
                  onClick={() => onToggleFollow(post.handle)}
                  className={clsx(
                    "rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                    isFollowing
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700"
                  )}
                >
                  {isFollowing ? "Abonné ✓" : "Suivre"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <ShareMenu
          postId={post.id}
          postText={post.text}
          onShare={() => onShare?.(post.id)}
          onClose={() => setShowShareMenu(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetId={post.id}
          targetType="post"
          targetPreview={post.text.slice(0, 100) + (post.text.length > 100 ? "..." : "")}
          onSubmit={handleReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
