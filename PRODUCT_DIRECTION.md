# Product Direction Notes

Date: 12 March 2026 (Australia/Melbourne)

## Product Goal

Build a simple property investor toolkit where a user can:

1. Enter data quickly.
2. Get a fast, accurate performance outcome.
3. Save their information for later use (future).
4. View and download a high-level report (future).

## Product Principles

- Speed over complexity: minimal friction to input and understand results.
- Accuracy first: calculations must be trustworthy and stable.
- Plain language: labels and outputs should be investor-friendly.
- Reusable core: calculations, state, and reporting should be separable.

## Future Capabilities (Not for this cleanup cycle)

- Save/load user scenarios.
- Historical tracking over time.
- High-level report generation and export workflows.

## What This Means For Cleanup Now

Cleanup should prioritize foundations that support the future without adding new end-user features now.

1. Protect calculation correctness with tests.
2. Define a canonical state model (`AppState`) to support future save/load.
3. Separate report data generation from report rendering.
4. Modularize code by responsibility (`calculations`, `state`, `ui`, `reporting`).
5. Continue UX simplification (labels, progressive disclosure, fast defaults).

## Execution Order

1. Tooling baseline: lint + format + test runner.
2. Regression tests for existing calculators.
3. Refactor calculation modules (no behavior changes).
4. Extract constants/config (tax brackets, assumptions, defaults).
5. Introduce report payload layer (used by PDF).
6. Accessibility and CSS structure cleanup.
7. Documentation refresh.

## References

- Technical debt backlog: `TECH_DEBT_TASKS.md`
- Existing app files: `index.html`, `styles.css`, `app.js`
