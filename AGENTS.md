<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Guaurritas shopping UX

Use https://lawsofux.com/es/ as a design reference for frontend changes, alongside the existing Guaurritas identity (Cinzel, Mansalva and its approved palette).

- Jakob: keep familiar catalogue, product, cart and purchase behavior; explain brand-specific category names visibly.
- Hick: group choices by task and disclose secondary details progressively; retain information buyers need to decide.
- Fitts: keep mobile targets at least 48 px high with space between independent actions; check reachability and overlap.
- Proximity and similarity: group price, selected configuration and purchase action; use consistent visual treatment for equivalent controls.
- Aesthetic-usability: review visual coherence and actual task completion separately; attractive retro chrome is insufficient evidence of usability.
- Doherty: give prompt, honest feedback for user actions and loading; do not add artificial purchase delays or claim unmeasured response times.

Treat these principles as design heuristics. Validate the buyer flow, keyboard focus, reduced motion, cart preservation and delivery restrictions. State when mobile behavior has only been reviewed in code or emulation; do not claim a real-device test without one.
