import assert from "node:assert/strict";
import test from "node:test";
import { validatePushEndpoint } from "../src/modules/push/validation.ts";
import { classifyPushFailure, privatePushPayload, retryDelayMs } from "../src/modules/push/delivery.ts";

test("push endpoints allow known services and reject server-side request targets", () => {
  assert.match(validatePushEndpoint("https://fcm.googleapis.com/fcm/send/example"), /^[a-f0-9]{64}$/);
  assert.match(validatePushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/example"), /^[a-f0-9]{64}$/);
  assert.match(validatePushEndpoint("https://web.push.apple.com/example"), /^[a-f0-9]{64}$/);
  for (const endpoint of ["http://fcm.googleapis.com/a", "https://localhost/a", "https://fcm.googleapis.com.evil.test/a", "https://user@fcm.googleapis.com/a", "https://fcm.googleapis.com:8443/a"]) assert.throws(() => validatePushEndpoint(endpoint));
});

test("push payload is private and retry classification is bounded", () => {
  assert.deepEqual(JSON.parse(privatePushPayload("reminder", "ASSET-2026-000001")), { kind: "reminder", reference: "ASSET-2026-000001" });
  assert.throws(() => privatePushPayload("new", "../../secret"));
  assert.equal(classifyPushFailure(410), "expired");
  assert.equal(classifyPushFailure(503), "temporary");
  assert.equal(classifyPushFailure(400), "permanent");
  assert.ok(retryDelayMs(8) <= 6 * 60 * 60_000);
});
