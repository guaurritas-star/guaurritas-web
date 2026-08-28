const findings = [
  {
    number: "01",
    title: "Primer hallazgo",
    text: "Cuando Robbie fue diagnosticado con insuficiencia renal, comer dejó de ser algo automático. Cada ingrediente, cada premio y cada decisión empezó a importar.",
  },
  {
    number: "02",
    title: "Lo que aprendimos",
    text: "Cuidar también significa preguntar qué contiene lo que les damos, entender sus necesidades y dejar de tratar la alimentación pet como un detalle menor.",
  },
  {
    number: "03",
    title: "Lo que nació de ahí",
    text: "De esa búsqueda nació Guaurritas: primero como una forma de cuidar con más conciencia y después como un universo que acompaña la vida pet mucho más allá de un premio.",
  },
];

const archiveNotes = [
  {
    code: "MOTIVO",
    title: "Por qué empezó",
    text: "Robbie obligó a mirar de cerca algo que parecía cotidiano: lo que comen nuestras mascotas. Su caso convirtió la preocupación en investigación y la investigación en acción.",
  },
  {
    code: "APRENDIZAJE",
    title: "Lo que cambió",
    text: "La pregunta dejó de ser solamente “¿les gusta?” y pasó a ser “¿qué les estamos dando y por qué?”. Esa pregunta sigue detrás de cada decisión de Guaurritas.",
  },
  {
    code: "RESULTADO",
    title: "Lo que construimos",
    text: "Guaurritas creció para entrar en la vida pet diaria: lo que comen, lo que usan, lo que viven y lo que aprenden.",
  },
  {
    code: "LEGADO",
    title: "Robbie sigue aquí",
    text: "Su historia no funciona como una campaña ni como decoración de marca. Es el recordatorio de por qué Guaurritas tiene que hacer las cosas con intención.",
  },
];

