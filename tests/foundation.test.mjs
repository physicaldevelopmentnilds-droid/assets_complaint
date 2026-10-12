import assert from "node:assert/strict";
import test from "node:test";
import { parseNairaToKobo, formatKobo, CASHBOOK_START_DATE, OPENING_BALANCE_KOBO } from "../src/lib/money.ts";
import { assertBusinessDate, lagosDate, lagosDayBounds } from "../src/lib/dates.ts";

test("exact kobo conversion and fixed opening", () => {
  assert.equal(CASHBOOK_START_DATE, "2026-10-15");
  assert.equal(OPENING_BALANCE_KOBO, 0);
  assert.equal(parseNairaToKobo("1000.10") - parseNairaToKobo("250.05"), 75005);
  assert.match(formatKobo(-75005), /750\.05/);
  for (const value of ["0", "-1", "1.001", "1e3", "9007199254740992"]) assert.throws(() => parseNairaToKobo(value));
});

test("Lagos date-only boundaries are inclusive over a calendar day", () => {
  assert.equal(assertBusinessDate("2026-10-15"), "2026-10-15");
  assert.throws(() => assertBusinessDate("2026-02-30"));
  const { start, endExclusive } = lagosDayBounds("2026-10-15");
  assert.equal(start.toISOString(), "2026-10-14T23:00:00.000Z");
  assert.equal(endExclusive.toISOString(), "2026-10-15T23:00:00.000Z");
  assert.equal(lagosDate(new Date("2026-10-14T23:30:00Z")), "2026-10-15");
});
