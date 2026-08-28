"use client";

import { useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

type RetroWindowProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  variant?: "default" | "wide";
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
  onMinimize,
  variant = "default",
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
    <div className="retro-window-overlay pointer-events-none fixed inset-0 z-50 flex h-[100dvh] items-center justify-center p-0 sm:bottom-[52px] sm:h-auto sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="retro-window-title"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        className={`retro-window-dialog pointer-events-auto flex h-full max-h-full w-full flex-col border-0 border-[#425b8c] bg-white shadow-none sm:h-auto sm:max-h-full sm:border-2 sm:shadow-[8px_8px_0_#425b8c] ${
          variant === "wide" ? "max-w-7xl" : "max-w-2xl"
        }`}
      >
        <header
          onPointerDown={startDragging}
          onPointerMove={moveWindow}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className="flex shrink-0 touch-none select-none items-center justify-between border-b-2 border-[#425b8c] bg-[#dce4f2] px-3 py-2 sm:cursor-grab sm:active:cursor-grabbing"
        >
          <p
            id="retro-window-title"
            className="truncate font-mono text-sm font-bold"
          >
            {icon && (
              <span aria-hidden="true" className="mr-1 inline-flex h-5 w-5 shrink-0 overflow-hidden align-middle">
                {icon}
              </span>
            )}
            {title}.exe
          </p>

          <div className="flex shrink-0 items-center gap-1">
            {onMinimize && (
              <button
                type="button"
                onClick={onMinimize}
                aria-label={`Minimizar ${title}`}
                title="Minimizar"
                className="hidden h-7 w-7 cursor-pointer items-center justify-center border-2 border-[#425b8c] bg-white font-mono text-sm font-bold leading-none hover:bg-[#e4c56d] sm:flex"
              >
                <span aria-hidden="true" className="-translate-y-0.5">_</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={`Cerrar ${title} y volver a las aplicaciones`}
              title="Volver a las aplicaciones"
              className="flex h-8 min-w-8 cursor-pointer items-center justify-center border-2 border-[#425b8c] bg-white px-2 font-mono font-bold hover:bg-[#425b8c] hover:text-white sm:h-7 sm:min-w-7 sm:px-0"
            >
              <span aria-hidden="true" className="sm:hidden">←</span>
              <span aria-hidden="true" className="hidden sm:inline">×</span>
            </button>
          </div>
        </header>

        <div
          className={`retro-window-content min-h-0 flex-1 overscroll-contain overflow-y-auto ${
            variant === "wide" ? "p-4 sm:p-6" : "p-6 sm:p-8"
          }`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
