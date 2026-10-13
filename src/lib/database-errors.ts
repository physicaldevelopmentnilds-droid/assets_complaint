export function isDatabaseUnavailable(error: unknown): boolean {
  return error instanceof Error && [
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "MongoServerSelectionError",
    "PoolClearedOnNetworkError",
  ].includes(error.name);
}
