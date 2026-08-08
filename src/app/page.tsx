export default function Home() {
  return (
    <main className="min-h-screen bg-[#f2f2f2] p-4 text-[#425b8c] sm:p-8">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col border-2 border-[#425b8c] bg-white shadow-[6px_6px_0_#425b8c] sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-2">
          <p className="font-mono text-sm font-bold">
            🐶 GUAURRITAS.EXE — INICIO
          </p>

          <div className="flex gap-2 font-mono text-xs">
            <button type="button" aria-label="Minimizar">
              _
            </button>
            <button type="button" aria-label="Maximizar">
              □
            </button>
            <button type="button" aria-label="Cerrar">
              ×
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.2em]">
            Sistema iniciado correctamente
          </p>

          <h1 className="text-5xl font-semibold italic sm:text-7xl">
            Guaurritas
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#263650] sm:text-lg">
            Lo que comen, lo que usan, lo que viven y lo que aprenden.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <button className="border-2 border-[#425b8c] bg-[#425b8c] px-6 py-3 font-mono text-sm font-bold text-white shadow-[4px_4px_0_#263650] transition-transform hover:-translate-y-1">
              EXPLORAR MUNDOS
            </button>

            <button className="border-2 border-[#425b8c] bg-white px-6 py-3 font-mono text-sm font-bold text-[#425b8c] shadow-[4px_4px_0_#425b8c] transition-transform hover:-translate-y-1">
              IR A CUISINE
            </button>
          </div>
        </div>

        <footer className="flex justify-between border-t-2 border-[#425b8c] bg-[#dce4f2] px-4 py-2 font-mono text-xs">
          <span>GUAURRIVERSE ONLINE</span>
          <span>07/08/2026</span>
        </footer>
      </section>
    </main>
  );
}