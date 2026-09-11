import {
  KIT_GUAURRICOOKIES_PRICE,
  KIT_GUAURRICOOKIES_PRODUCT_KEY,
  KIT_GUAURRICOOKIES_WIX_PRODUCT_ID,
  decodeKitGuaurriCookiesSlots,
} from "@/lib/kit-guaurricookies";
import {
  DESCUBRE_GUAURRITAS_PRICE,
  DESCUBRE_GUAURRITAS_PRODUCT_KEY,
  DESCUBRE_GUAURRITAS_WIX_PRODUCT_ID,
  decodeDescubreGuaurritasSelection,
} from "@/lib/descubre-guaurritas";

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
  personalization?: string;
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
    price: 250,
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
    price: 405,
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
    price: 625,
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
  const summary =
    String(item.personalization || "").trim() ||
    item.detail.trim() ||
    "Sin personalización adicional";
  return `Configuración Guaurritas: ${summary}`.slice(0, maxLength);
}


type CoutureProductConfig = {
  productId: string;
  colors: readonly string[];
  variantIds: readonly string[];
};

const coutureSizeIds = ["mini", "chica", "mediana", "grande", "xl"] as const;

const coutureProducts: Record<string, CoutureProductConfig> = {
  amulette: {
    productId: "eb5fc006-e815-4c42-b230-01e8fc8458bb",
    colors: [
      "crepuscule", "foret", "ciel", "framboise", "ivoire", "lilas", "soleil", "tangerine", "terracotta",
    ],
    variantIds: [
      // Mini
      "8d60585b-9383-47e2-8b81-5ecccc7142ad", "5fe469b4-e4e7-4d42-a268-c7ef018b5803", "fb26bc9f-0473-465f-a98c-72bfa8b9c41f", "482c985c-8cac-4a16-bf90-4e822e2af703", "ea5437d7-85e9-41d3-a762-2e3c7a806045", "f5413ff2-1028-4d15-9961-0070b57df860", "becdc854-c71f-4851-9c17-bbec46a0e344", "6fe79033-331d-4123-9438-0e3ab238c1fa", "26a03660-0a30-4bfa-97d3-77f275c3c6d0",
      // Chica
      "931bd1b0-6370-41b6-b745-62ff2fdadea3", "1f582a14-7dff-4dc2-885f-b2e9a1ca230a", "2086702e-adf0-41e0-8035-4f27af26ff6b", "c9a2d6e2-b8e8-4060-8973-67ba8c5817e1", "6b9e844e-dd30-4611-ad77-42f6bd187632", "1bb43e38-fe4f-4393-b8bf-d77f04fd511c", "8b355b55-c6a7-413e-bc9c-55fd081d7613", "d089e63b-3ade-43cf-bda1-a97e5216689d", "7e198b58-3ac1-4e6c-9881-a6f08a475942",
      // Mediana
      "70efeb4b-4252-4cbf-9bb5-af062a6762fa", "f1a57b7c-3ebf-45ae-9de2-39409ee030c2", "62d8aee8-8085-4024-ae21-9629bd21f2ef", "452b0be1-898f-43ea-b511-126184922df9", "62a05ebc-3ba6-4178-91d6-cba03052cb48", "88c2c3f2-621f-4c81-878e-5d606e1425ad", "1c36b2d1-8bcf-4ab1-b37e-96b6cabb0d84", "5265890b-5d96-4a2d-800b-7da72e3dfa28", "76427911-0b7d-4922-b43d-74fc5c504cfb",
      // Grande
      "a6aab766-f5e5-4670-bc42-5dc5b70b1a7c", "3bcab741-ce5d-446d-aa2b-5836fe98ddbf", "34202e2d-a58b-4e76-a59b-58b81d1ebb79", "71fd3536-b3e7-46eb-afb4-b76c5a896219", "560df4aa-ca70-48e4-8620-14104c5c4849", "e5643f3b-7349-4b9b-899b-877de9a8764c", "a638fa97-02ff-4af3-b274-73ec4186aa21", "514372b3-3084-4b3c-96b2-4dc71816851c", "33e06f50-f102-4a17-a4a0-a97d2a4a81df",
      // XL
      "8f910942-e299-440f-aac9-5019d5bf227e", "65d00a68-f2ce-44fe-9875-b2f94c0faf82", "3d29b3e5-f5f1-4be9-bbf1-d497a1134eb9", "cc88228d-8da7-431d-80b3-b04155eac74d", "2240c0e5-b6d7-4612-b333-6dca407b82c6", "42e2d67c-fec4-499d-acf2-04851da0f6a3", "5fe18c33-3d78-48d9-a4bf-1f66e0fe0206", "e61b32de-b108-4d8d-90c8-0a000d311e02", "4a711a2b-a2fa-4d65-a290-09315913170e",
    ],
  },
  abeille: {
    productId: "e90af6ed-c19e-4ca3-8bc0-82f5d4276b55",
    colors: ["ciel", "foret", "tangerine", "lilas", "ivoire", "framboise", "soleil", "terracotta"],
    variantIds: [
      // Mini
      "ee621d88-0feb-4ff0-8cfc-1ead442d855a", "f12f314c-110e-48a4-b3d1-ad98bdc515dd", "a9eaf918-1080-4e09-88e1-59067583701b", "d358fcf2-8e08-4805-bc3b-4f6dcc5e995c", "4ad8d731-f394-47f1-90e9-1bea58465603", "f6682abf-9234-42e5-9d70-a2ceb6f80e74", "fa1ef940-a8fd-4e3c-8687-00151d162004", "7472e086-1837-4eb3-b808-da5f433f0807",
      // Chica
      "226d4f82-7e58-4d6e-8ea6-66cc4f904f01", "1b95280f-b0fe-45cc-a2b5-60143386ed0e", "162f11d0-5987-4dba-8b5c-9c8b1e3b88d6", "ba971861-5f05-4324-b2f2-19994c9ee608", "275bc8fd-4ae2-47ba-9539-a3bd39dfecb1", "f5328e22-8380-410f-b799-d1b7047e3d5a", "08de4ca4-aab1-4c2e-a2ea-059fc36a10a1", "936438c3-9913-44ac-aa80-6024310e3d23",
      // Mediana
      "da4b19a9-7620-4e87-8a3e-5dbf1a629c23", "8a3e446d-40ab-4c0e-8b8b-3f831bb2ad0b", "63112db5-a068-4553-b541-9b02cfff6e8a", "99ee539a-870f-450b-8680-caba8e3a4900", "b6be9de9-e3d5-4092-a78d-60b85b007922", "590ec3e3-bba2-4819-ac9b-6808dafee9f2", "55cf8256-c94e-495b-a795-f574aa8647cf", "a0da518c-3df4-4991-839b-e0d0a0b36d13",
      // Grande
      "3d8fc971-734f-4b7e-b3d9-745597658806", "6bba88f7-b7ac-4ea6-a3cd-045aeaa172f6", "0aa21a09-e2de-41fc-b962-2a6d3b102511", "277e642b-dea6-4e82-9f8c-0c5f048b3b7e", "ed0e4782-3f29-45df-8f88-adf6614834dc", "7b34684d-d05a-4f55-b48a-136c194853c9", "28aebb6d-8bc5-4808-b7ac-a451e9e0722f", "991f1003-b522-4b84-b8ba-e63deff487e0",
      // XL
      "4380ebd3-b9ba-4d4f-a73e-121c913b72df", "7433e7f8-7382-4f85-bf6e-97bb10fd9e20", "77339c99-020c-44bf-a915-9a671fd93a1b", "66b02e43-82d6-4f88-80c6-6598dda421e7", "0b52edb4-67af-45c1-98be-6754b8491792", "08361dc6-adfc-4d5b-9821-e40ea14ab393", "42b705e0-3edc-45b2-8770-fe4d5c8be758", "1ca6e84d-41e2-4f83-a5fa-2054453a1146",
    ],
  },
  "coeur-sacre": {
    productId: "7a91483c-da75-4307-9658-4e6e03ab059a",
    colors: ["ciel", "foret", "framboise", "ivoire", "lilas", "soleil", "tangerine", "terracotta"],
    variantIds: [
      // Mini
      "d1bd4eb9-ea43-4046-8931-7198e9a37b8d", "ac61ea88-9270-4ffe-a0fc-2e497ab9f1ae", "769c1397-e8e3-492c-be0d-876cc4c6d1ea", "11891082-548f-4829-9305-1dd5e8d19920", "e3fa2b3e-cb10-490a-8af2-fdb23edee8fa", "90fa766e-6f97-4d20-9888-78f0770bdc1a", "da875a03-9350-4513-9aaa-cfeddc66a150", "afbf53f3-2b1e-4dad-bfc8-fb8f01a828ec",
      // Chica
      "93f24eb7-559b-4d61-854b-522692f3c4fc", "28a15be6-baeb-4291-b35a-f6a3ab2bbf64", "55adf3c7-5380-48d5-bfb7-ec7b6ed5cf5b", "2f85400e-f2db-4ccd-a187-c501372ead1c", "d467c65a-12ec-46ee-90f4-efa3598e16cf", "467df0a2-9a02-4394-a74e-9a7b20d0302d", "4c1ddf0a-26d0-4553-9b06-71c54a8ee9a4", "24c223a0-0fde-4e99-9b4a-43af2e03d1e4",
      // Mediana
      "b99c23cf-bf71-4dd7-b57a-51c32eedd35f", "32b5b569-63d7-499e-b227-411575c68daf", "4455ea9c-2090-481f-9486-94c305bcc761", "5d0132a1-4dc3-4b4b-bbb6-05f125d59eac", "dc84de18-bd34-442b-8563-2e3b38ec55ca", "dbcecd76-4590-460f-a0f3-3e5a8b436430", "7cb932d3-c6d5-4b70-8a6e-744ada33c8cc", "5df96ae9-e184-41b0-9f3f-915b2f349a81",
      // Grande
      "71c58fd9-8f14-4ec1-9844-a86e3c4a4ff8", "ba9f16f4-1a59-4468-9942-82d625150499", "1899fe26-56ec-4f68-8def-9545876647ee", "0ebf0003-9c58-49a2-85c6-bf6e6a050ee4", "62664ee6-a148-45be-9888-ec6133537d2e", "21644e1b-965a-48fd-bb8b-e55969bb2515", "dd46ad23-7458-47a9-89f9-e10cd6b225e4", "df65b9d4-31a7-4029-a3fe-5064fc5ac594",
      // XL
      "469aea3d-da8a-4582-b0ea-12a9b1931873", "525dcc61-2b87-4b80-b0c5-6607fd6cf240", "a590db52-8af2-4e76-98e0-ad8944ce3529", "42136d97-1787-4f66-86d8-495b2e3e0930", "826d9363-7e07-4677-8843-6fab85d54aee", "032c23ec-4d8f-43de-ad7e-2b1e18e01e59", "7e8d49c5-b443-4f2e-a82c-3f9b7f8d4085", "02ebf976-900f-4a9b-bd7f-7e33e40f68e7",
    ],
  },
  oracle: {
    productId: "0777abd6-6c8a-4014-ba38-f374744a165a",
    colors: ["ciel", "foret", "framboise", "ivoire", "lilas", "soleil", "tangerine", "terracotta"],
    variantIds: [
      // Mini
      "1639b8e1-e7f8-422d-9f4a-2c347355322e", "2f9d4a8c-e7d1-450b-9406-4ebebc434973", "9ff9ee11-4b68-48ed-8894-d497b1731c3a", "db5e3c04-c7d7-4dd2-bd36-413ed07fca12", "d29af558-f578-459a-9afd-d2f4ca873410", "273410b5-ba60-414c-8781-ca034fa5cac4", "8def6477-419d-4ab8-b421-06e9b08652b9", "ec7af473-3ecc-435f-a33d-0f7d646ec2d7",
      // Chica
      "d8a3af15-5652-4e9d-bfe3-64e9e2901d65", "0b4f00c7-1a31-4d67-8282-7aaf5924a0fc", "8c55bbc6-0a16-4e29-9b70-b33d0c487863", "c6063b87-4f1e-4f54-ac7c-8130fe7d3b39", "35e1a972-08dc-44f4-a2b5-34473fa4a925", "c1fd8fb9-cde8-4386-b973-af4ab5fbc1e5", "acbce0a0-b256-47f3-a2b2-e60fc5e15a9e", "543d86aa-ad09-4357-bc34-19ac7e2c872f",
      // Mediana
      "a47f0c95-fc3e-416b-bc72-8a94bf396c1d", "b29f6e43-ace6-466f-87d0-acecf5290d62", "aaf8d72f-9f42-4ba0-8836-687e4bff4b47", "804ae842-0dd9-4dd6-a691-7429d9884a54", "5f82fe08-93e9-4438-be57-5c42e2181170", "851fc758-7818-41fc-bdb7-d21148520642", "d14099c5-68f0-4705-8217-ca3684b81864", "aee2e0d2-d100-4dcd-b8cc-563a6d1388eb",
      // Grande
      "7f5e0778-1454-4a98-b067-c01ed30843a2", "5d9db39d-d183-4ac1-a869-b654f389bd19", "ce619c1f-e319-40e6-8816-1c7ccb4cd166", "1ca16346-fc01-42fe-b07a-920c0aff8e77", "d56234ab-1987-4b8f-a067-e4ac38ce8224", "40dfa706-1d52-4c1f-ae39-d453f44965a7", "fc48118c-ac24-46d2-ac85-d708f78ffd30", "c79fbf17-2f81-439d-b07d-aad9630a5c78",
      // XL
      "072cbde1-bebe-40f3-845c-a18256b2bf46", "ebcfc1fe-dfcc-44c2-9990-5ead41bdc2ef", "1c46dc88-824b-4d39-bfb5-7781d9cb041c", "2d87af3e-eb43-42e2-9058-62baf11a18d7", "bad6ce97-88e9-409b-a1d0-fbe8b0872650", "ed722d8a-4f42-4d5e-b09d-1354698635fc", "e4fca6fa-6c8f-4241-93dc-2d01a02e3a09", "e7883f4d-195e-4662-96df-c501121775bf",
    ],
  },
  confetti: {
    productId: "b38a1cac-693d-0866-78cb-e30a0840e47d",
    colors: ["rose", "macaron", "framboise"],
    variantIds: [
      // Mini
      "5b569724-4a5e-433f-a521-5261b27642f0", "cb9baa13-0189-4833-afb5-3be32b578ac5", "9c99596e-8ab4-4825-9ac7-e60d3fa621a4",
      // Chica
      "801839c7-31fb-490c-987f-125ebb8ab29c", "0d5ad33b-f4de-44b4-95cf-fc294adc6326", "e14b5131-e598-4239-b2e5-de4106605bee",
      // Mediana
      "27540aa6-f868-439d-b9a5-dde50de0c993", "a63dabf8-b80f-4c8d-800f-3d98cfde4702", "eb7bfe75-67bf-4973-b869-fd2a2caceb02",
      // Grande
      "bbba415b-b42a-49e4-9a8f-9af0247faff4", "0395e5f4-cf76-4c98-9367-0201d1ad9cd0", "b3c18868-b4d9-4921-bb97-422eb194bdc6",
      // XL
      "cbca59d6-1af2-41e8-b676-56b3af0adf33", "710a7114-bb97-49b7-8c86-b92635d6381f", "2094698e-d079-4458-b3f4-341ef114bca4",
    ],
  },
};

