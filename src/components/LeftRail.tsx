"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import type { FeedMode, ProjectionMode, CategoryFilter, Group } from "@/lib/types";
import {
  IconGlobe,
  IconMap,
  IconMoon,
  IconSun,
  IconSpark,
  IconTrendUp,
  IconPin,
  IconUsers,
  IconStar,
  IconLayers,
  IconX,
} from "./icons";

const modes: { key: FeedMode; icon: (p: { className?: string }) => React.ReactElement; label: string; color: string; bgActive: string }[] = [
  { key: "all", icon: IconSpark, label: "Tout", color: "text-neutral-600 dark:text-neutral-300", bgActive: "bg-neutral-200 dark:bg-neutral-700" },
  { key: "trending", icon: IconTrendUp, label: "Tendances", color: "text-fuchsia-500", bgActive: "bg-fuchsia-100 dark:bg-fuchsia-900/40" },
  { key: "nearby", icon: IconPin, label: "Proximité", color: "text-sky-500", bgActive: "bg-sky-100 dark:bg-sky-900/40" },
  { key: "following", icon: IconUsers, label: "Suivis", color: "text-emerald-500", bgActive: "bg-emerald-100 dark:bg-emerald-900/40" },
  { key: "sponsored", icon: IconStar, label: "Promus", color: "text-amber-500", bgActive: "bg-amber-100 dark:bg-amber-900/40" },
];

const categories: { key: CategoryFilter; label: string; emoji: string; color: string; bgActive: string }[] = [
  { key: "all", label: "Tous", emoji: "🌍", color: "text-neutral-600", bgActive: "bg-neutral-200 dark:bg-neutral-700" },
  { key: "vibe", label: "Vibes", emoji: "✨", color: "text-fuchsia-500", bgActive: "bg-fuchsia-100 dark:bg-fuchsia-900/40" },
  { key: "news", label: "Infos", emoji: "📰", color: "text-sky-500", bgActive: "bg-sky-100 dark:bg-sky-900/40" },
  { key: "event", label: "Events", emoji: "🎉", color: "text-amber-500", bgActive: "bg-amber-100 dark:bg-amber-900/40" },
  { key: "alert", label: "Alertes", emoji: "🚨", color: "text-rose-500", bgActive: "bg-rose-100 dark:bg-rose-900/40" },
];

