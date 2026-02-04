"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import type { GroupMemberOnMap } from "./GlobeMap";
import { GROUP_ROLE_LABELS } from "@/lib/types";

interface GroupMemberPopupProps {
  member: GroupMemberOnMap | null;
  screenPosition: { x: number; y: number } | null;
  onClose: () => void;
  onMessage?: () => void;
  onViewProfile?: () => void;
  currentUserHandle?: string;
  userAvatar?: string;
}

export default function GroupMemberPopup({
  member,
  screenPosition,
  onClose,
  onMessage,
  onViewProfile,
  currentUserHandle,
  userAvatar,
}: GroupMemberPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (member && screenPosition) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [member, screenPosition]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200);
  };

  if (!member || !screenPosition) return null;

  const isSelf = currentUserHandle === member.userHandle;

  // Calculer la position du popup
  const popupWidth = 280;
  const popupHeight = 180;
  const verticalGap = 35;

  let left = screenPosition.x - popupWidth / 2;
  let top = screenPosition.y - popupHeight - verticalGap;
  let popupBelow = false;

  const margin = 16;
  if (typeof window !== "undefined") {
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));
    if (top < margin + 60) {
      top = screenPosition.y + verticalGap;
      popupBelow = true;
    }
  }

  const lineEndX = left + popupWidth / 2;
  const lineEndY = popupBelow ? top : top + popupHeight;

  const roleColors: Record<string, string> = {
    owner: "from-fuchsia-500 to-pink-500",
    admin: "from-amber-500 to-orange-500",
    moderator: "from-sky-500 to-blue-500",
    member: "from-purple-500 to-violet-500",
  };

  const roleBgColors: Record<string, string> = {
    owner: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    moderator: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    member: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };

  return (
    <>
      {/* Ligne de connexion */}
      <svg
        className={clsx(
          "pointer-events-none fixed inset-0 z-40 transition-opacity duration-300",
          isVisible && !isExiting ? "opacity-100" : "opacity-0"
        )}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`member-line-${member.userHandle}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={member.isOnline ? "#10b981" : "#a3a3a3"} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <line
          x1={screenPosition.x}
          y1={screenPosition.y}
          x2={lineEndX}
          y2={lineEndY}
          stroke={`url(#member-line-${member.userHandle})`}
          strokeWidth="2"
          strokeDasharray="8 4"
        />
        {/* Cercle pulsant si en ligne */}
        {member.isOnline && (
          <circle
            cx={screenPosition.x}
            cy={screenPosition.y}
            r="12"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            opacity="0.6"
          >
            <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle
          cx={screenPosition.x}
          cy={screenPosition.y}
          r="8"
          fill={member.isOnline ? "#10b981" : "#a3a3a3"}
          className="drop-shadow-lg"
        />
      </svg>

      {/* Popup */}
      <div
        ref={popupRef}
        className={clsx(
          "pointer-events-auto fixed z-50 will-change-transform",
          isVisible && !isExiting ? "opacity-100" : "opacity-0"
        )}
        style={{
          left: 0,
          top: 0,
          width: `${popupWidth}px`,
          transform: `translate3d(${left}px, ${top}px, 0) ${isVisible && !isExiting ? "scale(1)" : "scale(0.9)"}`,
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
        }}
      >
        {/* Glow */}
        <div
          className={clsx(
            "absolute -inset-2 rounded-2xl blur-xl animate-pulse",
            member.isOnline
              ? "bg-gradient-to-r from-emerald-500/30 via-purple-500/20 to-fuchsia-500/20"
              : "bg-gradient-to-r from-neutral-500/20 to-neutral-400/10"
          )}
        />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50">
          {/* Header gradient */}
          <div
            className={clsx(
              "h-12 bg-gradient-to-r",
              roleColors[member.role] || roleColors.member
            )}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white shadow-lg hover:bg-red-500 transition-colors"
            title="Fermer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Avatar */}
          <div className="relative -mt-8 flex justify-center">
            <div className="relative">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.username}
                  className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg dark:border-neutral-900"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-fuchsia-500 text-xl font-bold text-white shadow-lg dark:border-neutral-900">
                  {(member.username || member.userHandle).charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online indicator */}
              {member.isOnline && (
                <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-3 border-white bg-emerald-500 dark:border-neutral-900" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-4 pt-2 text-center">
            {/* Name & handle */}
            <h3 className="font-bold text-neutral-900 dark:text-white">
              {member.username || member.userHandle}
              {isSelf && <span className="ml-1 text-xs text-neutral-400">(vous)</span>}
            </h3>
            <p className="text-sm text-neutral-500">@{member.userHandle}</p>

            {/* Status & role */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  roleBgColors[member.role] || roleBgColors.member
                )}
              >
                {GROUP_ROLE_LABELS[member.role] || "Membre"}
              </span>
              <span
                className={clsx(
                  "flex items-center gap-1 text-xs",
                  member.isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full",
                    member.isOnline ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                  )}
                />
                {member.isOnline ? "En ligne" : "Hors ligne"}
              </span>
            </div>

            {/* Group name */}
            <p className="mt-2 text-xs text-neutral-400">
              Groupe: <span className="font-medium text-neutral-600 dark:text-neutral-300">{member.groupName}</span>
            </p>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={onViewProfile}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Voir profil
              </button>
              {!isSelf && (
                <button
                  onClick={onMessage}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
