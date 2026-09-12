"use client";

const whatsapp = "https://wa.me/524775505243?text=Hola%20Guaurritas%2C%20me%20interesa%20conocer%20la%20propuesta%20para%20distribuidores.%20Mi%20negocio%20es%3A%20";
const email = "mailto:guaurritas@gmail.com?subject=Quiero%20distribuir%20Guaurritas&body=Hola%20Guaurritas%2C%0A%0AMe%20interesa%20conocer%20su%20propuesta%20para%20distribuidores.%0A%0ANombre%20del%20negocio%3A%0ACiudad%3A%0ATipo%20de%20negocio%3A%0AProductos%20de%20interes%3A%0AVolumen%20aproximado%3A%0A";

const benefits = [
  { number: "01", title: "Una marca que amplía tu oferta", text: "Guaurritas suma una propuesta pet con identidad propia: productos para la vida diaria, premios, regalos y celebraciones que complementan lo que tu negocio ya vende." },
  { number: "02", title: "Productos que invitan a volver", text: "Cookies, sticks y sazonadores funcionan como compra de impulso y también como productos de recompra. Son opciones fáciles de explicar, exhibir e integrar al ticket." },
  { number: "03", title: "Personalización que diferencia", text: "Desarrollamos presentaciones especiales para tu negocio. Las GuaurriCookies pueden llevar el logo o una figura solicitada, creando un producto propio y reconocible." },
];

const products = [
  ["Build Your Bag", "Selección pequeña", 55, 46.75],
  ["Happy Bag", "Bolsa 100 g", 85, 72.25],
  ["Happy Box", "Caja surtida + juguete", 160, 136],
  ["Happy Box Deluxe", "Caja surtida premium", 210, 178.5],
  ["Happy Jar", "300 g", 349, 296.65],
  ["Happy Jar", "500 g", 490, 416.5],
  ["GuaurriCookies", "300 g a granel", 150, 127.5],
  ["GuaurriCookies", "400 g a granel", 225, 191.25],
  ["GuaurriCookies", "500 g a granel", 300, 255],
  ["GuaurriCookies", "1 kg a granel", 600, 510],
  ["GuaurriSticks", "Pack masticable / selección curada", 80, 68],
  ["Sazonadores pet", "Topper / complemento", 120, 102],
] as const;

const bandanas = [["Mini", 219], ["Chica", 279], ["Mediana", 329], ["Grande", 379], ["XL", 439]] as const;
const money = (amount: number) => `$${amount.toFixed(2)} MXN`;

