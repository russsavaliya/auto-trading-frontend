# Trading Admin — dashboard

React + Vite admin panel for the TradingView → Upstox bridge, in both its paper
and live environments. Reads the bridge's `/api/*` routes: realised P&L, open
positions marked to the current option premium, closed-trade history, the
per-symbol state machine, and the inbound webhook audit trail. Also carries the
per-environment kill switch and the daily Upstox connection.

The backend lives in its own repository — this app only talks to it over HTTP.

## Running it

```bash
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

| Variable | What it is |
|---|---|
| `VITE_API_BASE_URL` | Where the bridge is listening. Production: `https://139-59-52-230.sslip.io` |

On Vercel, `VITE_API_BASE_URL` must be a **Config** variable, not a Secret — every
`VITE_*` value is compiled into the public bundle, so Vercel refuses to store
one as a secret. The admin password is deliberately NOT a frontend variable for
the same reason: login posts it to the backend's `/api/login`, which checks it
against its own `ADMIN_PASSWORD`, and only then is it sent as an
`x-admin-password` header on every request. Nothing is stored beyond
`sessionStorage`, so closing the tab logs you out.

```bash
npm run build             # production bundle into dist/
npm run preview           # serve that bundle locally
npm run lint              # oxlint
```

## Phone app (PWA)

The dashboard installs as a phone app (`vite-plugin-pwa`, configured in
`vite.config.js`).

- **Install.** Android/Chrome: the **Install** button on Home, or Settings →
  Phone app. iPhone: Safari → Share → **Add to Home Screen** (other iPhone
  browsers cannot install).
- **Updates.** A new deploy is never swapped in under an open app. The app
  checks hourly and shows "A new version is ready — Update".
- **What is cached.** Only the app shell (HTML, JS, CSS, icons) and the Inter
  font. The bridge API is a different origin and is never cached — a stale
  position or P&L on a trading screen is worse than an error.
- **Vercel.** Deployment Protection sits in front of the site, so the manifest
  link carries `crossorigin="use-credentials"` (`useCredentials: true`);
  without it the phone never offers Install. `vercel.json` serves `sw.js`
  with `no-cache` so a new version is always picked up.
- **Icons** in `public/` are generated from `public/favicon.svg`. To redo them,
  in an empty folder outside the repo:
  `npm i @vite-pwa/assets-generator@^1`, copy the SVG in as `logo.svg`, add a
  `pwa-assets.config.mjs` using `minimal2023Preset` with `padding: 0.15` and
  `resizeOptions: { background: '#0c0a09' }` for the `maskable` and `apple`
  entries, run `npx pwa-assets-generator`, and copy the PNGs + `favicon.ico`
  back into `public/`. (Kept out of `devDependencies` so `sharp` is not
  installed on every Vercel build.)

## Project structure

```
src/main.jsx                       Mounts the router and the app
src/app/App.jsx                    Providers
src/app/AppRoutes.jsx              Route table + the single auth gate

src/api/                           One module per backend controller
  auth.js  config.js  pnl.js  positions.js  trades.js  webhookLogs.js
src/lib/apiClient.js               The only place that calls fetch — 401 handling
src/lib/cn.js                      clsx + tailwind-merge class joiner
src/lib/chartTheme.js              Reads the CSS palette back for Recharts

src/context/AuthContext.jsx        authed / login / logout

src/components/ui/                 Presentational primitives, no data access
  Card.jsx  Badge.jsx  Button.jsx  Input.jsx  Table.jsx
  StatTile.jsx  Pagination.jsx  Feedback.jsx
src/components/layout/             Shell: DashboardLayout, Sidebar, Topbar,
                                   MobileNav (phone tab bar), Logo
src/components/home/               BotStatusCard — Home's plain-English status
src/components/pwa/                UpdateBanner, InstallCard, InstallNudge
src/components/charts/             ChartTooltip (shared by the Report charts)
src/components/tables/             RunningTrades, RecentTrades, Positions,
                                   WebhookLogs, ContractLabel

src/hooks/                         useTradingMode, useInstallPrompt, useMediaQuery
src/pages/                         One file per route
src/styles/index.css               Tailwind entry + the design tokens
src/utils/format.js                Every number and time on the dashboard
src/utils/signals.js               How an alert reads: reason, label, outcome
src/utils/market.js                IST market hours
```

The `@` alias points at `src/`, so nothing imports by counting `../` levels.

## Design system

Tailwind CSS v4. Every colour, radius and shadow is a token declared in the
`@theme` block of `src/styles/index.css` and used through the utility it
generates (`bg-canvas`, `text-muted`, `border-line`). Do not hard-code a hex in
a component — the charts are the one exception and they read the same tokens
back through `lib/chartTheme.js`.

| Token | Value | Used for |
|---|---|---|
| `canvas` | `#fafaf9` | The page |
| `surface` | `#ffffff` | Cards, tables |
| `ink` | `#0c0a09` | Headings, primary buttons, active nav |
| `muted` | `#78716c` | Labels, secondary values |
| `line` | `#e7e5e4` | Every border |
| `brand` | `#4f46e5` | Navigation accent, focus rings |
| `profit` / `loss` | `#047857` / `#b91c1c` | P&L sign |
| `side-call` / `side-put` | `#4f46e5` / `#c2410c` | Option side |

Two rules worth keeping:

- **Option side is never green/red.** Those two hues already mean profit and
  loss here, and a red `PUT` badge beside a red loss figure reads as if the
  side were the bad news.
- **Colour never carries P&L on its own.** The sign leads every figure
  (`+₹443` / `−₹4,910`), bars sit above or below the zero line, and every bar
  is directly labelled. Green and red are ~ΔE 7 apart under deuteranopia, so
  the hue is only ever a reinforcement.

Icons are [lucide-react](https://lucide.dev). Type is Inter, with tabular
figures switched on for anything read down a column.
