"use client";

import Image from "next/image";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

const whatsapp = "https://wa.me/524775505243?text=Hola%20Guaurritas%2C%20me%20interesa%20conocer%20la%20propuesta%20para%20distribuidores.%20Mi%20negocio%20es%3A%20";
const email = "https://mail.google.com/mail/?view=cm&fs=1&to=guaurritas@gmail.com&su=Quiero%20distribuir%20Guaurritas&body=Hola%20Guaurritas%2C%0A%0AMe%20interesa%20conocer%20su%20propuesta%20para%20distribuidores.%0A%0ANombre%20del%20negocio%3A%0ACiudad%3A%0ATipo%20de%20negocio%3A%0AProductos%20de%20interes%3A%0AVolumen%20aproximado%3A%0A";

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

const distributorCarouselProducts = [
  { name: "Happy Bag · Cacahuate con tocino", image: "/cuisine/products/happy-bag-flavors-v6/peanut-bacon.webp", width: 852, height: 1729 },
  { name: "GuaurriCookies en vitrolero", image: "/cuisine/products/guaurricookies-vitrolero.webp", width: 1086, height: 1448 },
  { name: "Sazonadores pet", image: "/cuisine/products/sazonadores-card-v3.webp", width: 900, height: 584 },
  { name: "GuaurriSticks", image: "/cuisine/products/sticks-card-v5.webp", width: 412, height: 1473 },
  { name: "Bandana Amulette Ciel", image: "/couture/bandanas/amulette-ciel-transparent-v3.webp", width: 1100, height: 894 },
] as const;

