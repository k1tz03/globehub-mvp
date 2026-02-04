"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { TimeCapsule, CapsuleHint, CapsuleRevealMode } from "@/lib/useTimeCapsuleStore";
import { timeAgo } from "@/lib/time";

// === CAPSULE RÉVÉLÉE - Affichage du contenu ===
interface TimeCapsuleRevealedProps {
  capsule: TimeCapsule;
  currentUserHandle?: string;
  onClose: () => void;
  onReact: (reaction: "amazed" | "touched" | "funny") => void;
  onViewProfile: (handle: string) => void;
}

export function TimeCapsuleRevealed({
  capsule,
  currentUserHandle,
  onClose,
  onReact,
  onViewProfile,
}: TimeCapsuleRevealedProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const userReaction = currentUserHandle
    ? (capsule.reactions.amazed.includes(currentUserHandle) ? "amazed" :
       capsule.reactions.touched.includes(currentUserHandle) ? "touched" :
       capsule.reactions.funny.includes(currentUserHandle) ? "funny" : null)
    : null;

  const isFirstDiscoverer = capsule.firstDiscoverer === currentUserHandle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop avec effet spécial */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Animation d'ouverture */}
      {showAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-60">
          <div className="relative">
            {/* Particules */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute h-3 w-3 rounded-full bg-amber-400"
                style={{
                  animation: `capsuleParticle 2s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 30}deg) translateY(-20px)`,
                }}
              />
            ))}
            {/* Icône centrale */}
            <span className="text-6xl animate-bounce">💊</span>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className={clsx(
        "relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 dark:bg-neutral-900",
        showAnimation ? "scale-90 opacity-0" : "scale-100 opacity-100"
      )}>
        {/* Header spécial */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6">
          {/* Effet scintillant */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-12 animate-shimmer" />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badge premier découvreur */}
          {isFirstDiscoverer && (
            <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <span>🏆</span> Premier découvreur !
            </div>
          )}

          <div className="relative text-center">
            <span className="text-5xl">💊</span>
            <h2 className="mt-2 text-xl font-bold text-white">Time Capsule</h2>
            <p className="text-white/80 text-sm">
              Enterrée {timeAgo(capsule.createdAt)}
            </p>
          </div>
        </div>

        {/* Auteur */}
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
          <button
            onClick={() => onViewProfile(capsule.creatorHandle)}
            className="flex items-center gap-3"
          >
            {capsule.creatorAvatar ? (
              <img src={capsule.creatorAvatar} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold">
                {capsule.creatorUsername.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold">{capsule.creatorUsername}</p>
              <p className="text-xs text-neutral-500">@{capsule.creatorHandle}</p>
            </div>
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-lg leading-relaxed text-neutral-800 dark:text-neutral-200">
            "{capsule.text}"
          </p>

          {capsule.mediaUrl && (
            <img
              src={capsule.mediaUrl}
              alt=""
              className="mt-4 rounded-xl w-full"
            />
          )}

          {/* Lieu */}
          {capsule.locationName && (
            <p className="mt-4 flex items-center gap-1 text-sm text-neutral-500">
              <span>📍</span> {capsule.locationName}
            </p>
          )}
        </div>

        {/* Réactions */}
        <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-500 mb-3">Comment te sens-tu ?</p>
          <div className="flex gap-2">
            {([
              { key: "amazed", emoji: "🤯", label: "Bluffé" },
              { key: "touched", emoji: "🥹", label: "Touché" },
              { key: "funny", emoji: "😂", label: "Amusé" },
            ] as const).map(({ key, emoji, label }) => (
              <button
                key={key}
                onClick={() => onReact(key)}
                className={clsx(
                  "flex-1 rounded-xl py-3 text-center transition-all",
                  userReaction === key
                    ? "bg-amber-100 ring-2 ring-amber-500 dark:bg-amber-900/30"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
                )}
              >
                <span className="text-2xl">{emoji}</span>
                <p className="text-xs mt-1 text-neutral-600 dark:text-neutral-400">{label}</p>
                <p className="text-xs font-bold text-neutral-500">
                  {capsule.reactions[key].length}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Découvreurs */}
        {capsule.discoveredBy.length > 1 && (
          <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-500">
              Aussi découvert par {capsule.discoveredBy.length - 1} autre{capsule.discoveredBy.length > 2 ? "s" : ""} personne{capsule.discoveredBy.length > 2 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes capsuleParticle {
          0% {
            transform: rotate(var(--rotation)) translateY(-20px) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-100px) scale(0);
            opacity: 0;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(12deg);
          }
          100% {
            transform: translateX(200%) rotate(12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// === CRÉATION DE CAPSULE ===
interface CreateTimeCapsuleProps {
  open: boolean;
  location: { lat: number; lon: number };
  locationName?: string;
  onClose: () => void;
  onCreate: (data: {
    text: string;
    mediaUrl?: string;
    revealMode: CapsuleRevealMode;
    revealDate?: string;
    revealCrowdSize?: number;
  }) => void;
}

export function CreateTimeCapsule({
  open,
  location,
  locationName,
  onClose,
  onCreate,
}: CreateTimeCapsuleProps) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [revealMode, setRevealMode] = useState<CapsuleRevealMode>("proximity");
  const [revealDate, setRevealDate] = useState("");
  const [crowdSize, setCrowdSize] = useState(5);

  if (!open) return null;

  const handleCreate = () => {
    if (text.trim().length < 10) return;

    onCreate({
      text: text.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      revealMode,
      revealDate: revealMode === "date" ? new Date(revealDate).toISOString() : undefined,
      revealCrowdSize: revealMode === "crowd" ? crowdSize : undefined,
    });

    // Reset
    setText("");
    setMediaUrl("");
    setRevealMode("proximity");
    setRevealDate("");
    setCrowdSize(5);
    onClose();
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-neutral-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💊</span>
              <div className="text-white">
                <h2 className="font-bold">Créer une Time Capsule</h2>
                <p className="text-xs text-white/80">Un message pour le futur</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full bg-black/20 p-2 text-white hover:bg-black/40">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Location */}
          <div className="flex items-center gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
            <span>📍</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {locationName || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
            </span>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-neutral-500">Ton message</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écris un message que quelqu'un découvrira..."
              className="mt-1 h-24 w-full resize-none rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-amber-400 dark:border-neutral-700 dark:bg-neutral-800"
              maxLength={500}
            />
            <p className="text-right text-xs text-neutral-400">{text.length}/500</p>
          </div>

          {/* Media URL */}
          <div>
            <label className="text-xs font-medium text-neutral-500">Image (optionnel)</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="URL d'une image..."
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-amber-400 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {/* Reveal mode */}
          <div>
            <label className="text-xs font-medium text-neutral-500">Quand révéler ?</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                { key: "proximity", emoji: "👣", label: "Passage" },
                { key: "date", emoji: "📅", label: "Date" },
                { key: "crowd", emoji: "👥", label: "Foule" },
              ] as const).map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setRevealMode(key)}
                  className={clsx(
                    "rounded-xl py-3 text-center transition-all",
                    revealMode === key
                      ? "bg-amber-100 ring-2 ring-amber-500 dark:bg-amber-900/30"
                      : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
                  )}
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-xs mt-1">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific options */}
          {revealMode === "proximity" && (
            <p className="text-xs text-neutral-500 bg-amber-50 p-3 rounded-xl dark:bg-amber-900/20">
              👣 La capsule sera révélée quand quelqu'un passera à moins de 200m de cet endroit
            </p>
          )}

          {revealMode === "date" && (
            <div>
              <label className="text-xs font-medium text-neutral-500">Date de révélation</label>
              <input
                type="date"
                value={revealDate}
                onChange={(e) => setRevealDate(e.target.value)}
                min={minDateStr}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-amber-400 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          )}

          {revealMode === "crowd" && (
            <div>
              <label className="text-xs font-medium text-neutral-500">
                Nombre de personnes requises : {crowdSize}
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={crowdSize}
                onChange={(e) => setCrowdSize(parseInt(e.target.value))}
                className="mt-2 w-full accent-amber-500"
              />
              <p className="text-xs text-neutral-400 mt-1">
                La capsule s'ouvrira quand {crowdSize} personnes seront présentes
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={text.trim().length < 10 || (revealMode === "date" && !revealDate)}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
          >
            💊 Enterrer la capsule
          </button>
        </div>
      </div>
    </div>
  );
}

// === INDICE DE CAPSULE PROCHE ===
interface CapsuleHintIndicatorProps {
  hints: CapsuleHint[];
  onClick: () => void;
}

export function CapsuleHintIndicator({ hints, onClick }: CapsuleHintIndicatorProps) {
  if (hints.length === 0) return null;

  const closestHint = hints.find(h => h.distance === "proche")
    || hints.find(h => h.distance === "moyen")
    || hints[0];

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-white shadow-lg animate-bounce"
    >
      <span className="text-xl">💊</span>
      <div className="text-left">
        <p className="text-xs font-bold">{hints.length} capsule{hints.length > 1 ? "s" : ""} proche{hints.length > 1 ? "s" : ""}</p>
        <p className="text-[10px] text-white/80">
          {closestHint.emoji} {closestHint.distance === "proche" ? "Très proche !" : closestHint.distance === "moyen" ? "À proximité" : "Dans la zone"}
        </p>
      </div>
    </button>
  );
}

// === MARQUEUR DE CAPSULE SUR LA CARTE ===
export function CapsuleMapMarker({
  status,
  onClick,
}: {
  status: "buried" | "revealed";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
        status === "buried"
          ? "bg-amber-500 animate-pulse"
          : "bg-gradient-to-br from-amber-400 to-orange-500"
      )}
    >
      <span className="text-lg">💊</span>
    </button>
  );
}
