"use client";

import SystemIcon from "@/components/ui/SystemIcon";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";
import type { FulfillmentMode } from "@/lib/fulfillment-store";
import CommunityCarousel from "./CommunityCarousel";
import { ShoppingButton } from "@/components/ui/ShoppingControls";

export const COMMUNITY_URL = "https://www.guaurritas.com/#comp-m4qz2a3f_r_comp-mnnkixwd";

export default function WelcomeApp({ onShop, onCommunity, onExplore }: {
  onShop: (mode: FulfillmentMode) => void;
  onCommunity: () => void;
  onExplore: () => void;
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
        <ShoppingButton $tone="blue" onClick={() => onShop("leon")} className="shopping-entry">
          <span aria-hidden="true"><SystemIcon name="cart" /></span>
          <span><strong>Comprar en León</strong><small>Repostería y catálogo local</small></span>
        </ShoppingButton>
        <ShoppingButton $tone="peach" onClick={() => onShop("national")} className="shopping-entry">
          <span aria-hidden="true"><SystemIcon name="truck" /></span>
          <span><strong>Envíos a todo México</strong><small>Ver productos para envío</small></span>
        </ShoppingButton>
      </div>
      <p>Elige tu ubicación para ver el catálogo.</p>
      <button type="button" className="welcome-explore-link" onClick={onExplore}>
        Prefiero explorar Guaurritas OS <span aria-hidden="true">→</span>
      </button>
    </div>
    <section className="welcome-community" aria-labelledby="welcome-community-title">
      <span aria-hidden="true" className="welcome-paw"><SystemIcon name="paw" /></span>
      <h2 id="welcome-community-title">Nuestra comunidad</h2>
      <CommunityCarousel />
      <a href={COMMUNITY_URL} target="_top" onClick={event => { event.preventDefault(); onCommunity(); }}>
        Ver opiniones y fotos <span aria-hidden="true">→</span>
      </a>
    </section>
  </div>;
}
