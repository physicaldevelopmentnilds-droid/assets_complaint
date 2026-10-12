import { database } from "./db";
export async function nextReference(prefix: "ASSET" | "MEMO" | "CASH", year: number) {
  const name = `${prefix}-${year}`;
  const result = await (await database()).collection("numberSequences").findOneAndUpdate({ name }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" });
  if (!result || typeof result.value !== "number") throw new Error("Reference sequence failed.");
  return `${name}-${String(result.value).padStart(6, "0")}`;
}

export async function nextNumber(name: string) {
  const result = await (await database()).collection("numberSequences").findOneAndUpdate({ name }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" });
  if (!result || typeof result.value !== "number") throw new Error("Sequence failed.");
  return result.value;
}
