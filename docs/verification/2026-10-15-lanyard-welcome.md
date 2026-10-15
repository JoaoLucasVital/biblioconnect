# Profile lanyard, editorial motion and first-account welcome

User approved the bounded design in chat: physical reader card with viewport tether, moderated review cards/stars, Shiny Text header, subtle main-title entrances, top-of-page navigation, a single loading indicator and the JãoDev welcome curtain shown once for future accounts.

## Implementation

- React Bits Lanyard replaces the active profile card. Geometry, spring/rope simulation, drag/flip and falling entrance use existing Three.js. No dependency was added. The photo stays complete; its private bytes are fetched through the existing authenticated API and used only for an in-browser texture. No portrait or generated personal texture is committed.
- The tether is fixed at viewport top, behind the navigation. The card rests in its desktop column while the transparent scene spans the window so a dragged badge does not clip at the column edge. On mobile it shrinks as the page scrolls. Reduced motion disables the drop, breeze and drag; a readable fallback remains when WebGL cannot initialize.
- A separate clipped pointer target follows projected card corners. Transparent canvas space passes clicks through to the page. A reviewer identified this issue before completion; the fix preserves profile photo controls beneath the fixed scene.
- Moderation separates book, rating, comment, reader, date and state. Existing approve/hide/delete endpoints and deletion confirmation remain. Public book reviews also use consistent star icons and card styling.
- All page h1 titles and large home titles use a reusable Blur Text-inspired entrance; the header uses a Shiny Text-inspired sheen. Existing palette/fonts/heading semantics are retained. CSS handles these effects, including reduced-motion and print variants.
- Scroll resets on route/search and authentication changes. Explicit catalog anchors still work. Chat scrolls only its message container and no longer pulls the whole page downward.
- BookLoader registers loading tasks with one shared provider. It waits 150ms, then renders one indicator regardless of overlapping loads. Auth guards use the same indicator; the six-layer flipping-page graphic was removed.
- `welcomeSeenAt` is nullable for future users. The additive migration backfills existing accounts. Authenticated, CSRF-protected `/me/welcome/claim` updates only the current user and claims atomically; simultaneous tabs cannot both show the curtain. First authenticated email login occurs after normal confirmation; Google accounts follow the same claim path. No confirmation bypass was introduced.
- The introduction uses the JãoDev four-word crossfades and curved curtain exit, adapted to library copy. It supports skip/Escape, a completion timeout and reduced-motion preferences. Claiming before playback intentionally favors at-most-once behavior: closing a tab mid-presentation does not replay it later.

## References and license

- [React Bits Lanyard](https://reactbits.dev/components/lanyard), [vendored source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Lanyard/Lanyard.jsx), fetched 2026-10-15. Existing `frontend/src/features/account/vendor/LICENSE.react-bits.md` contains David Haz's MIT + Commons Clause notice. Local changes: ref synchronization in effect, hidden-page pause and projected card-only pointer target with disposal.
- [Shiny Text](https://reactbits.dev/text-animations/shiny-text) and [Blur Text](https://reactbits.dev/text-animations/blur-text): adapted as lightweight CSS effects using the project's motion tokens, rather than installing another animation package.
- Owned JãoDev reference: sibling `jao-lucas-portfolio/src/scripts/interactions.ts`, `src/styles/global.css` splash rules and `src/pages/index.astro` splash markup; located through the requested “Criar Instagram profissional” chat and source inspection.

## Evidence

- Frontend: 137/137 tests in 37 files passed; later guard-loader verification 8/8 passed. New tests cover route/login scroll resets, deduped loading, StrictMode welcome, existing-account exclusion, concurrent claim and moderation stars/actions.
- Backend suite: 59 passed, one integration entry skipped by its existing environment gate. Focused welcome migration/claim tests: 2/2 passed. No failing test was ignored as a product success.
- Browser QA uses isolated API/database and generated accounts: profile editing/mobile, complete-photo persistence, one-time welcome across browsers, fixed tether and top-of-page navigation passed. Global sparks/green hold/rating passed. Review approval exposes an actual review publicly and hiding removes it again; initial fixture rejection was the existing eligibility rule, corrected by creating the required QA order.
- One combined browser run exceeded its 30-second aggregate scenario limit after adding the profile click-through regression. This multi-page WebGL/cross-browser scenario has a local 60-second limit. Final rerun with the window-wide scene passed in 29.6 seconds, including the click-through regression, automatic compact mobile card and cross-browser welcome persistence.
- Lint and production build passed. The shared Three.js chunk still exceeds Vite's advisory 500kB warning; it loads lazily and is shared with the existing book scene.
- Original runtime was briefly stopped with explicit permission, privately backed up, migrated and reopened. Existing row hashes and media were preserved: 22 books, five accounts and seven orders at restart. No QA order was written to that database.

## Overall plan

Email-provider activation, real Stripe payments, hosted OAuth, hosted data reconciliation, secure hosted admin and deployment remain separate pending work. This stage does not claim deployment readiness.

## Follow-up: document-top tether

The user corrected the scroll behavior after reviewing the profile: the tether belongs to the top of the document, so the badge must leave the viewport with the beginning of the profile. This supersedes the viewport-fixed tether and mobile shrink described above.

- The visual scene is portaled to the body and positioned absolutely at document top. The inline holder still reserves layout space and supplies accessible identification. The existing drag, rope elasticity, entrance and card-only hit target remain unchanged.
- Removed the mobile scroll listener and compact transform. The scene has a viewport width limit to prevent horizontal overflow during responsive resizing.
- A new browser regression failed against the previous fixed positioning (557px document-anchor error), then passed with the correction at desktop and mobile widths. Final focused browser run: 2/2 passed, including welcome persistence, profile control click-through and no mobile overflow. Lint, production build and whitespace checks passed; the existing lazy Three.js chunk warning remains.
- Native browser verification confirmed the frame at -720px with document scroll at 720px; saved books remain unobstructed. The original application and database stayed running throughout. Private screenshot: `.superpowers/lanyard-document-top.jpg`.
