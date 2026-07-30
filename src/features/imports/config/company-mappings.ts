export const COMPANY_MAPPINGS: Readonly<Record<string, string>> = Object.freeze({
  SOF: "PT. SUMMIT OTO FINANCE",
});

export function getCompanyName(companyCode: string): string | undefined {
  return COMPANY_MAPPINGS[companyCode.trim().toUpperCase()];
}
