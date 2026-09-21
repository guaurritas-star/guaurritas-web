import GlobalWixHeader from "@/components/desktop/GlobalWixHeader";

export const metadata = {
  title: "Encabezado Guaurritas OS",
  robots: { index: false, follow: false },
};

export default function HeaderPage() {
  return (
    <main className="global-wix-header-shell">
      <GlobalWixHeader />
    </main>
  );
}
