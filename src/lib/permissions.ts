export type AccessProfile = { role: "admin" | "officer"; cashbookAccess?: boolean };

export function canAccessCashbook(staff: AccessProfile) {
  return staff.role === "admin" || staff.cashbookAccess === true;
}

export function assertCashbookAccess(staff: AccessProfile) {
  if (!canAccessCashbook(staff)) throw new Error("FORBIDDEN");
}
