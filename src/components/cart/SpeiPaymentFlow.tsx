"use client";

import dynamic from "next/dynamic";
import type { CartItem } from "@/lib/cart-store";
import type { LeonOrderPreferences } from "@/lib/order-preferences";

const SpeiPaymentFlowCore = dynamic(
  () => import("@/components/cart/SpeiPaymentFlowCore"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-3 rounded-md border border-[#ead7de] bg-[#fff9fb] px-3 py-3 text-[9px] text-[#6f6266]">
        Preparando transferencia…
      </div>
    ),
  },
);

export default function SpeiPaymentFlow({
  items,
  preferences,
}: {
  items: CartItem[];
  preferences: LeonOrderPreferences;
}) {
  return <SpeiPaymentFlowCore items={items} preferences={preferences} />;
}
