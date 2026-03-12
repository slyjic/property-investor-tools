import { DEFAULT_CATEGORY_VALUES, DEFAULT_STATEMENT_MONTHS } from "../config/constants.js";
import { computePerformance } from "../calculations/performance.js";
import {
  byId,
  clampPercentInput,
  formatCurrencyInput,
  formatMoney,
  formatPercent,
  readNumber,
  renderSparkline,
  sanitizeCurrencyInput,
  setDetailsOpenState,
  setOutputValue,
  setSignedClass,
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

  const setPercentOutput = (element, value, useSignClass = false) => {
    if (!element) {
      return;
    }

    element.textContent = formatPercent(value);
    if (useSignClass) {
      setSignedClass(element, value);
    }
  };

  const setLabelledMoneyOutput = (element, label, value, useSignClass = false) => {
    if (!element) {
      return;
    }

    element.textContent = `${label || "-"}: ${formatMoney(value)}`;
    if (useSignClass) {
      setSignedClass(element, value);
    }
  };

  const setTextOutput = (element, text) => {
    if (!element) {
      return;
    }

    element.textContent = text;
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
      incomeFields.outputHealthStatus.textContent = status;
      applyToneClass(incomeFields.outputHealthStatus);
    }
    if (incomeFields.outputHealthStatusCard) {
      incomeFields.outputHealthStatusCard.textContent = status;
      applyToneClass(incomeFields.outputHealthStatusCard);
    }
    if (incomeFields.outputHealthNote) {
      incomeFields.outputHealthNote.textContent = note;
    }
    if (incomeFields.outputHealthNoteCard) {
      incomeFields.outputHealthNoteCard.textContent = note;
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
      element.textContent = formatMoney(netValue);
      setSignedClass(element, netValue);
    });

    [rowData.outputMargin, rowData.outputMarginMobile].forEach((element) => {
      if (!element) {
        return;
      }
      element.textContent = formatPercent(netMarginPercent);
      setSignedClass(element, netMarginPercent);
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

  const buildStatementRows = () => {
    monthRows = [];
    statementRowsBody.innerHTML = "";
    if (statementCardsContainer) {
      statementCardsContainer.innerHTML = "";
    }

    DEFAULT_STATEMENT_MONTHS.forEach((month, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="statement-month">${month.label}</td>
        <td>
          <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
            data-month-index="${index}" data-month-field="income" value="${toEditableNumberString(month.income)}" />
        </td>
        <td>
          <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
            data-month-index="${index}" data-month-field="expenses" value="${toEditableNumberString(month.expenses)}" />
        </td>
        <td>
          <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
            data-month-index="${index}" data-month-field="fees" value="${toEditableNumberString(month.fees)}" />
        </td>
        <td>
          <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
            data-month-index="${index}" data-month-field="disbursement" value="${toEditableNumberString(month.disbursement)}" />
        </td>
        <td><span class="statement-net" data-month-output="net">$0.00</span></td>
        <td><span class="statement-margin" data-month-output="margin">0.00%</span></td>
      `;
      statementRowsBody.appendChild(row);

      let cardIncomeInput = null;
      let cardExpensesInput = null;
      let cardFeesInput = null;
      let cardDisbursementInput = null;
      let cardNetOutput = null;
      let cardMarginOutput = null;

      if (statementCardsContainer) {
        const card = document.createElement("article");
        card.className = "statement-card";
        card.innerHTML = `
          <details class="statement-card-details" ${index === 0 ? "open" : ""}>
            <summary class="statement-card-summary">
              <div class="statement-card-summary-main">
                <h4>${month.label}</h4>
                <p>Tap to edit monthly inputs</p>
              </div>
              <div class="statement-card-summary-metrics">
                <span class="statement-card-net" data-month-output-mobile="net">$0.00</span>
                <strong class="statement-card-margin" data-month-output-mobile="margin">0.00%</strong>
              </div>
            </summary>
            <div class="statement-card-body">
              <div class="statement-card-grid">
                <label class="statement-card-field">
                  <span>Gross income</span>
                  <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                    data-month-index="${index}" data-month-field-mobile="income" value="${toEditableNumberString(month.income)}" />
                </label>
                <label class="statement-card-field">
                  <span>Operating expenses</span>
                  <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                    data-month-index="${index}" data-month-field-mobile="expenses" value="${toEditableNumberString(month.expenses)}" />
                </label>
                <label class="statement-card-field">
                  <span>Management fees</span>
                  <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                    data-month-index="${index}" data-month-field-mobile="fees" value="${toEditableNumberString(month.fees)}" />
                </label>
                <label class="statement-card-field">
                  <span>Owner draw / disbursement</span>
                  <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                    data-month-index="${index}" data-month-field-mobile="disbursement" value="${toEditableNumberString(month.disbursement)}" />
                </label>
              </div>
            </div>
          </details>
        `;
        statementCardsContainer.appendChild(card);

        cardIncomeInput = card.querySelector("input[data-month-field-mobile='income']");
        cardExpensesInput = card.querySelector("input[data-month-field-mobile='expenses']");
        cardFeesInput = card.querySelector("input[data-month-field-mobile='fees']");
        cardDisbursementInput = card.querySelector("input[data-month-field-mobile='disbursement']");
        cardNetOutput = card.querySelector("[data-month-output-mobile='net']");
        cardMarginOutput = card.querySelector("[data-month-output-mobile='margin']");
      }

      const rowData = {
        label: month.label,
        incomeInput: row.querySelector("input[data-month-field='income']"),
        expensesInput: row.querySelector("input[data-month-field='expenses']"),
        feesInput: row.querySelector("input[data-month-field='fees']"),
        disbursementInput: row.querySelector("input[data-month-field='disbursement']"),
        outputNet: row.querySelector("[data-month-output='net']"),
        outputMargin: row.querySelector("[data-month-output='margin']"),
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
    setPercentOutput(incomeFields.outputGrossYield, performance.grossYield);
    setPercentOutput(incomeFields.outputNetYield, performance.netYield, true);
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
    setPercentOutput(incomeFields.outputTableTotalMargin, performance.monthlyNetMargin, true);
    setOutputValue(incomeFields.outputMonthlyStripIncome, performance.monthlyIncomeTotal);
    setOutputValue(incomeFields.outputMonthlyStripNet, performance.monthlyNet, true);
    setOutputValue(incomeFields.outputMonthlyStripAvg, performance.monthlyAverageNet, true);
    setTextOutput(
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
      setPercentOutput(quarterMarginOutputs[index], quarter.margin, true);
    });

    setOutputValue(incomeFields.outputKpiNetShare, performance.yourShareNet, true);
    setOutputValue(incomeFields.outputKpiNetShareCard, performance.yourShareNet, true);
    setOutputValue(incomeFields.outputMobileSummaryNet, performance.yourShareNet, true);
    setPercentOutput(incomeFields.outputKpiNetYield, performance.netYield, true);
    setPercentOutput(incomeFields.outputKpiNetYieldCard, performance.netYield, true);
    setPercentOutput(incomeFields.outputKpiNetMargin, performance.annualMargin, true);
    setPercentOutput(incomeFields.outputKpiNetMarginCard, performance.annualMargin, true);
    setPercentOutput(incomeFields.outputKpiCostToIncome, performance.costToIncome);
    setPercentOutput(incomeFields.outputKpiCostToIncomeCard, performance.costToIncome);
    setTextOutput(incomeFields.outputKpiPositiveMonths, `${performance.positiveMonths} / ${months.length}`);
    setTextOutput(
      incomeFields.outputKpiPositiveMonthsCard,
      `${performance.positiveMonths} / ${months.length}`,
    );
    setOutputValue(incomeFields.outputKpiRetainedCash, performance.retainedCash, true);

    setOutputValue(incomeFields.outputTrendNetLatest, performance.latestNet, true);
    setPercentOutput(incomeFields.outputTrendMarginLatest, performance.latestMargin, true);

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
