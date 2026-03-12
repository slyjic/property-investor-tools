import { FUND_BASE_SPREAD_PERCENT, FUND_RBA_CASH_RATE_PERCENT } from "../config/constants.js";
import { computeFundProjection } from "../calculations/fund.js";
import {
  byId,
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

  const renderDistributionRows = (rows) => {
    fundRowsBody.innerHTML = "";
    if (fundCardsContainer) {
      fundCardsContainer.innerHTML = "";
    }

    rows.forEach((row) => {
      const rowElement = document.createElement("tr");
      rowElement.innerHTML = `
        <td>M${row.monthIndex}</td>
        <td>${dateFormatter.format(row.distributionDate)}</td>
        <td>${formatCurrencyValue(row.monthlyDistribution)}</td>
        <td>${formatCurrencyValue(row.cumulativeDistribution)}</td>
        <td>${formatCurrencyValue(row.capitalBalance)}</td>
      `;
      fundRowsBody.appendChild(rowElement);

      if (!fundCardsContainer) {
        return;
      }

      const card = document.createElement("article");
      card.className = "fund-card";
      const detailsOpenAttribute = fundCardsExpanded ? "open" : "";
      card.innerHTML = `
        <details class="fund-card-details" ${detailsOpenAttribute}>
          <summary class="fund-card-summary">
            <div class="fund-card-head">
              <h4>M${row.monthIndex}</h4>
              <p>${dateFormatter.format(row.distributionDate)}</p>
            </div>
            <div class="fund-card-summary-amount">
              <span>Monthly distribution</span>
              <strong>${formatCurrencyValue(row.monthlyDistribution)}</strong>
            </div>
          </summary>
          <dl class="fund-card-list">
            <div>
              <dt>Cumulative distribution</dt>
              <dd>${formatCurrencyValue(row.cumulativeDistribution)}</dd>
            </div>
            <div>
              <dt>Capital balance</dt>
              <dd>${formatCurrencyValue(row.capitalBalance)}</dd>
            </div>
          </dl>
        </details>
      `;
      fundCardsContainer.appendChild(card);
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

  if (fundFields.investmentAmount) {
    if (!fundFields.investmentAmount.value.trim()) {
      fundFields.investmentAmount.value = "100000";
    }

    fundFields.investmentAmount.addEventListener("focus", () => {
      unformatCurrencyInput(fundFields.investmentAmount);
    });

    fundFields.investmentAmount.addEventListener("input", () => {
      sanitizeCurrencyInput(fundFields.investmentAmount);
      calculateFundDistributions();
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
