import { DEFAULT_CATEGORY_VALUES, DEFAULT_STATEMENT_MONTHS } from "../config/constants.js";
import { parseStatementCsv, parseStatementPdfFile } from "../import/statementImport.js";
import { computePerformance } from "../calculations/performance.js";
import { collectPerformanceHistoryRows } from "../shared/performanceHistory.js";
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
    datasetSelector: byId("incomeDatasetYear"),
    historyTableWrap: byId("incomeHistoryTableWrap"),
    historyRowsBody: byId("incomeHistoryRows"),
    historyEmpty: byId("incomeHistoryEmpty"),
    outputHistorySparkline: byId("incomeHistorySparkline"),
    outputHistoryTrendLatest: byId("incomeHistoryTrendLatest"),
    trendHistoryCard: byId("incomeHistoryTrendCard"),
    statementImportFile: byId("incomeStatementImportFile"),
    statementImportWizard: byId("incomeStatementImportWizard"),
    statementImportOpenButton: byId("incomeStatementImportOpen"),
    statementImportApplyButton: byId("incomeStatementImportApply"),
    statementImportStatus: byId("incomeStatementImportStatus"),
    statementImportWarnings: byId("incomeStatementImportWarnings"),
    statementImportPreviewWrap: byId("incomeStatementImportPreviewWrap"),
    statementImportPreviewRows: byId("incomeStatementImportPreviewRows"),
    statementImportFileName: byId("incomeStatementImportFileName"),
    statementImportSyncAnnual: byId("incomeStatementImportSyncAnnual"),
    monthlyRange: byId("incomeMonthlyRange"),
    dataHubModal: byId("incomeDataHubModal"),
    dataHubBackdrop: byId("incomeDataHubBackdrop"),
    dataHubOpenButton: byId("incomeDataHubOpen"),
    dataHubOpenHeadButton: byId("incomeDataHubOpenHead"),
    dataHubOpenNavButton: byId("incomeDataHubOpenNav"),
    dataHubCloseButton: byId("incomeDataHubClose"),
  };

  const monthValueKeys = ["income", "expenses", "fees", "disbursement"];
  let monthRows = [];
  let latestHistoryMetrics = null;
  let importedStatementRows = [];
  let isDataHubOpen = false;

  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const fiscalMonthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

  const setStatementImportStatus = (message, tone = "") => {
    if (!incomeFields.statementImportStatus) {
      return;
    }

    setTextContent(incomeFields.statementImportStatus, message || "");
    incomeFields.statementImportStatus.classList.remove("is-success", "is-error");
    if (tone === "success") {
      incomeFields.statementImportStatus.classList.add("is-success");
    } else if (tone === "error") {
      incomeFields.statementImportStatus.classList.add("is-error");
    }
  };

  const setStatementImportWarnings = (warnings = []) => {
    if (!incomeFields.statementImportWarnings) {
      return;
    }

    clearNodeChildren(incomeFields.statementImportWarnings);
    const warningList = Array.isArray(warnings)
      ? warnings.filter((warning) => String(warning ?? "").trim().length > 0)
      : [];

    if (!warningList.length) {
      incomeFields.statementImportWarnings.hidden = true;
      return;
    }

    warningList.forEach((warning) => {
      const item = document.createElement("li");
      item.textContent = String(warning);
      incomeFields.statementImportWarnings.appendChild(item);
    });
    incomeFields.statementImportWarnings.hidden = false;
  };

  const setStatementImportFileName = (name = "") => {
    if (!incomeFields.statementImportFileName) {
      return;
    }
    setTextContent(incomeFields.statementImportFileName, name || "No file selected.");
  };

  const setStatementImportPreviewRows = (rows = []) => {
    if (!incomeFields.statementImportPreviewRows || !incomeFields.statementImportPreviewWrap) {
      return;
    }

    clearNodeChildren(incomeFields.statementImportPreviewRows);
    const safeRows = Array.isArray(rows) ? rows : [];
    safeRows.forEach((row) => {
      const tableRow = document.createElement("tr");

      const labelCell = document.createElement("td");
      labelCell.textContent = row.label;
      tableRow.appendChild(labelCell);

      const incomeCell = document.createElement("td");
      incomeCell.textContent = formatMoney(Number.isFinite(row.income) ? row.income : 0);
      tableRow.appendChild(incomeCell);

      const expensesCell = document.createElement("td");
      expensesCell.textContent = formatMoney(Number.isFinite(row.expenses) ? row.expenses : 0);
      tableRow.appendChild(expensesCell);

      const feesCell = document.createElement("td");
      feesCell.textContent = formatMoney(Number.isFinite(row.fees) ? row.fees : 0);
      tableRow.appendChild(feesCell);

      const disbursementCell = document.createElement("td");
      disbursementCell.textContent = formatMoney(Number.isFinite(row.disbursement) ? row.disbursement : 0);
      tableRow.appendChild(disbursementCell);

      incomeFields.statementImportPreviewRows.appendChild(tableRow);
    });

    incomeFields.statementImportPreviewWrap.hidden = safeRows.length === 0;
  };

  const setStatementImportRows = (rows = []) => {
    const validRows = Array.isArray(rows)
      ? rows.filter((row) => row && typeof row.label === "string" && row.label)
      : [];
    importedStatementRows = validRows;
    if (incomeFields.statementImportApplyButton) {
      incomeFields.statementImportApplyButton.disabled = validRows.length === 0;
    }
    setStatementImportPreviewRows(validRows);
  };

  const getStatementImportKind = (file) => {
    const type = String(file?.type ?? "").toLowerCase();
    const name = String(file?.name ?? "").toLowerCase();
    const isPdf = type.includes("pdf") || name.endsWith(".pdf");
    if (isPdf) {
      return "pdf";
    }
    const isCsv =
      type.includes("csv") || type.includes("excel") || name.endsWith(".csv") || name.endsWith(".txt");
    if (isCsv) {
      return "csv";
    }
    return "";
  };

  const getDatasetLabel = (datasetId) => {
    if (!incomeFields.datasetSelector) {
      return datasetId;
    }
    const match = Array.from(incomeFields.datasetSelector.options).find(
      (option) => option.value === datasetId,
    );
    return match ? String(match.textContent ?? datasetId).trim() : datasetId;
  };

  const parseDatasetStartYear = (datasetId) => {
    const match = String(datasetId ?? "").match(/^fy-(\d{4})-(\d{2})$/i);
    if (!match) {
      return 2024;
    }
    const year = Number.parseInt(match[1], 10);
    return Number.isFinite(year) ? year : 2024;
  };

  const toDatasetIdFromStartYear = (startYear) => {
    const endYearSuffix = String(startYear + 1).slice(-2);
    return `fy-${startYear}-${endYearSuffix}`;
  };

  const buildFiscalMonthLabels = (startYear) =>
    fiscalMonthOrder.map((monthNumber) => {
      const year = monthNumber >= 7 ? startYear : startYear + 1;
      return `${monthNamesShort[monthNumber - 1]} ${year}`;
    });

  const getCurrentDatasetMonthLabels = () => {
    const datasetId = incomeFields.datasetSelector ? incomeFields.datasetSelector.value : "fy-2024-25";
    const startYear = parseDatasetStartYear(datasetId);
    return buildFiscalMonthLabels(startYear);
  };

  const setDataHubOpen = (isOpen) => {
    isDataHubOpen = Boolean(isOpen);
    if (incomeFields.dataHubModal) {
      incomeFields.dataHubModal.hidden = !isDataHubOpen;
      incomeFields.dataHubModal.setAttribute("aria-hidden", isDataHubOpen ? "false" : "true");
    }
    if (document?.body) {
      document.body.classList.toggle("data-hub-open", isDataHubOpen);
    }
  };

  const populateApplySourceMonthOptions = (labels) => {
    if (!incomeFields.applySourceMonth) {
      return;
    }

    const selectedValue = Number.parseInt(incomeFields.applySourceMonth.value || "0", 10);
    clearNodeChildren(incomeFields.applySourceMonth);
    labels.forEach((label, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = label;
      incomeFields.applySourceMonth.appendChild(option);
    });

    const safeValue =
      Number.isInteger(selectedValue) && selectedValue >= 0 && selectedValue < labels.length
        ? selectedValue
        : 0;
    incomeFields.applySourceMonth.value = String(safeValue);
  };

  const updateStatementLabelsForCurrentDataset = () => {
    const labels = getCurrentDatasetMonthLabels();
    monthRows.forEach((rowData, index) => {
      const nextLabel = labels[index] || rowData.label;
      rowData.label = nextLabel;
      if (rowData.monthCell) {
        rowData.monthCell.textContent = nextLabel;
      }
      if (rowData.mobileTitle) {
        rowData.mobileTitle.textContent = nextLabel;
      }
    });

    populateApplySourceMonthOptions(labels);

    if (incomeFields.monthlyRange && labels.length) {
      setTextContent(incomeFields.monthlyRange, `(${labels[0]} - ${labels[labels.length - 1]})`);
    }
  };

  const inferDatasetIdFromDetectedMonths = (detectedMonths = []) => {
    if (!incomeFields.datasetSelector) {
      return "";
    }

    const scoreByDataset = new Map();
    detectedMonths.forEach((month) => {
      if (!month || !Number.isInteger(month.monthNumber) || !Number.isInteger(month.yearValue)) {
        return;
      }

      const startYear = month.monthNumber >= 7 ? month.yearValue : month.yearValue - 1;
      const datasetId = toDatasetIdFromStartYear(startYear);
      scoreByDataset.set(datasetId, (scoreByDataset.get(datasetId) || 0) + 1);
    });

    const validDatasetIds = new Set(
      Array.from(incomeFields.datasetSelector.options).map((option) => option.value),
    );
    let bestId = "";
    let bestScore = -1;

    scoreByDataset.forEach((score, datasetId) => {
      if (!validDatasetIds.has(datasetId)) {
        return;
      }
      if (score > bestScore) {
        bestScore = score;
        bestId = datasetId;
      }
    });

    return bestId;
  };

  const syncAnnualCategoriesFromMonthlyRows = () => {
    const monthlyTotals = monthRows.reduce(
      (acc, rowData) => {
        acc.income += readNumber(rowData.incomeInput);
        acc.expenses += readNumber(rowData.expensesInput);
        acc.fees += readNumber(rowData.feesInput);
        return acc;
      },
      { income: 0, expenses: 0, fees: 0 },
    );

    if (incomeFields.rentGst) {
      incomeFields.rentGst.value = toEditableNumberString(monthlyTotals.income);
    }
    if (incomeFields.rentGstFree) {
      incomeFields.rentGstFree.value = "0";
    }
    if (incomeFields.outgoingsRecovered) {
      incomeFields.outgoingsRecovered.value = "0";
    }
    if (incomeFields.otherIncome) {
      incomeFields.otherIncome.value = "0";
    }

    if (incomeFields.councilRates) {
      incomeFields.councilRates.value = toEditableNumberString(monthlyTotals.expenses);
    }
    [
      incomeFields.waterRates,
      incomeFields.insurance,
      incomeFields.landTax,
      incomeFields.gardening,
      incomeFields.fireSafety,
      incomeFields.repairs,
      incomeFields.capex,
      incomeFields.otherExpenses,
    ].forEach((input) => {
      if (input) {
        input.value = "0";
      }
    });

    if (incomeFields.managementFees) {
      incomeFields.managementFees.value = toEditableNumberString(monthlyTotals.fees);
    }
    if (incomeFields.otherFees) {
      incomeFields.otherFees.value = "0";
    }
  };

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

  const getDatasetOptions = () => {
    const selector = incomeFields.datasetSelector;
    if (!selector) {
      return [];
    }

    return Array.from(selector.options)
      .slice(0, 5)
      .map((option) => ({
        id: option.value,
        label: String(option.textContent ?? option.value).trim(),
      }));
  };

  const applyTrendValueClass = (cell, value) => {
    if (!cell) {
      return;
    }
    cell.classList.remove("value-positive", "value-negative");
    if (value > 0) {
      cell.classList.add("value-positive");
      return;
    }
    if (value < 0) {
      cell.classList.add("value-negative");
    }
  };

  const renderMultiYearTrend = () => {
    if (!incomeFields.historyRowsBody || !incomeFields.historyTableWrap || !incomeFields.historyEmpty) {
      return;
    }

    const currentDatasetId = incomeFields.datasetSelector ? incomeFields.datasetSelector.value : "";
    const historyRows = collectPerformanceHistoryRows({
      datasetOptions: getDatasetOptions(),
      currentDatasetId,
      currentMetrics: latestHistoryMetrics,
      maxRows: 5,
    });

    clearNodeChildren(incomeFields.historyRowsBody);

    if (historyRows.length < 2) {
      incomeFields.historyTableWrap.hidden = true;
      if (incomeFields.trendHistoryCard) {
        incomeFields.trendHistoryCard.hidden = true;
      }
      if (incomeFields.outputHistoryTrendLatest) {
        setOutputValue(incomeFields.outputHistoryTrendLatest, 0);
      }
      renderSparkline(incomeFields.outputHistorySparkline, []);
      setTextContent(
        incomeFields.historyEmpty,
        "Save at least two year datasets to compare long-term net, margin, and yield.",
      );
      return;
    }

    historyRows.forEach((row) => {
      const tableRow = document.createElement("tr");

      const labelCell = document.createElement("td");
      labelCell.textContent = row.label;
      tableRow.appendChild(labelCell);

      const netCell = document.createElement("td");
      netCell.textContent = formatMoney(row.netOperatingCashflowShare);
      applyTrendValueClass(netCell, row.netOperatingCashflowShare);
      tableRow.appendChild(netCell);

      const marginCell = document.createElement("td");
      marginCell.textContent = `${row.netMarginPercent.toFixed(2)}%`;
      applyTrendValueClass(marginCell, row.netMarginPercent);
      tableRow.appendChild(marginCell);

      const yieldCell = document.createElement("td");
      yieldCell.textContent = `${row.netYieldPercent.toFixed(2)}%`;
      applyTrendValueClass(yieldCell, row.netYieldPercent);
      tableRow.appendChild(yieldCell);

      incomeFields.historyRowsBody.appendChild(tableRow);
    });

    const netSeries = historyRows.map((row) => row.netOperatingCashflowShare);
    const latestNet = netSeries.length ? netSeries[netSeries.length - 1] : 0;

    setOutputValue(incomeFields.outputHistoryTrendLatest, latestNet, true);
    renderSparkline(incomeFields.outputHistorySparkline, netSeries, {
      baseline: 0,
      lineColor: "#69d49f",
      areaColor: "rgba(105, 212, 159, 0.2)",
      baselineColor: "rgba(188, 218, 223, 0.28)",
    });
    setTrendToneClass(incomeFields.trendHistoryCard, latestNet);

    if (incomeFields.trendHistoryCard) {
      incomeFields.trendHistoryCard.hidden = false;
    }
    incomeFields.historyTableWrap.hidden = false;
    setTextContent(incomeFields.historyEmpty, `Comparing ${historyRows.length} year datasets.`);
  };

  const applyImportedStatementRows = () => {
    if (!importedStatementRows.length) {
      setStatementImportStatus("Import a statement file first.", "error");
      return;
    }

    const rowMap = new Map(monthRows.map((rowData) => [rowData.label, rowData]));
    let appliedCount = 0;
    let firstUpdatedInput = null;

    importedStatementRows.forEach((row) => {
      const targetRow = rowMap.get(row.label);
      if (!targetRow) {
        return;
      }

      monthValueKeys.forEach((key) => {
        const rawValue = row[key];
        const safeValue = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
        setRowFieldValue(targetRow, key, toEditableNumberString(safeValue));
      });

      if (!firstUpdatedInput) {
        firstUpdatedInput = targetRow.incomeInput || null;
      }
      appliedCount += 1;
    });

    const shouldSyncAnnual = Boolean(incomeFields.statementImportSyncAnnual?.checked);
    if (appliedCount > 0 && shouldSyncAnnual) {
      syncAnnualCategoriesFromMonthlyRows();
    }

    formatAllIncomeCurrencyInputs();
    calculateInvestmentIncome();

    if (firstUpdatedInput) {
      triggerImportAutosave(firstUpdatedInput);
    }

    if (appliedCount > 0) {
      setStatementImportStatus(
        shouldSyncAnnual
          ? `Applied ${appliedCount} month${appliedCount === 1 ? "" : "s"} and synced annual category totals.`
          : `Applied ${appliedCount} month${appliedCount === 1 ? "" : "s"} to the monthly table.`,
        "success",
      );
    } else {
      setStatementImportStatus("No matching months were found in the current dataset.", "error");
    }
  };

  const triggerImportAutosave = (input) => {
    if (!input) {
      return;
    }
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
  };

  const wireStatementImportWizard = () => {
    if (!incomeFields.statementImportFile) {
      return;
    }

    setStatementImportFileName("");
    setStatementImportWarnings([]);
    setStatementImportRows([]);
    setStatementImportStatus("");

    incomeFields.statementImportFile.addEventListener("change", async () => {
      const [file] = Array.from(incomeFields.statementImportFile.files || []);
      if (!file) {
        setStatementImportFileName("");
        setStatementImportWarnings([]);
        setStatementImportRows([]);
        setStatementImportStatus("");
        return;
      }

      const importKind = getStatementImportKind(file);
      if (!importKind) {
        setStatementImportFileName(file.name || "");
        setStatementImportWarnings([]);
        setStatementImportRows([]);
        setStatementImportStatus("Unsupported file type. Please import a CSV or PDF statement.", "error");
        return;
      }

      setStatementImportFileName(file.name || "");
      setStatementImportWarnings([]);
      setStatementImportRows([]);
      setStatementImportStatus("Parsing statement file...");

      try {
        const parseForCurrentDataset = async () => {
          const targetMonthLabels = monthRows.map((rowData) => rowData.label);
          return importKind === "pdf"
            ? parseStatementPdfFile(file, targetMonthLabels)
            : parseStatementCsv(await file.text(), targetMonthLabels);
        };

        let parsed = await parseForCurrentDataset();
        let rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
        let warnings = Array.isArray(parsed?.warnings) ? parsed.warnings : [];
        const detectedMonths = Array.isArray(parsed?.detectedMonths) ? parsed.detectedMonths : [];

        if (!rows.length && incomeFields.datasetSelector) {
          const inferredDatasetId = inferDatasetIdFromDetectedMonths(detectedMonths);
          if (inferredDatasetId && inferredDatasetId !== incomeFields.datasetSelector.value) {
            incomeFields.datasetSelector.value = inferredDatasetId;
            incomeFields.datasetSelector.dispatchEvent(new window.Event("change", { bubbles: true }));
            await new Promise((resolve) => {
              window.setTimeout(resolve, 0);
            });

            updateStatementLabelsForCurrentDataset();
            parsed = await parseForCurrentDataset();
            rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
            warnings = Array.isArray(parsed?.warnings) ? parsed.warnings : [];

            if (rows.length) {
              warnings = [
                ...warnings,
                `Detected statement dates for ${getDatasetLabel(inferredDatasetId)} and switched dataset automatically.`,
              ];
            }
          }
        }

        setStatementImportWarnings(warnings);
        setStatementImportRows(rows);

        if (!rows.length) {
          setStatementImportStatus("No matching monthly rows found in this file.", "error");
          return;
        }

        setStatementImportStatus(
          `Parsed ${rows.length} month${rows.length === 1 ? "" : "s"}. Review and apply to table.`,
          "success",
        );
      } catch {
        setStatementImportWarnings([]);
        setStatementImportRows([]);
        setStatementImportStatus(
          "Could not parse this file. Try a cleaner CSV export or check the PDF text quality.",
          "error",
        );
      }
    });

    if (incomeFields.statementImportApplyButton) {
      incomeFields.statementImportApplyButton.addEventListener("click", () => {
        applyImportedStatementRows();
      });
    }

    if (incomeFields.statementImportOpenButton) {
      incomeFields.statementImportOpenButton.addEventListener("click", () => {
        setDataHubOpen(true);
        if (incomeFields.statementImportWizard) {
          incomeFields.statementImportWizard.open = true;
        }
        incomeFields.statementImportFile.click();
      });
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
      monthCell,
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
      title,
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

    const datasetLabels = getCurrentDatasetMonthLabels();

    DEFAULT_STATEMENT_MONTHS.forEach((month, index) => {
      const monthWithLabel = {
        ...month,
        label: datasetLabels[index] || month.label,
      };
      const desktopRow = createStatementDesktopRow(monthWithLabel, index);
      statementRowsBody.appendChild(desktopRow.row);

      let cardIncomeInput = null;
      let cardExpensesInput = null;
      let cardFeesInput = null;
      let cardDisbursementInput = null;
      let cardNetOutput = null;
      let cardMarginOutput = null;
      let cardTitle = null;

      if (statementCardsContainer) {
        const mobileCard = createStatementMobileCard(monthWithLabel, index);
        statementCardsContainer.appendChild(mobileCard.card);

        cardIncomeInput = mobileCard.incomeInput;
        cardExpensesInput = mobileCard.expensesInput;
        cardFeesInput = mobileCard.feesInput;
        cardDisbursementInput = mobileCard.disbursementInput;
        cardNetOutput = mobileCard.outputNet;
        cardMarginOutput = mobileCard.outputMargin;
        cardTitle = mobileCard.title;
      }

      const rowData = {
        label: monthWithLabel.label,
        monthCell: desktopRow.monthCell,
        incomeInput: desktopRow.incomeInput,
        expensesInput: desktopRow.expensesInput,
        feesInput: desktopRow.feesInput,
        disbursementInput: desktopRow.disbursementInput,
        outputNet: desktopRow.outputNet,
        outputMargin: desktopRow.outputMargin,
        mobileTitle: cardTitle,
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

    latestHistoryMetrics = {
      netOperatingCashflowShare: performance.yourShareNet,
      netMarginPercent: performance.annualMargin,
      netYieldPercent: performance.netYield,
    };
    renderMultiYearTrend();
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

  const wireDataHubControls = () => {
    const openButtons = [
      incomeFields.dataHubOpenButton,
      incomeFields.dataHubOpenHeadButton,
      incomeFields.dataHubOpenNavButton,
    ].filter(Boolean);

    openButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setDataHubOpen(true);
      });
    });

    if (incomeFields.dataHubCloseButton) {
      incomeFields.dataHubCloseButton.addEventListener("click", () => {
        setDataHubOpen(false);
      });
    }

    if (incomeFields.dataHubBackdrop) {
      incomeFields.dataHubBackdrop.addEventListener("click", () => {
        setDataHubOpen(false);
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isDataHubOpen) {
        setDataHubOpen(false);
      }
    });
  };

  buildStatementRows();
  updateStatementLabelsForCurrentDataset();
  setDataHubOpen(false);

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

  window.addEventListener("pit:scenario-updated", (event) => {
    const detail = event.detail || {};
    if (detail.toolId !== "performance") {
      return;
    }
    if (detail.action === "dataset-change" || detail.action === "load" || detail.action === "reset") {
      updateStatementLabelsForCurrentDataset();
    }
    renderMultiYearTrend();
  });

  applyCategoryDefaults();
  wireDataHubControls();
  wireStatementImportWizard();
  wireIncomeCurrencyFormatting();
  formatAllIncomeCurrencyInputs();
  wireIncomeEvents();
  calculateInvestmentIncome();
};
