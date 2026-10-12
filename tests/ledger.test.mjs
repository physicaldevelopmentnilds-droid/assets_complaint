import assert from "node:assert/strict";
import test from "node:test";
import { calculateLedger } from "../src/modules/cashbook/ledger.ts";

const entry = (reference, transactionDate, sequence, type, amountKobo, description = reference, voidedAt = null) => ({ reference, transactionDate, sequence, type, amountKobo, description, voidedAt });

test("backdated entries, voids and hidden filters retain true balances", () => {
  const income = entry("C1", "2026-10-16", 1, "Income", 100010);
  const expense = entry("C2", "2026-10-17", 2, "Expenditure", 25005);
  assert.equal(calculateLedger([income, expense]).closingBalanceKobo, 75005);
  const backdated = entry("C3", "2026-10-15", 3, "Income", 10000);
  const withBackdate = calculateLedger([income, expense, backdated]);
  assert.equal(withBackdate.closingBalanceKobo, 85005);
  assert.deepEqual(withBackdate.rows.map((row) => row.runningBalanceKobo), [10000, 110010, 85005]);
  const filtered = calculateLedger([income, expense, backdated], { from: "2026-10-16", type: "Income", search: "C1" });
  assert.equal(filtered.openingBalanceKobo, 10000);
  assert.equal(filtered.periodExpenditureKobo, 25005);
  assert.equal(filtered.closingBalanceKobo, 85005);
  assert.equal(filtered.rows[0].runningBalanceKobo, 110010);
  expense.voidedAt = new Date("2026-10-18T00:00:00Z");
  const voided = calculateLedger([income, expense, backdated]);
  assert.equal(voided.closingBalanceKobo, 110010);
  assert.equal(voided.periodExpenditureKobo, 0);
  assert.equal(voided.rows.find((row) => row.reference === "C2").runningBalanceKobo, 110010);
});

test("same-day sequence, negative balances and future cutoffs", () => {
  const rows = [entry("later", "2026-10-15", 2, "Income", 500), entry("first", "2026-10-15", 1, "Expenditure", 1000), entry("future", "2026-10-20", 3, "Income", 2000)];
  const today = calculateLedger(rows, { to: "2026-10-15" });
  assert.deepEqual(today.rows.map((row) => row.reference), ["first", "later"]);
  assert.deepEqual(today.rows.map((row) => row.runningBalanceKobo), [-1000, -500]);
  assert.equal(today.closingBalanceKobo, -500);
  assert.equal(calculateLedger(rows).closingBalanceKobo, 1500);
  assert.throws(() => calculateLedger(rows, { from: "2026-10-20", to: "2026-10-15" }));
});
