import {
  collapseWhitespace,
  normalizeLookupKey,
} from "@/features/imports/normalization/normalize-key";

export type NormalizedBranchName = {
  branchName: string;
  normalizedBranchName: string;
  originalBranchName: string;
};

export function normalizeBranchName(value: string): NormalizedBranchName {
  const originalBranchName = value;
  const branchName = collapseWhitespace(value);

  return {
    originalBranchName,
    branchName,
    normalizedBranchName: normalizeLookupKey(branchName),
  };
}
