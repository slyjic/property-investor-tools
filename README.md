# Property Investor Tools

A static multi-tool site for property investors.

## Included tools

- Net Proceeds Calculator
  - Sale proceeds after selling costs, CGT estimate, and mortgage payout
  - Ownership share support
  - Tax year switching (2025-26, 2026-27, 2027-28)
  - PDF report export
- Performance Calculator
  - Annual category totals and monthly cashflow tracking
  - Net annual/monthly outcomes, margin, and yield views
  - Quick monthly entry actions and quarterly rollups
- Simple Investment Fund Calculator
  - Monthly income projection from a capital-stable model
  - 4.00% + RBA cash rate return assumption
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
```

Auto-format supported files:

```bash
npm run format
```

Rebuild browser bundle after JS changes:

```bash
npm run build:bundle
```

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
2. Run quality gates:
   - `npm run lint`
   - `npm run format:check`
   - `npm test`
   - `npm run audit:a11y`
3. Build bundle: `npm run build:bundle`.
4. Smoke test in browser:
   - Tab switching works.
   - Net Proceeds values update live and PDF export works.
   - Performance calculator monthly edits and summary KPIs update.
   - Fund calculator presets/manual input update schedule and totals.
5. Deploy the `property-sale-calculator` folder contents to hosting.
