"use client";

import { useState } from "react";
import { clsx } from "clsx";

type ShareMenuProps = {
  postId: string;
  postText: string;
  postUrl?: string;
  onShare?: () => void;
  onClose: () => void;
};

export default function ShareMenu({ postId, postText, postUrl, onShare, onClose }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = postUrl ?? `https://globehub.app/post/${postId}`;
  const shareText = postText.slice(0, 200) + (postText.length > 200 ? "..." : "");

  const platforms = [
    {
      name: "X (Twitter)",
      icon: "𝕏",
      color: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: "f",
      color: "bg-[#1877F2] text-white",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "LinkedIn",
      icon: "in",
      color: "bg-[#0A66C2] text-white",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("GlobeHub")}&summary=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      icon: "💬",
      color: "bg-[#25D366] text-white",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: "✈️",
      color: "bg-[#0088CC] text-white",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Reddit",
      icon: "🔴",
      color: "bg-[#FF4500] text-white",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Email",
      icon: "📧",
      color: "bg-neutral-600 text-white",
      url: `mailto:?subject=${encodeURIComponent("Check this out on GlobeHub")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
    },
    {
      name: "SMS",
      icon: "💬",
      color: "bg-emerald-500 text-white",
      url: `sms:?body=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
  ];

  const handleShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    onShare?.();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GlobeHub",
          text: shareText,
          url: shareUrl,
        });
        onShare?.();
      } catch {
        // User cancelled or error
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl dark:bg-neutral-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold">Partager</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Native Share (mobile) */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 py-3 font-medium text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Partager via...
          </button>
        )}

        {/* Social Platforms */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => handleShare(platform.url)}
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
        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <p className="mb-2 text-sm font-medium">Ou copier le lien</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              onClick={handleCopyLink}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                copied
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50"
                  : "bg-fuchsia-500 text-white hover:bg-fuchsia-600"
              )}
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>

        {/* Post Preview */}
        <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {shareText}
          </p>
        </div>
      </div>
    </div>
  );
}
