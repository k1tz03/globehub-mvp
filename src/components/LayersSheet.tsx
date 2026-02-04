"use client";

import { clsx } from "clsx";
import type { LayerToggles } from "@/lib/types";

function Toggle({
  label,
  desc,
  value,
  onChange,
  dotClass,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  dotClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        "w-full rounded-3xl border border-white/40 bg-white/70 p-3 text-left shadow-soft backdrop-blur transition dark:border-neutral-800 dark:bg-neutral-950/60",
        value ? "ring-2 ring-fuchsia-500/20 dark:ring-sky-400/15" : "hover:bg-white/90 dark:hover:bg-neutral-950/80"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("h-2.5 w-2.5 rounded-full", dotClass, value ? "opacity-100" : "opacity-60")} />
            <div className="truncate text-sm font-semibold">{label}</div>
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{desc}</div>
        </div>
        <div
          className={clsx(
            "h-7 w-12 rounded-full border p-1 transition",
            value ? "border-fuchsia-400/50 bg-fuchsia-500/15 dark:border-sky-400/50 dark:bg-sky-400/15" : "border-neutral-300/60 bg-white dark:border-neutral-700 dark:bg-neutral-900"
          )}
        >
          <div
            className={clsx(
              "h-5 w-5 rounded-full transition",
              value ? "translate-x-5 bg-neutral-900 dark:bg-white" : "translate-x-0 bg-neutral-400 dark:bg-neutral-600"
            )}
          />
        </div>
      </div>
    </button>
  );
}

export default function LayersSheet({
  open,
  toggles,
  onClose,
  onChange,
}: {
  open: boolean;
  toggles: LayerToggles;
  onClose: () => void;
  onChange: (next: LayerToggles) => void;
}) {
  return (
    <div className={clsx("fixed inset-0 z-30 transition", open ? "opacity-100" : "pointer-events-none opacity-0")}>
      <div className="absolute inset-0 bg-black/25 dark:bg-black/45" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl rounded-t-3xl bg-white p-3 shadow-soft dark:bg-neutral-900 sm:bottom-auto sm:top-3 sm:right-3 sm:left-auto sm:h-auto sm:w-[360px] sm:rounded-3xl">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-semibold">Couches</div>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
            Fermer
          </button>
        </div>

        <div className="mt-2 space-y-2">
          <Toggle
            label="Pulse (signature)"
            desc="Ondes animées autour des bulles (effet GlobeHub)."
            value={toggles.pulse}
            onChange={(v) => onChange({ ...toggles, pulse: v })}
            dotClass="bg-fuchsia-400"
          />
          <Toggle
            label="Heatmap"
            desc="Carte de chaleur (densité de posts)."
            value={toggles.heat}
            onChange={(v) => onChange({ ...toggles, heat: v })}
            dotClass="bg-amber-400"
          />
          <Toggle
            label="Trails"
            desc="Traces récentes (chemins des auteurs)."
            value={toggles.trails}
            onChange={(v) => onChange({ ...toggles, trails: v })}
            dotClass="bg-sky-400"
          />
        </div>

        <div className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
          MVP visuel · prochaines étapes = vrais signaux + anti-spam + modération
        </div>
      </div>
    </div>
  );
}
