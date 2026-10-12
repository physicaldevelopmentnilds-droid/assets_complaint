import { database } from "./db";

const state = globalThis as typeof globalThis & { __nildsIndexes?: Promise<void> };
export async function ensureIndexes() {
  state.__nildsIndexes ??= createIndexes().catch((error) => { state.__nildsIndexes = undefined; throw error; });
  return state.__nildsIndexes;
}

async function createIndexes() {
  const db = await database();
  await Promise.all([
    db.collection("users").createIndex({ normalizedEmail: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("assetComplaints").createIndex({ reference: 1 }, { unique: true }),
    db.collection("assetComplaints").createIndex({ submittedAt: -1 }),
    db.collection("submissionKeys").createIndex({ key: 1, peerHash: 1 }, { unique: true }),
    db.collection("submissionKeys").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("memos").createIndex({ reference: 1 }, { unique: true }),
    db.collection("memos").createIndex({ registryDate: -1 }),
    db.collection("cashbookTransactions").createIndex({ reference: 1 }, { unique: true }),
    db.collection("cashbookTransactions").createIndex({ transactionDate: 1, sequence: 1 }),
    db.collection("cashbookSubmissionKeys").createIndex({ key: 1, actorId: 1 }, { unique: true }),
    db.collection("cashbookSubmissionKeys").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("numberSequences").createIndex({ name: 1 }, { unique: true }),
    db.collection("pushSubscriptions").createIndex({ endpointHash: 1 }, { unique: true }),
    db.collection("pushSubscriptions").createIndex({ ownerId: 1, active: 1 }),
    db.collection("notificationJobs").createIndex({ status: 1, nextAttemptAt: 1 }),
    db.collection("notificationDeliveries").createIndex({ jobId: 1, subscriptionId: 1 }, { unique: true }),
    db.collection("rateLimits").createIndex({ key: 1 }, { unique: true }),
    db.collection("rateLimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ]);
}
