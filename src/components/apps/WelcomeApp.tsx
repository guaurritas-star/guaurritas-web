"use client";

import Image from "next/image";
import { withBasePath } from "@/lib/base-path";
import type { FulfillmentMode } from "@/lib/fulfillment-store";

export const COMMUNITY_URL = "https://www.guaurritas.com/#comp-m4qz2a3f_r_comp-mnnkixwd";
const customerPhoto = "https://static.wixstatic.com/media/be52e3_89f8ca3283034eada7c7b865c07d965b~mv2.jpg";

export default function WelcomeApp({ onShop, onCommunity }: {
  onShop: (mode: FulfillmentMode) => void;
  onCommunity: () => void;
}) {
  return <div className="welcome-app">
    <div className="welcome-intro">
      <h1>Su día merece algo especial.</h1>
      <p>Premios, repostería y accesorios para perros y gatos.</p>
    </div>
    <figure className="welcome-photo">
      <Image src={withBasePath("/cuisine/products/petcakes-sizes-v2/mediano.webp")}
        alt="Petcake de Guaurritas decorado con calabazas y un fantasma" width={1164} height={1244}
        sizes="(max-width: 639px) 320px, 440px" priority />
    </figure>
    <div className="welcome-purchase">
      <div className="welcome-actions">
        <button type="button" onClick={() => onShop("leon")} className="welcome-buy welcome-buy-leon">
          <span aria-hidden="true">🛒</span> Comprar en León
        </button>
        <button type="button" onClick={() => onShop("national")} className="welcome-buy welcome-buy-national">
          <span aria-hidden="true">🚚</span> Envíos a todo México
        </button>
      </div>
      <p>Elige tu ubicación para ver el catálogo.</p>
    </div>
    <section className="welcome-community" aria-labelledby="welcome-community-title">
      <span aria-hidden="true" className="welcome-paw">🐾</span>
      <h2 id="welcome-community-title">Nuestra comunidad</h2>
      <Image src={customerPhoto} alt="Mascota con su Petcake en una foto compartida en los comentarios de Guaurritas"
        width={72} height={72} sizes="72px" className="welcome-community-photo" />
      <a href={COMMUNITY_URL} target="_top" onClick={event => { event.preventDefault(); onCommunity(); }}>
        Ver opiniones y fotos <span aria-hidden="true">→</span>
      </a>
    </section>
  </div>;
}
