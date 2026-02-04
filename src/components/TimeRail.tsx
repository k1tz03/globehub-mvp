"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { TimeRange } from "@/lib/types";
import { IconClock } from "./icons";

const ranges: { key: TimeRange; label: string; shortLabel: string }[] = [
  { key: "live", label: "En direct", shortLabel: "Live" },
  { key: "1h", label: "Dernière heure", shortLabel: "1h" },
  { key: "24h", label: "Dernières 24h", shortLabel: "24h" },
  { key: "7d", label: "Cette semaine", shortLabel: "7j" },
];

export default function TimeRail({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentRange = ranges.find((r) => r.key === value) ?? ranges[2];

  return (
    <div className="fixed bottom-4 right-3 z-20">
      {/* Bouton principal */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-xl transition-all",
          value === "live"
            ? "bg-rose-500 text-white"
            : "bg-white/90 text-neutral-700 hover:bg-white dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
        )}
      >
        <IconClock className="h-4 w-4" />
        <span>{currentRange.shortLabel}</span>
        {value === "live" && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        )}
      </button>

      {/* Menu déroulant */}
      {expanded && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setExpanded(false)}
          />
          <div className="absolute bottom-full right-0 z-20 mb-2 w-40 overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  onChange(r.key);
                  setExpanded(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                  value === r.key
                    ? "bg-neutral-100 font-medium dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    r.key === "live" ? "bg-rose-500" : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
