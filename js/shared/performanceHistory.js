import { computePerformance } from "../calculations/performance.js";
import { DEFAULT_STATEMENT_MONTHS } from "../config/constants.js";
import { createScenarioStorageKey } from "./scenarioStorageKeys.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readScenarioValues = (toolId, datasetId) => {
  const datasetKey = createScenarioStorageKey(toolId, datasetId);
  const legacyKey = createScenarioStorageKey(toolId);
  const raw = window.localStorage.getItem(datasetKey) || window.localStorage.getItem(legacyKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const values = parsed && typeof parsed === "object" && parsed.values ? parsed.values : parsed;
    if (!values || typeof values !== "object") {
      return null;
    }
    return values;
  } catch {
    return null;
  }
};

const readValueById = (values, id, fallback = 0) => toNumber(values[`id:${id}`], fallback);

const readMonthValue = (values, monthIndex, field, fallback = 0) =>
  toNumber(values[`month:${monthIndex}:${field}`], fallback);

export const computePerformanceMetricsFromScenarioValues = (values) => {
  if (!values || typeof values !== "object") {
    return null;
  }

  const annualIncome =
    readValueById(values, "incomeRentGst") +
    readValueById(values, "incomeRentGstFree") +
    readValueById(values, "incomeOutgoingsRecovered") +
    readValueById(values, "incomeOtherIncome");

  const annualExpenses =
    readValueById(values, "incomeCouncilRates") +
    readValueById(values, "incomeWaterRates") +
    readValueById(values, "incomeInsurance") +
    readValueById(values, "incomeLandTax") +
    readValueById(values, "incomeGardening") +
    readValueById(values, "incomeFireSafety") +
    readValueById(values, "incomeRepairs") +
    readValueById(values, "incomeCapex") +
    readValueById(values, "incomeOtherExpenses");

  const annualFees = readValueById(values, "incomeManagementFees") + readValueById(values, "incomeOtherFees");

  const months = DEFAULT_STATEMENT_MONTHS.map((month, index) => ({
    label: month.label,
    income: readMonthValue(values, index, "income", month.income),
    expenses: readMonthValue(values, index, "expenses", month.expenses),
    fees: readMonthValue(values, index, "fees", month.fees),
    disbursement: readMonthValue(values, index, "disbursement", month.disbursement),
  }));

  const performance = computePerformance({
    propertyValue: readValueById(values, "incomePropertyValue"),
    ownershipPercent: Math.min(100, Math.max(0, readValueById(values, "incomeOwnershipPercent", 100))),
    startingCash: readValueById(values, "incomeStartingCash"),
    annualIncome,
    annualExpenses,
    annualFees,
    months,
  });

  return {
    netOperatingCashflowShare: performance.yourShareNet,
    netMarginPercent: performance.annualMargin,
    netYieldPercent: performance.netYield,
  };
};

export const collectPerformanceHistoryRows = ({
  datasetOptions,
  currentDatasetId,
  currentMetrics,
  maxRows = 5,
}) => {
  const options = Array.isArray(datasetOptions) ? datasetOptions.slice(0, maxRows) : [];
  const rows = [];

  options.forEach((option) => {
    if (!option || !option.id) {
      return;
    }

    if (option.id === currentDatasetId && currentMetrics) {
      rows.push({
        datasetId: option.id,
        label: option.label || option.id,
        ...currentMetrics,
      });
      return;
    }

    const savedValues = readScenarioValues("performance", option.id);
    const metrics = computePerformanceMetricsFromScenarioValues(savedValues);
    if (!metrics) {
      return;
    }

    rows.push({
      datasetId: option.id,
      label: option.label || option.id,
      ...metrics,
    });
  });

  return rows;
};
