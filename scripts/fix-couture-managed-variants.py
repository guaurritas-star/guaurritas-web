from pathlib import Path

path = Path("src/lib/wix-commerce-map.ts")
source = path.read_text()

start_marker = 'const coutureProducts: Record<string, { productId: string; colors: Record<string, string> }> = {'
end_marker = 'export function resolveCuisineWixBinding('

start = source.index(start_marker)
end = source.index(end_marker, start)

replacement = r'''type CoutureProductConfig = {
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

'''

updated = source[:start] + replacement + source[end:]
path.write_text(updated)
