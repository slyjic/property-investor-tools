import { DEFAULT_CATEGORY_VALUES, DEFAULT_STATEMENT_MONTHS } from "../config/constants.js";
import { computePerformance } from "../calculations/performance.js";
import {
  byId,
  clampPercentInput,
  formatCurrencyInput,
  formatMoney,
  readNumber,
  renderSparkline,
  sanitizeCurrencyInput,
  setDetailsOpenState,
  setOutputValue,
  setPercentOutputValue,
  setSignedClass,
  setTextContent,
  setTrendToneClass,
  toEditableNumberString,
  unformatCurrencyInput,
} from "../shared/runtime.js";

export const initPerformanceCalculator = () => {
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
    outputMobileSummaryNet: byId("mobileIncomeNet"),
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
      { key: "disbursement", label: "Owner draw / disbursement", value: month.disbursement },
    ];

    const inputs = {};
    monthFieldConfig.forEach(({ key, label, value }) => {
      const cell = document.createElement("td");
      const input = createMonthInput({
        index,
        field: key,
        value,
        monthLabel: month.label,
        fieldLabel: label,
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
      outputMargin,
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
      { key: "disbursement", label: "Owner draw / disbursement", value: month.disbursement },
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
        mobile: true,
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
      outputMargin,
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
        outputMarginMobile: cardMarginOutput,
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
      otherFees: incomeFields.otherFees,
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
    const annualIncome =
      readNumber(incomeFields.rentGst) +
      readNumber(incomeFields.rentGstFree) +
      readNumber(incomeFields.outgoingsRecovered) +
      readNumber(incomeFields.otherIncome);

    const annualExpenses =
      readNumber(incomeFields.councilRates) +
      readNumber(incomeFields.waterRates) +
      readNumber(incomeFields.insurance) +
      readNumber(incomeFields.landTax) +
      readNumber(incomeFields.gardening) +
      readNumber(incomeFields.fireSafety) +
      readNumber(incomeFields.repairs) +
      readNumber(incomeFields.capex) +
      readNumber(incomeFields.otherExpenses);

    const annualFees = readNumber(incomeFields.managementFees) + readNumber(incomeFields.otherFees);

    const months = monthRows.map((rowData) => {
      const income = readNumber(rowData.incomeInput);
      const expenses = readNumber(rowData.expensesInput);
      const fees = readNumber(rowData.feesInput);
      const disbursement = readNumber(rowData.disbursementInput);
      const net = income - expenses - fees;
      const margin = income > 0 ? (net / income) * 100 : 0;

      setStatementCellValues(rowData, net, margin);

      return {
        label: rowData.label,
        income,
        expenses,
        fees,
        disbursement,
      };
    });

    const performance = computePerformance({
      propertyValue: readNumber(incomeFields.propertyValue),
      ownershipPercent: Math.min(100, readNumber(incomeFields.ownershipPercent)),
      startingCash: readNumber(incomeFields.startingCash),
      annualIncome,
      annualExpenses,
      annualFees,
      months,
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
      true,
    );
    setLabelledMoneyOutput(
      incomeFields.outputWorstMonth,
      performance.worstMonth.label,
      Number.isFinite(performance.worstMonth.value) ? performance.worstMonth.value : 0,
      true,
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
      `${performance.positiveMonths} / ${months.length}`,
    );

    const quarterNetOutputs = [
      incomeFields.outputQuarter1Net,
      incomeFields.outputQuarter2Net,
      incomeFields.outputQuarter3Net,
      incomeFields.outputQuarter4Net,
    ];
    const quarterMarginOutputs = [
      incomeFields.outputQuarter1Margin,
      incomeFields.outputQuarter2Margin,
      incomeFields.outputQuarter3Margin,
      incomeFields.outputQuarter4Margin,
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
      `${performance.positiveMonths} / ${months.length}`,
    );
    setOutputValue(incomeFields.outputKpiRetainedCash, performance.retainedCash, true);

    setOutputValue(incomeFields.outputTrendNetLatest, performance.latestNet, true);
    setPercentOutputValue(incomeFields.outputTrendMarginLatest, performance.latestMargin, true);

    renderSparkline(incomeFields.outputTrendNetSparkline, performance.monthNetSeries, {
      baseline: 0,
      lineColor: "#69d49f",
      areaColor: "rgba(105, 212, 159, 0.2)",
      baselineColor: "rgba(188, 218, 223, 0.28)",
    });

    renderSparkline(incomeFields.outputTrendMarginSparkline, performance.monthMarginSeries, {
      baseline: 0,
      lineColor: "#ffa44f",
      areaColor: "rgba(255, 164, 79, 0.22)",
      baselineColor: "rgba(188, 218, 223, 0.28)",
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
        10,
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
