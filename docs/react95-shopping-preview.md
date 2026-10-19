# Shopping preview — React95

This branch is a review draft. Do not merge to `main` before visual QA; `main` deploys production automatically.

## Changes

- React95 Window, WindowHeader and Button primitives with the approved palette and Cinzel/Mansalva; no global reset.
- Next compiler/SSR style registry and filtering for React95 v4 styling props under styled-components v6.
- Compact welcome photo and purchase buttons with local/national explanations; consistently sized community cards, including an explicit no-photo state.
- Compact store delivery/category controls with the existing cart count and cart event. Product configurators, fulfillment store and checkout bridge are reused.
- SPEI/card totals as labeled rows, readable delivery text and native quantity buttons.
- A Tienda shortcut in the existing mobile desktop taskbar. Existing Wix visibility/scroll behavior is retained; this is not a new fixed navigation layer inside the growing iframe.
- Removed obsolete welcome-button and store-navigation styles from three older stylesheets.

## Verified

- Production static export and TypeScript compile.
- ESLint and `git diff --check`.
- 28 Node tests: existing cart/reorder/fulfillment/pricing/session/deep-link guards plus real React95 server rendering, native button attributes, scoped styles and no React DOM styling-prop warnings.

## Required before merging

The remote browser could not reach the local dev server (`http://localhost:3001/`, connection refused). No new desktop/mobile screenshots or interactive browser validation are claimed.

- Render at 360/390, 768 and 1366/1440 px, including short screens. Check text wrapping, control size, focus, horizontal overflow and content after vertical scrolling.
- Welcome close/minimize/reopen; both delivery entries; direct product/app/checkout-return links.
- Configure Petcake and add it, then add another product; switch Cuisine/Couture; confirm count, totals, quantities and persistence.
- Change fulfillment with a conflicting cart and check the existing confirmation/guard without losing products.
- Check store/product/cart scroll and focus in the actual Wix iframe, including WhatsApp overlap and safe areas.
- Check real community data, photos and the external community anchor in Wix. Standalone preview has no parent Wix bridge and must show its existing fallback.
- Confirm no new console/hydration warnings; check styling and late asset loading on a physical phone.

Wix cookie/chat settings and production are unchanged. No order was submitted or payment made in this draft.
