# Property Investor Tools

A static multi-tool site for property investors.

Includes a global portfolio summary PDF export from the page header.

## Included tools

- Net Proceeds Calculator
  - Sale proceeds after selling costs, CGT estimate, and mortgage payout
  - Ownership share support
  - Tax year switching (2025-26, 2026-27, 2027-28)
  - Year datasets (FY 2024-25 to FY 2028-29) with scenario save/load/reset
  - Current dataset badge and last-used dataset restore
  - JSON import/export for backups and sharing
  - PDF report export
- Simple Performance Calculator
  - Annual-only inputs for one-year snapshot (income, expenses, fees)
  - Net operating cashflow, margin, yield, cost ratio, and health summary
  - Ownership share scaling for annual and monthly net outcomes
- Advanced Performance Calculator
  - Annual category totals and monthly cashflow tracking
  - Statement Data Hub modal for dataset selection, imports, and month-level editing
  - Statement import wizard for monthly rows (CSV and PDF)
  - Auto-detects statement FY from statement dates and switches dataset when needed
  - Main calculator view stays focused on compiled annual performance outcomes
  - Net annual/monthly outcomes, margin, and yield views
  - Year dataset selector with current-dataset badge and restore-last-year behavior
  - Compact multi-year trend summary (net, margin, yield) with sparkline
  - Scenario actions: save/load/reset with per-year local storage
  - JSON import/export for backups and sharing
  - Quick monthly entry actions and quarterly rollups
- Simple Investment Fund Calculator
  - Monthly income projection from a capital-stable model
  - 4.00% + RBA cash rate return assumption
  - Scenario actions: reset plus JSON export/import
  - 12-month distribution schedule and summary

## Files

- `index.html` - tool menu, calculator UIs
- `styles.css` - visual design, responsive layout, menu styles
- `app.js` - modular source entrypoint
- `app.bundle.js` - browser bundle loaded by `index.html`
- `js/` - calculator modules, shared runtime, UI helpers, PDF/reporting logic
- `TECH_DEBT_TASKS.md` - prioritized cleanup backlog
- `PRODUCT_DIRECTION.md` - product goals and cleanup guardrails

## Run

1. Open `index.html` in a browser.
2. Use the menu tabs to switch tools.
3. Enter values and review live-updating results.

## Development

Install dependencies:

```bash
npm install
```

Quality checks:

```bash
npm run lint
npm run format:check
npm test
npm run audit:a11y
npm run build:bundle
npm run verify
```

Auto-format supported files:

```bash
npm run format
```

Rebuild browser bundle after JS changes:

```bash
npm run build:bundle
```

Run production smoke test:

```bash
npm run smoke:live
```

## GitHub + Netlify Hardening (One-Time)

1. In GitHub, enable branch protection for `main`:
   - Require pull request before merge.
   - Require status checks to pass.
   - Select checks from `.github/workflows/ci.yml`:
     - `Lint, format, test, bundle`
     - `Accessibility and browser smoke`
2. In Netlify, keep deploys connected to the GitHub `main` branch.
3. Avoid manual drag-and-drop deploys for normal releases so CI remains the gatekeeper.

## Notes

- This is a planning tool, not financial or tax advice.
- CGT estimates do not include every rule (offsets, levies, HELP, etc.).

## Rate Update Checklist

1. Update tax brackets in `js/config/constants.js` (`TAX_BRACKETS`).
2. Update fund return assumptions in `js/config/constants.js` (`FUND_BASE_SPREAD_PERCENT`, `FUND_RBA_CASH_RATE_PERCENT`).
3. Confirm labels and copy in `index.html` still match the updated rates/years.
4. Run quality gates:
   - `npm run lint`
   - `npm run format:check`
   - `npm test`
   - `npm run audit:a11y`
5. Rebuild browser bundle: `npm run build:bundle`.

## Pre-Deploy Checklist

1. Install dependencies: `npm install`.
2. Run quality gate: `npm run verify`.
3. Run browser checks:
   - `npm run audit:a11y`
   - `node scripts/live-smoke.mjs http://127.0.0.1:4173` (while serving locally)
4. Smoke test in browser:
   - Tab switching works.
   - Net Proceeds values update live and PDF export works.
   - Performance calculator monthly edits and summary KPIs update.
   - Fund calculator presets/manual input update schedule and totals.
5. Merge to `main` and let Netlify deploy from GitHub.
6. Post-deploy validation: `npm run smoke:live`.
