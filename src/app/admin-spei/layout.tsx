import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#f4f5f9',
  colorScheme: 'light',
};

export default function AdminSpeiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`
        html,
        body {
          background: #f4f5f9 !important;
          color-scheme: light;
        }

        body {
          min-width: 100%;
        }
      `}</style>
      <div
        className="min-h-screen w-full bg-[#f4f5f9]"
        style={{ minHeight: '100dvh', backgroundColor: '#f4f5f9' }}
      >
        {children}
      </div>
    </>
  );
}
