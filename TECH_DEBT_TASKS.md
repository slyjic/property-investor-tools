# Technical Debt Cleanup Tasks

This backlog is focused on improving reliability, maintainability, and UX quality for existing features only.

Context: see `PRODUCT_DIRECTION.md` for product goals and cleanup guardrails.

## Current Snapshot

- `index.html`: 1,273 lines
- `styles.css`: 2,290 lines
- `app.js`: 15 lines (entrypoint only)
- Modularized JS:
  - `js/shared/runtime.js`: 217 lines
  - `js/tools/netProceeds.js`: 232 lines
  - `js/tools/performance.js`: 673 lines
  - `js/tools/fund.js`: 239 lines
- Quality checks:
  - `npm run format:check` passes
  - `npm run lint` passes
  - `npm test` passes (20 regression tests)

## Prioritized Tasks

### P1. Split `app.js` into focused modules

Status: Done on 12 Mar 2026.

- Why: one large file currently mixes calculators, DOM wiring, formatting, and PDF rendering.
- Scope:
  - Extract shared utilities (`format`, number parsing, DOM helpers) into `js/shared/*`.
  - Extract each calculator into `js/tools/net-proceeds.js`, `js/tools/performance.js`, `js/tools/fund.js`.
  - Extract PDF into `js/report/pdf-export.js`.
- Acceptance criteria:
  - No behavior changes.
  - Existing calculators still update live and match current outputs.
  - Main entry file orchestrates module init only.

### P1. Add formula regression tests for existing calculators

Status: Done on 12 Mar 2026 (20 deterministic regression tests).

- Why: calculations are core business logic; currently untested.
- Scope:
  - Add test runner (`vitest` or similar lightweight setup).
  - Add unit tests for:
    - CGT delta by tax year and discount toggle.
    - Ownership apportionment and mortgage treatment.
    - Performance totals/margins/yields.
    - Fund monthly and annual distributions.
- Acceptance criteria:
  - Minimum 20 deterministic tests.
  - CI/local command `npm test` runs clean.

### P1. Introduce lint/format scripts

Status: Done on 12 Mar 2026.

- Why: reduces regressions and keeps style consistent as files grow.
- Scope:
  - Add `eslint` for JS and `prettier` for HTML/CSS/JS.
  - Add scripts: `npm run lint`, `npm run format`, `npm run test`.
- Acceptance criteria:
  - Repo has a single documented quality gate command.
  - No lint errors on main branch.

### P1. Move hardcoded business constants into a config layer

Status: Done on 12 Mar 2026.

- Why: tax brackets, RBA cash rate, and statement defaults are embedded directly in code.
- Scope:
  - Create `js/config/rates.js` for tax brackets and fund assumptions.
  - Create `js/config/defaults.js` for statement defaults.
  - Add a simple comment block showing "last reviewed date" for rate data.
- Acceptance criteria:
  - No hardcoded rates left in calculator logic files.
  - Updating rates requires editing config only.

### P1. Accessibility hardening for helper tooltips and dynamic outputs

Status: In progress (semantic tooltip controls and scoped live regions updated on 12 Mar 2026; formal Lighthouse/axe pass still pending).

- Why: current custom help tips rely on hover/focus and need stronger semantic support.
- Scope:
  - Replace non-semantic tooltip triggers with accessible button + `aria-describedby`.
  - Ensure keyboard-only and touch behavior is reliable.
  - Review `aria-live` regions for concise announcements.
- Acceptance criteria:
  - Tooltip help accessible with keyboard and touch.
  - No critical a11y issues in a Lighthouse/axe pass.

### P2. Refactor dynamic row rendering away from large `innerHTML` blocks

Status: Done on 12 Mar 2026.

- Why: large template strings are hard to maintain and review safely.
- Scope:
  - Convert statement/fund row rendering to small DOM factory helpers.
  - Keep markup structure unchanged.
- Acceptance criteria:
  - Render output matches current UI.
  - Rendering functions are smaller and easier to test.

### P2. Add light performance guardrails for high-frequency input updates

Status: In progress (frame-coalesced input throttling added in net/fund tools on 12 Mar 2026; performance tool kept immediate updates to preserve live-month editing responsiveness and test determinism).

- Why: each input event triggers full recalculation and broad DOM writes.
- Scope:
  - Batch visual updates with `requestAnimationFrame` or microtask queue.
  - Only update changed output nodes where practical.
- Acceptance criteria:
  - No perceived input lag on mobile.
  - No calculation behavior changes.

### P2. CSS structure cleanup

- Why: stylesheet is large and increasingly difficult to reason about.
- Scope:
  - Group styles by component section with clear headers.
  - Deduplicate repeated patterns in media queries.
  - Extract shared tokens for repeated spacing/font-size values.
- Acceptance criteria:
  - Reduced duplication in responsive blocks.
  - Easier traceability from component to style section.

### P2. Add deterministic fixtures for PDF output smoke testing

Status: Done on 12 Mar 2026.

- Why: PDF is critical output and currently validated manually.
- Scope:
  - Add one deterministic input fixture.
  - Add a smoke test asserting file generation and key text blocks.
- Acceptance criteria:
  - PDF generation path is covered by automated check.

### P3. Documentation refresh

- Why: README is outdated relative to current tool set and behavior.
- Scope:
  - Update README with all three tools, assumptions, and known limitations.
  - Add a "rate update checklist" and "pre-deploy checklist."
- Acceptance criteria:
  - New contributor can run, verify, and deploy from docs alone.

## Suggested Execution Order

1. Tooling baseline: lint + format + tests scaffolding.
2. Formula tests before refactor (lock behavior).
3. JS modular split.
4. Config extraction for rates/defaults.
5. A11y cleanup and CSS cleanup.
6. PDF smoke test + docs refresh.

## Out of Scope For This Cleanup Cycle

- New calculators/tools.
- Data storage backend or user accounts.
- Historical statement upload workflows.
