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
