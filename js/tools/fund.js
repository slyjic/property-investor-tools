import { FUND_BASE_SPREAD_PERCENT, FUND_RBA_CASH_RATE_PERCENT } from "../config/constants.js";
import { computeFundProjection } from "../calculations/fund.js";
import {
  byId,
  createFrameScheduler,
  formatCurrencyInput,
  formatPercent,
  formatCurrencyValue,
  readNumber,
  renderSparkline,
  sanitizeCurrencyInput,
  setDetailsOpenState,
  setOutputValue,
  setTrendToneClass,
  unformatCurrencyInput,
} from "../shared/runtime.js";

export const initSimpleFundCalculator = () => {
  const fundForm = document.querySelector("#simple-fund-calculator");
  if (!fundForm) {
    return;
  }

  const fundRowsBody = byId("fundDistributionRows");
  if (!fundRowsBody) {
    return;
  }

  const fundCardsContainer = byId("fundDistributionCards");

  const fundFields = {
    investmentAmount: byId("fundInvestmentAmount"),
    presetButtons: Array.from(fundForm.querySelectorAll("[data-fund-preset]")),
    outputCashRate: byId("fundCashRate"),
    outputAnnualRate: byId("fundAnnualRate"),
    outputMonthlyRate: byId("fundMonthlyRate"),
    outputMonthlyDistribution: byId("fundMonthlyDistribution"),
    outputAnnualDistribution: byId("fundAnnualDistribution"),
    outputCapitalPreserved: byId("fundCapitalPreserved"),
    outputStartDate: byId("fundStartDate"),
    outputSnapshotMonthly: byId("fundSnapshotMonthly"),
    outputSnapshotAnnual: byId("fundSnapshotAnnual"),
    outputSnapshotCapital: byId("fundSnapshotCapital"),
    outputTrendMonthlyLatest: byId("fundTrendMonthlyLatest"),
    outputTrendCumulativeLatest: byId("fundTrendCumulativeLatest"),
    outputTrendMonthlySparkline: byId("fundMonthlySparkline"),
    outputTrendCumulativeSparkline: byId("fundCumulativeSparkline"),
    trendMonthlyCard: byId("fundMonthlyTrendCard"),
    trendCumulativeCard: byId("fundCumulativeTrendCard"),
    outputMobileSummaryAnnual: byId("mobileFundAnnual"),
    expandCardsButton: byId("fundCardsExpand"),
    collapseCardsButton: byId("fundCardsCollapse"),
  };

  const dateFormatter = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let fundCardsExpanded = false;

  const setPercentOutput = (element, value) => {
    if (!element) {
      return;
    }

    element.textContent = formatPercent(value);
  };

  const clearNodeChildren = (node) => {
    if (node) {
      node.textContent = "";
    }
  };

  const createDistributionTableRow = (row) => {
    const rowElement = document.createElement("tr");

    const monthCell = document.createElement("td");
    monthCell.textContent = `M${row.monthIndex}`;
    rowElement.appendChild(monthCell);

    const dateCell = document.createElement("td");
    dateCell.textContent = dateFormatter.format(row.distributionDate);
    rowElement.appendChild(dateCell);

    const monthlyCell = document.createElement("td");
    monthlyCell.textContent = formatCurrencyValue(row.monthlyDistribution);
    rowElement.appendChild(monthlyCell);

    const cumulativeCell = document.createElement("td");
    cumulativeCell.textContent = formatCurrencyValue(row.cumulativeDistribution);
    rowElement.appendChild(cumulativeCell);

    const capitalCell = document.createElement("td");
    capitalCell.textContent = formatCurrencyValue(row.capitalBalance);
    rowElement.appendChild(capitalCell);

    return rowElement;
  };

  const createDistributionCard = (row, isExpanded) => {
    const card = document.createElement("article");
    card.className = "fund-card";

    const details = document.createElement("details");
    details.className = "fund-card-details";
    details.open = isExpanded;
    card.appendChild(details);

    const summary = document.createElement("summary");
    summary.className = "fund-card-summary";
    details.appendChild(summary);

    const head = document.createElement("div");
    head.className = "fund-card-head";
    summary.appendChild(head);

    const monthLabel = document.createElement("h4");
    monthLabel.textContent = `M${row.monthIndex}`;
    head.appendChild(monthLabel);

    const dateLabel = document.createElement("p");
    dateLabel.textContent = dateFormatter.format(row.distributionDate);
    head.appendChild(dateLabel);

    const summaryAmount = document.createElement("div");
    summaryAmount.className = "fund-card-summary-amount";
    summary.appendChild(summaryAmount);

    const summaryAmountLabel = document.createElement("span");
    summaryAmountLabel.textContent = "Monthly distribution";
    summaryAmount.appendChild(summaryAmountLabel);

    const summaryAmountValue = document.createElement("strong");
    summaryAmountValue.textContent = formatCurrencyValue(row.monthlyDistribution);
    summaryAmount.appendChild(summaryAmountValue);

    const list = document.createElement("dl");
    list.className = "fund-card-list";
    details.appendChild(list);

    const cumulativeGroup = document.createElement("div");
    list.appendChild(cumulativeGroup);
    const cumulativeTerm = document.createElement("dt");
    cumulativeTerm.textContent = "Cumulative distribution";
    cumulativeGroup.appendChild(cumulativeTerm);
    const cumulativeValue = document.createElement("dd");
    cumulativeValue.textContent = formatCurrencyValue(row.cumulativeDistribution);
    cumulativeGroup.appendChild(cumulativeValue);

    const capitalGroup = document.createElement("div");
    list.appendChild(capitalGroup);
    const capitalTerm = document.createElement("dt");
    capitalTerm.textContent = "Capital balance";
    capitalGroup.appendChild(capitalTerm);
    const capitalValue = document.createElement("dd");
    capitalValue.textContent = formatCurrencyValue(row.capitalBalance);
    capitalGroup.appendChild(capitalValue);

    return card;
  };

  const renderDistributionRows = (rows) => {
    clearNodeChildren(fundRowsBody);
    clearNodeChildren(fundCardsContainer);

    rows.forEach((row) => {
      fundRowsBody.appendChild(createDistributionTableRow(row));

      if (!fundCardsContainer) {
        return;
      }

      fundCardsContainer.appendChild(createDistributionCard(row, fundCardsExpanded));
    });
  };

  const setFundCardsOpenState = (isOpen) => {
    fundCardsExpanded = isOpen;
    setDetailsOpenState(fundCardsContainer, ".fund-card-details", isOpen);
  };

  const syncPresetButtonState = (investmentAmount) => {
    if (!fundFields.presetButtons.length) {
      return;
    }

    fundFields.presetButtons.forEach((button) => {
      const presetAmount = Number.parseFloat(button.dataset.fundPreset || "0");
      const isActive = Number.isFinite(presetAmount) && Math.abs(presetAmount - investmentAmount) < 0.01;
      button.classList.toggle("is-active", isActive);
    });
  };

  const calculateFundDistributions = () => {
    const investmentAmount = readNumber(fundFields.investmentAmount);

    const projection = computeFundProjection({
      investmentAmount,
      baseSpreadPercent: FUND_BASE_SPREAD_PERCENT,
      cashRatePercent: FUND_RBA_CASH_RATE_PERCENT,
      startDate: new Date(),
      months: 12,
    });

    setPercentOutput(fundFields.outputCashRate, FUND_RBA_CASH_RATE_PERCENT);
    setPercentOutput(fundFields.outputAnnualRate, projection.annualRatePercent);
    setPercentOutput(fundFields.outputMonthlyRate, projection.monthlyRatePercent);
    setOutputValue(fundFields.outputMonthlyDistribution, projection.monthlyDistribution);
    setOutputValue(fundFields.outputAnnualDistribution, projection.annualDistribution);
    setOutputValue(fundFields.outputMobileSummaryAnnual, projection.annualDistribution);
    setOutputValue(fundFields.outputCapitalPreserved, investmentAmount);
    setOutputValue(fundFields.outputSnapshotMonthly, projection.monthlyDistribution);
    setOutputValue(fundFields.outputSnapshotAnnual, projection.annualDistribution);
    setOutputValue(fundFields.outputSnapshotCapital, investmentAmount);
    setOutputValue(fundFields.outputTrendMonthlyLatest, projection.monthlyDistribution);
    setOutputValue(fundFields.outputTrendCumulativeLatest, projection.annualDistribution);

    renderSparkline(fundFields.outputTrendMonthlySparkline, projection.monthlyDistributionSeries, {
      baseline: 0,
      lineColor: "#ffd4a8",
      areaColor: "rgba(255, 164, 79, 0.2)",
      baselineColor: "rgba(255, 212, 168, 0.34)",
    });

    renderSparkline(fundFields.outputTrendCumulativeSparkline, projection.cumulativeDistributionSeries, {
      baseline: 0,
      lineColor: "#ffa44f",
      areaColor: "rgba(255, 164, 79, 0.24)",
      baselineColor: "rgba(255, 212, 168, 0.34)",
    });

    setTrendToneClass(fundFields.trendMonthlyCard, projection.monthlyDistribution);
    setTrendToneClass(fundFields.trendCumulativeCard, projection.annualDistribution);

    if (fundFields.outputStartDate) {
      fundFields.outputStartDate.textContent = dateFormatter.format(projection.projectionStartDate);
    }

    syncPresetButtonState(investmentAmount);
    renderDistributionRows(projection.rows);
  };

  const scheduleFundCalculation = createFrameScheduler(calculateFundDistributions);

  if (fundFields.investmentAmount) {
    if (!fundFields.investmentAmount.value.trim()) {
      fundFields.investmentAmount.value = "100000";
    }

    fundFields.investmentAmount.addEventListener("focus", () => {
      unformatCurrencyInput(fundFields.investmentAmount);
    });

    fundFields.investmentAmount.addEventListener("input", () => {
      sanitizeCurrencyInput(fundFields.investmentAmount);
      scheduleFundCalculation();
    });

    fundFields.investmentAmount.addEventListener("change", () => {
      calculateFundDistributions();
    });

    fundFields.investmentAmount.addEventListener("blur", () => {
      formatCurrencyInput(fundFields.investmentAmount);
      calculateFundDistributions();
    });

    formatCurrencyInput(fundFields.investmentAmount);
  }

  fundFields.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const presetAmount = Number.parseFloat(button.dataset.fundPreset || "0");
      if (!Number.isFinite(presetAmount) || !fundFields.investmentAmount) {
        return;
      }

      fundFields.investmentAmount.value = formatCurrencyValue(presetAmount);
      calculateFundDistributions();
    });
  });

  if (fundFields.expandCardsButton) {
    fundFields.expandCardsButton.addEventListener("click", () => {
      setFundCardsOpenState(true);
    });
  }

  if (fundFields.collapseCardsButton) {
    fundFields.collapseCardsButton.addEventListener("click", () => {
      setFundCardsOpenState(false);
    });
  }

  calculateFundDistributions();
};
