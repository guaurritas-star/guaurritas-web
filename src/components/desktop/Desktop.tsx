"use client";

import { useState } from "react";
import GuaurriverseApp from "@/components/apps/GuaurriverseApp";
import GuaurrinotasAuthGate from "@/components/apps/GuaurrinotasAuthGate";
import RetroWindow from "@/components/windows/RetroWindow";

const apps = [
  { id: "mundos", name: "Explora mundo", icon: "🌎" },
  { id: "mascota", name: "Mi mascota", icon: "🐶" },
  { id: "paint", name: "Paint", icon: "🎨" },
  { id: "notas", name: "Guaurrinotas", icon: "📝" },
  { id: "carrito", name: "Carrito", icon: "🛒" },
];

export default function Desktop() {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const selectedApp = apps.find((app) => app.id === activeApp);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f2f2] text-[#263650]">
      <section className="grid min-h-[calc(100vh-52px)] grid-cols-2 content-start gap-5 p-6 sm:grid-cols-3 lg:grid-cols-5">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => setActiveApp(app.id)}
            onDoubleClick={() => setActiveApp(app.id)}
            className="group flex w-28 flex-col items-center gap-2 rounded-md p-2 text-center hover:bg-[#dce4f2]"
          >
            <span className="flex h-16 w-16 items-center justify-center border-2 border-[#425b8c] bg-white text-3xl shadow-[4px_4px_0_#425b8c] transition-transform group-hover:-translate-y-1">
              {app.icon}
            </span>

            <span className="bg-white/80 px-2 py-1 font-mono text-xs font-bold">
              {app.name}
            </span>
          </button>
        ))}
      </section>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-14">
        <div className="text-center">
          <h1 className="text-5xl font-semibold italic text-[#425b8c] sm:text-7xl">
            Guaurritas
          </h1>

          <p className="mt-3 max-w-md px-6 text-sm leading-6 sm:text-base">
            Lo que comen, lo que usan, lo que viven y lo que aprenden.
          </p>
        </div>
      </div>

      {selectedApp && (
        <RetroWindow
          title={selectedApp.name}
          icon={selectedApp.icon}
          onClose={() => setActiveApp(null)}
          variant={selectedApp.id === "mundos" ? "wide" : "default"}
        >
          {selectedApp.id === "mundos" ? (
            <GuaurriverseApp />
          ) : selectedApp.id === "notas" ? (
            <GuaurrinotasAuthGate />
          ) : (
            <div className="text-center">
              <p className="font-mono text-sm uppercase tracking-wider">
                Aplicación en construcción
              </p>

              <p className="mt-3 text-sm leading-6 text-[#53627a]">
                Aquí construiremos la experiencia de {selectedApp.name}.
              </p>
            </div>
          )}
        </RetroWindow>
      )}

      <footer className="absolute inset-x-0 bottom-0 z-30 flex h-[52px] items-center justify-between border-t-2 border-[#425b8c] bg-[#dce4f2] px-2">
        <button
          type="button"
          className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#425b8c]"
        >
          🐶 Guaurritas.exe
        </button>

        <div className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs">
          GUAURRIVERSE ONLINE
        </div>
      </footer>
    </main>
  );
}
