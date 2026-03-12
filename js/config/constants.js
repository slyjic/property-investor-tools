export const TAX_BRACKETS = {
  "2025-26": [
    { min: 0, max: 18200, rate: 0 },
    { min: 18200, max: 45000, rate: 0.16 },
    { min: 45000, max: 135000, rate: 0.3 },
    { min: 135000, max: 190000, rate: 0.37 },
    { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  "2026-27": [
    { min: 0, max: 18200, rate: 0 },
    { min: 18200, max: 45000, rate: 0.15 },
    { min: 45000, max: 135000, rate: 0.3 },
    { min: 135000, max: 190000, rate: 0.37 },
    { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
  "2027-28": [
    { min: 0, max: 18200, rate: 0 },
    { min: 18200, max: 45000, rate: 0.14 },
    { min: 45000, max: 135000, rate: 0.3 },
    { min: 135000, max: 190000, rate: 0.37 },
    { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 },
  ],
};

export const DEFAULT_STATEMENT_MONTHS = [
  { label: "Jul 2024", income: 31469.73, expenses: 1099.0, fees: 1645.35, disbursement: 28725.38 },
  { label: "Aug 2024", income: 21388.97, expenses: 2903.25, fees: 1082.93, disbursement: 18040.67 },
  { label: "Sep 2024", income: 20883.52, expenses: 1877.72, fees: 1057.66, disbursement: 17948.14 },
  { label: "Oct 2024", income: 22952.53, expenses: 649.0, fees: 1132.04, disbursement: 21171.49 },
  { label: "Nov 2024", income: 21628.53, expenses: 5390.33, fees: 1094.92, disbursement: 15143.28 },
  { label: "Dec 2024", income: 12713.18, expenses: 10784.91, fees: 652.51, disbursement: 1275.76 },
  { label: "Jan 2025", income: 33453.88, expenses: 770.0, fees: 1686.2, disbursement: 30997.68 },
  { label: "Feb 2025", income: 9803.18, expenses: 2444.2, fees: 503.64, disbursement: 5381.7 },
  { label: "Mar 2025", income: 21703.53, expenses: 7857.8, fees: 1022.07, disbursement: 14297.3 },
  { label: "Apr 2025", income: 36294.98, expenses: 11060.6, fees: 1832.33, disbursement: 23402.05 },
  { label: "May 2025", income: 13985.38, expenses: 2607.41, fees: 713.32, disbursement: 10664.65 },
  { label: "Jun 2025", income: 21028.53, expenses: 88.0, fees: 1061.97, disbursement: 19305.07 },
];

export const DEFAULT_CATEGORY_VALUES = {
  rentGst: 207941.74,
  rentGstFree: 34800.0,
  outgoingsRecovered: 23915.2,
  otherIncome: 649.0,
  councilRates: 7357.61,
  waterRates: 3756.98,
  insurance: 10784.91,
  landTax: 16128.95,
  gardening: 5346.0,
  fireSafety: 1590.26,
  repairs: 1430.0,
  capex: 1099.0,
  otherExpenses: 38.51,
  managementFees: 13429.94,
  otherFees: 55.0,
};

export const FUND_BASE_SPREAD_PERCENT = 4.0;
export const FUND_RBA_CASH_RATE_PERCENT = 3.85;
