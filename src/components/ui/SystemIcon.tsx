import type { CSSProperties, ReactNode } from "react";

// Original 24px sprites: cream highlights and Guaurritas blue/pink.
const ink = "#24345c", blue = "#425BBC", light = "#aebff3", pink = "#D9A6B9", cream = "#fff5de";
const icons = {
  cart: <><path fill={ink} d="M1 3h5v3h17v3h-2v7H8v-3H6V8H4V5H1zM8 18h5v5H8zM17 18h5v5h-5z"/><path fill={pink} d="M8 8h11v6H9v-3H8z"/><path fill={cream} d="M9 8h2v5H9zM14 8h2v5h-2zM9 19h2v2H9zM18 19h2v2h-2z"/></>,
  truck: <><path fill={ink} d="M1 5h14v4h5v3h3v8H1zM4 18h5v5H4zM16 18h5v5h-5z"/><path fill={blue} d="M3 7h10v10H3z"/><path fill={pink} d="M15 11h4v3h2v3h-6z"/><path fill={cream} d="M4 8h8v2H4zM16 11h2v3h-2zM5 19h2v2H5zM17 19h2v2h-2z"/></>,
  pin: <><path fill={ink} d="M7 1h10v2h3v12h-3v3h-2v3h-2v2h-2v-2H9v-3H7v-3H4V3h3z"/><path fill={pink} d="M7 4h10v10h-3v4h-3v-4H7z"/><path fill={cream} d="M9 6h6v6H9z"/><path fill={blue} d="M11 8h2v2h-2z"/></>,
  box: <><path fill={ink} d="M7 2h10v2h5v18H2V4h5z"/><path fill={pink} d="M4 8h16v12H4z"/><path fill={cream} d="M8 4h8v2H4v2h7v12h2V8h7V6H8z"/><path fill={blue} d="M15 15h4v3h-4z"/></>,
  paw: <><path fill={ink} d="M5 1h5v7H5zM14 1h5v7h-5zM0 6h5v7H0zM19 6h5v7h-5zM8 10h8v3h3v3h3v6H2v-6h3v-3h3z"/><path fill={pink} d="M7 3h1v3H7zM16 3h1v3h-1zM2 8h1v3H2zM21 8h1v3h-1zM9 13h6v3h3v2h2v2H4v-2h2v-2h3z"/><path fill={cream} d="M9 14h5v2H9zM6 17h3v2H6z"/></>,
  chat: <><path fill={ink} d="M1 2h22v16H9v2H6v3H3v-5H1z"/><path fill={cream} d="M3 4h18v12H8v2H5v-2H3z"/><path fill={blue} d="M5 7h14v2H5zM5 11h10v2H5z"/><path fill={pink} d="M17 11h2v2h-2z"/></>,
  user: <><path fill={ink} d="M8 1h8v2h2v9h-3v2h4v2h3v7H2v-7h3v-2h4v-2H6V3h2z"/><path fill={cream} d="M8 4h8v6h-2v3h-4v-3H8z"/><path fill={blue} d="M5 17h3v-2h8v2h3v4H5z"/><path fill={pink} d="M10 15h4v6h-4z"/></>,
  notes: <><path fill={ink} d="M3 2h4V0h10v2h4v22H3z"/><path fill={cream} d="M5 4h14v16H5z"/><path fill={blue} d="M7 7h10v2H7zM7 11h10v2H7zM7 15h7v2H7z"/><path fill={pink} d="M9 2h6v3H9z"/></>,
  camera: <><path fill={ink} d="M7 3h10v3h6v16H1V6h6z"/><path fill={light} d="M3 8h18v12H3z"/><path fill={blue} d="M8 10h8v8H8z"/><path fill={cream} d="M10 12h4v4h-4zM4 9h3v2H4z"/><path fill={pink} d="M9 5h6v3H9z"/></>,
  globe: <><path fill={ink} d="M7 1h10v2h4v4h2v10h-2v4h-4v2H7v-2H3v-4H1V7h2V3h4z"/><path fill={light} d="M7 3h10v2h3v3h1v8h-1v3h-3v2H7v-2H4v-3H3V8h1V5h3z"/><path fill={blue} d="M7 4h6v4h-3v4H5V8H4V6h3zM13 12h7v5h-3v3h-4z"/><path fill={cream} d="M8 3h5v2H8z"/></>,
  lock: <><path fill={ink} d="M6 1h12v10h4v12H2V11h4z"/><path fill={cream} d="M9 4h6v7H9z"/><path fill={pink} d="M4 13h16v8H4z"/><path fill={ink} d="M10 15h4v3h-1v2h-2v-2h-1z"/></>,
  dog: <><path fill={ink} d="M2 2h6v3h8V2h6v14h-4v5h-4v2h-4v-2H6v-5H2z"/><path fill={pink} d="M4 4h2v10H4zM18 4h2v10h-2z"/><path fill={cream} d="M8 7h8v12h-3v2h-2v-2H8z"/><path fill={ink} d="M9 10h2v2H9zM13 10h2v2h-2zM10 15h4v2h-4z"/></>,
  cat: <><path fill={ink} d="M2 1h4v2h3v3h6V3h3V1h4v17h-3v3h-4v2H9v-2H5v-3H2z"/><path fill={pink} d="M4 4h2v4H4zM18 4h2v4h-2z"/><path fill={cream} d="M6 9h12v9h-4v3h-4v-3H6z"/><path fill={ink} d="M7 11h3v2H7zM14 11h3v2h-3zM11 15h2v2h-2z"/></>,
  calendar: <><path fill={ink} d="M5 0h3v3h8V0h3v3h4v20H1V3h4z"/><path fill={pink} d="M3 5h18v4H3z"/><path fill={cream} d="M3 11h18v10H3z"/><path fill={blue} d="M5 13h4v3H5zM11 13h3v3h-3zM16 13h3v3h-3zM5 18h4v2H5zM11 18h3v2h-3z"/></>,
  ruler: <><path fill={ink} d="M1 5h22v14H1z"/><path fill={cream} d="M3 7h18v10H3z"/><path fill={pink} d="M3 15h18v2H3z"/><path fill={blue} d="M5 7h2v5H5zM9 7h2v3H9zM13 7h2v5h-2zM17 7h2v3h-2z"/></>,
  bee: <><path fill={ink} d="M1 2h7v3h3v3h2V5h3V2h7v9h-5v10h-4v2h-4v-2H6V11H1z"/><path fill={light} d="M3 4h3v3h3v2H3zM18 4h3v5h-6V7h3z"/><path fill={cream} d="M8 10h8v3H8zM8 16h8v3H8z"/><path fill={pink} d="M10 20h4v1h-4z"/></>,
} satisfies Record<string, ReactNode>;

export default function SystemIcon({ name, className, style }: {
  name: keyof typeof icons; className?: string; style?: CSSProperties;
}) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1.35em" height="1.35em"
    className={className} shapeRendering="crispEdges"
    style={{ display: "inline-block", verticalAlign: "-0.25em", flexShrink: 0, ...style }}>
    {icons[name]}
  </svg>;
}
