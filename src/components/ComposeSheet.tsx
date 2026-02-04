"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import type { Post, PostCategory, GeoMode, User, Media } from "@/lib/types";
import { obfuscateApproximate, obfuscatePrecise } from "@/lib/geo";
import { useEngagementBoostStore, type PrePublishPrediction } from "@/lib/useEngagementBoostStore";
import { IconX, IconLink, IconLocation } from "./icons";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const categories: { key: PostCategory; label: string; emoji: string }[] = [
  { key: "vibe", label: "Vibe", emoji: "✨" },
  { key: "news", label: "Info", emoji: "📰" },
  { key: "event", label: "Event", emoji: "🎉" },
  { key: "alert", label: "Alerte", emoji: "⚠️" },
];

function detectMedia(url: string): Media | null {
  if (!url.trim()) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return { type: "youtube", url };
  if (/\.(jpg|jpeg|png|gif|webp)/i.test(url)) return { type: "image", url };
  if (url.includes("unsplash.com") || url.includes("imgur.com")) return { type: "image", url };
  return null;
}

export default function ComposeSheet({
  open,
  currentUser,
  mapCenter,
  onClose,
  onCreate,
}: {
  open: boolean;
  currentUser: User | null;
  mapCenter: { lon: number; lat: number };
  onClose: () => void;
  onCreate: (p: Post) => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory>("vibe");
  const [geoMode, setGeoMode] = useState<GeoMode>("approximate");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [showPrediction, setShowPrediction] = useState(true);

  const { predictPrePublish } = useEngagementBoostStore();

  const canSend = text.trim().length >= 3 && currentUser;
  const media = useMemo(() => detectMedia(mediaUrl), [mediaUrl]);

  // Prédiction de viralité en temps réel
  const prediction = useMemo((): PrePublishPrediction => {
    return predictPrePublish({
      text,
      category,
      hasMedia: !!media,
      geoMode,
      location: mapCenter,
    });
  }, [text, category, media, geoMode, mapCenter, predictPrePublish]);

  const handlePublish = () => {
    if (!canSend || !currentUser) return;

    let lon: number | undefined;
    let lat: number | undefined;

    if (geoMode === "approximate") {
      const p = obfuscateApproximate(mapCenter);
      lon = p.lon;
      lat = p.lat;
    } else if (geoMode === "precise") {
      const p = obfuscatePrecise(mapCenter);
      lon = p.lon;
      lat = p.lat;
    }

    const post: Post = {
      id: `p_${uid()}`,
      authorId: currentUser.id,
      author: currentUser.username,
      handle: currentUser.handle,
      text: text.trim(),
      createdAtISO: new Date().toISOString(),
      kind: "normal",
      category,
      signal: geoMode === "precise" ? "strong" : geoMode === "approximate" ? "weak" : "none",
      geoMode,
      status: "active",
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      views: 0,
      viralityScore: 0,
      engagementRate: 0,
      peakViewsPerMinute: 0,
      viewsHistory: [],
      media: media ?? undefined,
      lon,
      lat,
    };

    onCreate(post);
    setText("");
    setCategory("vibe");
    setGeoMode("approximate");
    setMediaUrl("");
    setShowMedia(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">Nouveau post</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!currentUser ? (
            <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Connecte-toi pour publier sur GlobeHub
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Qu'est-ce qui se passe autour de toi ?"
                className="h-28 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-[15px] outline-none focus:border-fuchsia-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:focus:bg-neutral-900"
              />

              {/* Media input */}
              {showMedia && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Lien YouTube, image..."
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  {media && <span className="text-emerald-500">✓</span>}
                </div>
              )}

              {/* Categories */}
              <div className="mt-4 flex gap-2">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={clsx(
                      "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
                      category === c.key
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    )}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>

              {/* Location */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-1 text-xs font-medium text-neutral-500">
                  <IconLocation className="h-3.5 w-3.5" />
                  Géolocalisation
                </div>
                <div className="flex gap-2">
                  {([
                    { key: "none", label: "Aucune" },
                    { key: "approximate", label: "~20km" },
                    { key: "precise", label: "~2km" },
                  ] as { key: GeoMode; label: string }[]).map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setGeoMode(g.key)}
                      className={clsx(
                        "flex-1 rounded-xl py-2 text-sm font-medium transition-all",
                        geoMode === g.key
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                          : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Virality Prediction */}
              {text.length >= 3 && showPrediction && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {prediction.label === "viral" && "🚀"}
                        {prediction.label === "excellent" && "🔥"}
                        {prediction.label === "bon" && "✨"}
                        {prediction.label === "moyen" && "👍"}
                        {prediction.label === "faible" && "💡"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          Potentiel viral : <span className={clsx(
                            prediction.score >= 85 ? "text-fuchsia-500" :
                            prediction.score >= 70 ? "text-amber-500" :
                            prediction.score >= 55 ? "text-emerald-500" :
                            prediction.score >= 40 ? "text-sky-500" :
                            "text-neutral-500"
                          )}>{prediction.score}%</span>
                        </p>
                        <p className="text-xs text-neutral-500 capitalize">{prediction.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPrediction(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs"
                    >
                      Masquer
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 mb-3 overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        prediction.score >= 85 ? "bg-gradient-to-r from-fuchsia-500 to-pink-500" :
                        prediction.score >= 70 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                        prediction.score >= 55 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                        prediction.score >= 40 ? "bg-gradient-to-r from-sky-500 to-blue-500" :
                        "bg-neutral-400"
                      )}
                      style={{ width: `${prediction.score}%` }}
                    />
                  </div>

                  {/* Factors grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {Object.entries(prediction.factors).map(([key, factor]) => (
                      <div
                        key={key}
                        className={clsx(
                          "rounded-lg px-2 py-1.5 text-center",
                          factor.score >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30" :
                          factor.score >= 60 ? "bg-amber-100 dark:bg-amber-900/30" :
                          "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <p className={clsx(
                          "text-xs font-bold",
                          factor.score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                          factor.score >= 60 ? "text-amber-600 dark:text-amber-400" :
                          "text-neutral-500"
                        )}>
                          {factor.score >= 80 ? "✓" : factor.score >= 60 ? "○" : "–"} {factor.score}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {key === "timing" && "Timing"}
                          {key === "content" && "Contenu"}
                          {key === "media" && "Média"}
                          {key === "location" && "Position"}
                          {key === "hashtags" && "Hashtags"}
                          {key === "category" && "Catégorie"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  {prediction.tips.length > 0 && (
                    <div className="space-y-1">
                      {prediction.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-neutral-600 dark:text-neutral-400">
                          {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMedia(!showMedia)}
                    className={clsx(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
                      showMedia ? "bg-fuchsia-100 text-fuchsia-700" : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
                    )}
                  >
                    <IconLink className="h-4 w-4" />
                    Média
                  </button>

                  {!showPrediction && text.length >= 3 && (
                    <button
                      onClick={() => setShowPrediction(true)}
                      className="flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                    >
                      <span>🎯</span>
                      <span className={clsx(
                        "font-bold",
                        prediction.score >= 70 ? "text-emerald-500" : "text-neutral-500"
                      )}>
                        {prediction.score}%
                      </span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handlePublish}
                  disabled={!canSend}
                  className="rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  Publier
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
