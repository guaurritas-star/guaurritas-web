"use client";

import { useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

type RetroWindowProps = {
  title: string;
  icon?: string;
  children: ReactNode;
  onClose: () => void;
};

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerX: number;
  pointerY: number;
  positionX: number;
  positionY: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export default function RetroWindow({
  title,
  icon,
  children,
  onClose,
}: RetroWindowProps) {
  const dragState = useRef<DragState | null>(null);

  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  const startDragging = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (window.innerWidth < 640) return;

    const target = event.target as HTMLElement;

    if (target.closest("button")) return;

    const windowElement = event.currentTarget.parentElement;

    if (!windowElement) return;

    const rect = windowElement.getBoundingClientRect();

    dragState.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      positionX: position.x,
      positionY: position.y,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveWindow = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    const drag = dragState.current;

    if (!drag) return;

    const movementX = event.clientX - drag.pointerX;
    const movementY = event.clientY - drag.pointerY;

    const limitedX = Math.min(
      Math.max(movementX, -drag.left),
      window.innerWidth - drag.right,
    );

    const limitedY = Math.min(
      Math.max(movementY, -drag.top),
      window.innerHeight - 52 - drag.bottom,
    );

    setPosition({
      x: drag.positionX + limitedX,
      y: drag.positionY + limitedY,
    });
  };

  const stopDragging = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    dragState.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex h-[calc(100vh-52px)] items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="retro-window-title"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        className="pointer-events-auto flex h-full w-full max-w-2xl flex-col border-2 border-[#425b8c] bg-white shadow-[8px_8px_0_#425b8c] sm:h-auto sm:max-h-full"
      >
        <header
          onPointerDown={startDragging}
          onPointerMove={moveWindow}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className="flex shrink-0 cursor-grab touch-none select-none items-center justify-between border-b-2 border-[#425b8c] bg-[#dce4f2] px-3 py-2 active:cursor-grabbing"
        >
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
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border-2 border-[#425b8c] bg-white font-mono font-bold hover:bg-[#425b8c] hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </section>
    </div>
  );
}