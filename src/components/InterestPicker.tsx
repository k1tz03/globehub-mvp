"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { INTEREST_CATEGORIES, type InterestCategory } from "@/lib/useRecommendationStore";

interface InterestPickerProps {
  selected: InterestCategory[];
  onChange: (interests: InterestCategory[]) => void;
  minSelection?: number;
  maxSelection?: number;
}

export function InterestPicker({ 
  selected, 
  onChange, 
  minSelection = 3, 
  maxSelection = 5 
}: InterestPickerProps) {
  const toggleInterest = (id: InterestCategory) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else if (selected.length < maxSelection) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Choisis {minSelection} à {maxSelection} centres d&apos;intérêt
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {selected.length}/{maxSelection} sélectionnés
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div 
          className={clsx(
            "h-full rounded-full transition-all duration-300",
            selected.length >= minSelection 
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
              : "bg-gradient-to-r from-fuchsia-400 to-fuchsia-500"
          )}
          style={{ width: `${(selected.length / maxSelection) * 100}%` }}
        />
      </div>

      {/* Grille des intérêts */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {INTEREST_CATEGORIES.map(category => {
          const isSelected = selected.includes(category.id);
          const isDisabled = !isSelected && selected.length >= maxSelection;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleInterest(category.id)}
              disabled={isDisabled}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl p-3 transition-all",
                isSelected 
                  ? "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-lg scale-105" 
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="text-2xl">{category.emoji}</span>
              <span className="text-xs font-medium">{category.label}</span>
              {isSelected && (
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {selected.length < minSelection && selected.length > 0 && (
        <p className="text-center text-sm text-amber-500">
          Encore {minSelection - selected.length} à choisir !
        </p>
      )}
    </div>
  );
}

// Modal complet pour la configuration des intérêts
interface InterestModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (interests: InterestCategory[]) => void;
  initialInterests?: InterestCategory[];
}

export function InterestModal({ open, onClose, onSave, initialInterests = [] }: InterestModalProps) {
  const [selected, setSelected] = useState<InterestCategory[]>(initialInterests);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-bold">Personnalise ton expérience</h2>
          <p className="mt-1 text-sm text-neutral-500">
            On te montrera du contenu qui te correspond !
          </p>
        </div>

        <InterestPicker 
          selected={selected}
          onChange={setSelected}
          minSelection={3}
          maxSelection={5}
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
          >
            Plus tard
          </button>
          <button
            onClick={() => {
              if (selected.length >= 3) {
                onSave(selected);
                onClose();
              }
            }}
            disabled={selected.length < 3}
            className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
          >
            C&apos;est parti ! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
