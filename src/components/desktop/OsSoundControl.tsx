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

/** Opt-in sound layer: no autoplay, no files fetched and no checkout data touched. */
export default function OsSoundControl() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const lastPlayed = useRef(0);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(STORAGE_KEY) === "true");
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
    if (next) play("confirm");
  };

  return (
    <button
      type="button"
      data-os-sound-toggle
      aria-label={enabled ? "Desactivar sonidos de Guaurritas OS" : "Activar sonidos de Guaurritas OS"}
      aria-pressed={enabled}
      title={enabled ? "Sonidos activados · clic para silenciar" : "Sonidos desactivados · clic para activar"}
      onClick={toggle}
      className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded border border-transparent px-2 text-[17px] text-white transition-colors duration-150 hover:border-white/50 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
    >
      <span aria-hidden="true">{enabled ? "♫" : "♪"}</span>
    </button>
  );
}
