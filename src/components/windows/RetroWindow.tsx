"use client";

import type { ReactNode } from "react";

type RetroWindowProps = {
  title: string;
  icon?: string;
  children: ReactNode;
  onClose: () => void;
};

export default function RetroWindow({
  title,
  icon,
  children,
  onClose,
}: RetroWindowProps) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="retro-window-title"
      className="absolute inset-4 bottom-[68px] z-20 flex flex-col border-2 border-[#425b8c] bg-white shadow-[8px_8px_0_#425b8c] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100vh-96px)] sm:w-[calc(100%-48px)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
    >
      <header className="flex shrink-0 items-center justify-between border-b-2 border-[#425b8c] bg-[#dce4f2] px-3 py-2">
        <p
          id="retro-window-title"
          className="truncate font-mono text-sm font-bold"
        >
          {icon && <span aria-hidden="true">{icon} </span>}
          {title}.exe
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label={`Cerrar ${title}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-white font-mono font-bold hover:bg-[#425b8c] hover:text-white"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>
    </section>
  );
}