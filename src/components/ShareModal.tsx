"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
};

type SharePlatform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  getUrl: (text: string, url: string) => string;
};

const SHARE_PLATFORMS: SharePlatform[] = [
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: "𝕏",
    color: "bg-black text-white",
    getUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    color: "bg-[#1877F2] text-white",
    getUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "in",
    color: "bg-[#0A66C2] text-white",
    getUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "📱",
    color: "bg-[#25D366] text-white",
    getUrl: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    color: "bg-[#0088CC] text-white",
    getUrl: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "email",
    name: "Email",
    icon: "✉️",
    color: "bg-neutral-600 text-white",
    getUrl: (text, url) => `mailto:?subject=${encodeURIComponent("Découvre ce post sur GlobeHub")}&body=${encodeURIComponent(text + "\n\n" + url)}`,
  },
];

export function ShareModal({ isOpen, onClose, post }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const postUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/post/${post.id}` 
    : `https://globehub.app/post/${post.id}`;
  
  const shareText = `${post.text.slice(0, 100)}${post.text.length > 100 ? "..." : ""} via @${post.handle} sur GlobeHub`;

  const handleShare = (platform: SharePlatform) => {
    const url = platform.getUrl(shareText, postUrl);
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = postUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Post sur GlobeHub",
          text: shareText,
          url: postUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-bold">Partager</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{post.author}</span>
              <span className="text-neutral-500">@{post.handle}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {post.text.slice(0, 100)}{post.text.length > 100 && "..."}
            </p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="p-4">
          {/* Native share (mobile) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 py-3 font-medium text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Partager...
            </button>
          )}

          {/* Platform buttons */}
          <div className="grid grid-cols-3 gap-3">
            {SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-xl p-3 transition-transform hover:scale-105",
                  platform.color
                )}
              >
                <span className="text-xl">{platform.icon}</span>
                <span className="text-xs">{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Copy link */}
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700">
              <input
                type="text"
                value={postUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={clsx(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  copied
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                )}
              >
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
