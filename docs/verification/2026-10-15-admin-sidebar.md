# Rounded administrative sidebar

The user approved a bounded navigation redesign inspired by the supplied rounded rail reference. Preserve the library palette and destinations; keep Painel visible; organize Acervo, Operações and Gestão as collapsible groups; offer an icon rail, Shiny Text names, a curved active item and elastic collapse. Mobile retains the existing modal navigation.

## Implementation

- AdminSidebar reuses the existing route inventory and ShinyText component. One group opens at a time; direct navigation opens the current route's group. Selecting a group in the compact rail expands it. The current group remains highlighted in the icon rail.
- Closed groups use `aria-hidden` and `inert`, with unique controlled-region IDs. Compact controls retain accessible names and show tooltips on hover or keyboard focus. The modal retains its existing focus handling and closes after navigation. Its navigation height is bounded so the close control stays visible on small screens.
- GSAP, already installed, animates measured accordion height over 240ms. The sidebar background and content use transform-based FLIP with a 500ms elastic settle; rapid reversals start at their current visual position. Labels fade over 180ms without being stretched. Reduced motion skips these spatial transitions, and the existing ShinyText reduced-motion styling remains in force.
- AdminLayout is now lazy-loaded inside the existing Suspense and authorization boundary, keeping administrative GSAP code out of the public entry chunk. URLs, authorization, database and APIs are unchanged.

## Verification

- The new grouping, active-route and compact-control tests first failed against the old sidebar, then passed. Final focused unit run: 13/13 across navigation, route scroll reset and UI motion components.
- Isolated browser scenario passed: active group and route, compact rail width, tooltip by keyboard, expansion from a group icon, navigation, keyboard group toggling, four consecutive collapse/expand clicks, mobile navigation and focus restoration, visible mobile close control, no settled horizontal overflow and reduced motion.
- ESLint, production build and whitespace checks passed. The existing lazy Three.js chunk still emits Vite's size advisory. No new dependency was added.
- Native browser review covered both themes and expanded/compact states using a disposable QA administrator, without changing the original user's session or data. Browser screenshots are private local artifacts: `.superpowers/sidebar-expandida.jpg`, `.superpowers/sidebar-compacta.jpg`; mobile review: `.impeccable/review/sidebar-mobile.png`.

## Reference correction and continuous overflow regression

The user rejected the first composition and reported horizontal scrolling. At their explicit request, GPT-6 Astra compared the reference and implementation, proposed the revised geometry and reviewed the resulting native-browser screenshot.

- Replaced the wide capsule with a 200px expanded shell / 60px icon rail, occupying 220px / 80px of the desktop grid. The shell follows viewport height, with a smaller brand mark and 36px navigation rows. Removed the oversized caption and identity header.
- Added the reference's continuous 34px cream spine, inset 7px from the right. The 149px navigation starts 10px from the left and ends exactly at the spine. Active rows share its solid fill and connect through 14px radial concave corners. Closed accordion regions reserve room around those corners. Navigation styling is now isolated in `admin-navigation.css`.
- Root cause of horizontal overflow: the former FLIP translated the entire resized content toward the right. A regression with an actual paid QA order and rendered charts measured document width 1581px in a 1440px viewport while collapsing. Removed that content transform; retained a small elastic pulse on the decorative glass and label fade. No global overflow suppression was added.
- The regression samples every animation frame throughout collapse and expansion at 1440px, 1100px and 1024px, then checks 768px and 360px. It failed on the former implementation and passed after the correction. Final browser run: 2/2 scenarios passed; navigation unit tests: 10/10 passed. ESLint, build and whitespace verification passed.
- Astra's final visual review confirmed the narrow rail, continuous spine and joined active curves, with no essential remaining adjustment. Private captures: `.superpowers/sidebar-astra-expandida.jpg` and `.superpowers/sidebar-astra-compacta.jpg`. The original local database was not modified for these tests.
