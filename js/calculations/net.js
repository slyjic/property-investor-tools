export const calculateIncomeTax = (income, brackets) => {
  const taxableIncome = Math.max(0, income);
  let tax = 0;

  brackets.forEach((bracket) => {
    if (taxableIncome <= bracket.min) {
      return;
    }
    const taxableSlice = Math.min(taxableIncome, bracket.max) - bracket.min;
    if (taxableSlice > 0) {
      tax += taxableSlice * bracket.rate;
    }
  });

  return tax;
};

export const computeNetProceeds = ({
  salePrice,
  purchasePrice,
  outstandingMortgage,
  ownershipPercent,
  feeType,
  agentFeePercent,
  agentFeeGstPercent,
  agentFeeDollar,
  marketingCost,
  legalCost,
  mortgageReleaseCost,
  titleSearchCost,
  taxableIncome,
  cgtDiscountApplied,
  taxYear,
  taxBracketsByYear,
}) => {
  const ownershipRatio = Math.min(100, ownershipPercent) / 100;

  let agentFeeWhole = 0;
  if (feeType === "percent") {
    const commissionRate = agentFeePercent / 100;
    const gstRate = agentFeeGstPercent / 100;
    const baseCommission = salePrice * commissionRate;
    agentFeeWhole = baseCommission * (1 + gstRate);
  } else {
    agentFeeWhole = agentFeeDollar;
  }

  const additionalSellingCostsWhole = marketingCost + legalCost + mortgageReleaseCost + titleSearchCost;
  const totalSellingCostsWhole = agentFeeWhole + additionalSellingCostsWhole;
  const saleShare = salePrice * ownershipRatio;
  const purchaseShare = purchasePrice * ownershipRatio;
  const totalSellingCosts = totalSellingCostsWhole * ownershipRatio;
  const capitalGain = saleShare - purchaseShare - totalSellingCosts;
  const discountMultiplier = cgtDiscountApplied ? 0.5 : 1;
  const taxableCapitalGain = Math.max(0, capitalGain) * discountMultiplier;

  const chosenTaxYear = taxBracketsByYear[taxYear] ? taxYear : "2025-26";
  const brackets = taxBracketsByYear[chosenTaxYear];

  const taxBeforeGain = calculateIncomeTax(taxableIncome, brackets);
  const taxAfterGain = calculateIncomeTax(taxableIncome + taxableCapitalGain, brackets);
  const estimatedCgt = Math.max(0, taxAfterGain - taxBeforeGain);
  const mortgageShare = outstandingMortgage;
  const netProceeds = saleShare - totalSellingCosts - estimatedCgt - mortgageShare;
  const afterTaxProfit = netProceeds - purchaseShare;

  return {
    salePrice,
    purchasePrice,
    ownershipPercent,
    ownershipRatio,
    outstandingMortgage,
    taxYear: chosenTaxYear,
    feeType,
    agentFeePercent,
    agentFeeGstPercent,
    agentFeeWhole,
    marketingCost,
    legalCost,
    mortgageReleaseCost,
    titleSearchCost,
    additionalSellingCostsWhole,
    totalSellingCostsWhole,
    saleShare,
    purchaseShare,
    totalSellingCosts,
    capitalGain,
    taxableCapitalGain,
    discountApplied: Boolean(cgtDiscountApplied),
    taxableIncome,
    taxBeforeGain,
    taxAfterGain,
    estimatedCgt,
    mortgageShare,
    netProceeds,
    afterTaxProfit,
  };
};
