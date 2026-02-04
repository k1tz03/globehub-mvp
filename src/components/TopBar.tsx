"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { User } from "@/lib/types";
import { IconEye, IconUsers } from "./icons";

function formatOnline(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TopBar({
  online,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenFeed,
}: {
  online: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFeed: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed right-2 top-2 z-30 flex items-center gap-2 sm:right-3 sm:top-3">
      {/* Compteur online - minimaliste */}
      <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur-xl dark:bg-neutral-900/90">
        <div className="relative">
          <IconEye className="h-4 w-4 text-emerald-500" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          </span>
        </div>
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {formatOnline(online)}
        </span>
      </div>

      {/* Bouton Groupes */}
      <button
        onClick={() => router.push("/groups")}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-800"
        title="Groupes"
      >
        <svg className="h-5 w-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>

      {/* Bouton Flux */}
      <button
        onClick={onOpenFeed}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-800"
        title="Voir le flux"
      >
        <svg className="h-5 w-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Bouton Connexion / Profil */}
      {currentUser ? (
        <button
          onClick={onOpenProfile}
          className="flex h-10 items-center gap-2 rounded-xl bg-white/90 px-3 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 text-xs font-bold text-white">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-neutral-700 sm:block dark:text-neutral-200">
            {currentUser.username}
          </span>
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 px-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
        >
          <IconUsers className="h-4 w-4" />
          <span className="hidden sm:block">Connexion</span>
        </button>
      )}
    </div>
  );
}
