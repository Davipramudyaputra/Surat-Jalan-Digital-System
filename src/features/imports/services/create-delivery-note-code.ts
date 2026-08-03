import { createHash } from "node:crypto";

export function createStableDeliveryNoteCode(input: {
  companyCode: string;
  normalizedBranchName: string;
  normalizedPoNumber: string;
}): string {
  const identity = [
    input.companyCode.toUpperCase(),
    input.normalizedPoNumber,
    input.normalizedBranchName,
  ].join("\u0000");
  const digest = createHash("sha256")
    .update(identity, "utf8")
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  return `SJ-${digest}`;
}
