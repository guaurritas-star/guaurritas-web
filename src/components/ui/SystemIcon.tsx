import type { CSSProperties } from "react";

const paths = {
  cart: "M2 3h3l2 12h12l3-9H6M9 19h1v1H9zM17 19h1v1h-1z",
  truck: "M2 5h12v12H2zM14 9h4l4 4v4h-8M6 17v4h4v-4M16 17v4h4v-4",
  pin: "M6 3h12v10l-6 8-6-8zM10 7h4v4h-4z",
  box: "M3 7l9-4 9 4v13H3zM3 7h18M12 7v13M9 3v4h6V3",
  paw: "M8 12h8l4 5v4H4v-4zM2 7h4v4H2zM7 2h4v5H7zM13 2h4v5h-4zM18 7h4v4h-4z",
  chat: "M3 4h18v13H9l-6 4zM7 8h10M7 12h7",
  user: "M8 2h8v8H8zM4 21v-6l4-3h8l4 3v6z",
  notes: "M5 3h14v18H5zM9 2h6v4H9zM8 10h8M8 14h8M8 18h5",
  camera: "M3 7h4l2-3h6l2 3h4v13H3zM9 10h6v6H9z",
  globe: "M6 3h12l3 5v8l-3 5H6l-3-5V8zM3 8h18M3 16h18M10 3L8 8v8l2 5M14 3l2 5v8l-2 5",
  lock: "M4 10h16v11H4zM7 10V3h10v7M12 14v3",
  dog: "M7 7l-5-4v10h5M17 7l5-4v10h-5M7 6h10v13l-5 3-5-3zM9 10v2M15 10v2M10 16h4l-2 2z",
  cat: "M4 4l6 3h4l6-3v13l-8 5-8-5zM8 11v2M16 11v2M10 16h4M1 15h5M18 15h5",
  calendar: "M3 5h18v16H3zM7 2v6M17 2v6M3 10h18M7 14h3M14 14h3M7 18h3",
  ruler: "M3 7h18v10H3zM7 7v5M11 7v3M15 7v5M19 7v3",
  bee: "M8 10h8v10H8zM8 13h8M8 17h8M8 10H3V4h5l4 6 4-6h5v6h-5M10 10V7M14 10V7",
} as const;

/** Small angular symbols inherit each control's color; no font or image request. */
export default function SystemIcon({ name, className, style }: {
  name: keyof typeof paths; className?: string; style?: CSSProperties;
}) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1em" height="1em"
    className={className} fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="square" strokeLinejoin="miter"
    style={{ display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0, ...style }}>
    <path d={paths[name]} />
  </svg>;
}
