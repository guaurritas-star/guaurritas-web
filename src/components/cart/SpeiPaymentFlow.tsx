"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { paymentSessionKey, type SpeiCustomer } from "@/lib/payment-session";
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
  const [customer, setCustomer] = useState<SpeiCustomer>({ name: "", phone: "", email: "" });
  return <SpeiPaymentFlowCore
    key={paymentSessionKey(items, preferences)}
    items={items}
    preferences={preferences}
    customer={customer}
    onCustomerChange={(patch) => setCustomer((current) => ({ ...current, ...patch }))}
  />;
}
