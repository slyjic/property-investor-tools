(() => {
  // js/config/constants.js
  var TAX_BRACKETS = {
    "2025-26": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45e3, rate: 0.16 },
      { min: 45e3, max: 135e3, rate: 0.3 },
      { min: 135e3, max: 19e4, rate: 0.37 },
      { min: 19e4, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ],
    "2026-27": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45e3, rate: 0.15 },
      { min: 45e3, max: 135e3, rate: 0.3 },
      { min: 135e3, max: 19e4, rate: 0.37 },
      { min: 19e4, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ],
    "2027-28": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45e3, rate: 0.14 },
      { min: 45e3, max: 135e3, rate: 0.3 },
      { min: 135e3, max: 19e4, rate: 0.37 },
      { min: 19e4, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ]
  };
  var DEFAULT_STATEMENT_MONTHS = [
    { label: "Jul 2024", income: 31469.73, expenses: 1099, fees: 1645.35, disbursement: 28725.38 },
    { label: "Aug 2024", income: 21388.97, expenses: 2903.25, fees: 1082.93, disbursement: 18040.67 },
    { label: "Sep 2024", income: 20883.52, expenses: 1877.72, fees: 1057.66, disbursement: 17948.14 },
    { label: "Oct 2024", income: 22952.53, expenses: 649, fees: 1132.04, disbursement: 21171.49 },
    { label: "Nov 2024", income: 21628.53, expenses: 5390.33, fees: 1094.92, disbursement: 15143.28 },
    { label: "Dec 2024", income: 12713.18, expenses: 10784.91, fees: 652.51, disbursement: 1275.76 },
    { label: "Jan 2025", income: 33453.88, expenses: 770, fees: 1686.2, disbursement: 30997.68 },
    { label: "Feb 2025", income: 9803.18, expenses: 2444.2, fees: 503.64, disbursement: 5381.7 },
    { label: "Mar 2025", income: 21703.53, expenses: 7857.8, fees: 1022.07, disbursement: 14297.3 },
    { label: "Apr 2025", income: 36294.98, expenses: 11060.6, fees: 1832.33, disbursement: 23402.05 },
    { label: "May 2025", income: 13985.38, expenses: 2607.41, fees: 713.32, disbursement: 10664.65 },
    { label: "Jun 2025", income: 21028.53, expenses: 88, fees: 1061.97, disbursement: 19305.07 }
  ];
  var DEFAULT_CATEGORY_VALUES = {
    rentGst: 207941.74,
    rentGstFree: 34800,
    outgoingsRecovered: 23915.2,
    otherIncome: 649,
    councilRates: 7357.61,
    waterRates: 3756.98,
    insurance: 10784.91,
    landTax: 16128.95,
    gardening: 5346,
    fireSafety: 1590.26,
    repairs: 1430,
    capex: 1099,
    otherExpenses: 38.51,
    managementFees: 13429.94,
    otherFees: 55
  };
  var FUND_BASE_SPREAD_PERCENT = 4;
  var FUND_RBA_CASH_RATE_PERCENT = 3.85;

  // js/calculations/fund.js
  var addMonths = (date, monthsToAdd) => {
    const shifted = new Date(date.getTime());
    const day = shifted.getDate();
    shifted.setDate(1);
    shifted.setMonth(shifted.getMonth() + monthsToAdd);
    const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
    shifted.setDate(Math.min(day, lastDay));
    return shifted;
  };
  var computeFundProjection = ({
    investmentAmount,
    baseSpreadPercent,
    cashRatePercent,
    startDate = /* @__PURE__ */ new Date(),
    months = 12
  }) => {
    const annualRatePercent = baseSpreadPercent + cashRatePercent;
    const monthlyRatePercent = annualRatePercent / 12;
    const monthlyDistribution = investmentAmount * (annualRatePercent / 100) / 12;
    const annualDistribution = monthlyDistribution * months;
    const projectionStartDate = new Date(startDate.getTime());
    const monthlyDistributionSeries = Array.from({ length: months }, () => monthlyDistribution);
    const cumulativeDistributionSeries = monthlyDistributionSeries.map((value, index) => value * (index + 1));
    const rows = cumulativeDistributionSeries.map((cumulativeDistribution, index) => ({
      monthIndex: index + 1,
      distributionDate: addMonths(projectionStartDate, index),
      monthlyDistribution,
      cumulativeDistribution,
      capitalBalance: investmentAmount
    }));
    return {
      annualRatePercent,
      monthlyRatePercent,
      monthlyDistribution,
      annualDistribution,
      projectionStartDate,
      monthlyDistributionSeries,
      cumulativeDistributionSeries,
      rows
    };
  };

  // js/shared/runtime.js
  var moneyFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  var currencyInputFormatter = new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  var byId = (id) => document.getElementById(id);
  var normalizeNumericString = (value) => {
    const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
    if (!cleaned) {
      return "";
    }
    const firstDotIndex = cleaned.indexOf(".");
    if (firstDotIndex === -1) {
      return cleaned;
    }
    const integerPart = cleaned.slice(0, firstDotIndex);
    const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
    return `${integerPart}.${decimalPart}`;
  };
  var parseCurrencyValue = (value) => {
    const normalized = normalizeNumericString(value);
    if (!normalized) {
      return Number.NaN;
    }
    return Number.parseFloat(normalized);
  };
  var toEditableNumberString = (value) => {
    if (!Number.isFinite(value)) {
      return "";
    }
    return value.toFixed(2).replace(/\.?0+$/, "");
  };
  var readNumber = (input) => {
    if (!input) {
      return 0;
    }
    const parsed = input.dataset && input.dataset.currency === "true" ? parseCurrencyValue(input.value) : Number.parseFloat(input.value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };
  var clampRangeInput = (input, min, max) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = Number.parseFloat(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    input.value = toEditableNumberString(clamped);
  };
  var clampPercentInput = (input) => {
    clampRangeInput(input, 0, 100);
  };
  var formatMoney = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  var formatPercent = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
  var formatCurrencyValue = (value) => `$${currencyInputFormatter.format(Math.max(0, value))}`;
  var sanitizeCurrencyInput = (input) => {
    if (!input) {
      return;
    }
    input.value = normalizeNumericString(input.value);
  };
  var formatCurrencyInput = (input) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = parseCurrencyValue(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    input.value = formatCurrencyValue(parsed);
  };
  var unformatCurrencyInput = (input) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = parseCurrencyValue(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    input.value = toEditableNumberString(Math.max(0, parsed));
  };
  var setTextContent = (element, value) => {
    if (!element) {
      return false;
    }
    const nextValue = String(value ?? "");
    if (element.textContent === nextValue) {
      return false;
    }
    element.textContent = nextValue;
    return true;
  };
  var setSignedClass = (element, value) => {
    if (!element) {
      return;
    }
    const nextTone = value > 0 ? "positive" : value < 0 ? "negative" : "none";
    const currentTone = element.dataset.signTone || "none";
    if (currentTone === nextTone) {
      return;
    }
    element.dataset.signTone = nextTone;
    element.classList.remove("value-positive", "value-negative");
    if (nextTone === "positive") {
      element.classList.add("value-positive");
    } else if (nextTone === "negative") {
      element.classList.add("value-negative");
    }
  };
  var setOutputValue = (element, value, useSignClass = false) => {
    if (!element) {
      return;
    }
    setTextContent(element, formatMoney(value));
    if (useSignClass) {
      setSignedClass(element, value);
    }
  };
  var setPercentOutputValue = (element, value, useSignClass = false) => {
    if (!element) {
      return;
    }
    setTextContent(element, formatPercent(value));
    if (useSignClass) {
      setSignedClass(element, value);
    }
  };
  var setTrendToneClass = (element, value) => {
    if (!element) {
      return;
    }
    const nextTone = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
    if (element.dataset.trendTone === nextTone) {
      return;
    }
    element.dataset.trendTone = nextTone;
    element.classList.remove("is-positive", "is-negative", "is-neutral");
    if (nextTone === "positive") {
      element.classList.add("is-positive");
      return;
    }
    if (nextTone === "negative") {
      element.classList.add("is-negative");
      return;
    }
    element.classList.add("is-neutral");
  };
  var setDetailsOpenState = (container, detailsSelector, isOpen) => {
    if (!container) {
      return;
    }
    container.querySelectorAll(detailsSelector).forEach((detailsElement) => {
      detailsElement.open = isOpen;
    });
  };
  var renderSparkline = (svgElement, values, {
    baseline = 0,
    lineColor = "#69d49f",
    areaColor = "rgba(105, 212, 159, 0.2)",
    baselineColor = "rgba(188, 218, 223, 0.3)"
  } = {}) => {
    if (!svgElement) {
      return;
    }
    const safeValues = Array.isArray(values) ? values.map((value) => Number.isFinite(value) ? value : 0) : [];
    if (!safeValues.length) {
      if (svgElement.innerHTML) {
        svgElement.innerHTML = "";
      }
      delete svgElement.dataset.sparklineSignature;
      return;
    }
    const signature = JSON.stringify({
      values: safeValues,
      baseline: Number.isFinite(baseline) ? baseline : null,
      lineColor,
      areaColor,
      baselineColor
    });
    if (svgElement.dataset.sparklineSignature === signature) {
      return;
    }
    svgElement.dataset.sparklineSignature = signature;
    const width = 300;
    const height = 88;
    const padX = 6;
    const padY = 8;
    let minValue = Math.min(...safeValues);
    let maxValue = Math.max(...safeValues);
    if (Number.isFinite(baseline)) {
      minValue = Math.min(minValue, baseline);
      maxValue = Math.max(maxValue, baseline);
    }
    if (minValue === maxValue) {
      minValue -= 1;
      maxValue += 1;
    }
    const valueRange = maxValue - minValue;
    const xStep = safeValues.length > 1 ? (width - padX * 2) / (safeValues.length - 1) : 0;
    const yFor = (value) => padY + (maxValue - value) / valueRange * (height - padY * 2);
    const pointFor = (value, index) => {
      const x = padX + index * xStep;
      const y = yFor(value);
      return { x, y, text: `${x.toFixed(2)},${y.toFixed(2)}` };
    };
    const points = safeValues.map((value, index) => pointFor(value, index));
    const polylinePoints = points.map((point) => point.text).join(" ");
    const baselineY = yFor(Number.isFinite(baseline) ? baseline : minValue);
    const areaPoints = `${points[0].x.toFixed(2)},${baselineY.toFixed(2)} ${polylinePoints} ${points[points.length - 1].x.toFixed(2)},${baselineY.toFixed(2)}`;
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svgElement.innerHTML = `
      <line x1="${padX}" y1="${baselineY.toFixed(2)}" x2="${(width - padX).toFixed(2)}" y2="${baselineY.toFixed(2)}"
        stroke="${baselineColor}" stroke-width="1" stroke-dasharray="3 3"></line>
      <polyline points="${areaPoints}" fill="${areaColor}" stroke="none"></polyline>
      <polyline points="${polylinePoints}" fill="none" stroke="${lineColor}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"></polyline>
    `;
  };
  var createFrameScheduler = (callback) => {
    let isCoolingDown = false;
    let hasPending = false;
    const scheduleFrame = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" ? window.requestAnimationFrame.bind(window) : (fn) => window.setTimeout(fn, 16);
    const flush = () => {
      if (!hasPending) {
        isCoolingDown = false;
        return;
      }
      hasPending = false;
      callback();
      scheduleFrame(flush);
    };
    return () => {
      if (isCoolingDown) {
        hasPending = true;
        return;
      }
      callback();
      isCoolingDown = true;
      scheduleFrame(flush);
    };
  };

  // js/tools/fund.js
  var initSimpleFundCalculator = () => {
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
      collapseCardsButton: byId("fundCardsCollapse")
    };
    const dateFormatter = new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    let fundCardsExpanded = false;
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
        startDate: /* @__PURE__ */ new Date(),
        months: 12
      });
      setPercentOutputValue(fundFields.outputCashRate, FUND_RBA_CASH_RATE_PERCENT);
      setPercentOutputValue(fundFields.outputAnnualRate, projection.annualRatePercent);
      setPercentOutputValue(fundFields.outputMonthlyRate, projection.monthlyRatePercent);
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
        baselineColor: "rgba(255, 212, 168, 0.34)"
      });
      renderSparkline(fundFields.outputTrendCumulativeSparkline, projection.cumulativeDistributionSeries, {
        baseline: 0,
        lineColor: "#ffa44f",
        areaColor: "rgba(255, 164, 79, 0.24)",
        baselineColor: "rgba(255, 212, 168, 0.34)"
      });
      setTrendToneClass(fundFields.trendMonthlyCard, projection.monthlyDistribution);
      setTrendToneClass(fundFields.trendCumulativeCard, projection.annualDistribution);
      if (fundFields.outputStartDate) {
        setTextContent(fundFields.outputStartDate, dateFormatter.format(projection.projectionStartDate));
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

  // js/calculations/net.js
  var calculateIncomeTax = (income, brackets) => {
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
  var computeNetProceeds = ({
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
    taxBracketsByYear
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
      afterTaxProfit
    };
  };

  // js/reporting/pdf.js
  var generateNetProceedsPdfReport = ({
    getLatestReport,
    recalculate,
    formatMoney: formatMoney2,
    formatPercent: formatPercent2,
    setPdfStatus
  }) => {
    const jsPdfConstructor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPdfConstructor) {
      setPdfStatus("PDF library did not load. Refresh and try again.", "error");
      return;
    }
    recalculate();
    const report = getLatestReport();
    if (!report) {
      setPdfStatus("No calculations available to export.", "error");
      return;
    }
    try {
      const doc = new jsPdfConstructor({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 44;
      const contentWidth = pageWidth - margin * 2;
      const bottomMargin = 44;
      const headerHeight = 86;
      const colors = {
        headerBg: [14, 34, 46],
        headerAccent: [255, 164, 79],
        heading: [23, 53, 70],
        body: [41, 58, 69],
        muted: [105, 122, 135],
        rowAlt: [246, 250, 252],
        rowBorder: [217, 226, 232],
        highlightBg: [226, 247, 235],
        highlightBorder: [105, 212, 159],
        highlightText: [20, 89, 58],
        highlightTextNegative: [140, 39, 49]
      };
      const now = /* @__PURE__ */ new Date();
      let y = 0;
      const drawHeader = () => {
        doc.setFillColor(...colors.headerBg);
        doc.rect(0, 0, pageWidth, headerHeight, "F");
        doc.setFillColor(...colors.headerAccent);
        doc.rect(0, headerHeight - 4, pageWidth, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text("Investment Property Net Proceeds Report", margin, 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(224, 234, 240);
        doc.text(`Generated: ${now.toLocaleString("en-AU")}`, margin, 54);
        doc.text(`Tax year: ${report.taxYear}`, margin, 69);
        y = headerHeight + 20;
      };
      const ensureSpace = (needed = 16) => {
        if (y + needed > pageHeight - bottomMargin) {
          doc.addPage();
          drawHeader();
        }
      };
      const drawSection = (title) => {
        ensureSpace(28);
        doc.setDrawColor(...colors.rowBorder);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setTextColor(...colors.heading);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, margin, y + 18);
        y += 26;
      };
      const drawRightAlignedLines = (lines, rightX, startY, gap = 12) => {
        lines.forEach((line, index) => {
          doc.text(line, rightX, startY + index * gap, { align: "right" });
        });
      };
      const drawRows = (rows) => {
        const labelWidth = contentWidth * 0.58;
        const valueWidth = contentWidth * 0.34;
        const labelX = margin + 10;
        const valueX = margin + contentWidth - 10;
        const lineGap = 12;
        rows.forEach((row, rowIndex) => {
          const labelLines = doc.splitTextToSize(String(row.label), labelWidth);
          const valueLines = doc.splitTextToSize(String(row.value), valueWidth);
          const rowHeight = Math.max(labelLines.length, valueLines.length) * lineGap + 10;
          ensureSpace(rowHeight + 2);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(...colors.rowAlt);
            doc.rect(margin, y, contentWidth, rowHeight, "F");
          }
          doc.setDrawColor(...colors.rowBorder);
          doc.setLineWidth(0.5);
          doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
          doc.setTextColor(...colors.body);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.8);
          labelLines.forEach((line, lineIndex) => {
            doc.text(line, labelX, y + 14 + lineIndex * lineGap);
          });
          doc.setFont("helvetica", "bold");
          drawRightAlignedLines(valueLines, valueX, y + 14, lineGap);
          y += rowHeight;
        });
        y += 10;
      };
      const drawNetProceedsHighlight = (value) => {
        ensureSpace(84);
        const boxHeight = 72;
        doc.setFillColor(...colors.highlightBg);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "F");
        doc.setDrawColor(...colors.highlightBorder);
        doc.setLineWidth(1.2);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.highlightText);
        doc.text("Net cash to you at settlement", margin + 14, y + 24);
        doc.setFontSize(22);
        if (value >= 0) {
          doc.setTextColor(...colors.highlightText);
        } else {
          doc.setTextColor(...colors.highlightTextNegative);
        }
        doc.text(formatMoney2(value), margin + contentWidth - 14, y + 50, { align: "right" });
        y += boxHeight + 14;
      };
      drawHeader();
      const inputRows = [
        { label: "Contract sale price (whole asset)", value: formatMoney2(report.salePrice) },
        { label: "Acquisition price (whole asset)", value: formatMoney2(report.purchasePrice) },
        { label: "Beneficial ownership", value: formatPercent2(report.ownershipPercent) },
        { label: "Debt payout at settlement (personal)", value: formatMoney2(report.outstandingMortgage) },
        { label: "Expected taxable income (excluding gain)", value: formatMoney2(report.taxableIncome) },
        { label: "50% CGT discount", value: report.discountApplied ? "Yes" : "No" },
        {
          label: "Commission input",
          value: report.feeType === "percent" ? `Percentage mode: ${formatPercent2(report.agentFeePercent)} + ${formatPercent2(report.agentFeeGstPercent)} GST` : "Dollar mode"
        },
        { label: "Marketing and advertising", value: formatMoney2(report.marketingCost) },
        { label: "Legal and conveyancing", value: formatMoney2(report.legalCost) },
        { label: "Discharge and settlement fees", value: formatMoney2(report.mortgageReleaseCost) },
        { label: "Title and due-diligence searches", value: formatMoney2(report.titleSearchCost) }
      ];
      const breakdownRows = [
        {
          label: "Commission (asset level)",
          value: report.feeType === "percent" ? `${formatMoney2(report.salePrice)} x ${formatPercent2(report.agentFeePercent)} x (1 + ${formatPercent2(report.agentFeeGstPercent)}) = ${formatMoney2(report.agentFeeWhole)}` : `${formatMoney2(report.agentFeeWhole)} (manual amount)`
        },
        { label: "Total disposal costs (asset level)", value: formatMoney2(report.totalSellingCostsWhole) },
        {
          label: "Proceeds at beneficial ownership share",
          value: `${formatMoney2(report.salePrice)} x ${formatPercent2(report.ownershipPercent)} = ${formatMoney2(report.saleShare)}`
        },
        {
          label: "Acquisition share",
          value: `${formatMoney2(report.purchasePrice)} x ${formatPercent2(report.ownershipPercent)} = ${formatMoney2(report.purchaseShare)}`
        },
        {
          label: "Apportioned disposal costs",
          value: `${formatMoney2(report.totalSellingCostsWhole)} x ${formatPercent2(report.ownershipPercent)} = ${formatMoney2(report.totalSellingCosts)}`
        },
        {
          label: "Capital gain/loss",
          value: `${formatMoney2(report.saleShare)} - ${formatMoney2(report.purchaseShare)} - ${formatMoney2(report.totalSellingCosts)} = ${formatMoney2(report.capitalGain)}`
        },
        { label: "Taxable capital gain", value: formatMoney2(report.taxableCapitalGain) },
        { label: "Income tax on base income", value: formatMoney2(report.taxBeforeGain) },
        { label: "Income tax with taxable gain", value: formatMoney2(report.taxAfterGain) },
        {
          label: "Incremental CGT estimate",
          value: `${formatMoney2(report.taxAfterGain)} - ${formatMoney2(report.taxBeforeGain)} = ${formatMoney2(report.estimatedCgt)}`
        }
      ];
      const resultRows = [
        { label: "Gross proceeds at your beneficial ownership share", value: formatMoney2(report.saleShare) },
        { label: "Your apportioned disposal costs (excl. CGT)", value: formatMoney2(report.totalSellingCosts) },
        { label: "Your taxable capital gain", value: formatMoney2(report.taxableCapitalGain) },
        { label: "Incremental CGT estimate", value: formatMoney2(report.estimatedCgt) },
        { label: "Debt payout at settlement", value: formatMoney2(report.mortgageShare) },
        { label: "After-tax profit vs acquisition share", value: formatMoney2(report.afterTaxProfit) }
      ];
      drawSection("Inputs");
      drawRows(inputRows);
      drawSection("Calculation Breakdown");
      drawRows(breakdownRows);
      drawSection("Settlement Outcomes");
      drawRows(resultRows);
      drawNetProceedsHighlight(report.netProceeds);
      ensureSpace(28);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      doc.text("Planning estimate only. This report is not financial or tax advice.", margin, y);
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        "-",
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0")
      ].join("");
      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...colors.rowBorder);
        doc.setLineWidth(0.6);
        doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.muted);
        doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: "right" });
      }
      doc.save(`net-proceeds-report-${stamp}.pdf`);
      setPdfStatus("PDF report downloaded.", "success");
    } catch (error) {
      setPdfStatus("Could not create PDF. Please try again.", "error");
    }
  };

  // js/tools/netProceeds.js
  var initNetProceedsCalculator = () => {
    const form = document.querySelector("#property-calculator");
    if (!form) {
      return;
    }
    const fields = {
      salePrice: byId("salePrice"),
      purchasePrice: byId("purchasePrice"),
      ownershipPercent: byId("ownershipPercent"),
      outstandingMortgage: byId("outstandingMortgage"),
      taxYear: byId("taxYear"),
      agentFeePercent: byId("agentFeePercent"),
      agentFeeGstPercent: byId("agentFeeGstPercent"),
      agentFeeDollar: byId("agentFeeDollar"),
      marketingCost: byId("marketingCost"),
      legalCost: byId("legalCost"),
      mortgageReleaseCost: byId("mortgageReleaseCost"),
      titleSearchCost: byId("titleSearchCost"),
      taxableIncome: byId("taxableIncome"),
      cgtDiscount: byId("cgtDiscount"),
      outputAgentFee: byId("agentFeeComputed"),
      outputAdditionalSellingCosts: byId("additionalSellingCostsComputed"),
      outputTotalSellingCostsWholeComputed: byId("totalSellingCostsWholeComputed"),
      outputTotalSellingCostsInline: byId("totalSellingCostsInline"),
      outputOwnershipApplied: byId("ownershipApplied"),
      outputSaleShare: byId("saleShare"),
      outputTotalSellingCosts: byId("totalSellingCosts"),
      outputCapitalGain: byId("capitalGain"),
      outputTaxableCapitalGain: byId("taxableCapitalGain"),
      outputTaxOnIncomeOnly: byId("taxOnIncomeOnly"),
      outputTaxOnIncomeWithGain: byId("taxOnIncomeWithGain"),
      outputEstimatedCgt: byId("estimatedCgt"),
      outputMortgageShare: byId("mortgageShare"),
      outputNetProceeds: byId("netProceeds"),
      outputMobileNetProceeds: byId("mobileNetProceeds"),
      outputAfterTaxProfit: byId("afterTaxProfit"),
      downloadPdf: byId("downloadPdf"),
      pdfStatus: byId("pdfStatus")
    };
    let latestReport = null;
    let statusTimerId = null;
    const agentFeeTypeInputs = Array.from(document.querySelectorAll("input[name='agentFeeType']"));
    const agentPercentBlock = document.querySelector("[data-agent-percent]");
    const agentDollarBlock = document.querySelector("[data-agent-dollar]");
    const currencyInputs = Array.from(form.querySelectorAll("input[data-currency='true']"));
    const selectedAgentFeeType = () => {
      const checked = agentFeeTypeInputs.find((input) => input.checked);
      return checked ? checked.value : "percent";
    };
    const setPdfStatus = (message, tone = "") => {
      if (!fields.pdfStatus) {
        return;
      }
      setTextContent(fields.pdfStatus, message);
      fields.pdfStatus.classList.remove("is-success", "is-error");
      if (tone === "success") {
        fields.pdfStatus.classList.add("is-success");
      } else if (tone === "error") {
        fields.pdfStatus.classList.add("is-error");
      }
      if (statusTimerId) {
        window.clearTimeout(statusTimerId);
        statusTimerId = null;
      }
      if (message) {
        statusTimerId = window.setTimeout(() => {
          if (fields.pdfStatus) {
            setTextContent(fields.pdfStatus, "");
            fields.pdfStatus.classList.remove("is-success", "is-error");
          }
        }, 5200);
      }
    };
    const syncAgentFeeInputs = () => {
      const feeType = selectedAgentFeeType();
      const isPercentMode = feeType === "percent";
      if (agentPercentBlock) {
        agentPercentBlock.hidden = !isPercentMode;
      }
      if (agentDollarBlock) {
        agentDollarBlock.hidden = isPercentMode;
      }
      if (fields.agentFeePercent) {
        fields.agentFeePercent.disabled = !isPercentMode;
      }
      if (fields.agentFeeGstPercent) {
        fields.agentFeeGstPercent.disabled = !isPercentMode;
      }
      if (fields.agentFeeDollar) {
        fields.agentFeeDollar.disabled = isPercentMode;
      }
    };
    const calculate = () => {
      const calculation = computeNetProceeds({
        salePrice: readNumber(fields.salePrice),
        purchasePrice: readNumber(fields.purchasePrice),
        outstandingMortgage: readNumber(fields.outstandingMortgage),
        ownershipPercent: readNumber(fields.ownershipPercent),
        feeType: selectedAgentFeeType(),
        agentFeePercent: readNumber(fields.agentFeePercent),
        agentFeeGstPercent: readNumber(fields.agentFeeGstPercent),
        agentFeeDollar: readNumber(fields.agentFeeDollar),
        marketingCost: readNumber(fields.marketingCost),
        legalCost: readNumber(fields.legalCost),
        mortgageReleaseCost: readNumber(fields.mortgageReleaseCost),
        titleSearchCost: readNumber(fields.titleSearchCost),
        taxableIncome: readNumber(fields.taxableIncome),
        cgtDiscountApplied: Boolean(fields.cgtDiscount && fields.cgtDiscount.checked),
        taxYear: fields.taxYear ? fields.taxYear.value : "2025-26",
        taxBracketsByYear: TAX_BRACKETS
      });
      latestReport = calculation;
      if (fields.outputOwnershipApplied) {
        setTextContent(fields.outputOwnershipApplied, `${calculation.ownershipPercent.toFixed(2)}%`);
      }
      setOutputValue(fields.outputAgentFee, calculation.agentFeeWhole);
      setOutputValue(fields.outputAdditionalSellingCosts, calculation.additionalSellingCostsWhole);
      setOutputValue(fields.outputTotalSellingCostsWholeComputed, calculation.totalSellingCostsWhole);
      setOutputValue(fields.outputTotalSellingCostsInline, calculation.totalSellingCosts);
      setOutputValue(fields.outputSaleShare, calculation.saleShare);
      setOutputValue(fields.outputTotalSellingCosts, calculation.totalSellingCosts);
      setOutputValue(fields.outputCapitalGain, calculation.capitalGain, true);
      setOutputValue(fields.outputTaxableCapitalGain, calculation.taxableCapitalGain);
      setOutputValue(fields.outputTaxOnIncomeOnly, calculation.taxBeforeGain);
      setOutputValue(fields.outputTaxOnIncomeWithGain, calculation.taxAfterGain);
      setOutputValue(fields.outputEstimatedCgt, calculation.estimatedCgt);
      setOutputValue(fields.outputMortgageShare, calculation.mortgageShare);
      setOutputValue(fields.outputNetProceeds, calculation.netProceeds, true);
      setOutputValue(fields.outputMobileNetProceeds, calculation.netProceeds, true);
      setOutputValue(fields.outputAfterTaxProfit, calculation.afterTaxProfit, true);
    };
    const wireCurrencyFormatting = () => {
      currencyInputs.forEach((input) => {
        input.addEventListener("focus", () => {
          unformatCurrencyInput(input);
        });
        input.addEventListener("blur", () => {
          formatCurrencyInput(input);
          calculate();
        });
      });
    };
    const formatAllCurrencyInputs = () => {
      currencyInputs.forEach((input) => {
        formatCurrencyInput(input);
      });
    };
    const wireEvents = () => {
      const scheduleCalculate = createFrameScheduler(calculate);
      agentFeeTypeInputs.forEach((radioInput) => {
        radioInput.addEventListener("change", () => {
          syncAgentFeeInputs();
          calculate();
        });
      });
      const inputs = Array.from(form.querySelectorAll("input, select"));
      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          if (input.dataset && input.dataset.currency === "true") {
            sanitizeCurrencyInput(input);
          }
          if (input.id === "ownershipPercent") {
            clampPercentInput(input);
          }
          scheduleCalculate();
        });
        input.addEventListener("change", () => {
          if (input.id === "ownershipPercent") {
            clampPercentInput(input);
          }
          calculate();
        });
      });
    };
    const wirePdfExport = () => {
      if (!fields.downloadPdf) {
        return;
      }
      fields.downloadPdf.addEventListener("click", () => {
        generateNetProceedsPdfReport({
          getLatestReport: () => latestReport,
          recalculate: calculate,
          formatMoney,
          formatPercent,
          setPdfStatus
        });
      });
    };
    wireCurrencyFormatting();
    syncAgentFeeInputs();
    formatAllCurrencyInputs();
    wireEvents();
    wirePdfExport();
    calculate();
  };

  // js/calculations/performance.js
  var evaluateHealth = (annualMargin, costToIncome, positiveMonths, totalMonths) => {
    const marginScore = annualMargin >= 55 ? 3 : annualMargin >= 35 ? 2 : annualMargin >= 20 ? 1 : 0;
    const costScore = costToIncome <= 40 ? 3 : costToIncome <= 55 ? 2 : costToIncome <= 70 ? 1 : 0;
    const stabilityScore = positiveMonths >= 11 ? 3 : positiveMonths >= 9 ? 2 : positiveMonths >= 7 ? 1 : 0;
    const score = marginScore + costScore + stabilityScore;
    if (score >= 7) {
      return {
        status: "Healthy",
        tone: "strong",
        note: `Strong operating cashflow profile with ${positiveMonths}/${totalMonths} positive months and controlled costs.`
      };
    }
    if (score >= 4) {
      return {
        status: "Stable",
        tone: "stable",
        note: "Generally performing well, but monitor operating margins and cost pressure over time."
      };
    }
    return {
      status: "Needs Attention",
      tone: "watch",
      note: "Operating profitability or month-to-month consistency is under pressure and needs closer review."
    };
  };
  var computePerformance = ({
    propertyValue,
    ownershipPercent,
    startingCash,
    annualIncome,
    annualExpenses,
    annualFees,
    months
  }) => {
    const ownershipRatio = Math.min(100, ownershipPercent) / 100;
    const annualNet = annualIncome - annualExpenses - annualFees;
    const annualMargin = annualIncome > 0 ? annualNet / annualIncome * 100 : 0;
    const grossYield = propertyValue > 0 ? annualIncome / propertyValue * 100 : 0;
    const netYield = propertyValue > 0 ? annualNet / propertyValue * 100 : 0;
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
      const monthMargin = month.income > 0 ? monthNet / month.income * 100 : 0;
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
        margin: monthMargin
      };
    });
    quarterSummaries.forEach((quarter) => {
      quarter.margin = quarter.income > 0 ? quarter.net / quarter.income * 100 : 0;
    });
    const monthlyNet = monthlyIncomeTotal - monthlyExpensesTotal - monthlyFeesTotal;
    const monthlyAverageNet = months.length ? monthlyNet / months.length : 0;
    const costToIncome = monthlyIncomeTotal > 0 ? (monthlyExpensesTotal + monthlyFeesTotal) / monthlyIncomeTotal * 100 : 0;
    const retainedCash = startingCash + monthlyNet - monthlyDisbursementTotal;
    const netDifference = annualNet - monthlyNet;
    const yourShareNet = monthlyNet * ownershipRatio;
    const yourShareMonthly = monthlyAverageNet * ownershipRatio;
    const monthlyNetMargin = monthlyIncomeTotal > 0 ? monthlyNet / monthlyIncomeTotal * 100 : 0;
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
      health
    };
  };

  // js/tools/performance.js
  var initPerformanceCalculator = () => {
    const incomeForm = document.querySelector("#investment-income-calculator");
    if (!incomeForm) {
      return;
    }
    const statementRowsBody = byId("incomeStatementRows");
    if (!statementRowsBody) {
      return;
    }
    const statementCardsContainer = byId("incomeStatementCards");
    const incomeCardsExpandButton = byId("incomeCardsExpand");
    const incomeCardsCollapseButton = byId("incomeCardsCollapse");
    const incomeFields = {
      propertyValue: byId("incomePropertyValue"),
      ownershipPercent: byId("incomeOwnershipPercent"),
      startingCash: byId("incomeStartingCash"),
      applySourceMonth: byId("incomeApplySourceMonth"),
      applySourceToAllButton: byId("incomeApplySourceToAll"),
      copyPrevAcrossButton: byId("incomeCopyPrevAcross"),
      rentGst: byId("incomeRentGst"),
      rentGstFree: byId("incomeRentGstFree"),
      outgoingsRecovered: byId("incomeOutgoingsRecovered"),
      otherIncome: byId("incomeOtherIncome"),
      councilRates: byId("incomeCouncilRates"),
      waterRates: byId("incomeWaterRates"),
      insurance: byId("incomeInsurance"),
      landTax: byId("incomeLandTax"),
      gardening: byId("incomeGardening"),
      fireSafety: byId("incomeFireSafety"),
      repairs: byId("incomeRepairs"),
      capex: byId("incomeCapex"),
      otherExpenses: byId("incomeOtherExpenses"),
      managementFees: byId("incomeManagementFees"),
      otherFees: byId("incomeOtherFees"),
      outputAnnualIncome: byId("incomeAnnualIncome"),
      outputAnnualExpenses: byId("incomeAnnualExpenses"),
      outputAnnualFees: byId("incomeAnnualFees"),
      outputAnnualNet: byId("incomeAnnualNet"),
      outputGrossYield: byId("incomeGrossYield"),
      outputNetYield: byId("incomeNetYield"),
      outputMonthlyNet: byId("incomeMonthlyNet"),
      outputMonthlyAverageNet: byId("incomeMonthlyAverageNet"),
      outputOwnerDisbursements: byId("incomeOwnerDisbursements"),
      outputBestMonth: byId("incomeBestMonth"),
      outputWorstMonth: byId("incomeWorstMonth"),
      outputNetDifference: byId("incomeNetDifference"),
      outputYourShareMonthly: byId("incomeYourShareMonthly"),
      outputTableTotalIncome: byId("incomeTableTotalIncome"),
      outputTableTotalExpenses: byId("incomeTableTotalExpenses"),
      outputTableTotalFees: byId("incomeTableTotalFees"),
      outputTableTotalDisbursement: byId("incomeTableTotalDisbursement"),
      outputTableTotalNet: byId("incomeTableTotalNet"),
      outputTableTotalMargin: byId("incomeTableTotalMargin"),
      outputMonthlyStripIncome: byId("incomeMonthlyStripIncome"),
      outputMonthlyStripNet: byId("incomeMonthlyStripNet"),
      outputMonthlyStripAvg: byId("incomeMonthlyStripAvg"),
      outputMonthlyStripPositive: byId("incomeMonthlyStripPositive"),
      outputQuarter1Net: byId("incomeQuarter1Net"),
      outputQuarter1Margin: byId("incomeQuarter1Margin"),
      outputQuarter2Net: byId("incomeQuarter2Net"),
      outputQuarter2Margin: byId("incomeQuarter2Margin"),
      outputQuarter3Net: byId("incomeQuarter3Net"),
      outputQuarter3Margin: byId("incomeQuarter3Margin"),
      outputQuarter4Net: byId("incomeQuarter4Net"),
      outputQuarter4Margin: byId("incomeQuarter4Margin"),
      outputHealthStatus: byId("incomeHealthStatus"),
      outputHealthStatusCard: byId("incomeHealthStatusCard"),
      outputHealthNote: byId("incomeHealthNote"),
      outputHealthNoteCard: byId("incomeHealthNoteCard"),
      outputKpiNetShare: byId("incomeKpiNetShare"),
      outputKpiNetShareCard: byId("incomeKpiNetShareCard"),
      outputKpiNetYield: byId("incomeKpiNetYield"),
      outputKpiNetYieldCard: byId("incomeKpiNetYieldCard"),
      outputKpiNetMargin: byId("incomeKpiNetMargin"),
      outputKpiNetMarginCard: byId("incomeKpiNetMarginCard"),
      outputKpiCostToIncome: byId("incomeKpiCostToIncome"),
      outputKpiCostToIncomeCard: byId("incomeKpiCostToIncomeCard"),
      outputKpiPositiveMonths: byId("incomeKpiPositiveMonths"),
      outputKpiPositiveMonthsCard: byId("incomeKpiPositiveMonthsCard"),
      outputKpiRetainedCash: byId("incomeKpiRetainedCash"),
      outputTrendNetLatest: byId("incomeTrendNetLatest"),
      outputTrendMarginLatest: byId("incomeTrendMarginLatest"),
      outputTrendNetSparkline: byId("incomeNetSparkline"),
      outputTrendMarginSparkline: byId("incomeMarginSparkline"),
      trendNetCard: byId("incomeNetTrendCard"),
      trendMarginCard: byId("incomeMarginTrendCard"),
      outputMobileSummaryNet: byId("mobileIncomeNet")
    };
    const monthValueKeys = ["income", "expenses", "fees", "disbursement"];
    let monthRows = [];
    const setLabelledMoneyOutput = (element, label, value, useSignClass = false) => {
      if (!element) {
        return;
      }
      setTextContent(element, `${label || "-"}: ${formatMoney(value)}`);
      if (useSignClass) {
        setSignedClass(element, value);
      }
    };
    const setHealthState = (status, note, tone) => {
      const applyToneClass = (element) => {
        if (!element) {
          return;
        }
        element.classList.remove("is-strong", "is-stable", "is-watch");
        if (tone === "strong") {
          element.classList.add("is-strong");
        } else if (tone === "stable") {
          element.classList.add("is-stable");
        } else if (tone === "watch") {
          element.classList.add("is-watch");
        }
      };
      if (incomeFields.outputHealthStatus) {
        setTextContent(incomeFields.outputHealthStatus, status);
        applyToneClass(incomeFields.outputHealthStatus);
      }
      if (incomeFields.outputHealthStatusCard) {
        setTextContent(incomeFields.outputHealthStatusCard, status);
        applyToneClass(incomeFields.outputHealthStatusCard);
      }
      if (incomeFields.outputHealthNote) {
        setTextContent(incomeFields.outputHealthNote, note);
      }
      if (incomeFields.outputHealthNoteCard) {
        setTextContent(incomeFields.outputHealthNoteCard, note);
      }
    };
    const syncPairedInputValue = (source, target) => {
      if (!source || !target) {
        return;
      }
      target.value = source.value;
    };
    const wireMirroredInputs = (inputA, inputB) => {
      if (!inputA || !inputB) {
        return;
      }
      const mirrorValue = (source, target, eventName) => {
        syncPairedInputValue(source, target);
        if (eventName === "blur") {
          window.setTimeout(() => {
            syncPairedInputValue(source, target);
          }, 0);
        }
      };
      ["input", "change", "blur"].forEach((eventName) => {
        inputA.addEventListener(eventName, () => {
          mirrorValue(inputA, inputB, eventName);
        });
        inputB.addEventListener(eventName, () => {
          mirrorValue(inputB, inputA, eventName);
        });
      });
    };
    const setStatementCellValues = (rowData, netValue, netMarginPercent) => {
      [rowData.outputNet, rowData.outputNetMobile].forEach((element) => {
        if (!element) {
          return;
        }
        setTextContent(element, formatMoney(netValue));
        setSignedClass(element, netValue);
      });
      [rowData.outputMargin, rowData.outputMarginMobile].forEach((element) => {
        if (!element) {
          return;
        }
        setPercentOutputValue(element, netMarginPercent, true);
      });
    };
    const getRowInputByKey = (rowData, key, useMobile = false) => {
      if (!rowData) {
        return null;
      }
      if (key === "income") {
        return useMobile ? rowData.incomeInputMobile : rowData.incomeInput;
      }
      if (key === "expenses") {
        return useMobile ? rowData.expensesInputMobile : rowData.expensesInput;
      }
      if (key === "fees") {
        return useMobile ? rowData.feesInputMobile : rowData.feesInput;
      }
      if (key === "disbursement") {
        return useMobile ? rowData.disbursementInputMobile : rowData.disbursementInput;
      }
      return null;
    };
    const setRowFieldValue = (rowData, key, value) => {
      const desktopInput = getRowInputByKey(rowData, key, false);
      const mobileInput = getRowInputByKey(rowData, key, true);
      if (desktopInput) {
        desktopInput.value = value;
      }
      if (mobileInput) {
        mobileInput.value = value;
      }
    };
    const readRowFieldValue = (rowData, key) => {
      const desktopInput = getRowInputByKey(rowData, key, false);
      if (desktopInput) {
        return desktopInput.value;
      }
      const mobileInput = getRowInputByKey(rowData, key, true);
      return mobileInput ? mobileInput.value : "";
    };
    const copyRowValues = (sourceRow, targetRow) => {
      if (!sourceRow || !targetRow) {
        return;
      }
      monthValueKeys.forEach((key) => {
        setRowFieldValue(targetRow, key, readRowFieldValue(sourceRow, key));
      });
    };
    const clearNodeChildren = (node) => {
      if (node) {
        node.textContent = "";
      }
    };
    const createMonthInput = ({ index, field, value, monthLabel, fieldLabel, mobile = false }) => {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.dataset.currency = "true";
      input.autocomplete = "off";
      input.value = toEditableNumberString(value);
      input.setAttribute("aria-label", `${monthLabel} - ${fieldLabel}`);
      input.dataset.monthIndex = String(index);
      if (mobile) {
        input.dataset.monthFieldMobile = field;
      } else {
        input.dataset.monthField = field;
      }
      return input;
    };
    const createStatementDesktopRow = (month, index) => {
      const row = document.createElement("tr");
      const monthCell = document.createElement("td");
      monthCell.className = "statement-month";
      monthCell.textContent = month.label;
      row.appendChild(monthCell);
      const monthFieldConfig = [
        { key: "income", label: "Gross income", value: month.income },
        { key: "expenses", label: "Operating expenses", value: month.expenses },
        { key: "fees", label: "Management fees", value: month.fees },
        { key: "disbursement", label: "Owner draw / disbursement", value: month.disbursement }
      ];
      const inputs = {};
      monthFieldConfig.forEach(({ key, label, value }) => {
        const cell = document.createElement("td");
        const input = createMonthInput({
          index,
          field: key,
          value,
          monthLabel: month.label,
          fieldLabel: label
        });
        cell.appendChild(input);
        row.appendChild(cell);
        inputs[key] = input;
      });
      const netCell = document.createElement("td");
      const outputNet = document.createElement("span");
      outputNet.className = "statement-net";
      outputNet.dataset.monthOutput = "net";
      outputNet.textContent = "$0.00";
      netCell.appendChild(outputNet);
      row.appendChild(netCell);
      const marginCell = document.createElement("td");
      const outputMargin = document.createElement("span");
      outputMargin.className = "statement-margin";
      outputMargin.dataset.monthOutput = "margin";
      outputMargin.textContent = "0.00%";
      marginCell.appendChild(outputMargin);
      row.appendChild(marginCell);
      return {
        row,
        incomeInput: inputs.income,
        expensesInput: inputs.expenses,
        feesInput: inputs.fees,
        disbursementInput: inputs.disbursement,
        outputNet,
        outputMargin
      };
    };
    const createStatementMobileCard = (month, index) => {
      const card = document.createElement("article");
      card.className = "statement-card";
      const details = document.createElement("details");
      details.className = "statement-card-details";
      details.open = index === 0;
      card.appendChild(details);
      const summary = document.createElement("summary");
      summary.className = "statement-card-summary";
      details.appendChild(summary);
      const summaryMain = document.createElement("div");
      summaryMain.className = "statement-card-summary-main";
      summary.appendChild(summaryMain);
      const title = document.createElement("h4");
      title.textContent = month.label;
      summaryMain.appendChild(title);
      const summaryHint = document.createElement("p");
      summaryHint.textContent = "Tap to edit monthly inputs";
      summaryMain.appendChild(summaryHint);
      const summaryMetrics = document.createElement("div");
      summaryMetrics.className = "statement-card-summary-metrics";
      summary.appendChild(summaryMetrics);
      const outputNet = document.createElement("span");
      outputNet.className = "statement-card-net";
      outputNet.dataset.monthOutputMobile = "net";
      outputNet.textContent = "$0.00";
      summaryMetrics.appendChild(outputNet);
      const outputMargin = document.createElement("strong");
      outputMargin.className = "statement-card-margin";
      outputMargin.dataset.monthOutputMobile = "margin";
      outputMargin.textContent = "0.00%";
      summaryMetrics.appendChild(outputMargin);
      const body = document.createElement("div");
      body.className = "statement-card-body";
      details.appendChild(body);
      const grid = document.createElement("div");
      grid.className = "statement-card-grid";
      body.appendChild(grid);
      const mobileFieldConfig = [
        { key: "income", label: "Gross income", value: month.income },
        { key: "expenses", label: "Operating expenses", value: month.expenses },
        { key: "fees", label: "Management fees", value: month.fees },
        { key: "disbursement", label: "Owner draw / disbursement", value: month.disbursement }
      ];
      const inputs = {};
      mobileFieldConfig.forEach(({ key, label, value }) => {
        const fieldLabel = document.createElement("label");
        fieldLabel.className = "statement-card-field";
        const labelText = document.createElement("span");
        labelText.textContent = label;
        fieldLabel.appendChild(labelText);
        const input = createMonthInput({
          index,
          field: key,
          value,
          monthLabel: month.label,
          fieldLabel: label,
          mobile: true
        });
        fieldLabel.appendChild(input);
        grid.appendChild(fieldLabel);
        inputs[key] = input;
      });
      return {
        card,
        incomeInput: inputs.income,
        expensesInput: inputs.expenses,
        feesInput: inputs.fees,
        disbursementInput: inputs.disbursement,
        outputNet,
        outputMargin
      };
    };
    const buildStatementRows = () => {
      monthRows = [];
      clearNodeChildren(statementRowsBody);
      clearNodeChildren(statementCardsContainer);
      DEFAULT_STATEMENT_MONTHS.forEach((month, index) => {
        const desktopRow = createStatementDesktopRow(month, index);
        statementRowsBody.appendChild(desktopRow.row);
        let cardIncomeInput = null;
        let cardExpensesInput = null;
        let cardFeesInput = null;
        let cardDisbursementInput = null;
        let cardNetOutput = null;
        let cardMarginOutput = null;
        if (statementCardsContainer) {
          const mobileCard = createStatementMobileCard(month, index);
          statementCardsContainer.appendChild(mobileCard.card);
          cardIncomeInput = mobileCard.incomeInput;
          cardExpensesInput = mobileCard.expensesInput;
          cardFeesInput = mobileCard.feesInput;
          cardDisbursementInput = mobileCard.disbursementInput;
          cardNetOutput = mobileCard.outputNet;
          cardMarginOutput = mobileCard.outputMargin;
        }
        const rowData = {
          label: month.label,
          incomeInput: desktopRow.incomeInput,
          expensesInput: desktopRow.expensesInput,
          feesInput: desktopRow.feesInput,
          disbursementInput: desktopRow.disbursementInput,
          outputNet: desktopRow.outputNet,
          outputMargin: desktopRow.outputMargin,
          incomeInputMobile: cardIncomeInput,
          expensesInputMobile: cardExpensesInput,
          feesInputMobile: cardFeesInput,
          disbursementInputMobile: cardDisbursementInput,
          outputNetMobile: cardNetOutput,
          outputMarginMobile: cardMarginOutput
        };
        wireMirroredInputs(rowData.incomeInput, rowData.incomeInputMobile);
        wireMirroredInputs(rowData.expensesInput, rowData.expensesInputMobile);
        wireMirroredInputs(rowData.feesInput, rowData.feesInputMobile);
        wireMirroredInputs(rowData.disbursementInput, rowData.disbursementInputMobile);
        monthRows.push(rowData);
      });
    };
    const applyCategoryDefaults = () => {
      const categoryFieldMap = {
        rentGst: incomeFields.rentGst,
        rentGstFree: incomeFields.rentGstFree,
        outgoingsRecovered: incomeFields.outgoingsRecovered,
        otherIncome: incomeFields.otherIncome,
        councilRates: incomeFields.councilRates,
        waterRates: incomeFields.waterRates,
        insurance: incomeFields.insurance,
        landTax: incomeFields.landTax,
        gardening: incomeFields.gardening,
        fireSafety: incomeFields.fireSafety,
        repairs: incomeFields.repairs,
        capex: incomeFields.capex,
        otherExpenses: incomeFields.otherExpenses,
        managementFees: incomeFields.managementFees,
        otherFees: incomeFields.otherFees
      };
      Object.entries(DEFAULT_CATEGORY_VALUES).forEach(([key, value]) => {
        const input = categoryFieldMap[key];
        if (!input) {
          return;
        }
        input.value = toEditableNumberString(value);
      });
    };
    const calculateInvestmentIncome = () => {
      const annualIncome = readNumber(incomeFields.rentGst) + readNumber(incomeFields.rentGstFree) + readNumber(incomeFields.outgoingsRecovered) + readNumber(incomeFields.otherIncome);
      const annualExpenses = readNumber(incomeFields.councilRates) + readNumber(incomeFields.waterRates) + readNumber(incomeFields.insurance) + readNumber(incomeFields.landTax) + readNumber(incomeFields.gardening) + readNumber(incomeFields.fireSafety) + readNumber(incomeFields.repairs) + readNumber(incomeFields.capex) + readNumber(incomeFields.otherExpenses);
      const annualFees = readNumber(incomeFields.managementFees) + readNumber(incomeFields.otherFees);
      const months = monthRows.map((rowData) => {
        const income = readNumber(rowData.incomeInput);
        const expenses = readNumber(rowData.expensesInput);
        const fees = readNumber(rowData.feesInput);
        const disbursement = readNumber(rowData.disbursementInput);
        const net = income - expenses - fees;
        const margin = income > 0 ? net / income * 100 : 0;
        setStatementCellValues(rowData, net, margin);
        return {
          label: rowData.label,
          income,
          expenses,
          fees,
          disbursement
        };
      });
      const performance = computePerformance({
        propertyValue: readNumber(incomeFields.propertyValue),
        ownershipPercent: Math.min(100, readNumber(incomeFields.ownershipPercent)),
        startingCash: readNumber(incomeFields.startingCash),
        annualIncome,
        annualExpenses,
        annualFees,
        months
      });
      setOutputValue(incomeFields.outputAnnualIncome, annualIncome);
      setOutputValue(incomeFields.outputAnnualExpenses, annualExpenses);
      setOutputValue(incomeFields.outputAnnualFees, annualFees);
      setOutputValue(incomeFields.outputAnnualNet, performance.annualNet, true);
      setPercentOutputValue(incomeFields.outputGrossYield, performance.grossYield);
      setPercentOutputValue(incomeFields.outputNetYield, performance.netYield, true);
      setOutputValue(incomeFields.outputMonthlyNet, performance.monthlyNet, true);
      setOutputValue(incomeFields.outputMonthlyAverageNet, performance.monthlyAverageNet, true);
      setOutputValue(incomeFields.outputOwnerDisbursements, performance.monthlyDisbursementTotal);
      setLabelledMoneyOutput(
        incomeFields.outputBestMonth,
        performance.bestMonth.label,
        Number.isFinite(performance.bestMonth.value) ? performance.bestMonth.value : 0,
        true
      );
      setLabelledMoneyOutput(
        incomeFields.outputWorstMonth,
        performance.worstMonth.label,
        Number.isFinite(performance.worstMonth.value) ? performance.worstMonth.value : 0,
        true
      );
      setOutputValue(incomeFields.outputNetDifference, performance.netDifference, true);
      setOutputValue(incomeFields.outputYourShareMonthly, performance.yourShareMonthly, true);
      setOutputValue(incomeFields.outputTableTotalIncome, performance.monthlyIncomeTotal);
      setOutputValue(incomeFields.outputTableTotalExpenses, performance.monthlyExpensesTotal);
      setOutputValue(incomeFields.outputTableTotalFees, performance.monthlyFeesTotal);
      setOutputValue(incomeFields.outputTableTotalDisbursement, performance.monthlyDisbursementTotal);
      setOutputValue(incomeFields.outputTableTotalNet, performance.monthlyNet, true);
      setPercentOutputValue(incomeFields.outputTableTotalMargin, performance.monthlyNetMargin, true);
      setOutputValue(incomeFields.outputMonthlyStripIncome, performance.monthlyIncomeTotal);
      setOutputValue(incomeFields.outputMonthlyStripNet, performance.monthlyNet, true);
      setOutputValue(incomeFields.outputMonthlyStripAvg, performance.monthlyAverageNet, true);
      setTextContent(
        incomeFields.outputMonthlyStripPositive,
        `${performance.positiveMonths} / ${months.length}`
      );
      const quarterNetOutputs = [
        incomeFields.outputQuarter1Net,
        incomeFields.outputQuarter2Net,
        incomeFields.outputQuarter3Net,
        incomeFields.outputQuarter4Net
      ];
      const quarterMarginOutputs = [
        incomeFields.outputQuarter1Margin,
        incomeFields.outputQuarter2Margin,
        incomeFields.outputQuarter3Margin,
        incomeFields.outputQuarter4Margin
      ];
      performance.quarterSummaries.forEach((quarter, index) => {
        setOutputValue(quarterNetOutputs[index], quarter.net, true);
        setPercentOutputValue(quarterMarginOutputs[index], quarter.margin, true);
      });
      setOutputValue(incomeFields.outputKpiNetShare, performance.yourShareNet, true);
      setOutputValue(incomeFields.outputKpiNetShareCard, performance.yourShareNet, true);
      setOutputValue(incomeFields.outputMobileSummaryNet, performance.yourShareNet, true);
      setPercentOutputValue(incomeFields.outputKpiNetYield, performance.netYield, true);
      setPercentOutputValue(incomeFields.outputKpiNetYieldCard, performance.netYield, true);
      setPercentOutputValue(incomeFields.outputKpiNetMargin, performance.annualMargin, true);
      setPercentOutputValue(incomeFields.outputKpiNetMarginCard, performance.annualMargin, true);
      setPercentOutputValue(incomeFields.outputKpiCostToIncome, performance.costToIncome);
      setPercentOutputValue(incomeFields.outputKpiCostToIncomeCard, performance.costToIncome);
      setTextContent(incomeFields.outputKpiPositiveMonths, `${performance.positiveMonths} / ${months.length}`);
      setTextContent(
        incomeFields.outputKpiPositiveMonthsCard,
        `${performance.positiveMonths} / ${months.length}`
      );
      setOutputValue(incomeFields.outputKpiRetainedCash, performance.retainedCash, true);
      setOutputValue(incomeFields.outputTrendNetLatest, performance.latestNet, true);
      setPercentOutputValue(incomeFields.outputTrendMarginLatest, performance.latestMargin, true);
      renderSparkline(incomeFields.outputTrendNetSparkline, performance.monthNetSeries, {
        baseline: 0,
        lineColor: "#69d49f",
        areaColor: "rgba(105, 212, 159, 0.2)",
        baselineColor: "rgba(188, 218, 223, 0.28)"
      });
      renderSparkline(incomeFields.outputTrendMarginSparkline, performance.monthMarginSeries, {
        baseline: 0,
        lineColor: "#ffa44f",
        areaColor: "rgba(255, 164, 79, 0.22)",
        baselineColor: "rgba(188, 218, 223, 0.28)"
      });
      setTrendToneClass(incomeFields.trendNetCard, performance.latestNet);
      setTrendToneClass(incomeFields.trendMarginCard, performance.latestMargin);
      setHealthState(performance.health.status, performance.health.note, performance.health.tone);
    };
    const wireIncomeCurrencyFormatting = () => {
      const incomeCurrencyInputs = Array.from(incomeForm.querySelectorAll("input[data-currency='true']"));
      incomeCurrencyInputs.forEach((input) => {
        input.addEventListener("focus", () => {
          unformatCurrencyInput(input);
        });
        input.addEventListener("blur", () => {
          formatCurrencyInput(input);
          calculateInvestmentIncome();
        });
      });
    };
    const formatAllIncomeCurrencyInputs = () => {
      const incomeCurrencyInputs = Array.from(incomeForm.querySelectorAll("input[data-currency='true']"));
      incomeCurrencyInputs.forEach((input) => {
        formatCurrencyInput(input);
      });
    };
    const wireIncomeEvents = () => {
      const inputs = Array.from(incomeForm.querySelectorAll("input, select"));
      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          if (input.dataset && input.dataset.currency === "true") {
            sanitizeCurrencyInput(input);
          }
          if (input.id === "incomeOwnershipPercent") {
            clampPercentInput(input);
          }
          calculateInvestmentIncome();
        });
        input.addEventListener("change", () => {
          if (input.id === "incomeOwnershipPercent") {
            clampPercentInput(input);
          }
          calculateInvestmentIncome();
        });
      });
    };
    buildStatementRows();
    if (incomeCardsExpandButton) {
      incomeCardsExpandButton.addEventListener("click", () => {
        setDetailsOpenState(statementCardsContainer, ".statement-card-details", true);
      });
    }
    if (incomeCardsCollapseButton) {
      incomeCardsCollapseButton.addEventListener("click", () => {
        setDetailsOpenState(statementCardsContainer, ".statement-card-details", false);
      });
    }
    if (incomeFields.applySourceToAllButton) {
      incomeFields.applySourceToAllButton.addEventListener("click", () => {
        const sourceIndex = Number.parseInt(
          incomeFields.applySourceMonth ? incomeFields.applySourceMonth.value : "0",
          10
        );
        if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= monthRows.length) {
          return;
        }
        const sourceRow = monthRows[sourceIndex];
        monthRows.forEach((rowData, index) => {
          if (index === sourceIndex) {
            return;
          }
          copyRowValues(sourceRow, rowData);
        });
        calculateInvestmentIncome();
      });
    }
    if (incomeFields.copyPrevAcrossButton) {
      incomeFields.copyPrevAcrossButton.addEventListener("click", () => {
        const snapshotValues = monthRows.map((rowData) => {
          const values = {};
          monthValueKeys.forEach((key) => {
            values[key] = readRowFieldValue(rowData, key);
          });
          return values;
        });
        for (let index = 1; index < monthRows.length; index += 1) {
          const previousValues = snapshotValues[index - 1];
          monthValueKeys.forEach((key) => {
            setRowFieldValue(monthRows[index], key, previousValues[key]);
          });
        }
        calculateInvestmentIncome();
      });
    }
    applyCategoryDefaults();
    wireIncomeCurrencyFormatting();
    formatAllIncomeCurrencyInputs();
    wireIncomeEvents();
    calculateInvestmentIncome();
  };

  // js/ui/mobileSummary.js
  var wireMobileSummaryJumpButtons = () => {
    const jumpButtons = Array.from(document.querySelectorAll("[data-scroll-target]"));
    jumpButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.scrollTarget;
        if (!targetId) {
          return;
        }
        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  // js/reporting/portfolioSummary.js
  var parseNumberText = (value) => {
    const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  var readText = (id) => {
    const element = document.getElementById(id);
    return element ? String(element.textContent ?? "").trim() : "";
  };
  var readInputValue = (id) => {
    const element = document.getElementById(id);
    return element ? String(element.value ?? "").trim() : "";
  };
  var readCheckboxValue = (id) => {
    const element = document.getElementById(id);
    return Boolean(element && element.checked);
  };
  var buildPortfolioSummaryPayload = () => ({
    generatedAt: /* @__PURE__ */ new Date(),
    netProceeds: {
      ownershipPercent: parseNumberText(readInputValue("ownershipPercent")),
      taxYear: readInputValue("taxYear"),
      cgtDiscountApplied: readCheckboxValue("cgtDiscount"),
      netSettlementCash: parseNumberText(readText("netProceeds")),
      saleShare: parseNumberText(readText("saleShare")),
      sellingCostsShare: parseNumberText(readText("totalSellingCosts")),
      estimatedCgt: parseNumberText(readText("estimatedCgt")),
      mortgagePayout: parseNumberText(readText("mortgageShare")),
      afterTaxProfit: parseNumberText(readText("afterTaxProfit"))
    },
    performance: {
      healthStatus: readText("incomeHealthStatus") || "-",
      healthNote: readText("incomeHealthNote") || "-",
      netOperatingCashflowShare: parseNumberText(readText("incomeKpiNetShare")),
      netYieldPercent: parseNumberText(readText("incomeKpiNetYield")),
      netMarginPercent: parseNumberText(readText("incomeKpiNetMargin")),
      costRatioPercent: parseNumberText(readText("incomeKpiCostToIncome")),
      positiveMonths: readText("incomeKpiPositiveMonths") || "-",
      retainedCash: parseNumberText(readText("incomeKpiRetainedCash"))
    },
    fund: {
      annualDistribution: parseNumberText(readText("fundAnnualDistribution")),
      monthlyDistribution: parseNumberText(readText("fundMonthlyDistribution")),
      annualRatePercent: parseNumberText(readText("fundAnnualRate")),
      cashRatePercent: parseNumberText(readText("fundCashRate")),
      capitalPreserved: parseNumberText(readText("fundCapitalPreserved"))
    }
  });
  var generatePortfolioSummaryPdfReport = ({ payload, formatMoney: formatMoney2, formatPercent: formatPercent2, setPdfStatus }) => {
    const jsPdfConstructor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPdfConstructor) {
      setPdfStatus("PDF library did not load. Refresh and try again.", "error");
      return;
    }
    if (!payload) {
      setPdfStatus("No summary data available to export.", "error");
      return;
    }
    try {
      const doc = new jsPdfConstructor({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 44;
      const contentWidth = pageWidth - margin * 2;
      const bottomMargin = 44;
      const colors = {
        headerBg: [14, 34, 46],
        headerAccent: [255, 164, 79],
        heading: [23, 53, 70],
        body: [41, 58, 69],
        muted: [105, 122, 135],
        rowAlt: [246, 250, 252],
        rowBorder: [217, 226, 232],
        highlightBg: [226, 247, 235],
        highlightBorder: [105, 212, 159],
        highlightText: [20, 89, 58],
        highlightTextNegative: [140, 39, 49]
      };
      const now = payload.generatedAt instanceof Date ? payload.generatedAt : /* @__PURE__ */ new Date();
      let y = 0;
      const drawHeader = () => {
        const headerHeight = 90;
        doc.setFillColor(...colors.headerBg);
        doc.rect(0, 0, pageWidth, headerHeight, "F");
        doc.setFillColor(...colors.headerAccent);
        doc.rect(0, headerHeight - 4, pageWidth, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text("Property Investor Toolkit - Portfolio Summary", margin, 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(224, 234, 240);
        doc.text(`Generated: ${now.toLocaleString("en-AU")}`, margin, 54);
        doc.text("High-level estimate across all current tool inputs", margin, 69);
        y = headerHeight + 18;
      };
      const ensureSpace = (needed = 16) => {
        if (y + needed > pageHeight - bottomMargin) {
          doc.addPage();
          drawHeader();
        }
      };
      const drawSection = (title) => {
        ensureSpace(28);
        doc.setDrawColor(...colors.rowBorder);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setTextColor(...colors.heading);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, margin, y + 18);
        y += 26;
      };
      const drawRows = (rows) => {
        const labelWidth = contentWidth * 0.58;
        const valueWidth = contentWidth * 0.34;
        const labelX = margin + 10;
        const valueX = margin + contentWidth - 10;
        const lineGap = 12;
        rows.forEach((row, rowIndex) => {
          const labelLines = doc.splitTextToSize(String(row.label), labelWidth);
          const valueLines = doc.splitTextToSize(String(row.value), valueWidth);
          const rowHeight = Math.max(labelLines.length, valueLines.length) * lineGap + 10;
          ensureSpace(rowHeight + 2);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(...colors.rowAlt);
            doc.rect(margin, y, contentWidth, rowHeight, "F");
          }
          doc.setDrawColor(...colors.rowBorder);
          doc.setLineWidth(0.5);
          doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
          doc.setTextColor(...colors.body);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.8);
          labelLines.forEach((line, lineIndex) => {
            doc.text(line, labelX, y + 14 + lineIndex * lineGap);
          });
          doc.setFont("helvetica", "bold");
          valueLines.forEach((line, lineIndex) => {
            doc.text(line, valueX, y + 14 + lineIndex * lineGap, { align: "right" });
          });
          y += rowHeight;
        });
        y += 10;
      };
      const drawPrimarySummary = () => {
        ensureSpace(126);
        const boxHeight = 116;
        doc.setFillColor(...colors.highlightBg);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "F");
        doc.setDrawColor(...colors.highlightBorder);
        doc.setLineWidth(1.2);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "S");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.highlightText);
        doc.setFontSize(10);
        doc.text("At-a-glance outcomes", margin + 14, y + 22);
        const firstColumnX = margin + 14;
        const secondColumnX = margin + contentWidth / 2 + 4;
        doc.setFontSize(8.8);
        doc.text("Net settlement cash", firstColumnX, y + 40);
        doc.text("Annual fund distribution", secondColumnX, y + 40);
        doc.setFontSize(18);
        const netColor = payload.netProceeds.netSettlementCash >= 0 ? colors.highlightText : colors.highlightTextNegative;
        doc.setTextColor(...netColor);
        doc.text(formatMoney2(payload.netProceeds.netSettlementCash), firstColumnX, y + 62);
        doc.setTextColor(...colors.highlightText);
        doc.text(formatMoney2(payload.fund.annualDistribution), secondColumnX, y + 62);
        doc.setFontSize(8.8);
        doc.text("Net operating cashflow (your share)", firstColumnX, y + 82);
        doc.text("Investment health", secondColumnX, y + 82);
        doc.setFontSize(12.5);
        doc.text(formatMoney2(payload.performance.netOperatingCashflowShare), firstColumnX, y + 102);
        doc.text(payload.performance.healthStatus, secondColumnX, y + 102);
        y += boxHeight + 14;
      };
      drawHeader();
      drawPrimarySummary();
      drawSection("1. Net Proceeds Snapshot");
      drawRows([
        { label: "Tax year", value: payload.netProceeds.taxYear || "-" },
        {
          label: "Beneficial ownership applied",
          value: formatPercent2(payload.netProceeds.ownershipPercent)
        },
        {
          label: "50% CGT discount",
          value: payload.netProceeds.cgtDiscountApplied ? "Applied" : "Not applied"
        },
        {
          label: "Net cash to you at settlement",
          value: formatMoney2(payload.netProceeds.netSettlementCash)
        },
        {
          label: "Gross proceeds at your ownership share",
          value: formatMoney2(payload.netProceeds.saleShare)
        },
        {
          label: "Your apportioned disposal costs",
          value: formatMoney2(payload.netProceeds.sellingCostsShare)
        },
        {
          label: "Estimated CGT payable",
          value: formatMoney2(payload.netProceeds.estimatedCgt)
        },
        {
          label: "Loan payout at settlement",
          value: formatMoney2(payload.netProceeds.mortgagePayout)
        },
        {
          label: "After-tax profit vs acquisition share",
          value: formatMoney2(payload.netProceeds.afterTaxProfit)
        }
      ]);
      drawSection("2. Performance Snapshot");
      drawRows([
        { label: "Health status", value: payload.performance.healthStatus },
        { label: "Health note", value: payload.performance.healthNote },
        {
          label: "Net operating cashflow (your share)",
          value: formatMoney2(payload.performance.netOperatingCashflowShare)
        },
        { label: "Net yield", value: formatPercent2(payload.performance.netYieldPercent) },
        { label: "Net margin", value: formatPercent2(payload.performance.netMarginPercent) },
        { label: "Cost ratio", value: formatPercent2(payload.performance.costRatioPercent) },
        { label: "Positive months", value: payload.performance.positiveMonths },
        { label: "Cash retained after draws", value: formatMoney2(payload.performance.retainedCash) }
      ]);
      drawSection("3. Simple Fund Snapshot");
      drawRows([
        {
          label: "Total projected distribution (12 months)",
          value: formatMoney2(payload.fund.annualDistribution)
        },
        { label: "Projected monthly distribution", value: formatMoney2(payload.fund.monthlyDistribution) },
        {
          label: "Target annual return rate",
          value: formatPercent2(payload.fund.annualRatePercent)
        },
        { label: "RBA cash rate used", value: formatPercent2(payload.fund.cashRatePercent) },
        { label: "Capital available (withdrawable)", value: formatMoney2(payload.fund.capitalPreserved) }
      ]);
      ensureSpace(28);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      doc.text("Planning estimate only. This report is not financial or tax advice.", margin, y);
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        "-",
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0")
      ].join("");
      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...colors.rowBorder);
        doc.setLineWidth(0.6);
        doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.muted);
        doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 15, {
          align: "right"
        });
      }
      doc.save(`portfolio-summary-${stamp}.pdf`);
      setPdfStatus("Portfolio summary PDF downloaded.", "success");
    } catch {
      setPdfStatus("Could not create summary PDF. Please try again.", "error");
    }
  };

  // js/ui/portfolioSummary.js
  var initPortfolioSummary = () => {
    const downloadButton = byId("downloadPortfolioSummaryPdf");
    const status = byId("portfolioPdfStatus");
    if (!downloadButton) {
      return;
    }
    let statusTimerId = null;
    const setStatus = (message, tone = "") => {
      if (!status) {
        return;
      }
      setTextContent(status, message);
      status.classList.remove("is-success", "is-error");
      if (tone === "success") {
        status.classList.add("is-success");
      } else if (tone === "error") {
        status.classList.add("is-error");
      }
      if (statusTimerId) {
        window.clearTimeout(statusTimerId);
        statusTimerId = null;
      }
      if (message) {
        statusTimerId = window.setTimeout(() => {
          if (!status) {
            return;
          }
          setTextContent(status, "");
          status.classList.remove("is-success", "is-error");
        }, 5200);
      }
    };
    downloadButton.addEventListener("click", () => {
      const payload = buildPortfolioSummaryPayload();
      generatePortfolioSummaryPdfReport({
        payload,
        formatMoney,
        formatPercent,
        setPdfStatus: setStatus
      });
    });
  };

  // js/ui/scenarioStorage.js
  var STORAGE_PREFIX = "pit:scenario:";
  var CONTROL_SELECTOR = "input, select, textarea";
  var SCHEMA_VERSION = 1;
  var createStorageKey = (toolId) => `${STORAGE_PREFIX}${toolId}`;
  var controlKeyFor = (control) => {
    if (!control) {
      return "";
    }
    if (control.id) {
      return `id:${control.id}`;
    }
    if (control.name) {
      return `name:${control.name}`;
    }
    const monthIndex = control.dataset?.monthIndex;
    const monthField = control.dataset?.monthField || control.dataset?.monthFieldMobile;
    if (monthIndex && monthField) {
      return `month:${monthIndex}:${monthField}`;
    }
    return "";
  };
  var getControlValue = (control) => {
    if (control.type === "checkbox" || control.type === "radio") {
      return Boolean(control.checked);
    }
    return String(control.value ?? "");
  };
  var setControlValue = (control, value) => {
    if (control.type === "checkbox" || control.type === "radio") {
      control.checked = Boolean(value);
      return;
    }
    control.value = String(value ?? "");
  };
  var collectFormSnapshot = (form) => {
    const values = {};
    const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR));
    controls.forEach((control) => {
      const key = controlKeyFor(control);
      if (!key || key in values) {
        return;
      }
      values[key] = getControlValue(control);
    });
    return values;
  };
  var buildControlGroups = (form) => {
    const groups = /* @__PURE__ */ new Map();
    const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR));
    controls.forEach((control) => {
      const key = controlKeyFor(control);
      if (!key) {
        return;
      }
      const group = groups.get(key) || [];
      group.push(control);
      groups.set(key, group);
    });
    return groups;
  };
  var triggerControlUpdate = (control) => {
    control.dispatchEvent(new window.Event("input", { bubbles: true }));
    control.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  var applyFormSnapshot = (form, values) => {
    if (!values || typeof values !== "object") {
      return;
    }
    const groupedControls = buildControlGroups(form);
    Object.entries(values).forEach(([key, value]) => {
      const controls = groupedControls.get(key);
      if (!controls || !controls.length) {
        return;
      }
      controls.forEach((control) => {
        setControlValue(control, value);
      });
      triggerControlUpdate(controls[0]);
    });
  };
  var parseImportedSnapshot = (rawText) => {
    const data = JSON.parse(rawText);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid file format.");
    }
    const values = data.values && typeof data.values === "object" ? data.values : data;
    if (!values || typeof values !== "object") {
      throw new Error("Missing input values.");
    }
    return {
      tool: typeof data.tool === "string" ? data.tool : "",
      values
    };
  };
  var createDebounced = (callback, delayMs) => {
    let timerId = null;
    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
      timerId = window.setTimeout(() => {
        timerId = null;
        callback();
      }, delayMs);
    };
  };
  var toExportFileName = (toolId) => {
    const now = /* @__PURE__ */ new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${toolId}-scenario-${stamp}.json`;
  };
  var downloadJson = (fileName, payload) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };
  var wireScenarioControls = (container) => {
    const toolId = container.dataset.scenarioTool || "";
    const formId = container.dataset.scenarioForm || "";
    const form = formId ? document.getElementById(formId) : null;
    if (!toolId || !form) {
      return;
    }
    const storageKey = createStorageKey(toolId);
    const statusElement = container.querySelector("[data-scenario-status]");
    const saveButton = container.querySelector("[data-scenario-action='save']");
    const loadButton = container.querySelector("[data-scenario-action='load']");
    const resetButton = container.querySelector("[data-scenario-action='reset']");
    const exportButton = container.querySelector("[data-scenario-action='export']");
    const importButton = container.querySelector("[data-scenario-action='import']");
    const importFileInput = container.querySelector("[data-scenario-action='import-file']");
    const defaultValues = collectFormSnapshot(form);
    let statusTimerId = null;
    let isApplyingSnapshot = false;
    const setStatus = (message, tone = "") => {
      if (!statusElement) {
        return;
      }
      statusElement.textContent = message;
      statusElement.classList.remove("is-success", "is-error");
      if (tone === "success") {
        statusElement.classList.add("is-success");
      } else if (tone === "error") {
        statusElement.classList.add("is-error");
      }
      if (statusTimerId) {
        window.clearTimeout(statusTimerId);
        statusTimerId = null;
      }
      if (message) {
        statusTimerId = window.setTimeout(() => {
          if (statusElement) {
            statusElement.textContent = "";
            statusElement.classList.remove("is-success", "is-error");
          }
        }, 4200);
      }
    };
    const saveToStorage = (showStatus = false) => {
      try {
        const payload = {
          version: SCHEMA_VERSION,
          tool: toolId,
          savedAt: (/* @__PURE__ */ new Date()).toISOString(),
          values: collectFormSnapshot(form)
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
        if (showStatus) {
          setStatus("Inputs saved in this browser.", "success");
        }
      } catch {
        if (showStatus) {
          setStatus("Could not save inputs on this device.", "error");
        }
      }
    };
    const loadFromStorage = (showStatus = true) => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          if (showStatus) {
            setStatus("No saved inputs found yet.", "error");
          }
          return false;
        }
        const parsed = parseImportedSnapshot(raw);
        isApplyingSnapshot = true;
        applyFormSnapshot(form, parsed.values);
        isApplyingSnapshot = false;
        if (showStatus) {
          setStatus("Saved inputs loaded.", "success");
        }
        return true;
      } catch {
        isApplyingSnapshot = false;
        if (showStatus) {
          setStatus("Saved inputs are invalid. Reset or import a new file.", "error");
        }
        return false;
      }
    };
    const resetToDefaults = () => {
      isApplyingSnapshot = true;
      applyFormSnapshot(form, defaultValues);
      isApplyingSnapshot = false;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
      }
      setStatus("Inputs reset to defaults.", "success");
    };
    const exportSnapshot = () => {
      try {
        const payload = {
          version: SCHEMA_VERSION,
          tool: toolId,
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          values: collectFormSnapshot(form)
        };
        downloadJson(toExportFileName(toolId), payload);
        setStatus("Scenario exported as JSON.", "success");
      } catch {
        setStatus("Could not export scenario.", "error");
      }
    };
    const importSnapshotFromFile = async (file) => {
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const payload = parseImportedSnapshot(text);
        if (payload.tool && payload.tool !== toolId) {
          setStatus("This file is for a different calculator.", "error");
          return;
        }
        isApplyingSnapshot = true;
        applyFormSnapshot(form, payload.values);
        isApplyingSnapshot = false;
        saveToStorage(false);
        setStatus("Scenario imported and applied.", "success");
      } catch {
        isApplyingSnapshot = false;
        setStatus("Invalid JSON file.", "error");
      }
    };
    const scheduleAutosave = createDebounced(() => {
      if (isApplyingSnapshot) {
        return;
      }
      saveToStorage(false);
    }, 260);
    const onAutosaveEvent = () => {
      if (isApplyingSnapshot) {
        return;
      }
      scheduleAutosave();
    };
    form.addEventListener("input", onAutosaveEvent);
    form.addEventListener("change", onAutosaveEvent);
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        saveToStorage(true);
      });
    }
    if (loadButton) {
      loadButton.addEventListener("click", () => {
        loadFromStorage(true);
      });
    }
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        resetToDefaults();
      });
    }
    if (exportButton) {
      exportButton.addEventListener("click", () => {
        exportSnapshot();
      });
    }
    if (importButton && importFileInput) {
      importButton.addEventListener("click", () => {
        importFileInput.click();
      });
    }
    if (importFileInput) {
      importFileInput.addEventListener("change", async () => {
        const [file] = Array.from(importFileInput.files || []);
        await importSnapshotFromFile(file || null);
        importFileInput.value = "";
      });
    }
    loadFromStorage(false);
  };
  var initScenarioStorage = () => {
    const containers = Array.from(document.querySelectorAll("[data-scenario-controls]"));
    containers.forEach((container) => {
      wireScenarioControls(container);
    });
  };

  // js/ui/tooltips.js
  var initTooltips = () => {
    const triggers = Array.from(document.querySelectorAll("[data-tooltip-trigger]"));
    if (!triggers.length) {
      return;
    }
    const getTooltip = (trigger) => {
      const tooltipId = trigger.getAttribute("aria-controls");
      return tooltipId ? document.getElementById(tooltipId) : null;
    };
    const closeTooltip = (trigger) => {
      if (!trigger) {
        return;
      }
      const tooltip = getTooltip(trigger);
      trigger.setAttribute("aria-expanded", "false");
      if (tooltip) {
        tooltip.setAttribute("aria-hidden", "true");
      }
    };
    const openTooltip = (trigger) => {
      if (!trigger) {
        return;
      }
      triggers.forEach((currentTrigger) => {
        if (currentTrigger !== trigger) {
          closeTooltip(currentTrigger);
        }
      });
      const tooltip = getTooltip(trigger);
      trigger.setAttribute("aria-expanded", "true");
      if (tooltip) {
        tooltip.setAttribute("aria-hidden", "false");
      }
    };
    const toggleTooltip = (trigger) => {
      if (trigger.getAttribute("aria-expanded") === "true") {
        closeTooltip(trigger);
        return;
      }
      openTooltip(trigger);
    };
    triggers.forEach((trigger) => {
      closeTooltip(trigger);
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleTooltip(trigger);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeTooltip(trigger);
        }
      });
    });
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest("[data-tooltip-trigger], .info-tip-text")) {
        return;
      }
      triggers.forEach((trigger) => {
        closeTooltip(trigger);
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      triggers.forEach((trigger) => {
        closeTooltip(trigger);
      });
    });
  };

  // js/ui/toolMenu.js
  var initToolMenu = () => {
    const tabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-tool-panel]"));
    if (!tabs.length || !panels.length) {
      return;
    }
    const activatePanel = (panelId) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.toolTab === panelId;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
      });
      panels.forEach((panel) => {
        const isActive = panel.id === panelId;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    };
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetPanel = tab.dataset.toolTab;
        if (!targetPanel) {
          return;
        }
        activatePanel(targetPanel);
      });
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        if (currentIndex === -1) {
          return;
        }
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        const targetPanel = nextTab.dataset.toolTab;
        if (!targetPanel) {
          return;
        }
        activatePanel(targetPanel);
        nextTab.focus();
      });
    });
    const defaultTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
    if (defaultTab && defaultTab.dataset.toolTab) {
      activatePanel(defaultTab.dataset.toolTab);
    }
  };

  // app.js
  var initApp = () => {
    initToolMenu();
    initTooltips();
    wireMobileSummaryJumpButtons();
    initPortfolioSummary();
    initNetProceedsCalculator();
    initPerformanceCalculator();
    initSimpleFundCalculator();
    initScenarioStorage();
  };
  initApp();
})();