export default function DistribuidoresInfoApp() {
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const activeProduct = distributorCarouselProducts[activeProductIndex];
  const showPreviousProduct = () => setActiveProductIndex((current) => (current - 1 + distributorCarouselProducts.length) % distributorCarouselProducts.length);
  const showNextProduct = () => setActiveProductIndex((current) => (current + 1) % distributorCarouselProducts.length);

  return (
    <article className="mx-auto w-full max-w-6xl text-[#20283b]">
      <section className="relative overflow-hidden border-2 border-[#425b8c] bg-[#fff9f4] shadow-[6px_6px_0_#d9a6b9] sm:shadow-[9px_9px_0_#d9a6b9]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:px-6 sm:text-xs">
          <span className="flex items-center gap-2"><span className="text-[#eab0bd]">●</span> Guaurritas Partner Portal</span>
          <span className="hidden font-interface text-[10px] normal-case tracking-wide text-[#fff7ef] sm:inline">Más mascotas felices, más historias juntas ♡</span>
          <span className="rounded-full border border-white/70 bg-[#d9a6b9] px-3 py-1 text-[#3a2030]">Programa para distribuidores</span>
        </div>

        <div className="relative grid lg:grid-cols-[minmax(0,.9fr)_minmax(430px,1.1fr)]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-9 sm:py-10 lg:pr-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#425b8c] bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#425b8c]"><span className="h-2 w-2 rounded-full bg-[#e4c56d]" />Programa de distribución</div>
            <h1 className="mt-5 max-w-2xl font-display text-[2.45rem] leading-[1.02] text-[#263f70] sm:text-5xl lg:text-[3.45rem]">Haz crecer tu negocio con una experiencia pet diferente</h1>
            <span className="mt-2 h-[5px] w-44 -rotate-1 rounded-full bg-[#e9a6b3]" aria-hidden="true" />
            <p className="mt-5 max-w-xl font-interface text-sm leading-6 text-[#52627d] sm:text-base sm:leading-7">Premios, snacks y complementos que entran en la vida pet diaria y hacen que tus clientes quieran volver.</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full border-2 border-[#425b8c] bg-[#425b8c] px-6 py-3 text-center font-display text-sm uppercase tracking-[.08em] text-white shadow-[3px_3px_0_#d9a6b9] transition-transform hover:-translate-y-0.5">Quiero distribuir&nbsp; →</a>
              <a href="#catalogo-distribucion" className="rounded-full border-2 border-[#425b8c] bg-white px-6 py-3 text-center font-display text-sm uppercase tracking-[.08em] text-[#425b8c] transition-colors hover:bg-[#edf3ff]">Ver productos&nbsp; →</a>
            </div>
          </div>

          <div className="relative min-h-[410px] overflow-hidden border-t-2 border-[#e6bec7] bg-[radial-gradient(circle_at_80%_15%,#fff8df_0,transparent_24%),linear-gradient(145deg,#f8d8cf_0%,#f7e8de_52%,#dce9f7_100%)] sm:min-h-[500px] lg:border-l-2 lg:border-t-0">
            <span className="absolute left-5 top-6 z-20 -rotate-6 font-mono text-[10px] font-bold uppercase leading-5 tracking-[.08em] text-[#294779] sm:left-10 sm:top-10">Pets reales<br />snacks reales<br />historias increíbles</span>
            <span className="absolute right-5 top-6 z-20 rotate-3 bg-[#f5df85] px-4 py-3 text-center font-mono text-[9px] font-bold uppercase leading-5 tracking-[.08em] text-[#294779] shadow-[3px_3px_0_#d9a6b9] sm:right-8 sm:top-9">Guaurritas<br />en tu tienda también ♡</span>

            <div className="absolute inset-x-[7%] bottom-8 top-[22%] rounded-[28px] border-2 border-[#b97b67] bg-[#d99a72] shadow-[10px_12px_0_rgba(66,91,140,.18)]">
              <div className="absolute inset-x-0 top-0 h-[34%] rounded-t-[25px] border-b-2 border-[#b97b67] bg-[#edbb98]" />
              <Image src={withBasePath("/icons/desktop/guaurritas-mascot-hd.webp")} alt="Mascota de Guaurritas" width={150} height={150} className="absolute left-1/2 top-[3%] z-10 w-[88px] -translate-x-1/2 sm:w-[112px]" />

              <div className="absolute inset-x-2 bottom-[13%] top-[34%] z-20 flex items-center justify-center px-12 sm:inset-x-5 sm:px-16" aria-live="polite">
                <Image
                  key={activeProduct.image}
                  src={withBasePath(activeProduct.image)}
                  alt={activeProduct.name}
                  width={activeProduct.width}
                  height={activeProduct.height}
                  className="distributor-product-enter max-h-full max-w-full object-contain drop-shadow-[0_10px_6px_rgba(42,48,63,.24)]"
                />
              </div>

              <button type="button" onClick={showPreviousProduct} aria-label="Ver producto anterior" className="absolute left-2 top-[62%] z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#425b8c] bg-[#fffaf3]/95 font-display text-2xl text-[#425b8c] shadow-[3px_3px_0_#d9a6b9] transition-transform hover:-translate-x-0.5 hover:-translate-y-1/2 active:scale-95 sm:left-4 sm:h-12 sm:w-12">‹</button>
              <button type="button" onClick={showNextProduct} aria-label="Ver siguiente producto" className="absolute right-2 top-[62%] z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#425b8c] bg-[#fffaf3]/95 font-display text-2xl text-[#425b8c] shadow-[3px_3px_0_#d9a6b9] transition-transform hover:translate-x-0.5 hover:-translate-y-1/2 active:scale-95 sm:right-4 sm:h-12 sm:w-12">›</button>

              <div className="absolute inset-x-3 bottom-3 z-30 text-center sm:bottom-4">
                <p className="font-display text-base text-[#263f70] sm:text-lg">{activeProduct.name}</p>
                <div className="mt-1.5 flex justify-center gap-1.5" aria-label={`Producto ${activeProductIndex + 1} de ${distributorCarouselProducts.length}`}>
                  {distributorCarouselProducts.map((product, index) => (
                    <button key={product.name} type="button" onClick={() => setActiveProductIndex(index)} aria-label={`Ver ${product.name}`} aria-current={index === activeProductIndex ? "true" : undefined} className={`h-2 rounded-full border border-[#425b8c] transition-all ${index === activeProductIndex ? "w-6 bg-[#425b8c]" : "w-2 bg-[#fffaf3]"}`} />
                  ))}
                </div>
              </div>
            </div>
            <span className="absolute bottom-5 right-4 rotate-6 text-2xl text-[#e592a4]">✦</span>
            <span className="absolute left-4 top-1/2 -rotate-12 text-3xl text-[#e4c56d]">✦</span>
          </div>
        </div>

        <div id="beneficios-distribucion" className="relative z-20 grid scroll-mt-4 gap-2 border-t-2 border-[#425b8c] bg-[#f6f8ff] p-3 sm:grid-cols-3 sm:p-4">
          {[
            ["▣", "Empieza sin complicarte", "Selección inicial fácil de exhibir."],
            ["↻", "Productos con recompra", "Cookies, sticks y sazonadores para volver."],
            ["♡", "Personaliza con tu logo", "Presentaciones únicas para tu negocio."],
          ].map(([icon, title, text]) => (
            <div key={title} className="grid grid-cols-[42px_1fr] items-center gap-3 rounded-2xl border border-[#c9d6ec] bg-white px-3 py-3 shadow-[2px_2px_0_#e6bec7]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7d5dd] font-display text-xl text-[#425b8c]">{icon}</span>
              <div><h2 className="font-display text-base leading-5 text-[#263f70]">{title}</h2><p className="mt-1 font-interface text-[11px] leading-4 text-[#647188]">{text}</p></div>
            </div>
          ))}
        </div>
        <p className="border-t border-[#9aabd0] bg-[#dce9f7] px-4 py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#294779]">Ideal para tiendas pet&nbsp; · &nbsp;veterinarias&nbsp; · &nbsp;concept stores</p>
      </section>

      <section className="mt-12 sm:mt-14">
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
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href={whatsapp} target="_blank" rel="noreferrer" className="border-2 border-white bg-[#d9a6b9] px-5 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#3a2030] shadow-[3px_3px_0_#fff] sm:text-xs">Escribir por WhatsApp</a><a href={email} target="_blank" rel="noreferrer" className="border-2 border-white bg-[#fffdf8] px-5 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[.1em] text-[#425b8c] shadow-[3px_3px_0_#dce4f2] sm:text-xs">Enviar correo</a></div>
        <p className="mt-4 font-mono text-[9px] text-[#dce4f2]">guaurritas@gmail.com · WhatsApp +52 477 550 5243 · León, Guanajuato</p>
      </section>
    </article>
  );
}
