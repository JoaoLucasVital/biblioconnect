# Checkout and account interface corrections

User-requested UI correction stage, following the live ORS integration. No schema or backend contract changes.

## Result

- Catalog purchase dialog previews the book and navigates to protected `/checkout/:livroId`. Entering checkout does not create an order.
- Checkout contains pickup/delivery choice, structured address fields and automatic ViaCEP lookup. Manual entry remains available when lookup fails. Requests abort on unmount/change and time out after 10 seconds.
- Address edits invalidate the freight quote. Quote and purchase use the same full address, including complement. Purchase sends no client-controlled price and keeps existing server recalculation, CSRF and idempotency protections.
- Only the 1200ms hold action confirms a purchase. Keyboard hold remains available; early release, blur and disabled state cancel the hold. The click-only alternative was removed.
- Reader orders show covers, totals, payment/delivery status and existing actions. Empty categories have no dead anchor and do not consume full sections.
- Atlas retains its constellation, selected-book panel and accessible list mode. The redundant eight-book strip was removed.
- Profile no longer shows Google linking UI. Login/signup keep official GIS with pill shape and theme-aware styling. `useSyncExternalStore` fixes initial dark-theme subscription timing.

## Verification

- Frontend unit/component suite: **131 tests in 33 files passed**. Includes checkout creation guard, ViaCEP/manual entry, quote invalidation, identical quote/purchase addresses, hold-only confirmation and GIS theme regression.
- Production-browser QA: **7 scenarios passed across isolated runs**. Catalog suite passed 5/5, then dialog accessibility and motion passed 2/2 in a fresh QA environment. The combined first run hit the existing five-login-per-quarter-hour account limit for its final admin fixtures; the production limit was not weakened.
- Latest lint, production build and whitespace check passed. Existing large 3D bundle warning remains.
- Real original environment: public campus CEP 57051-565 filled Rua José de Alencar, Farol, Maceió/AL; ORS returned street-level same-origin quote 0 km / R$5.00, explicitly approximate, checkout total R$37.00. No real purchase submitted.
- Browser screenshots verified orders with an existing paid purchase, rounded Google button without white surround, and checkout at 360px with no horizontal overflow (345px document / 360px viewport). Temporary viewport override reset.
- Profile DOM verified zero Google button containers. Original database backed up and restarted: 22 books, 5 accounts, 6 existing orders. QA writes used isolated data.

## Remaining overall-plan work

Real email provider and Nodemailer security upgrade, Stripe payment integration, hosted OAuth origins, secure hosted admin, reconciliation of local data changes since the Neon snapshot, protected preview, final review and deployment remain pending. This UI stage does not claim those integrations are complete.