export default function DistribuidoresInfoApp() {
  return (
    <article className="mx-auto w-full max-w-6xl text-[#20283b]">
      <section className="relative overflow-hidden border-2 border-[#425b8c] bg-[#eee7d7] shadow-[6px_6px_0_#c9d6ec] sm:shadow-[9px_9px_0_#c9d6ec]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] sm:px-6 sm:text-xs">
          <span>Archivo comercial B2B</span>
          <span className="border border-[#a65f67] bg-[#fff7f2] px-2 py-1 text-[#9b4955]">Convocatoria abierta</span>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 27px, #8292aa 28px)" }} />

        <div className="relative grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] lg:gap-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b4955] sm:text-xs">Programa de aliados Guaurritas</p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl leading-[1.05] text-[#425b8c] sm:text-5xl lg:text-6xl">Lleva una experiencia pet diferente a tu negocio</h1>
            <p className="mt-4 max-w-2xl font-interface text-sm leading-7 text-[#47556d] sm:text-base">Más que sumar otro producto al anaquel, distribuyes una marca que entra en la vida pet diaria: lo que comen, lo que usan, lo que viven y lo que aprenden.</p>

            <div className="mt-6 grid grid-cols-2 gap-px border-2 border-[#425b8c] bg-[#425b8c] font-mono text-[10px] sm:grid-cols-4 sm:text-xs">
              {[["Ideal para", "Tiendas pet"], ["También para", "Veterinarias"], ["Oportunidad", "Recompra"], ["Diferenciador", "Personalización"]].map(([label, value]) => (
                <div key={label} className="min-h-20 bg-[#fffdf8] p-3"><p className="uppercase tracking-[.12em] text-[#7a8391]">{label}</p><p className="mt-2 font-bold leading-4 text-[#263650]">{value}</p></div>
              ))}
            </div>

            <div className="mt-6 border-l-4 border-[#a65f67] bg-white/80 p-4 sm:p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a65f67]">La oportunidad</p>
              <p className="mt-2 font-interface text-sm leading-7 sm:text-base">Una selección visual, fácil de exhibir y con distintos niveles de entrada: desde un snack de impulso hasta una caja de regalo. Puedes comenzar con una prueba piloto y construir tu surtido según la respuesta de tus clientes.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#beneficios-distribucion" className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-white shadow-[3px_3px_0_#aab8d2] sm:text-xs">Por qué vender Guaurritas</a>
              <a href="#catalogo-distribucion" className="border-2 border-[#425b8c] bg-[#fffdf8] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#425b8c] shadow-[3px_3px_0_#aab8d2] sm:text-xs">Consultar precios</a>
            </div>
          </div>

          <aside className="relative min-h-[330px] border-2 border-[#425b8c] bg-[#d8d0bd] p-4 shadow-[inset_0_0_0_6px_#f8f3e8] sm:p-6">
            <div className="absolute -right-6 top-16 rotate-90 border border-[#8d7d63] bg-[#efe4c8] px-4 py-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#685d4c]">Aliados B2B</div>
            <div className="mx-auto flex h-full min-h-[290px] max-w-[300px] flex-col justify-between border border-[#867b69] bg-[#fffdf8] p-5 shadow-[5px_6px_0_rgba(66,91,140,.2)]">
              <div>
                <div className="flex justify-between border-b border-[#b7ad9b] pb-2 font-mono text-[9px] uppercase tracking-[.14em]"><span>Ficha comercial</span><span>B2B-01</span></div>
                <div className="mt-6 grid place-items-center"><div className="grid h-32 w-32 place-items-center rounded-full border-2 border-dashed border-[#425b8c] bg-[#e7edf7] text-6xl shadow-[4px_4px_0_#d4cbb9]" aria-hidden="true">🐾</div></div>
                <div className="mt-6 space-y-2 font-mono text-[10px] sm:text-xs"><p><strong>Marca:</strong> Guaurritas</p><p><strong>Modelo:</strong> Precio aliado</p><p><strong>Inicio:</strong> Selección piloto</p><p><strong>Contacto:</strong> Directo con nosotros</p></div>
              </div>
              <div className="rotate-[-3deg] self-end border-4 border-double border-[#a65f67] px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#a65f67]">Buscamos<br />aliados</div>
            </div>
          </aside>
        </div>
      </section>

      <section id="beneficios-distribucion" className="mt-8 scroll-mt-4">
        <div className="mb-4 border-b-2 border-[#425b8c] pb-2"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#7b8493]">Razones para integrarnos</p><h2 className="font-display text-2xl text-[#425b8c] sm:text-3xl">Lo que Guaurritas aporta a tu punto de venta</h2></div>
        <div className="grid gap-3 lg:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.number} className="relative overflow-hidden border-2 border-[#425b8c] bg-[#fffdf8] p-5 shadow-[4px_4px_0_#dce4f2]">
              <span className="absolute right-3 top-2 font-display text-5xl text-[#e4e8f0]" aria-hidden="true">{item.number}</span>
              <p className="relative font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#a65f67]">Beneficio {item.number}</p>
              <h3 className="relative mt-3 font-display text-xl text-[#263650]">{item.title}</h3>
              <p className="relative mt-3 font-interface text-sm leading-6 text-[#53627a]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-2 border-[#425b8c] bg-[#fffdf8] p-5 shadow-[5px_5px_0_#dce4f2] sm:p-7">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#a65f67]">Personalización para tu marca</p>
        <h2 className="mt-2 font-display text-2xl text-[#425b8c] sm:text-4xl">GuaurriCookies con tu logo o figura</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <p className="font-interface text-sm leading-6 text-[#53627a] sm:col-span-2">Podemos personalizar las GuaurriCookies con el logo de tu negocio o con una figura especial. Esto permite crear una presentación exclusiva para venta, regalos de bienvenida, amenidades pet friendly, activaciones o kits corporativos. El molde personalizado tiene un costo único inicial; después puedes volver a solicitar producción con el mismo diseño. También podemos revisar tamaños, presentación y empaquetado al vacío según el proyecto.</p>
          <div className="border border-dashed border-[#a65f67] bg-[#fff4ef] p-4 font-mono text-[10px] leading-5 text-[#70434a]"><strong>IDEAL PARA</strong><br />• Hoteles pet friendly<br />• Veterinarias<br />• Tiendas y concept stores<br />• Eventos de marca<br />• Regalos para clientes</div>
        </div>
        <p className="mt-4 border-l-4 border-[#d9a6b9] bg-[#f8eef2] p-3 font-interface text-xs leading-6 text-[#53627a]"><strong>Importante:</strong> el diseño, tamaño, costo del molde, mínimos y disponibilidad se confirman al preparar la cotización.</p>
      </section>

      <section id="catalogo-distribucion" className="mt-8 scroll-mt-4">
        <div className="border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#6e7890]">Anexo comercial 01</p><h2 className="mt-1 font-display text-2xl text-[#425b8c] sm:text-3xl">Catálogo y precio aliado</h2><p className="mt-1 font-interface text-xs text-[#53627a]">Precio aliado con 15% de descuento sobre el precio público.</p></div>
        <div className="overflow-x-auto border-x-2 border-b-2 border-[#425b8c] bg-white">
          <table className="w-full min-w-[620px] border-collapse text-left font-interface text-[11px]">
            <thead className="bg-[#d9a6b9] text-[#3a2030]"><tr><th className="p-3">Producto</th><th className="p-3">Presentación</th><th className="p-3">Público</th><th className="p-3">Aliado -15%</th></tr></thead>
            <tbody>{products.map(([name, presentation, publicPrice, allyPrice]) => <tr key={`${name}-${presentation}`} className="odd:bg-[#faf7ef]"><td className="border-t border-[#ddd] p-3 font-bold">{name}</td><td className="border-t border-[#ddd] p-3">{presentation}</td><td className="border-t border-[#ddd] p-3">{money(publicPrice)}</td><td className="border-t border-[#ddd] p-3 font-bold text-[#425b8c]">{money(allyPrice)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#6e7890]">Anexo comercial 02</p><h2 className="mt-1 font-display text-2xl text-[#425b8c] sm:text-3xl">Bandanas Couture</h2></div>
        <div className="grid gap-5 border-x-2 border-b-2 border-[#425b8c] bg-[#fffdf8] p-4 sm:p-6 lg:grid-cols-[.8fr_1.2fr]">
          <div><h3 className="font-display text-xl text-[#263650]">Una pieza visual para tu exhibición</h3><p className="mt-2 font-interface text-sm leading-6 text-[#53627a]">Bandanas artesanales tejidas a mano, disponibles en las colecciones Amulette, Abeille, Cœur Sacré, Oracle y Confetti. Su variedad de tallas y colores ayuda a construir una exhibición atractiva y una compra más personal.</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#8a5c65]">Colores sujetos a disponibilidad.</p></div>
          <div className="overflow-x-auto border border-[#8995aa] bg-white"><table className="w-full min-w-[430px] text-left font-interface text-[11px]"><thead className="bg-[#d9a6b9]"><tr><th className="p-3">Talla</th><th className="p-3">Público León</th><th className="p-3">Aliado</th></tr></thead><tbody>{bandanas.map(([size, price]) => <tr key={size} className="odd:bg-[#faf7ef]"><td className="border-t border-[#ddd] p-3 font-bold">{size}</td><td className="border-t border-[#ddd] p-3">{money(price)}</td><td className="border-t border-[#ddd] p-3 font-bold text-[#425b8c]">{money(price * .85)}</td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section className="mt-8 border-2 border-[#425b8c] bg-[#425b8c] p-5 text-white shadow-[6px_6px_0_#d9a6b9] sm:p-7">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#dce4f2]">Siguiente paso</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Cuéntanos sobre tu negocio</h2>
        <p className="mt-3 max-w-3xl font-interface text-sm leading-7 text-[#eef2f8]">Compártenos tu ciudad, tipo de negocio, productos de interés y volumen aproximado. Revisaremos contigo disponibilidad, selección inicial y opciones personalizadas.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href={whatsapp} target="_blank" rel="noreferrer" className="border-2 border-white bg-[#d9a6b9] px-5 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#3a2030] shadow-[3px_3px_0_#fff] sm:text-xs">Escribir por WhatsApp</a><a href={email} className="border-2 border-white bg-[#fffdf8] px-5 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#425b8c] shadow-[3px_3px_0_#dce4f2] sm:text-xs">Enviar correo</a></div>
        <p className="mt-4 font-mono text-[9px] text-[#dce4f2]">guaurritas@gmail.com · WhatsApp +52 477 550 5243 · León, Guanajuato</p>
      </section>
    </article>
  );
}
