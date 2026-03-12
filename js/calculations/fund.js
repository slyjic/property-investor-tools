export const addMonths = (date, monthsToAdd) => {
  const shifted = new Date(date.getTime());
  const day = shifted.getDate();
  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() + monthsToAdd);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(day, lastDay));
  return shifted;
};

export const computeFundProjection = ({
  investmentAmount,
  baseSpreadPercent,
  cashRatePercent,
  startDate = new Date(),
  months = 12,
}) => {
  const annualRatePercent = baseSpreadPercent + cashRatePercent;
  const monthlyRatePercent = annualRatePercent / 12;
  const monthlyDistribution = (investmentAmount * (annualRatePercent / 100)) / 12;
  const annualDistribution = monthlyDistribution * months;
  const projectionStartDate = new Date(startDate.getTime());
  const monthlyDistributionSeries = Array.from({ length: months }, () => monthlyDistribution);
  const cumulativeDistributionSeries = monthlyDistributionSeries.map((value, index) => value * (index + 1));

  const rows = cumulativeDistributionSeries.map((cumulativeDistribution, index) => ({
    monthIndex: index + 1,
    distributionDate: addMonths(projectionStartDate, index),
    monthlyDistribution,
    cumulativeDistribution,
    capitalBalance: investmentAmount,
  }));

  return {
    annualRatePercent,
    monthlyRatePercent,
    monthlyDistribution,
    annualDistribution,
    projectionStartDate,
    monthlyDistributionSeries,
    cumulativeDistributionSeries,
    rows,
  };
};
