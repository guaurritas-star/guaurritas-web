from pathlib import Path

p = Path("src/components/apps/CoutureStoreApp.tsx")
s = p.read_text()

old_import = 'import { useState } from "react";\n'
new_import = 'import { useEffect, useRef, useState } from "react";\n'
assert s.count(old_import) == 1
s = s.replace(old_import, new_import)

cart_import_anchor = 'import { addCartItem, useCart } from "@/lib/cart-store";\n'
assert s.count(cart_import_anchor) == 1
s = s.replace(
    cart_import_anchor,
    cart_import_anchor + 'import { requestSystemCartOpen } from "@/lib/cart-events";\n',
)

# Convert current Couture product imagery to the loading-aware wrapper first.
current_image_count = s.count("<Image")
assert current_image_count >= 4, current_image_count
s = s.replace("<Image", "<BandanaImage")

type_anchor = '''type BandanaSize = {
  id: SizeId;
  name: string;
  neck: string;
  example: string;
};
'''
assert s.count(type_anchor) == 1
image_component = '''type BandanaSize = {
  id: SizeId;
  name: string;
  neck: string;
  example: string;
};

const WEB_SOURCE = "guaurritas-web";

function BandanaImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes: string;
  className: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 font-interface text-xl font-bold tracking-[0.28em] text-[#8d7a84]"
        >
          <span className="animate-pulse">...</span>
        </span>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
'''
s = s.replace(type_anchor, image_component)

state_anchor = '''  const [notice, setNotice] = useState("");
  const { count: cartCount } = useCart();
'''
assert s.count(state_anchor) == 1
state_replacement = '''  const [notice, setNotice] = useState("");
  const [cartOpening, setCartOpening] = useState(false);
  const cartOpeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartOpeningResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartOpeningRef = useRef(false);
  const { count: cartCount } = useCart();

  const openCoutureCart = () => {
    if (typeof window === "undefined") return;

    if (window.self !== window.top && window.matchMedia("(max-width: 639px)").matches) {
      window.parent.postMessage(
        { source: WEB_SOURCE, type: "guaurritas:cuisine-cart-request" },
        "*",
      );
      return;
    }

    if (cartOpeningRef.current) return;

    cartOpeningRef.current = true;
    setCartOpening(true);

    if (cartOpeningTimerRef.current) clearTimeout(cartOpeningTimerRef.current);
    if (cartOpeningResetTimerRef.current) clearTimeout(cartOpeningResetTimerRef.current);

    cartOpeningTimerRef.current = setTimeout(() => {
      requestSystemCartOpen();
      cartOpeningResetTimerRef.current = setTimeout(() => {
        cartOpeningRef.current = false;
        setCartOpening(false);
        cartOpeningResetTimerRef.current = null;
      }, 360);
      cartOpeningTimerRef.current = null;
    }, 90);
  };

  useEffect(
    () => () => {
      if (cartOpeningTimerRef.current) clearTimeout(cartOpeningTimerRef.current);
      if (cartOpeningResetTimerRef.current) clearTimeout(cartOpeningResetTimerRef.current);
    },
    [],
  );
'''
s = s.replace(state_anchor, state_replacement)

old_cart = '''        <span className="rounded-full border border-[#bfa9b4] bg-[#f5edf1] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#432536] sm:text-[10px]">
          Carrito · {cartCount}
        </span>
'''
assert s.count(old_cart) == 1
new_cart = '''        <button
          type="button"
          onClick={openCoutureCart}
          aria-busy={cartOpening}
          aria-label={`Abrir carrito con ${cartCount} ${cartCount === 1 ? "artículo" : "artículos"}`}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-[#bfa9b4] bg-[#f5edf1] px-2.5 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#432536] shadow-[1px_1px_0_rgba(112,66,90,0.12)] transition hover:border-[#8f6178] hover:bg-[#fff7fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70425a] sm:text-[10px]"
        >
          <span className="relative h-7 w-7 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
            <Image
              src={withBasePath("/icons/desktop/taskbar-cart.webp")}
              alt=""
              fill
              unoptimized
              sizes="28px"
              className="object-contain"
            />
          </span>
          <span>{cartOpening ? "Abriendo…" : `Carrito · ${cartCount}`}</span>
        </button>
'''
s = s.replace(old_cart, new_cart)

p.write_text(s)
