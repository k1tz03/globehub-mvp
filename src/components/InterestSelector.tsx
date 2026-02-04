"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { INTEREST_LABELS, type InterestCategory } from "@/lib/types";

interface InterestSelectorProps {
  selectedInterests: InterestCategory[];
  onSelect: (interests: InterestCategory[]) => void;
  maxSelection?: number;
  minSelection?: number;
}

export function InterestSelector({ 
  selectedInterests, 
  onSelect, 
  maxSelection = 5,
  minSelection = 3 
}: InterestSelectorProps) {
  const allInterests = Object.keys(INTEREST_LABELS) as InterestCategory[];
  
  const toggleInterest = (interest: InterestCategory) => {
    if (selectedInterests.includes(interest)) {
      onSelect(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxSelection) {
      onSelect([...selectedInterests, interest]);
    }
  };
  
  const isValid = selectedInterests.length >= minSelection && selectedInterests.length <= maxSelection;
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Sélectionnez {minSelection} à {maxSelection} centres d&apos;intérêt
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {selectedInterests.length}/{maxSelection} sélectionnés
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div 
          className={clsx(
            "h-full rounded-full transition-all duration-300",
            selectedInterests.length >= minSelection 
              ? "bg-gradient-to-r from-fuchsia-500 to-amber-500" 
              : "bg-neutral-400"
          )}
          style={{ width: `${(selectedInterests.length / maxSelection) * 100}%` }}
        />
      </div>
      
      {/* Grid des intérêts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          const isDisabled = !isSelected && selectedInterests.length >= maxSelection;
          
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              disabled={isDisabled}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isSelected
                  ? "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30 scale-105"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="text-base">{INTEREST_LABELS[interest].split(" ")[0]}</span>
              <span className="truncate">{INTEREST_LABELS[interest].split(" ")[1]}</span>
              
              {isSelected && (
                <svg className="ml-auto h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Message de validation */}
      {!isValid && selectedInterests.length > 0 && (
        <p className="text-center text-xs text-amber-500">
          Encore {minSelection - selectedInterests.length} à sélectionner
        </p>
      )}
    </div>
  );
}

// Version compacte pour les paramètres
interface CompactInterestSelectorProps {
  selectedInterests: InterestCategory[];
  onSelect: (interests: InterestCategory[]) => void;
  maxSelection?: number;
}

export function CompactInterestSelector({ 
  selectedInterests, 
  onSelect, 
  maxSelection = 5 
}: CompactInterestSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const allInterests = Object.keys(INTEREST_LABELS) as InterestCategory[];
  
  const toggleInterest = (interest: InterestCategory) => {
    if (selectedInterests.includes(interest)) {
      onSelect(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxSelection) {
      onSelect([...selectedInterests, interest]);
    }
  };
  
  return (
    <div className="space-y-3">
      {/* Intérêts sélectionnés */}
      <div className="flex flex-wrap gap-2">
        {selectedInterests.map((interest) => (
          <span
            key={interest}
            className="flex items-center gap-1 rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-medium text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-400"
          >
            {INTEREST_LABELS[interest]}
            <button
              onClick={() => toggleInterest(interest)}
              className="ml-1 hover:text-fuchsia-900"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        
        {selectedInterests.length < maxSelection && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-full border-2 border-dashed border-neutral-300 px-3 py-1 text-sm text-neutral-500 hover:border-fuchsia-400 hover:text-fuchsia-500 dark:border-neutral-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        )}
      </div>
      
      {/* Sélecteur étendu */}
      {isExpanded && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {selectedInterests.length}/{maxSelection} sélectionnés
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-fuchsia-500 hover:underline"
            >
              Fermer
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allInterests
              .filter(i => !selectedInterests.includes(i))
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => {
                    toggleInterest(interest);
                    if (selectedInterests.length >= maxSelection - 1) {
                      setIsExpanded(false);
                    }
                  }}
                  disabled={selectedInterests.length >= maxSelection}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-700 shadow-sm hover:bg-fuchsia-50 hover:text-fuchsia-600 disabled:opacity-40 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  {INTEREST_LABELS[interest]}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
