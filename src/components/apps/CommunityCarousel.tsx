"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { normalizeReviews, selectReviews, type CommunityReview } from "@/lib/community-reviews";

const SELECTION_KEY = "guaurritas-community-first";

export default function CommunityCarousel() {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [status, setStatus] = useState("Cargando opiniones de nuestra comunidad…");
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let received = false;
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== "https://www.guaurritas.com" ||
          event.data?.source !== "guaurritas-embed" || event.data?.type !== "guaurritas:community-data" || received) return;
      const realReviews = normalizeReviews(event.data.reviews);
      if (!realReviews.length) return;
      received = true;
      let previous: string | undefined;
      try { previous = sessionStorage.getItem(SELECTION_KEY) ?? undefined; } catch { /* Optional preference. */ }
      const selection = selectReviews(realReviews, previous);
      try { sessionStorage.setItem(SELECTION_KEY, selection[0].id); } catch { /* Storage may be blocked. */ }
      setReviews(selection);
    };
    window.addEventListener("message", receive);
    if (window.parent !== window) {
      window.parent.postMessage({ source: "guaurritas-web", type: "guaurritas:community-request" }, "https://www.guaurritas.com");
    }
    const timeout = window.setTimeout(() => {
      if (!received) setStatus("Puedes consultar las opiniones en el enlace de abajo.");
    }, 12000);
    return () => { window.removeEventListener("message", receive); window.clearTimeout(timeout); };
  }, []);

  const move = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>(".community-card");
    element.scrollBy({ left: direction * ((card?.offsetWidth ?? element.clientWidth) + 16), behavior: "instant" });
  };

  return <div className="community-carousel" role="region" aria-roledescription="carrusel" aria-label="Opiniones de clientes">
    {reviews.length ? <>
      <div className="community-controls">
        <span>Desliza para ver más opiniones</span>
        <button type="button" aria-label="Opiniones anteriores" onClick={() => move(-1)}>←</button>
        <button type="button" aria-label="Opiniones siguientes" onClick={() => move(1)}>→</button>
      </div>
      <div className="community-track" ref={track} tabIndex={0} aria-label="Opiniones; usa las flechas del teclado o desliza">
        {reviews.map(review => <article key={review.id} className="community-card">
          {review.photo && <Image src={review.photo} alt={`Foto compartida por ${review.name} en su opinión`}
            width={400} height={260} sizes="(max-width: 639px) 280px, 320px" loading="lazy" />}
          <blockquote><p>{review.text}</p><footer>{review.name}</footer></blockquote>
        </article>)}
      </div>
    </> : <p className="community-status" role="status">{status}</p>}
  </div>;
}