function resolveCoutureWixBinding(item: CuisineCartIdentity): WixCartBinding {
  const parts = item.id.split(":");
  const collection = coutureProducts[parts[1]];
  const colorIndex = collection?.colors.indexOf(parts[2]) ?? -1;
  const sizeIndex = coutureSizeIds.indexOf(
    parts[3] as (typeof coutureSizeIds)[number],
  );
  const variantId =
    collection && colorIndex >= 0 && sizeIndex >= 0
      ? collection.variantIds[sizeIndex * collection.colors.length + colorIndex]
      : undefined;

  if (!collection || !variantId) {
    return {
      supported: false,
      reason: `No pudimos identificar la variante Wix de ${item.name}.`,
    };
  }

  return supported(collection.productId, item.unitPrice, { variantId });
}

export function resolveCuisineWixBinding(
  item: CuisineCartIdentity,
): WixCartBinding {
  if (item.id.startsWith("couture:")) {
    return resolveCoutureWixBinding(item);
  }

  if (!item.id.startsWith("cuisine:")) {
    return {
      supported: false,
      reason: "Este artículo todavía no pertenece al catálogo conectado a Wix.",
    };
  }

  const parts = item.id.split(":");
  const productKey = parts[1];

  if (productKey === KIT_GUAURRICOOKIES_PRODUCT_KEY) {
    const slots = decodeKitGuaurriCookiesSlots(parts.slice(2).join(":"));

    if (slots.length !== 4) {
      return {
        supported: false,
        reason: "El Kit GuaurriCookies necesita exactamente 4 bolsas.",
      };
    }

    return supported(KIT_GUAURRICOOKIES_WIX_PRODUCT_ID, KIT_GUAURRICOOKIES_PRICE, {
      options: {
        "Bolsa 1": slots[0],
        "Bolsa 2": slots[1],
        "Bolsa 3": slots[2],
        "Bolsa 4": slots[3],
      },
    });
  }

  if (productKey === DESCUBRE_GUAURRITAS_PRODUCT_KEY) {
    const selection = decodeDescubreGuaurritasSelection(
      parts.slice(2).join(":"),
    );

    if (selection.cookies.length !== 2 || !selection.sazonador) {
      return {
        supported: false,
        reason:
          "Descubre Guaurritas necesita exactamente 2 GuaurriCookies y 1 Sazonador.",
      };
    }

    return supported(
      DESCUBRE_GUAURRITAS_WIX_PRODUCT_ID,
      DESCUBRE_GUAURRITAS_PRICE,
      {
        options: {
          "Bolsa 1": selection.cookies[0],
          "Bolsa 2": selection.cookies[1],
          Sazonador: selection.sazonador,
          GuaurriSticks: "×1",
        },
      },
    );
  }

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
    return supported("29576014-b5ff-46dd-85f8-875dbb4f5e06", 79);
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
