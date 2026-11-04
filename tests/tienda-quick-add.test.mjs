import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cuisine = readFileSync("src/components/apps/CuisineStoreApp.tsx", "utf8");
const css = readFileSync("src/app/cuisine-catalog-ux.css", "utf8");
test("Quick add only targets single-presentation products without choices", () => {
  assert.match(cuisine, /function canQuickAdd\(product: CuisineProduct\)/);
  assert.match(cuisine, /product\.options\.length === 1/);
  assert.match(cuisine, /!product\.customizable/);
  assert.match(cuisine, /!recipeProductIds\.has\(product\.id\)/);
  const configured = cuisine.slice(cuisine.indexOf("const configuredProductIds"), cuisine.indexOf("function canQuickAdd"));
  for (const id of ["petcakes", "guaurricookies", "chilaquidogs", "gorrito", "velitas"]) {
    assert.ok(configured.includes(`"${id}"`), id);
  }
});

test("Quick add reuses the detail view's generic cart line and delivery guard", () => {
  // Detail view: cuisine:${id}:${optionIndex}:${petType}:${petProtein}:${customize}:${photos}:${text}
  assert.match(cuisine, /id: `cuisine:\$\{selectedProduct\.id\}:\$\{optionIndex\}:\$\{petType \?\? ""\}:\$\{petProtein \?\? ""\}:\$\{customize \?\? ""\}:\$\{inspirationPhotos\.length\}:/);
  assert.match(cuisine, /id: `cuisine:\$\{product\.id\}:0::::0:`/);
  const quick = cuisine.slice(cuisine.indexOf("const quickAddToCart"), cuisine.indexOf("const cuisineCartTrigger"));
  assert.match(quick, /cartFulfillmentConflict\(fulfillmentMode\)/);
  assert.match(quick, /getCuisineOptionPrice\(product\.id, 0, option\.price, fulfillmentMode\)/);
  assert.match(quick, /announceCartAddition\(message\)/);
});

test("Card and quick-add stay separate targets of at least 48 px", () => {
  assert.match(cuisine, /className="cuisine-catalog-card-shell"/);
  assert.match(cuisine, /className="boutique-purchase cuisine-catalog-quick-add"/);
  assert.match(css, /\.cuisine-catalog-card-shell > \.cuisine-catalog-quick-add \{[^}]*min-height: 48px/);
  assert.match(css, /\.cuisine-catalog-quick-add-status > button \{[^}]*min-height: 48px/);
});
