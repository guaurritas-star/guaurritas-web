from pathlib import Path

p = Path('src/lib/wix-commerce-map.ts')
s = p.read_text()
marker = '\nexport function resolveCuisineWixBinding(\n'
assert s.count(marker) == 1

block = '''

const coutureProducts: Record<string, { productId: string; colors: Record<string, string> }> = {
  amulette: {
    productId: "eb5fc006-e815-4c42-b230-01e8fc8458bb",
    colors: {
      crepuscule: "Crépuscule", foret: "Fôret", ciel: "Ciel", framboise: "Framboise",
      ivoire: "Ivoire", lilas: "Lilas", soleil: "Soleil", tangerine: "Tangerine", terracotta: "Terracotta",
    },
  },
  abeille: {
    productId: "e90af6ed-c19e-4ca3-8bc0-82f5d4276b55",
    colors: {
      ciel: "Ciel", foret: "Fôret", tangerine: "Tangerine", lilas: "Lilas",
      ivoire: "Ivoire", framboise: "Framboise", soleil: "Soleil", terracotta: "Terracotta",
    },
  },
  "coeur-sacre": {
    productId: "7a91483c-da75-4307-9658-4e6e03ab059a",
    colors: {
      ciel: "Ciel", foret: "Fôret", framboise: "Framboise", ivoire: "Ivoire",
      lilas: "Lilas", soleil: "Soleil", tangerine: "Tangerine", terracotta: "Terracotta",
    },
  },
  oracle: {
    productId: "0777abd6-6c8a-4014-ba38-f374744a165a",
    colors: {
      ciel: "Ciel", foret: "Fôret", framboise: "Framboise", ivoire: "Ivoire",
      lilas: "Lilas", soleil: "Soleil", tangerine: "Tangerine", terracotta: "Terracotta",
    },
  },
  confetti: {
    productId: "b38a1cac-693d-0866-78cb-e30a0840e47d",
    colors: { rose: "Rosé", macaron: "Macaron", framboise: "Framboise" },
  },
};

const coutureSizes: Record<string, string> = {
  mini: "Mini", chica: "Chica", mediana: "Mediana", grande: "Grande", xl: "XL",
};

function resolveCoutureWixBinding(item: CuisineCartIdentity): WixCartBinding {
  const parts = item.id.split(":");
  const collection = coutureProducts[parts[1]];
  const color = collection?.colors[parts[2]];
  const size = coutureSizes[parts[3]];

  if (!collection || !color || !size) {
    return {
      supported: false,
      reason: `No pudimos identificar la colección, color o talla de ${item.name}.`,
    };
  }

  return supported(collection.productId, item.unitPrice, {
    options: { Tamaño: size, Color: color },
  });
}
'''

s = s.replace(marker, block + marker)
old = '''  if (!item.id.startsWith("cuisine:")) {
    return {
      supported: false,
      reason: "Este artículo todavía no pertenece al catálogo Cuisine conectado a Wix.",
    };
  }
'''
new = '''  if (item.id.startsWith("couture:")) {
    return resolveCoutureWixBinding(item);
  }

  if (!item.id.startsWith("cuisine:")) {
    return {
      supported: false,
      reason: "Este artículo todavía no pertenece al catálogo conectado a Wix.",
    };
  }
'''
assert s.count(old) == 1
s = s.replace(old, new)
p.write_text(s)
