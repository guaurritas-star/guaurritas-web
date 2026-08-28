import type { Metadata } from "next";
import { Cinzel, Mansalva, Open_Sans } from "next/font/google";
import "./globals.css";
import "./iframe-scroll-fix.css";
import "./mobile-launch-animations.css";

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

const openSans = Open_Sans({
  variable: "--font-open-sans",
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
      className={`${mansalva.variable} ${cinzel.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
