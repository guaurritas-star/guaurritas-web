"use client";

import { useEffect, useState } from "react";
import { playOsSound, readOsSoundPreference, saveOsSoundPreference } from "@/lib/os-sounds";

export default function OsSoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readOsSoundPreference());
  }, []);

  const toggle = () => {
    const next = !enabled;
    saveOsSoundPreference(next);
    setEnabled(next);
    if (next) playOsSound("open");
  };

  return (
    <button
      type="button"
      className={`desktop-sound-toggle ${enabled ? "is-on" : "is-off"}`}
      onClick={toggle}
      aria-label={enabled ? "Silenciar sonidos de Guaurritas OS" : "Activar sonidos de Guaurritas OS"}
      aria-pressed={enabled}
      title={enabled ? "Sonido activado · Silenciar" : "Sin sonido · Activar"}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        {enabled ? (
          <>
            <path d="M16 9a4.5 4.5 0 0 1 0 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        )}
      </svg>
      <span className="desktop-sound-label">{enabled ? "Sonido" : "Silencio"}</span>
    </button>
  );
}
