"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "guaurritas-os-sound-enabled-v1";
type SoundType = "open" | "close" | "cart" | "confirm" | "click";

function playOsTone(context: AudioContext, type: SoundType) {
  const now = context.currentTime;
  const notes: Record<SoundType, number[]> = {
    open: [590, 785],
    close: [660, 440],
    cart: [698, 988],
    confirm: [523, 784],
    click: [630],
  };
  const frequencies = notes[type];
  frequencies.forEach((frequency, index) => {
    const start = now + index * 0.065;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.024, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.085);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.09);
  });
}

function classifyClick(target: Element): SoundType | null {
  const control = target.closest<HTMLElement>("button, a, summary");
  if (!control || control.closest("[data-os-sound-toggle]")) return null;
  if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return null;
  if (control.matches(".desktop-shortcut, .desktop-taskbar-start, .shopping-mobile-store, .desktop-os-nav-link")) return "open";
  if (control.matches(".retro-window-control, .shopping-window-control") || /cerrar|minimizar|volver/i.test(control.getAttribute("aria-label") ?? "")) return "close";
  if (/añadir|agregar|añadir al carrito|agregar al carrito/i.test(control.getAttribute("aria-label") ?? "") || /añadir al carrito|agregar al carrito/i.test(control.textContent ?? "")) return "cart";
  return "click";
}

/** Sound enabled on first visit; tones only follow user gestures, never autoplay. */
export default function OsSoundControl() {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const lastPlayed = useRef(0);

  useEffect(() => {
    try {
      // Enabled on first visit, but a previous mute choice takes precedence.
      setEnabled(window.localStorage.getItem(STORAGE_KEY) !== "false");
    } catch {
      // Private-mode restrictions should never prevent the OS from loading.
    }
    setReady(true);
    return () => {
      void audioContext.current?.close().catch(() => {});
      audioContext.current = null;
    };
  }, []);

  const play = (type: SoundType) => {
    try {
      const AudioContextCtor = window.AudioContext;
      if (!AudioContextCtor) return;
      const context = audioContext.current ?? new AudioContextCtor();
      audioContext.current = context;
      if (context.state === "suspended") void context.resume().catch(() => {});
      playOsTone(context, type);
    } catch {
      // Decorative audio must never interfere with shopping.
    }
  };

  useEffect(() => {
    if (!ready || !enabled) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const type = classifyClick(target);
      if (!type) return;
      const timestamp = performance.now();
      if (timestamp - lastPlayed.current < 65) return;
      lastPlayed.current = timestamp;
      play(type);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled, ready]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try { window.localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* optional */ }
    if (next) {
      play("confirm");
    } else if (audioContext.current?.state === "running") {
      // Immediately silence any tone that is still ringing when muting.
      void audioContext.current.suspend().catch(() => {});
    }
  };

  return (
    <button
      type="button"
      data-os-sound-toggle
      data-os-sound-state={enabled ? "on" : "muted"}
      aria-label={enabled ? "Silenciar sonido de Guaurritas OS" : "Activar sonido de Guaurritas OS"}
      aria-pressed={enabled}
      title={enabled ? "Volumen activado · silenciar" : "Sonido silenciado · activar"}
      onClick={toggle}
      className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded border border-transparent px-2 text-[#263650] transition-colors duration-150 hover:border-[#875773] hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#425b8c] active:translate-y-px"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block shrink-0"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {enabled ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        )}
      </svg>
    </button>
  );
}
