import type { CSSProperties } from "react";
import { withBasePath } from "@/lib/base-path";

// Approved 3D artwork, used unchanged as a transparent sprite sheet. Individual
// bounds account for the natural spacing of the illustration rather than
// dividing it into equal cells, which would clip the cart and truck.
const bounds = {
  cart: [48, 62, 280, 278], truck: [340, 107, 301, 225],
  pin: [683, 59, 203, 268], box: [958, 91, 242, 236],
  paw: [50, 380, 276, 242], chat: [362, 389, 256, 237],
  user: [662, 368, 234, 265], notes: [978, 356, 218, 282],
  camera: [47, 695, 268, 206], globe: [364, 662, 250, 253],
  lock: [679, 653, 207, 264], dog: [928, 673, 306, 229],
  cat: [36, 953, 284, 247], calendar: [366, 941, 240, 253],
  ruler: [666, 943, 258, 250], bee: [957, 946, 272, 256],
} as const;

export default function SystemIcon({ name, className = "", style }: {
  name: keyof typeof bounds; className?: string; style?: CSSProperties;
}) {
  const [x, y, width, height] = bounds[name];
  const frame = Math.max(width, height) + 8;
  const left = x + width / 2 - frame / 2;
  const top = y + height / 2 - frame / 2;
  return <span aria-hidden="true" className={`system-icon ${className}`}
    style={{
      display: "inline-block", width: "1.6em", height: "1.6em",
      verticalAlign: "-0.35em", flexShrink: 0,
      backgroundImage: `url("${withBasePath("/icons/interface/guaurritas-emoji-v1.webp")}")`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${1254 / frame * 100}% ${1254 / frame * 100}%`,
      backgroundPosition: `${left / (1254 - frame) * 100}% ${top / (1254 - frame) * 100}%`,
      clipPath: `inset(${Math.max(0, (frame - height) / 2 - 4) / frame * 100}% ${Math.max(0, (frame - width) / 2 - 4) / frame * 100}%)`,
      ...style,
    }} />;
}
