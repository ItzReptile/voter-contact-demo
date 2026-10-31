---
name: add-segment-filter
description: Add a new filter to the segment builder (e.g. city, "has phone", household size). Use when asked to let users segment or cut lists by a new voter attribute.
---

# Add a segment filter

A filter touches five places. Do them in this order, running the tests named at each step.

## 1. Unit test first (`src/lib/segments.test.ts`)

Add cases for the new filter before writing it:
- `parseSegmentParams` reads it from URL params (blank = no filter, bad value = `{ ok: false }`).
- `buildSegmentWhere` emits the condition with a `$n` placeholder and puts the value in `params`, never in the SQL text.
- `describeSegment` mentions it.

Run `npm run test:unit` and watch the new cases fail.

## 2. Schema and SQL (`src/lib/segments.ts`)

- Add the field to `segmentSchema`. Optional, with `blankToUndefined` for numbers, `.default([])` for multi-selects.
- Read it in `parseSegmentParams` (`params.get` for one value, `params.getAll` for repeated ones).
- In `buildSegmentWhere`, push a condition that uses `param(value)` for every value. Reference voters as `v.` and contacts in a subquery, like the existing contact-history filters.
- Add it to `describeSegment`.

If the filter needs a new voter column, it also needs `db/schema.sql`, the importer (`src/lib/csv.ts`, `importVoters`), the generator (`src/dev/fake-voters.ts`) and a regenerated `public/sample-voters.csv` (`npm run generate`). That is a bigger change: say so before starting.

## 3. Database test (`src/lib/lists.db.test.ts`)

Add a test in "segments and lists" that imports voters on both sides of the filter with `makeVoter()` and checks `previewSegment` returns only the right ones. Run `npm test`.

## 4. Form control (`src/app/lists/new/page.tsx`)

Add the input inside the `<Form>`. Its `name` must match the param read in step 2. Prefill it from `params` so the form shows the current segment after Preview. Use a visible `<label>` or `aria-label`.

## 5. Check

- `npm run check`
- `npm run test:e2e` if you changed the form. Extend `e2e/canvass-flow.spec.ts` only if the filter changes the main flow.
- Update the segment shape in `docs/plan.md`.

Saved lists keep their segment as JSON in `lists.segment`. Old lists won't have the new field; `describeSegment` must handle it being absent.
