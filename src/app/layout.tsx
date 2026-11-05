import type { Metadata } from "next";
import { Cinzel, Mansalva } from "next/font/google";
import CartPersistenceGuard from "@/components/cart/CartPersistenceGuard";
import ShoppingTheme from "@/components/ui/ShoppingTheme";
import "./globals.css";
import "./iframe-scroll-fix.css";
import "./mobile-launch-animations.css";
import "./paint-icon-animation.css";
import "./cart-payment-overrides.css";
import "./cart-final-polish.css";
import "./welcome.css";
import "./retro-controls.css";
import "./boutique-shopping.css";
import "./shopping-experience.css";
import "./store-native-window.css";
import "./ux-overlap-fixes.css";
import "./guaurriverse-store.css";
import "./cuisine-catalog-ux.css";
import "./cuisine-product-ux.css";
import "./petcake-mobile-steps.css";

const mansalva = Mansalva({
  weight: "400",
  variable: "--font-mansalva",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guaurritas OS",
  description:
    "Lo que comen, lo que usan, lo que viven y lo que aprenden.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${mansalva.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ShoppingTheme>
          <CartPersistenceGuard />
          {children}
        </ShoppingTheme>
      </body>
    </html>
  );
}
