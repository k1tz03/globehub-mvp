"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { User } from "@/lib/types";
import { IconX, IconUsers } from "./icons";

export default function ProfileMenu({
  open,
  user,
  onClose,
  onLogout,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:pt-20">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      <div className="relative w-full max-w-xs rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 text-lg font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">{user.username}</div>
              <div className="text-sm text-neutral-500">@{user.handle}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">{user.following.length}</div>
            <div className="text-xs text-neutral-500">Suivis</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">{user.followers.length}</div>
            <div className="text-xs text-neutral-500">Abonnés</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">{user.stats.posts}</div>
            <div className="text-xs text-neutral-500">Posts</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {user.isVerified && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-400">
              ✓ Vérifié
            </span>
          )}
          {user.role === "admin" && (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              Admin
            </span>
          )}
          {user.role === "moderator" && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              Modérateur
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              router.push(`/u/${user.handle}`);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <IconUsers className="h-5 w-5 text-neutral-500" />
            Mon profil
          </button>

          {(user.role === "admin" || user.role === "moderator") && (
            <button
              onClick={() => {
                router.push("/admin");
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Administration
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
