"use client";

const whatsapp = "https://wa.me/524775505243?text=Hola%20Guaurritas%2C%20me%20interesa%20la%20informaci%C3%B3n%20para%20distribuidores.";

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

const money = (amount: number) => `$${amount.toFixed(2)} MXN`;

export default function DistribuidoresInfoApp() {
  return (
    <div className="mx-auto w-full max-w-[960px] border-2 border-[#7d7d7d] bg-[#c0c0c0] p-2 text-black shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#404040]" style={{ fontFamily: "Tahoma, Arial, sans-serif" }}>
      <div className="border-2 border-[#7d7d7d] bg-[#fffdf4] shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#aaa]">
        <div className="bg-gradient-to-r from-[#003087] to-[#1569c7] px-3 py-2 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]">Guaurritas Cuisine</p>
          <h1 className="mt-1 text-lg font-bold">Información para distribuidores</h1>
          <p className="mt-1 text-[11px] text-blue-100">Productos de fácil exhibición, recompra y entrada de marca.</p>
        </div>

        <div className="space-y-4 p-3 sm:p-5">
          <div className="border border-[#d2b56f] bg-[#fff8d9] p-3 text-[11px] leading-5">
            <strong>Propuesta para aliados:</strong> puedes integrar productos Guaurritas en tu tienda, veterinaria, hotel pet friendly, concept store o espacio de venta. El precio aliado mostrado considera un <strong>15% de descuento</strong> sobre el precio público.
          </div>

          <div className="overflow-x-auto border border-[#888] bg-white">
            <table className="w-full min-w-[620px] border-collapse text-left text-[10px] sm:text-[11px]">
              <thead className="bg-[#d9a6b9] text-[#3a2030]">
                <tr><th className="border-b border-[#888] px-2 py-2">Producto</th><th className="border-b border-[#888] px-2 py-2">Presentación</th><th className="border-b border-[#888] px-2 py-2">Público</th><th className="border-b border-[#888] px-2 py-2">Aliado -15%</th></tr>
              </thead>
              <tbody>
                {products.map(([name, presentation, publicPrice, allyPrice]) => (
                  <tr key={`${name}-${presentation}`} className="odd:bg-[#fafafa]">
                    <td className="border-b border-[#ddd] px-2 py-2 font-bold">{name}</td><td className="border-b border-[#ddd] px-2 py-2">{presentation}</td><td className="border-b border-[#ddd] px-2 py-2">{money(publicPrice)}</td><td className="border-b border-[#ddd] px-2 py-2 font-bold text-[#003087]">{money(allyPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section>
            <h2 className="border-b border-[#888] pb-1 text-sm font-bold text-[#003087]">Couture · bandanas</h2>
            <p className="mt-2 text-[11px] leading-5">Bandanas artesanales por colección y color. Todas las colecciones actuales utilizan este tabulador de tallas. El precio aliado se calcula con 15% de descuento.</p>
            <div className="mt-2 overflow-x-auto border border-[#888] bg-white">
              <table className="w-full min-w-[560px] border-collapse text-[10px] sm:text-[11px]"><thead className="bg-[#d9a6b9]"><tr><th className="px-2 py-2 text-left">Talla</th><th className="px-2 py-2 text-left">Público León</th><th className="px-2 py-2 text-left">Aliado distribuidor</th></tr></thead><tbody>{[["Mini",219],["Chica",279],["Mediana",329],["Grande",379],["XL",439]].map(([size, price]) => <tr key={size} className="odd:bg-[#fafafa]"><td className="border-t border-[#ddd] px-2 py-2 font-bold">{size}</td><td className="border-t border-[#ddd] px-2 py-2">{money(price as number)}</td><td className="border-t border-[#ddd] px-2 py-2 font-bold text-[#003087]">{money((price as number) * 0.85)}</td></tr>)}</tbody></table>
            </div>
            <p className="mt-2 text-[10px] text-[#555]">Colecciones actuales: Amulette, Abeille, Cœur Sacré, Oracle y Confetti. Disponibilidad de colores sujeta a existencia.</p>
          </section>

          <div className="grid gap-2 text-[11px] leading-5 sm:grid-cols-2">
            <div className="border border-[#aaa] bg-[#eef6ff] p-3"><strong className="text-[#003087]">Importante</strong><br />Sticks y sazonadores pueden estar sujetos a disponibilidad por lote, proveedor, sabores, presentación y temporada. La selección final se confirma al preparar la cotización.</div>
            <div className="border border-[#aaa] bg-[#f8eef2] p-3"><strong className="text-[#815a61]">Para comenzar</strong><br />Indícanos tu ciudad, tipo de negocio, productos de interés y volumen aproximado para preparar una propuesta.</div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#aaa] pt-3 sm:flex-row">
            <a href="mailto:guaurritas@gmail.com?subject=Información%20para%20distribuidores" className="border border-[#808080] bg-[#c0c0c0] px-3 py-2 text-center text-[11px] font-bold shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#555]">✉ Enviar correo</a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="border border-[#526b52] bg-[#b9d9b9] px-3 py-2 text-center text-[11px] font-bold shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#526b52]">☏ Escribir por WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
}
