"use client";

import { IconPlus } from "./icons";

export default function FloatingComposeButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-44 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 text-white shadow-xl shadow-fuchsia-500/30 transition-all hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:hover:scale-100 sm:h-16 sm:w-16"
      title="Nouveau post"
    >
      <IconPlus className="h-7 w-7 sm:h-8 sm:w-8" />
    </button>
  );
}
