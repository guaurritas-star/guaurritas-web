"use client";

import styled from "styled-components";
import { Button } from "react95/dist/Button/Button";
import { Window } from "react95/dist/Window/Window";
import { WindowHeader } from "react95/dist/Window/WindowHeader";

// React95 v4 uses v5-style styling props; styled-components v6 no longer
// filters these automatically. Preserve them on components, not native DOM.
const stylingProps = new Set(["active", "fullWidth", "primary", "square", "shadow", "variant"]);
export const shouldForwardShoppingProp = (prop: string, target: unknown) =>
  typeof target !== "string" || !stylingProps.has(prop);

// Keep React95 scoped to shopping. No global reset or replacement brand font.
export const ShoppingButton = styled(Button).attrs({ type: "button" })<{ $tone?: "blue" | "peach" }>`
  && {
    min-width: 0;
    min-height: 48px;
    box-sizing: border-box;
    border: 1px solid #637aa6;
    border-radius: 2px;
    box-shadow: var(--retro-button-raised);
    height: auto;
    padding: 10px 16px;
    white-space: normal;
    font: 400 17px/1.35 var(--font-mansalva), cursive;
    text-shadow: none;
    color: ${p => p.$tone === "blue" ? "#fff" : "#263650"};
    background: ${p => p.$tone === "blue" ? "#425b8c" : p.$tone === "peach" ? "#d9a689" : "#f2f2f2"};
    transition: background-color 140ms ease, color 140ms ease;
  }
  /* React95 draws a second bevel and a pointer-focus rectangle with pseudos.
     Use the same single bevel and keyboard focus as the existing shop controls. */
  &&::before, &&::after { content: none; }
  &&:not(:disabled):active { padding: 10px 16px; box-shadow: var(--retro-button-pressed); }
  &&:not(:disabled):hover { background: #e8c8d7; color: #263650; }
  &&[aria-pressed="true"] { background: #425b8c; color: #fff; box-shadow: var(--retro-button-pressed); }
  &&:focus-visible { outline: 3px solid #425b8c; outline-offset: 3px; }
  &&:focus:not(:focus-visible)::after { outline: none; }
  &&:disabled { opacity: .55; cursor: not-allowed; }
  @media (prefers-reduced-motion: reduce) { && { transition: none; } }
`;

export const ShoppingWindow = styled(Window)`
  && { display: flex; flex-direction: column; white-space: normal; padding: 3px; border: 1px solid #637aa6; box-shadow: inset 1px 1px #fff, 3px 4px 0 #26365033; background: #f2f2f2; box-sizing: border-box; border-radius: 0; }
`;

export const ShoppingWindowHeader = styled(WindowHeader)`
  && {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    height: auto;
    min-height: 42px;
    box-sizing: border-box;
    border-bottom: 1px solid #637aa6;
    box-shadow: none;
    padding: 4px 8px;
    background: linear-gradient(90deg, #425b8c, #637aa6);
    color: #fff;
    white-space: normal;
    font: 400 17px/1.4 var(--font-mansalva), cursive;
    touch-action: none;
    user-select: none;
  }
`;