export default function ExpedienteRobbieApp() {
  return (
    <article className="mx-auto w-full max-w-6xl text-[#20283b]">
      <section className="relative overflow-hidden border-2 border-[#425b8c] bg-[#eee7d7] shadow-[6px_6px_0_#c9d6ec] sm:shadow-[9px_9px_0_#c9d6ec]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] sm:px-6 sm:text-xs">
          <span>Archivo clínico 001</span>
          <span className="border border-[#a65f67] bg-[#fff7f2] px-2 py-1 text-[#9b4955]">
            Caso de origen
          </span>
        </div>

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0, transparent 27px, #8292aa 28px)",
          }}
        />

        <div className="relative grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] lg:gap-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b4955] sm:text-xs">
              Expediente Robbie
            </p>
            <h2 className="mt-2 max-w-3xl font-display text-3xl leading-[1.05] text-[#425b8c] sm:text-5xl lg:text-6xl">
              El caso que dio origen a Guaurritas
            </h2>
            <p className="mt-4 max-w-2xl font-interface text-sm leading-7 text-[#47556d] sm:text-base">
              Antes de existir una tienda, una colección o un Guaurriverse,
              hubo un gato llamado Robbie y una pregunta que cambió la forma
              de cuidar.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-px border-2 border-[#425b8c] bg-[#425b8c] font-mono text-[10px] sm:grid-cols-4 sm:text-xs">
              {[
                ["Paciente", "Robbie"],
                ["Especie", "Felino"],
                ["Diagnóstico", "Insuficiencia renal"],
                ["Legado", "Inspiró Guaurritas"],
              ].map(([label, value]) => (
                <div key={label} className="min-h-20 bg-[#fffdf8] p-3">
                  <p className="uppercase tracking-[0.12em] text-[#7a8391]">{label}</p>
                  <p className="mt-2 font-bold leading-4 text-[#263650]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-l-4 border-[#a65f67] bg-white/80 p-4 sm:p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#a65f67]">
                Nota de ingreso
              </p>
              <p className="mt-2 font-interface text-sm leading-7 sm:text-base">
                El diagnóstico de Robbie hizo visible algo que hasta entonces
                era fácil pasar por alto: no todo lo que parece un premio es
                una decisión inocente. Buscar opciones más cuidadas dejó de
                ser una idea bonita y se volvió una necesidad real.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#historia-robbie"
                className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_#aab8d2] active:translate-x-px active:translate-y-px sm:text-xs"
              >
                Conocer la historia
              </a>
              <a
                href="#legado-robbie"
                className="border-2 border-[#425b8c] bg-[#fffdf8] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#425b8c] shadow-[3px_3px_0_#aab8d2] active:translate-x-px active:translate-y-px sm:text-xs"
              >
                Ver su legado
              </a>
            </div>
          </div>

          <aside className="relative min-h-[300px] border-2 border-[#425b8c] bg-[#d8d0bd] p-4 shadow-[inset_0_0_0_6px_#f8f3e8] sm:min-h-[390px] sm:p-6">
            <div className="absolute -right-5 top-12 rotate-90 border border-[#8d7d63] bg-[#efe4c8] px-4 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#685d4c] sm:-right-7">
              Archivo 001
            </div>

            <div className="mx-auto flex aspect-[4/5] max-w-[280px] flex-col justify-between border border-[#867b69] bg-[#fffdf8] p-5 shadow-[5px_6px_0_rgba(66,91,140,.2)]">
              <div>
                <div className="flex items-center justify-between border-b border-[#b7ad9b] pb-2 font-mono text-[9px] uppercase tracking-[0.14em]">
                  <span>Ficha del paciente</span>
                  <span>001</span>
                </div>
                <div className="mt-5 grid place-items-center">
                  <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-[#425b8c] bg-[#e7edf7] text-6xl shadow-[4px_4px_0_#d4cbb9] sm:h-36 sm:w-36 sm:text-7xl">
                    🐈
                  </div>
                </div>
                <div className="mt-5 space-y-2 font-mono text-[10px] sm:text-xs">
                  <p><strong>Nombre:</strong> Robbie</p>
                  <p><strong>Especie:</strong> Felino</p>
                  <p><strong>Caso:</strong> El inicio de todo</p>
                </div>
              </div>

              <div className="rotate-[-3deg] self-end border-4 border-double border-[#a65f67] px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a65f67] sm:text-xs">
                Legado<br />permanente
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="historia-robbie" className="mt-8 scroll-mt-4">
        <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-[#425b8c] pb-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b8493]">Secuencia del caso</p>
            <h3 className="font-display text-2xl text-[#425b8c] sm:text-3xl">La historia dentro del expediente</h3>
          </div>
          <span className="hidden font-mono text-[10px] text-[#9b4955] sm:block">GUAURRITAS / ARCHIVO INTERNO</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {findings.map((finding) => (
            <div
              key={finding.number}
              className="relative overflow-hidden border-2 border-[#425b8c] bg-[#fffdf8] p-5 shadow-[4px_4px_0_#dce4f2]"
            >
              <span className="absolute right-3 top-2 font-display text-5xl text-[#e4e8f0]" aria-hidden="true">
                {finding.number}
              </span>
              <p className="relative font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a65f67]">Hallazgo {finding.number}</p>
              <h4 className="relative mt-3 font-display text-xl text-[#263650]">{finding.title}</h4>
              <p className="relative mt-3 font-interface text-sm leading-6 text-[#53627a]">{finding.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="legado-robbie" className="mt-8 scroll-mt-4">
        <div className="border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6e7890]">Anexos 01—04</p>
          <h3 className="mt-1 font-display text-2xl text-[#425b8c] sm:text-3xl">Notas del expediente</h3>
        </div>

        <div className="grid gap-px border-x-2 border-b-2 border-[#425b8c] bg-[#425b8c] sm:grid-cols-2">
          {archiveNotes.map((note) => (
            <div key={note.code} className="bg-[#fffdf8] p-5 sm:p-6">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#a65f67]">{note.code}</p>
              <h4 className="mt-2 font-display text-xl text-[#263650]">{note.title}</h4>
              <p className="mt-2 font-interface text-sm leading-6 text-[#53627a]">{note.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 flex items-center gap-3 border-t border-dashed border-[#8995aa] pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6f7887]">
        <span className="h-2 w-2 rounded-full bg-[#a65f67]" aria-hidden="true" />
        Caso cerrado, legado permanente.
      </div>
    </article>
  );
}