export default function LeftRail({
  mode,
  setMode,
  categoryFilter,
  setCategoryFilter,
  projection,
  setProjection,
  onOpenLayers,
  followsOnly,
  setFollowsOnly,
  userGroups,
  selectedGroupId,
  onSelectGroup,
}: {
  mode: FeedMode;
  setMode: (m: FeedMode) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (c: CategoryFilter) => void;
  projection: ProjectionMode;
  setProjection: (p: ProjectionMode) => void;
  onOpenLayers: () => void;
  followsOnly: boolean;
  setFollowsOnly: (v: boolean) => void;
  userGroups?: Group[];
  selectedGroupId?: string | null;
  onSelectGroup?: (group: Group | null) => void;
}) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";
  const [expanded, setExpanded] = useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(true);

  return (
    <>
      {/* Bouton menu mobile */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="fixed left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow-lg backdrop-blur-xl transition-all hover:bg-white dark:bg-neutral-900/95 dark:hover:bg-neutral-800 sm:hidden"
      >
        {expanded ? (
          <IconX className="h-5 w-5" />
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h12" />
          </svg>
        )}
      </button>

      {/* Panel principal */}
      <div className={clsx(
        "fixed left-3 top-16 z-30 w-44 transition-all duration-300 sm:top-3 sm:w-48",
        expanded ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 sm:translate-x-0 sm:opacity-100"
      )}>
        <div className="flex flex-col gap-3">
          
          {/* Section: Filtres de flux */}
          <div className="rounded-2xl bg-white/95 shadow-lg backdrop-blur-xl dark:bg-neutral-900/95 overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Filtrer par</span>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {modes.map((m) => {
                const Icon = m.icon;
                const active = mode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      setMode(m.key);
                      setExpanded(false);
                    }}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all",
                      active
                        ? `${m.bgActive} ${m.color}`
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    )}
                  >
                    <Icon className={clsx("h-4 w-4 shrink-0", active ? m.color : "text-neutral-400")} />
                    <span>{m.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Catégories */}
          <div className="rounded-2xl bg-white/95 shadow-lg backdrop-blur-xl dark:bg-neutral-900/95 overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Catégories</span>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {categories.map((c) => {
                const active = categoryFilter === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setCategoryFilter(c.key);
                      setExpanded(false);
                    }}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all",
                      active
                        ? `${c.bgActive} ${c.color}`
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    )}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Options */}
          <div className="rounded-2xl bg-white/95 shadow-lg backdrop-blur-xl dark:bg-neutral-900/95 overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Options</span>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {/* Toggle suivis uniquement */}
              <button
                onClick={() => setFollowsOnly(!followsOnly)}
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all",
                  followsOnly
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
              >
                <IconUsers className={clsx("h-4 w-4 shrink-0", followsOnly ? "text-emerald-500" : "text-neutral-400")} />
                <span>Suivis seuls</span>
                <div className={clsx(
                  "ml-auto h-5 w-9 rounded-full transition-colors",
                  followsOnly ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"
                )}>
                  <div className={clsx(
                    "h-5 w-5 rounded-full bg-white shadow transition-transform",
                    followsOnly ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
              </button>

              {/* Globe/Carte */}
              <button
                onClick={() => setProjection(projection === "globe" ? "flat" : "globe")}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {projection === "globe" ? (
                  <>
                    <IconGlobe className="h-4 w-4 shrink-0 text-sky-500" />
                    <span>Vue Globe</span>
                    <span className="ml-auto text-xs text-neutral-400">→ Carte</span>
                  </>
                ) : (
                  <>
                    <IconMap className="h-4 w-4 shrink-0 text-fuchsia-500" />
                    <span>Vue Carte</span>
                    <span className="ml-auto text-xs text-neutral-400">→ Globe</span>
                  </>
                )}
              </button>

              {/* Couches */}
              <button
                onClick={() => {
                  onOpenLayers();
                  setExpanded(false);
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <IconLayers className="h-4 w-4 shrink-0 text-purple-500" />
                <span>Couches</span>
                <svg className="ml-auto h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Thème */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {isDark ? (
                  <>
                    <IconSun className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Mode clair</span>
                  </>
                ) : (
                  <>
                    <IconMoon className="h-4 w-4 shrink-0 text-indigo-500" />
                    <span>Mode sombre</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: Mes Groupes */}
          {userGroups && userGroups.length > 0 && (
            <div className="rounded-2xl bg-white/95 shadow-lg backdrop-blur-xl dark:bg-neutral-900/95 overflow-hidden">
              <button
                onClick={() => setGroupsExpanded(!groupsExpanded)}
                className="flex w-full items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Mes Groupes</span>
                <svg
                  className={clsx("h-3 w-3 text-neutral-400 transition-transform", groupsExpanded && "rotate-180")}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {groupsExpanded && (
                <div className="p-1.5 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {/* Bouton pour désélectionner */}
                  {selectedGroupId && (
                    <button
                      onClick={() => {
                        onSelectGroup?.(null);
                        setExpanded(false);
                      }}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all dark:hover:bg-rose-950/30"
                    >
                      <IconX className="h-4 w-4 shrink-0" />
                      <span>Masquer le groupe</span>
                    </button>
                  )}

                  {userGroups.map((group) => {
                    const isSelected = selectedGroupId === group.id;
                    const onlineCount = group.members.filter(m => m.isOnline && m.shareLocation).length;
                    const membersWithLocation = group.members.filter(m => m.shareLocation && m.lat && m.lon).length;

                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          if (isSelected) {
                            onSelectGroup?.(null);
                          } else {
                            onSelectGroup?.(group);
                          }
                          setExpanded(false);
                        }}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all",
                          isSelected
                            ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        )}
                      >
                        {/* Icône/Avatar du groupe */}
                        <div className="relative flex-shrink-0">
                          {group.avatar ? (
                            <img src={group.avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
                          ) : (
                            <div className={clsx(
                              "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                              isSelected
                                ? "bg-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-800 dark:text-fuchsia-200"
                                : "bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 text-fuchsia-600 dark:text-fuchsia-400"
                            )}>
                              {group.name.charAt(0)}
                            </div>
                          )}
                          {/* Indicateur membres en ligne */}
                          {onlineCount > 0 && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm">{group.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {membersWithLocation > 0 ? (
                              <>
                                <span className="text-emerald-500">{onlineCount}</span>/{membersWithLocation} sur carte
                              </>
                            ) : (
                              "Aucun membre visible"
                            )}
                          </p>
                        </div>

                        {/* Indicateur sélection */}
                        {isSelected && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
                        )}
                      </button>
                    );
                  })}

                  {/* Lien vers tous les groupes */}
                  <button
                    onClick={() => {
                      router.push("/groups");
                      setExpanded(false);
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-400 hover:bg-neutral-100 transition-all dark:hover:bg-neutral-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span>Voir tous les groupes</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay mobile */}
      {expanded && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setExpanded(false)}
        />
      )}
    </>
  );
}
