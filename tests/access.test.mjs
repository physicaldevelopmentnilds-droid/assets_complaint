import test from "node:test";
import assert from "node:assert/strict";
import { canAccessCashbook, assertCashbookAccess } from "../src/lib/permissions.ts";
import { complaintSchema } from "../src/modules/complaints/validation.ts";

test("cashbook approval defaults to denial and can be revoked", () => {
  for (const staff of [{ role: "officer" }, { role: "officer", cashbookAccess: false }]) {
    assert.equal(canAccessCashbook(staff), false);
    assert.throws(() => assertCashbookAccess(staff), /FORBIDDEN/);
  }
  assert.doesNotThrow(() => assertCashbookAccess({ role: "admin" }));
  assert.doesNotThrow(() => assertCashbookAccess({ role: "officer", cashbookAccess: true }));
});

test("office number may be omitted without relaxing required complaint fields", () => {
  const input = { complaintType: "Furniture", description: "Fixture repair", submissionType: "First complaint", buildingSection: "Clinic", floor: "Ground", complainantName: "Sample", department: "Sample", designation: "Sample", contactNumber: "08000000000" };
  assert.equal(complaintSchema.parse(input).officeNumber, "");
  assert.equal(complaintSchema.parse({ ...input, officeNumber: "  " }).officeNumber, "");
  assert.equal(complaintSchema.safeParse({ ...input, floor: "" }).success, false);
});
