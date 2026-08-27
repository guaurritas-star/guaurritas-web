"use client";

const archiveSections = [
  {
    number: "01",
    title: "Una historia para guardar",
    text: "Hay historias que no empiezan con una tienda, sino con una forma distinta de mirar la vida con nuestros animales. Este expediente guarda esa parte de Guaurritas como si fuera un archivo encontrado dentro del escritorio.",
  },
  {
    number: "02",
    title: "Más que una categoría",
    text: "Guaurritas entra en la vida pet diaria: lo que comen, lo que usan, lo que viven y lo que aprenden. Por eso Robbie no vive como una página aparte, sino como una pieza del mismo universo.",
  },
  {
    number: "03",
    title: "El archivo sigue abierto",
    text: "Cada producto, experiencia y nueva idea puede sumar otra página a este expediente. La intención es que la historia se sienta viva, cercana y conectada con todo el Guaurriverse.",
  },
];

export default function ExpedienteRobbieApp() {
  return (
    <article className="mx-auto w-full max-w-5xl font-interface text-[#263650]">
      <div className="border-2 border-[#425b8c] bg-[#f7f2e8] shadow-[6px_6px_0_#d9a689]">
        <header className="grid gap-5 border-b-2 border-[#425b8c] p-5 sm:grid-cols-[1fr_auto] sm:items-start sm:p-7">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#637aa6]">
              Archivo confidencial // Historia de Guaurritas
            </p>
            <h2 className="mt-2 text-3xl font-semibold italic text-[#425b8c] sm:text-5xl">
              Expediente Robbie
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Un archivo de origen dentro de Guaurritas OS.
            </p>
          </div>

          <div className="rotate-2 border-2 border-[#a66d88] px-4 py-3 text-center font-mono text-xs font-black uppercase tracking-[0.16em] text-[#a66d88]">
            Archivo<br />recuperado
          </div>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr]">
          <aside className="border-b-2 border-[#425b8c] bg-[#dce4f2] p-5 lg:border-b-0 lg:border-r-2">
            <dl className="space-y-4 font-mono text-xs">
              <div>
                <dt className="font-bold uppercase tracking-wider text-[#637aa6]">Nombre</dt>
                <dd className="mt-1 font-bold">Robbie</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wider text-[#637aa6]">Tipo</dt>
                <dd className="mt-1">Historia / origen</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wider text-[#637aa6]">Sistema</dt>
                <dd className="mt-1">Guaurritas OS</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wider text-[#637aa6]">Estado</dt>
                <dd className="mt-1 inline-flex items-center gap-2 font-bold text-[#496e63]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#a9c9be] ring-1 ring-[#425b8c]" />
                  ACTIVO
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-2 border-dashed border-[#425b8c] bg-white/80 p-3 text-center font-mono text-[10px] uppercase leading-5 tracking-[0.12em]">
              Lo que comen<br />
              Lo que usan<br />
              Lo que viven<br />
              Lo que aprenden
            </div>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="space-y-5">
              {archiveSections.map((section) => (
                <section
                  key={section.number}
                  className="relative border-2 border-[#425b8c] bg-white p-5 shadow-[3px_3px_0_rgba(66,91,140,0.2)]"
                >
                  <span className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center border-2 border-[#425b8c] bg-[#e4c56d] font-mono text-xs font-black">
                    {section.number}
                  </span>
                  <h3 className="pl-4 text-lg font-bold text-[#425b8c] sm:text-xl">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#53627a] sm:text-base">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-[#a66d88] pt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#637aa6]">
                GUAURRITAS_OS / ROBBIE_ARCHIVE / OPEN
              </p>
              <span className="border-2 border-[#425b8c] bg-[#d9a689] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em]">
                Continuará…
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
