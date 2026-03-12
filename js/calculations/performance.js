export const evaluateHealth = (annualMargin, costToIncome, positiveMonths, totalMonths) => {
  const marginScore = annualMargin >= 55 ? 3 : annualMargin >= 35 ? 2 : annualMargin >= 20 ? 1 : 0;
  const costScore = costToIncome <= 40 ? 3 : costToIncome <= 55 ? 2 : costToIncome <= 70 ? 1 : 0;
  const stabilityScore = positiveMonths >= 11 ? 3 : positiveMonths >= 9 ? 2 : positiveMonths >= 7 ? 1 : 0;
  const score = marginScore + costScore + stabilityScore;

  if (score >= 7) {
    return {
      status: "Healthy",
      tone: "strong",
      note: `Strong operating cashflow profile with ${positiveMonths}/${totalMonths} positive months and controlled costs.`,
    };
  }

  if (score >= 4) {
    return {
      status: "Stable",
      tone: "stable",
      note: "Generally performing well, but monitor operating margins and cost pressure over time.",
    };
  }

  return {
    status: "Needs Attention",
    tone: "watch",
    note: "Operating profitability or month-to-month consistency is under pressure and needs closer review.",
  };
};

export const computePerformance = ({
  propertyValue,
  ownershipPercent,
  startingCash,
  annualIncome,
  annualExpenses,
  annualFees,
  months,
}) => {
  const ownershipRatio = Math.min(100, ownershipPercent) / 100;
  const annualNet = annualIncome - annualExpenses - annualFees;
  const annualMargin = annualIncome > 0 ? (annualNet / annualIncome) * 100 : 0;
  const grossYield = propertyValue > 0 ? (annualIncome / propertyValue) * 100 : 0;
  const netYield = propertyValue > 0 ? (annualNet / propertyValue) * 100 : 0;

  let monthlyIncomeTotal = 0;
  let monthlyExpensesTotal = 0;
  let monthlyFeesTotal = 0;
  let monthlyDisbursementTotal = 0;
  let positiveMonths = 0;
  const quarterSummaries = Array.from({ length: 4 }, () => ({ income: 0, net: 0, margin: 0 }));
  const monthNetSeries = [];
  const monthMarginSeries = [];

  let bestMonth = { label: "-", value: Number.NEGATIVE_INFINITY };
  let worstMonth = { label: "-", value: Number.POSITIVE_INFINITY };

  const monthSummaries = months.map((month, index) => {
    const monthNet = month.income - month.expenses - month.fees;
    const monthMargin = month.income > 0 ? (monthNet / month.income) * 100 : 0;

    if (monthNet >= 0) {
      positiveMonths += 1;
    }

    monthlyIncomeTotal += month.income;
    monthlyExpensesTotal += month.expenses;
    monthlyFeesTotal += month.fees;
    monthlyDisbursementTotal += month.disbursement;
    monthNetSeries.push(monthNet);
    monthMarginSeries.push(monthMargin);

    const quarterIndex = Math.floor(index / 3);
    if (quarterSummaries[quarterIndex]) {
      quarterSummaries[quarterIndex].income += month.income;
      quarterSummaries[quarterIndex].net += monthNet;
    }

    if (monthNet > bestMonth.value) {
      bestMonth = { label: month.label, value: monthNet };
    }
    if (monthNet < worstMonth.value) {
      worstMonth = { label: month.label, value: monthNet };
    }

    return {
      ...month,
      net: monthNet,
      margin: monthMargin,
    };
  });

  quarterSummaries.forEach((quarter) => {
    quarter.margin = quarter.income > 0 ? (quarter.net / quarter.income) * 100 : 0;
  });

  const monthlyNet = monthlyIncomeTotal - monthlyExpensesTotal - monthlyFeesTotal;
  const monthlyAverageNet = months.length ? monthlyNet / months.length : 0;
  const costToIncome =
    monthlyIncomeTotal > 0 ? ((monthlyExpensesTotal + monthlyFeesTotal) / monthlyIncomeTotal) * 100 : 0;
  const retainedCash = startingCash + monthlyNet - monthlyDisbursementTotal;
  const netDifference = annualNet - monthlyNet;
  const yourShareNet = monthlyNet * ownershipRatio;
  const yourShareMonthly = monthlyAverageNet * ownershipRatio;
  const monthlyNetMargin = monthlyIncomeTotal > 0 ? (monthlyNet / monthlyIncomeTotal) * 100 : 0;
  const health = evaluateHealth(annualMargin, costToIncome, positiveMonths, months.length);
  const latestNet = monthNetSeries.length ? monthNetSeries[monthNetSeries.length - 1] : 0;
  const latestMargin = monthMarginSeries.length ? monthMarginSeries[monthMarginSeries.length - 1] : 0;

  return {
    ownershipRatio,
    annualNet,
    annualMargin,
    grossYield,
    netYield,
    monthlyIncomeTotal,
    monthlyExpensesTotal,
    monthlyFeesTotal,
    monthlyDisbursementTotal,
    monthlyNet,
    monthlyAverageNet,
    costToIncome,
    retainedCash,
    netDifference,
    yourShareNet,
    yourShareMonthly,
    monthlyNetMargin,
    positiveMonths,
    bestMonth,
    worstMonth,
    quarterSummaries,
    monthNetSeries,
    monthMarginSeries,
    latestNet,
    latestMargin,
    monthSummaries,
    health,
  };
};
