import { LEON_PICKUP_POINTS, type LeonOrderPreferences } from "@/lib/order-preferences";

// Presentation only. Eligibility remains in isLeonOrderPreferencesComplete.
export function leonCheckoutErrors(value: LeonOrderPreferences) {
  return {
    date: value.deliveryDate.trim() ? "" : "Elige una fecha de entrega.",
    time: value.preferredTime.trim() ? "" : "Elige un horario preferido.",
    point: value.deliveryMethod === "pickup_point" && !LEON_PICKUP_POINTS.some(point => point === value.deliveryPoint)
      ? "Selecciona un punto medio." : "",
    address: ["home_delivery", "uber_eats"].includes(value.deliveryMethod) && !value.deliveryAddress.trim()
      ? "Escribe la dirección para cotizar Uber." : "",
  };
}

export type LeonCheckoutErrors = ReturnType<typeof leonCheckoutErrors>;
