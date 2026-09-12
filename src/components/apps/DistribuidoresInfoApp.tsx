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
      <section className="relative overflow-hidden border-2 border-[#425b8c] bg-[#edf3ff] shadow-[6px_6px_0_#d9a6b9] sm:shadow-[9px_9px_0_#d9a6b9]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:px-6 sm:text-xs">
          <span>Guaurritas Partner Portal</span>
          <span className="rounded-full border border-white/70 bg-[#d9a6b9] px-3 py-1 text-[#3a2030]">● Nuevos aliados</span>
        </div>
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border-[42px] border-white/30" aria-hidden="true" />

        <div className="relative grid gap-5 p-4 sm:p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)] lg:gap-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#425b8c] bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#425b8c]"><span className="h-2 w-2 rounded-full bg-[#e4c56d]" />Programa de distribución</div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl leading-[1.05] text-[#425b8c] sm:text-5xl lg:text-[3.5rem]">Lleva una experiencia pet diferente a tu negocio</h1>
            <p className="mt-4 max-w-2xl font-interface text-sm leading-7 text-[#47556d] sm:text-base">Más que sumar otro producto al anaquel, distribuyes una marca que entra en la vida pet diaria: lo que comen, lo que usan, lo que viven y lo que aprenden.</p>

            <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[10px] sm:grid-cols-4 sm:text-xs">
              {[["Ideal para", "Tiendas pet"], ["También para", "Veterinarias"], ["Oportunidad", "Recompra"], ["Diferenciador", "Personalización"]].map(([label, value]) => (
                <div key={label} className="min-h-20 rounded-xl border border-[#9aabd0] bg-white/85 p-3 shadow-[2px_2px_0_#c9d6ec]"><p className="uppercase tracking-[.12em] text-[#7a8391]">{label}</p><p className="mt-2 font-bold leading-4 text-[#263650]">{value}</p></div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#beneficios-distribucion" className="rounded-full border-2 border-[#425b8c] bg-[#425b8c] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-white shadow-[3px_3px_0_#d9a6b9] sm:text-xs">Descubrir beneficios</a>
              <a href="#catalogo-distribucion" className="rounded-full border-2 border-[#425b8c] bg-white px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#425b8c] sm:text-xs">Ver catálogo</a>
            </div>
          </div>

          <aside className="rounded-[24px] border-2 border-[#425b8c] bg-[#263650] p-3 shadow-[6px_6px_0_#e4c56d]">
            <div className="flex items-center justify-between border-b border-white/30 px-2 pb-3 font-mono text-[9px] uppercase tracking-[.14em] text-white"><span>Tu ruta de entrada</span><span>01 / 03</span></div>
            <div className="mt-3 space-y-3">
              {[["01","Empieza ligero","Prueba una selección de fácil exhibición."],["02","Mide la respuesta","Descubre qué conecta con tus clientes."],["03","Hazla crecer","Suma recompra, regalos y personalización."]].map(([step,title,text]) => (
                <div key={step} className="grid grid-cols-[42px_1fr] gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-white">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9a6b9] font-display text-lg text-[#3a2030]">{step}</span>
                  <div><h2 className="font-interface text-sm font-bold">{title}</h2><p className="mt-1 font-interface text-[11px] leading-5 text-[#dce4f2]">{text}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-[#e4c56d] p-4 text-[#263650]"><p className="font-mono text-[9px] font-bold uppercase tracking-[.15em]">Modelo flexible</p><p className="mt-1 font-display text-xl">Crece según tu punto de venta</p></div>
          </aside>
        </div>
      </section>

      <section id="beneficios-distribucion" className="mt-8 scroll-mt-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#7b8493]">Razones para integrarnos</p><h2 className="font-display text-2xl text-[#425b8c] sm:text-3xl">Lo que Guaurritas aporta a tu punto de venta</h2></div><span className="rounded-full bg-[#d9a6b9] px-3 py-1 font-mono text-[9px] font-bold uppercase text-[#3a2030]">Valor para tu negocio</span></div>
        <div className="grid gap-3 lg:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.number} className="rounded-[20px] border-2 border-[#425b8c] bg-white p-5 shadow-[4px_4px_0_#c9d6ec]">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#425b8c] font-mono text-[10px] font-bold text-white">{item.number}</span><span className="h-px flex-1 bg-[#d9a6b9]" /></div>
              <h3 className="mt-4 font-display text-xl text-[#263650]">{item.title}</h3>
              <p className="mt-3 font-interface text-sm leading-6 text-[#53627a]">{item.text}</p>
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
        <div className="rounded-t-[20px] border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#6e7890]">Explorador de productos</p><h2 className="mt-1 font-display text-2xl text-[#425b8c] sm:text-3xl">Catálogo y precio aliado</h2><p className="mt-1 font-interface text-xs text-[#53627a]">Precio aliado con 15% de descuento sobre el precio público.</p></div>
        <div className="overflow-x-auto border-x-2 border-b-2 border-[#425b8c] bg-white">
          <table className="w-full min-w-[620px] border-collapse text-left font-interface text-[11px]">
            <thead className="bg-[#d9a6b9] text-[#3a2030]"><tr><th className="p-3">Producto</th><th className="p-3">Presentación</th><th className="p-3">Público</th><th className="p-3">Aliado -15%</th></tr></thead>
            <tbody>{products.map(([name, presentation, publicPrice, allyPrice]) => <tr key={`${name}-${presentation}`} className="odd:bg-[#faf7ef]"><td className="border-t border-[#ddd] p-3 font-bold">{name}</td><td className="border-t border-[#ddd] p-3">{presentation}</td><td className="border-t border-[#ddd] p-3">{money(publicPrice)}</td><td className="border-t border-[#ddd] p-3 font-bold text-[#425b8c]">{money(allyPrice)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-t-[20px] border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 sm:px-6"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#6e7890]">Categoría de exhibición</p><h2 className="mt-1 font-display text-2xl text-[#425b8c] sm:text-3xl">Bandanas Couture</h2></div>
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
