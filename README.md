# Auditrail Web

Next.js 16 + Tailwind v4 frontend for **Auditrail**: Login → Event Explorer → Event Detail.
API: [auditrail-api](https://github.com/rajakuma6an2022/auditrail-api).

## Try it (demo account)

The login screen has a **Try the demo** button: a read-only session on a demo account, no email needed. The data is synthetic.
The button only appears when the API is configured for it. Normal sign-in is by magic link to an allow-listed email.

## Highlights

- **Virtualized infinite scroll** (TanStack Query `useInfiniteQuery` + Virtual + Table): only a small window of rows is in
  the DOM however many are loaded. Pages are cached, so Back from an event restores the list and the scroll position
- **Filters live in the URL** (shareable): search, level, service, action, time-range presets and a custom range with validation
- **Accessibility**: severity is never colour-only, WCAG AA text contrast is guarded by a unit test, axe checks run in
  jsdom and in real Chromium (light and dark), keyboard shortcuts (`/` focus search, `?` help), native `<dialog>`
- Loading, empty, error, not-found and unauthorized states on every screen; shared 404 and 500 pages; toast notifications
- `/api/*` is proxied to the API so the session cookie stays first-party; a 401 anywhere returns the user to login

## Quality

- `npm test`: 100 unit/component tests (Vitest, Testing Library, axe-core)
- `npm run e2e`: 46 Playwright tests including axe WCAG A/AA checks in light and dark mode
- GitHub Actions runs format check, typecheck, lint, tests, build and the E2E suite against a real API and PostgreSQL

## Run locally

```bash
npm install
cp .env.example .env.local      # API_URL=http://localhost:4000
npm run dev
```

## Trade-offs

- TanStack Table adds little here because the order is fixed by the server; it is used for column structure
- Scroll restore is kept in memory, so it resets on a full page reload
- Sign-in is by magic link to an allow-listed address, so a public reviewer cannot log in: see the demo video and screenshots instead
