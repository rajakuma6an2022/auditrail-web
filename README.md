# Auditrail Web

Next.js 16 + Tailwind CSS v4 frontend for **Auditrail**: Login → Event Explorer → Event Detail.
API: [auditrail-api](https://github.com/rajakuma6an2022/auditrail-api).

## What it does

- **Event Explorer**: a virtualized, infinite-scrolling table (TanStack Query `useInfiniteQuery`, Virtual and Table). Only a small window of rows is in the DOM however many are loaded, and pages are cached so returning to a list is instant
- **Filters live in the URL** (shareable and back-button safe): search, level, service, action, time-range presets and a custom range with validation
- **Event Detail**: what happened, when, where, who, the message and the metadata as JSON, with a Copy Event ID button
- **Keyboard and UI**: `/` focuses search, `?` opens the shortcuts dialog (native `<dialog>`), account menu, toast notifications, light and dark themes without a flash
- **States**: loading, empty, error, not-found and unauthorized states on every screen, plus shared 404 and 500 pages
- **Passwordless sign-in** with a magic link; `/api/*` is proxied to the API so the session cookie stays first-party, and a 401 anywhere returns the user to login

## Quality

|                                                    | Result                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| Unit and component tests (Vitest, Testing Library) | **95**                                                                     |
| End-to-end tests (Playwright, real browser)        | **44**, including axe WCAG A/AA checks in light and dark mode              |
| Lighthouse, desktop (3 runs)                       | Performance 100, Accessibility 100, Best Practices 100, SEO 100            |
| Lighthouse, mobile (3 runs)                        | Performance 94, other categories 100 (LCP 2.4 s, TBT 210 to 230 ms, CLS 0) |

Accessibility details: severity is never conveyed by colour alone, WCAG AA text contrast is guarded by a unit test, and the filter controls, table and dialogs are keyboard operable.
Lighthouse scores are lab results for the tested build and conditions.

GitHub Actions runs two jobs: **check** (format, typecheck, lint, unit tests, build) and **e2e** (starts PostgreSQL, builds the API from the API repo, seeds deterministic data and runs Playwright).

## Scale

The API was measured on a 510,501-event dataset: filtered first page about 0.5 ms with the composite index (575 ms with a sequential scan) and deep pagination 0.117 ms with keyset versus 45.792 ms with `OFFSET` (median of 3 runs).
Details and method are in the [API README](https://github.com/rajakuma6an2022/auditrail-api#measured-results).

## Run locally

```bash
npm install
cp .env.example .env.local      # API_URL=http://localhost:4000
npm run dev
```

`npm test` runs the unit tests; `npm run e2e` runs Playwright (it needs the API and a seeded Postgres, see `.github/workflows/ci.yml` for the exact setup).

## Known limitations

- Sign-in is a magic link to an allow-listed address (the email provider is on its free tier), so there is no public login
- The scroll position of the list is not restored reliably after opening an event and going back
- TanStack Table adds little here because the order is fixed by the server; it is used for column structure
