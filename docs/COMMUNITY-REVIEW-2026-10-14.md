# Community carousel — review implementation

The welcome window keeps shopping before community. The community carousel uses real published Wix comments via the existing, origin-checked iframe bridge. It never stores copied testimonials in source code and never generates ratings or photographs.

## Behavior

- The parent reads the name, rich-text paragraphs and first attached photograph from the Wix comments widget. Videos remain available at the original comments destination; video-only comments display as text in the carousel.
- The carousel chooses up to five unique opinions from the comments Wix has already rendered, shuffles them and avoids the previously displayed first opinion when at least two exist. Only that previous ID is stored in sessionStorage; blocked storage does not block the feature.
- No automatic rotation. Touch scrolling, keyboard scrolling and 48px arrow controls are available. Photos use the Wix image transformation URL, lazy loading and contain sizing to avoid cropping.
- Missing comments do not block shopping. A bounded observer waits for Wix to mount the comments. Both observer and listeners are cleaned up. After 12 seconds the interface offers the existing comments link instead of an indefinite loading message.
- Welcome/iframe readiness is tied to hydration and paint, rather than all desktop images and fonts. Image dimensions remain reserved.
- Deep-link handling, dismissal persistence, fulfillment, store and cart state are unchanged.

## Verification

- 17 automated tests passed, including data validation, image-host rejection, uniqueness and selection changes. Existing cart and checkout tests passed.
- ESLint and Next production build/TypeScript passed. Embed JavaScript syntax and git whitespace checks passed.
- The extraction selectors were run read-only against the real published Wix DOM: 10 rendered opinions had the correct names and complete comments; six had photo attachments. The site reports 11 comments, with more loaded using the original comments control. The carousel does not fetch hidden pages of comments.

## Pending before publication

- End-to-end visual verification of the new parent bridge and iframe together, including mobile scroll and constrained desktop height. This implementation has not been deployed to the public site.
- No physical phone testing or measured production speed improvement is claimed.
- The GitHub Pages app alone has no access to cross-origin Wix comments. It offers the original comments link when used without the Wix parent.
- Wix comments use DOM hooks rather than a documented data API in this integration. If Wix changes these hooks, the graceful fallback remains available but the extraction adapter will need updating.
