/**
 * Guaurritas OS sound design — intentionally opt-in.
 * No audio context is created on load, and no sound is triggered by hydration.
 * We synthesise quiet retro tones instead of fetching third-party audio assets.
 */
export const OS_SOUND_STORAGE_KEY = "guaurritas-os-sounds-enabled-v1";

export type OsSound = "open" | "close" | "cart" | "confirm";

type Note = { from: number; to: number; delay: number; length: number };

const score: Record<OsSound, readonly Note[]> = {
  open: [{ from: 520, to: 780, delay: 0, length: 0.105 }],
  close: [{ from: 690, to: 430, delay: 0, length: 0.11 }],
  cart: [
    { from: 590, to: 660, delay: 0, length: 0.10 },
    { from: 830, to: 990, delay: 0.105, length: 0.115 },
  ],
  confirm: [
    { from: 520, to: 610, delay: 0, length: 0.09 },
    { from: 780, to: 880, delay: 0.09, length: 0.14 },
  ],
};

let fallbackEnabled = false;
let context: AudioContext | null = null;

export function readOsSoundPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OS_SOUND_STORAGE_KEY) === "on";
  } catch {
    return fallbackEnabled;
  }
}

export function saveOsSoundPreference(enabled: boolean): void {
  fallbackEnabled = enabled;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OS_SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Some browsers block storage in third-party frames; this visit still works.
  }
}

export function playOsSound(sound: OsSound): void {
  if (typeof window === "undefined" || !readOsSoundPreference()) return;
  if (!window.AudioContext) return;

  try {
    context ??= new window.AudioContext();
    const audio = context;
    if (audio.state === "suspended") {
      void audio.resume().catch(() => {});
    }
    const origin = audio.currentTime + 0.008;

    for (const note of score[sound]) {
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      const start = origin + note.delay;
      const stop = start + note.length;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.from, start);
      oscillator.frequency.exponentialRampToValueAtTime(note.to, stop);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.034, start + 0.014);
      envelope.gain.exponentialRampToValueAtTime(0.0001, stop);

      oscillator.connect(envelope);
      envelope.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(stop + 0.012);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    }
  } catch {
    // Audio is a progressive enhancement; never block navigation or purchase.
  }
}
