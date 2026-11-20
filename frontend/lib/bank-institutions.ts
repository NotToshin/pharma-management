export const BANGLADESH_BANKS = {
  conventional: [
    "Eastern Bank PLC",
    "BRAC Bank PLC",
    "City Bank PLC",
    "Dutch-Bangla Bank PLC",
    "United Commercial Bank (UCB)",
    "Prime Bank PLC",
    "Mutual Trust Bank (MTB)",
    "Dhaka Bank PLC",
    "Bank Asia PLC",
    "Pubali Bank PLC",
  ],
  islamic: [
    "Islami Bank Bangladesh PLC",
    "Al-Arafah Islami Bank PLC",
    "Shahjalal Islami Bank PLC",
    "Social Islami Bank PLC (SIBL)",
    "EXIM Bank Bangladesh PLC",
  ],
  foreign: [
    "Standard Chartered Bank",
    "HSBC Bangladesh",
    "Citibank N.A.",
    "Commercial Bank of Ceylon",
  ],
  cashCounters: [
    "Head Office Cash Safe",
    "Sales Counter Cash Drawer",
    "Mirpur Depot Petty Safe",
    "Factory Plant Cash Vault",
  ],
} as const

export const CUSTOM_INSTITUTION_VALUE = "__custom__"

export function institutionsForCategory(category: "BANK" | "CASH"): string[] {
  if (category === "CASH") {
    return [...BANGLADESH_BANKS.cashCounters]
  }

  return [
    ...BANGLADESH_BANKS.conventional,
    ...BANGLADESH_BANKS.islamic,
    ...BANGLADESH_BANKS.foreign,
  ]
}

export function isKnownInstitution(category: "BANK" | "CASH", value: string): boolean {
  return institutionsForCategory(category).includes(value)
}
