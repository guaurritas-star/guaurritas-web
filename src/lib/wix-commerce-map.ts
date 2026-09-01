export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

export type WixCatalogReferenceOptions = {
  variantId?: string;
  options?: Record<string, string>;
  customTextFields?: Record<string, string>;
};

export type WixCatalogReference = {
  appId: string;
  catalogItemId: string;
  options?: WixCatalogReferenceOptions;
};

export type WixCartBinding =
  | {
      supported: true;
      catalogReference: WixCatalogReference;
      wixUnitPrice: number;
      warnings?: string[];
    }
  | {
      supported: false;
      reason: string;
    };

export type CuisineCartIdentity = {
  id: string;
  name: string;
  detail: string;
  unitPrice: number;
};

type Variant = {
  variantId: string;
  price: number;
};

const simpleProducts: Record<string, { productId: string; price: number }> = {
  "cake-pops": {
    productId: "80c4d261-5f84-9080-bc4f-6e1d29e944f1",
    price: 40,
  },
  perrundas: {
    productId: "fbbc7058-894c-bb83-81e0-5c9b7420c570",
    price: 80,
  },
  pizzet: {
    productId: "5bd0032b-3de8-0e8d-7412-1e29f8b60200",
    price: 60,
  },
  gorrito: {
    productId: "c0c257f2-b323-716a-c3a5-88f4814d3124",
    price: 50,
  },
  pancarta: {
    productId: "827718ba-227d-e107-3b82-6bbe80b1379a",
    price: 80,
  },
};

const velitasVariants: Variant[] = [
  { variantId: "31e9e328-7349-4f08-9cbc-6bb85dad6d40", price: 10 },
  { variantId: "23c5c02f-d5ff-482a-b3d3-e5cbf5cf1038", price: 40 },
];

const dognutsVariants: Variant[] = [
  { variantId: "7c1ff23f-30d4-46ca-876d-c888ea0b28d1", price: 105 },
  { variantId: "b1ae90b7-b0e3-4693-8fa5-f87a11e798de", price: 140 },
];

const chilaquiVariants: Variant[] = [
  { variantId: "828c3ebb-20c7-4bfa-8ea6-3ac6fcaa5f5e", price: 65 },
  { variantId: "004d1ff0-c84a-4703-a491-09cf3b18c25c", price: 85 },
];

const cupcakeVariants: Variant[] = [
  { variantId: "750b4631-c78d-42b8-93e1-b8f32f0a0a25", price: 40 },
  { variantId: "8bbdb49d-f745-4bae-a747-1420a919cb37", price: 150 },
];

const happyBoxVariants: Variant[] = [
  // Cuisine shows Normal first, then Deluxe.
  { variantId: "a1521968-0c65-49bf-8e78-0e6a03031fb2", price: 160 },
  { variantId: "d41f342a-1284-4d17-91bf-2b114c3ede8e", price: 210 },
];

const petcakeVariants: Array<Variant & { productId: string }> = [
  // Chico: betún, fondant
  {
    productId: "c80169f0-c65e-5b81-00b5-106ef502d1af",
    variantId: "74165939-e639-4632-a250-0abbb003e705",
    price: 150,
  },
  {
    productId: "c80169f0-c65e-5b81-00b5-106ef502d1af",
    variantId: "e928103b-fc9e-4ce8-b43a-e601b9e5480c",
    price: 200,
  },
  // Mediano: betún, fondant
  {
    productId: "26677e84-f128-6dc2-b0a8-7bf2eb29b438",
    variantId: "7b681622-7c85-48c5-9a34-3dc4b3bccad6",
    price: 305,
  },
  {
    productId: "26677e84-f128-6dc2-b0a8-7bf2eb29b438",
    variantId: "7c99023c-72f6-44c1-a659-cfc5d0703844",
    price: 375,
  },
  // Grande: betún, fondant
  {
    productId: "e21e120c-b1be-2ca6-6b6a-ee088589a912",
    variantId: "4d572ed6-dc92-496c-986c-c9994360fbca",
    price: 395,
  },
  {
    productId: "e21e120c-b1be-2ca6-6b6a-ee088589a912",
    variantId: "7154f049-0667-426b-8918-ba3258a0bba7",
    price: 475,
  },
  // "Plus grande" in Cuisine maps to Petcake Jumbo in Wix.
  {
    productId: "f04202ed-1640-7d21-431e-397ff972a326",
    variantId: "4545c007-10b5-488d-8cce-537e8e3987be",
    price: 655,
  },
  {
    productId: "f04202ed-1640-7d21-431e-397ff972a326",
    variantId: "35170993-cb14-4f24-b876-3b31024fb1ac",
    price: 895,
  },
];

