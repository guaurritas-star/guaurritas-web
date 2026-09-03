"use client";

import dynamic from "next/dynamic";

const GuaurriverseAppCore = dynamic(
  () => import("@/components/apps/GuaurriverseAppCore"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[22rem] place-items-center bg-[#f7fafb] px-6 text-center">
        <div>
          <div className="mx-auto h-7 w-7 animate-pulse rounded-full bg-[#425BBC]/15" />
          <p className="mt-3 font-interface text-[10px] font-semibold text-[#657287]">
            Abriendo Guaurriverse…
          </p>
        </div>
      </div>
    ),
  },
);

export default function GuaurriverseApp() {
  return <GuaurriverseAppCore />;
}
