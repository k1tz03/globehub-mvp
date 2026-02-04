"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";

interface ShareModalProps {
  post: Post;
  onClose: () => void;
}

const platforms = [
  { 
    id: "twitter", 
    name: "X (Twitter)", 
    icon: "𝕏", 
    color: "bg-black text-white",
    getUrl: (text: string, url: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: "f", 
    color: "bg-[#1877F2] text-white",
    getUrl: (text: string, url: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    icon: "in", 
    color: "bg-[#0A66C2] text-white",
    getUrl: (text: string, url: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp", 
    icon: "📱", 
    color: "bg-[#25D366] text-white",
    getUrl: (text: string, url: string) => 
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`
  },
  { 
    id: "telegram", 
    name: "Telegram", 
    icon: "✈️", 
    color: "bg-[#0088cc] text-white",
    getUrl: (text: string, url: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  { 
    id: "email", 
    name: "Email", 
    icon: "✉️", 
    color: "bg-neutral-600 text-white",
    getUrl: (text: string, url: string) => 
      `mailto:?subject=${encodeURIComponent("Découvre ce post sur GlobeHub!")}&body=${encodeURIComponent(text + "\n\n" + url)}`
  },
  { 
    id: "sms", 
    name: "SMS", 
    icon: "💬", 
    color: "bg-emerald-500 text-white",
    getUrl: (text: string, url: string) => 
      `sms:?body=${encodeURIComponent(text + " " + url)}`
  },
];

export function ShareModal({ post, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate post URL (in real app, this would be a real URL)
  const postUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/post/${post.id}` 
    : `https://globehub.app/post/${post.id}`;
  
  const shareText = `${post.text.slice(0, 100)}${post.text.length > 100 ? "..." : ""} - par @${post.handle} sur GlobeHub`;

  const handleShare = (platform: typeof platforms[0]) => {
    const url = platform.getUrl(shareText, postUrl);
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Post GlobeHub",
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">Partager ce post</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Post Preview */}
        <div className="mb-6 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800">
          <p className="text-sm">@{post.handle}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {post.text.slice(0, 120)}{post.text.length > 120 && "..."}
          </p>
        </div>

        {/* Native Share (mobile) */}
        {"share" in navigator && (
          <button
            onClick={handleNativeShare}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 px-4 py-3 text-sm font-medium text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Partager...
          </button>
        )}

        {/* Platforms Grid */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform)}
              className="flex flex-col items-center gap-2"
            >
              <div className={clsx(
                "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-transform hover:scale-110",
                platform.color
              )}>
                {platform.icon}
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{platform.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <input
            type="text"
            value={postUrl}
            readOnly
            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            onClick={handleCopyLink}
            className={clsx(
              "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            )}
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