const happyBagProducts = [
  // Order matches CuisineStoreApp.tsx.
  { productId: "1a61cf70-7d92-79ab-20f1-4f30eef3b1b7", price: 85 },
  { productId: "9876918f-25af-9234-fb0f-2656775b664d", price: 85 },
  { productId: "96eaf1f0-561b-4adc-0240-f7981b97bb4f", price: 85 },
  { productId: "a1a1f670-ba83-ed8e-8b4c-e6d43f637348", price: 85 },
];

const cookieVariants = new Map<number, Variant>([
  [300, { variantId: "34857899-fcdf-483b-ad4a-5e18071d9f0e", price: 180 }],
  [400, { variantId: "95bb93ab-a169-4a7d-b5e4-062967e17c54", price: 240 }],
  [500, { variantId: "b211501d-1036-4182-9735-245e9dfd679a", price: 300 }],
  [600, { variantId: "fdaee569-2c71-4d2b-a42d-e7a6da4077ff", price: 360 }],
  [700, { variantId: "7019d145-3a8d-4b40-a3b1-783c45ff46bf", price: 420 }],
  [800, { variantId: "085e1449-a976-4def-aa56-74a825d648e9", price: 480 }],
  [900, { variantId: "c8edb972-ac34-4506-86d1-c0220e4ca160", price: 540 }],
  [1000, { variantId: "7c81b29f-4375-4d86-b2cf-bd0c6227d8e8", price: 600 }],
  [1100, { variantId: "e5483281-a4d4-4ce2-9961-cfa3766a0073", price: 660 }],
  [1200, { variantId: "bcfb0584-054b-4c12-8c93-374ffaa71df2", price: 720 }],
  [1300, { variantId: "4106e14d-d9f2-4253-ac6b-e2f266af2396", price: 780 }],
  [1400, { variantId: "f1174403-ebd6-41ea-bca6-1830bb7e2059", price: 840 }],
  [1500, { variantId: "e6c9b2d0-63d6-4c55-bb2c-05cc84a7cd01", price: 900 }],
  [1600, { variantId: "2587574f-7c46-4471-9e6c-ded8e0482ba2", price: 960 }],
  [1700, { variantId: "d46c6a06-6f29-4f79-b718-0358d330951c", price: 1020 }],
  [1800, { variantId: "cb247764-31e4-450f-a854-2aedf66707e2", price: 1080 }],
  [1900, { variantId: "b978c1c1-61ab-4dfc-9a4c-7fd14adad6f7", price: 1140 }],
  [2000, { variantId: "45700999-1e80-4423-b29f-21582e01c53a", price: 1140 }],
  [2100, { variantId: "539a0313-4d3a-469d-8ce4-0cfb14933d9d", price: 1197 }],
  [2200, { variantId: "30926db9-c9fa-4574-8701-428de4121666", price: 1254 }],
  [2300, { variantId: "5e6832e8-1027-4bb0-b7b1-84f444074f26", price: 1311 }],
  [2400, { variantId: "46e884d7-da2d-45c6-b935-0d279c7dac51", price: 1368 }],
  [2500, { variantId: "be6e1dd2-3d92-4476-adfb-730046699369", price: 1425 }],
  [2600, { variantId: "b049aca8-bff7-4f7d-8ff9-26df95eab859", price: 1482 }],
  [2700, { variantId: "b33d9264-81f7-4432-a45e-8a18d4c71c95", price: 1539 }],
  [2800, { variantId: "b4e38d28-011b-4a4b-b91b-d6f216766816", price: 1596 }],
  [2900, { variantId: "c5659140-527c-46d8-b03b-cd4c80140fa1", price: 1653 }],
  [3000, { variantId: "bb648a67-8b9a-4514-8a09-37fcb4df956f", price: 1710 }],
  [3100, { variantId: "18346b21-f0c1-456c-af20-170b339c8f44", price: 1767 }],
  [3200, { variantId: "22fa7178-f21e-4d24-b345-b783b2919f64", price: 1824 }],
  [3300, { variantId: "bdb88c03-8909-4fd1-92df-fdd5762d6aca", price: 1881 }],
  [3400, { variantId: "1df72841-3e5c-42ed-9895-ed8936f79d3c", price: 1938 }],
  [3500, { variantId: "8aee0272-c885-4729-950a-36edc32afc7c", price: 1995 }],
  [3600, { variantId: "cbd5fd08-7a2b-4fdf-9dd0-8399c488e67c", price: 2052 }],
  [3700, { variantId: "eb361a9b-fa49-44f8-a452-f5846a4972b1", price: 2109 }],
  [3800, { variantId: "d19c61a4-d668-4185-98d7-9b2b93d89a48", price: 2166 }],
  [3900, { variantId: "dab20a0a-43bf-4bf4-baa7-45d66c82c85e", price: 2223 }],
  [4000, { variantId: "51c08817-c971-4c13-abd2-aeaa5c2c6759", price: 2280 }],
  [4100, { variantId: "a05659c7-c663-4f3a-be88-e7322608294e", price: 2337 }],
  [4200, { variantId: "a2af7ca9-2ecd-4dad-b6c3-a4d8dc08028e", price: 2394 }],
  [4300, { variantId: "810a32e2-f973-4307-ad8b-d7ffe8bf1fec", price: 2451 }],
  [4400, { variantId: "a59c2748-cd45-4f57-91a1-36ea7e5a9628", price: 2508 }],
  [4500, { variantId: "5470e242-bc69-4957-a9d0-843041f9625b", price: 2565 }],
  [4600, { variantId: "4502ea96-1a38-4326-b4ca-2993e9b98732", price: 2622 }],
  [4700, { variantId: "f07226db-a3f9-4275-bd15-70dd892e90a5", price: 2679 }],
  [4800, { variantId: "3bdc83c1-d93e-4cb1-80d8-f9997e7ae39b", price: 2736 }],
  [4900, { variantId: "a341dc97-7746-4372-bdaf-c212403fd01f", price: 2793 }],
]);

function catalogReference(
  productId: string,
  options?: WixCatalogReferenceOptions,
): WixCatalogReference {
  return {
    appId: WIX_STORES_APP_ID,
    catalogItemId: productId,
    ...(options && Object.keys(options).length ? { options } : {}),
  };
}

function supported(
  productId: string,
  price: number,
  options?: WixCatalogReferenceOptions,
  warnings?: string[],
): WixCartBinding {
  return {
    supported: true,
    catalogReference: catalogReference(productId, options),
    wixUnitPrice: price,
    ...(warnings?.length ? { warnings } : {}),
  };
}

function parseOptionIndex(parts: string[]) {
  const value = Number(parts[2]);
  return Number.isInteger(value) && value >= 0 ? value : -1;
}

function customSummary(item: CuisineCartIdentity, maxLength = 500) {
  const summary = item.detail.trim() || "Sin personalización adicional";
  return `Configuración Guaurritas: ${summary}`.slice(0, maxLength);
}

export function resolveCuisineWixBinding(
  item: CuisineCartIdentity,
): WixCartBinding {
  if (!item.id.startsWith("cuisine:")) {
    return {
      supported: false,
      reason: "Este artículo todavía no pertenece al catálogo Cuisine conectado a Wix.",
    };
  }

  const parts = item.id.split(":");
  const productKey = parts[1];

  if (productKey === "guaurricookies") {
    const grams = Number(parts[2]);
    const variant = cookieVariants.get(grams);

    if (!variant) {
      return {
        supported: false,
        reason: "Ese gramaje de GuaurriCookies todavía no existe como variante en Wix.",
      };
    }

    return supported(
      "f4403702-54e9-95e8-045c-23a706870959",
      variant.price,
      { variantId: variant.variantId },
      item.detail ? ["La distribución de sabores viajará como nota del pedido."] : undefined,
    );
  }

  if (productKey === "sticks") {
    return {
      supported: false,
      reason: "GuaurriSticks todavía no existe como producto en Wix Stores.",
    };
  }

  const optionIndex = parseOptionIndex(parts);

  if (productKey === "happy-bag") {
    const match = happyBagProducts[optionIndex];
    return match
      ? supported(match.productId, match.price)
      : { supported: false, reason: "No pudimos identificar el sabor de Happy Bag." };
  }

  if (productKey === "sazonadores") {
    const flavor = optionIndex === 0 ? "Res" : optionIndex === 1 ? "Pollo" : null;
    return flavor
      ? supported("ef82ff4b-2355-5d6f-0ea1-40a265fc53ae", 119, {
          options: { Sabor: flavor },
        })
      : { supported: false, reason: "No pudimos identificar el sabor del sazonador." };
  }

  if (productKey === "petcakes") {
    const match = petcakeVariants[optionIndex];
    return match
      ? supported(match.productId, match.price, {
          variantId: match.variantId,
          customTextFields: {
            "Comentarios de personalización": customSummary(item),
          },
        })
      : { supported: false, reason: "No pudimos identificar el tamaño/decoración del Petcake." };
  }

  if (productKey === "cupcakes") {
    const match = cupcakeVariants[optionIndex];
    return match
      ? supported("15ed60e0-05df-bab1-1540-f2458f47e4a9", match.price, {
          variantId: match.variantId,
          ...(item.detail
            ? {
                customTextFields: {
                  "¿Tienes algún tema o decoración especial? (opcional) 🌟": customSummary(
                    item,
                  ),
                },
              }
            : {}),
        })
      : { supported: false, reason: "No pudimos identificar la presentación de Cupcakes." };
  }

  if (productKey === "dognuts") {
    const match = dognutsVariants[optionIndex];
    return match
      ? supported("0263b553-bdcb-ca3a-b08d-7777ff270889", match.price, {
          variantId: match.variantId,
          customTextFields: {
            "Comentarios de personalización": customSummary(item),
          },
        })
      : { supported: false, reason: "No pudimos identificar el pack de Dognuts." };
  }

  if (productKey === "chilaquidogs") {
    const match = chilaquiVariants[optionIndex];
    return match
      ? supported(
          "1cb5c50f-fcec-955d-8023-da0145c39754",
          match.price,
          { variantId: match.variantId },
          ["Proteína y salsa viajarán como nota del pedido."],
        )
      : { supported: false, reason: "No pudimos identificar el tamaño de ChilaquiDogs." };
  }

  if (productKey === "happy-box") {
    const match = happyBoxVariants[optionIndex];
    return match
      ? supported("ecb30ab5-3a2a-165b-878d-66fdb214736a", match.price, {
          variantId: match.variantId,
        })
      : { supported: false, reason: "No pudimos identificar la versión de Happy Box." };
  }

  if (productKey === "velitas") {
    const match = velitasVariants[optionIndex];
    return match
      ? supported("0d5a3cca-0407-c121-f105-2c06d4a9bf80", match.price, {
          variantId: match.variantId,
        })
      : { supported: false, reason: "No pudimos identificar el tamaño de la velita." };
  }

  const simple = simpleProducts[productKey];
  if (simple) {
    return supported(simple.productId, simple.price);
  }

  return {
    supported: false,
    reason: `Todavía no existe un mapeo Wix para ${item.name}.`,
  };
}
