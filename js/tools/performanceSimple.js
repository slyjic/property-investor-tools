import {
  byId,
  clampPercentInput,
  formatCurrencyInput,
  readNumber,
  sanitizeCurrencyInput,
  setOutputValue,
  setPercentOutputValue,
  setSignedClass,
  setTextContent,
  toEditableNumberString,
  unformatCurrencyInput,
} from "../shared/runtime.js";

const evaluateSimpleHealth = ({ netMargin, costRatio, netShare }) => {
  if (netShare <= 0 || netMargin < 20 || costRatio > 80) {
    return {
      status: "Needs Attention",
      tone: "watch",
      note: "Low profitability or high annual costs. Review rent and operating cost assumptions.",
    };
  }

  if (netMargin >= 50 && costRatio <= 50) {
    return {
      status: "Healthy",
      tone: "strong",
      note: "Strong annual operating profile with healthy margin and controlled costs.",
    };
  }

  return {
    status: "Stable",
    tone: "stable",
    note: "Annual snapshot is broadly stable. Monitor margin and cost ratio over time.",
  };
};

const applyHealthTone = (element, tone) => {
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

export const initSimplePerformanceCalculator = () => {
  const form = byId("simple-performance-calculator");
  if (!form) {
    return;
  }

  const fields = {
    propertyValue: byId("simplePerfPropertyValue"),
    ownershipPercent: byId("simplePerfOwnershipPercent"),
    annualIncome: byId("simplePerfAnnualIncome"),
    annualExpenses: byId("simplePerfAnnualExpenses"),
    annualFees: byId("simplePerfAnnualFees"),
    outputNetShare: byId("simplePerfNetShare"),
    outputAnnualNet: byId("simplePerfAnnualNet"),
    outputGrossYield: byId("simplePerfGrossYield"),
    outputNetYield: byId("simplePerfNetYield"),
    outputNetMargin: byId("simplePerfNetMargin"),
    outputCostRatio: byId("simplePerfCostRatio"),
    outputMonthlyShare: byId("simplePerfMonthlyShare"),
    outputHealthStatus: byId("simplePerfHealthStatus"),
    outputHealthNote: byId("simplePerfHealthNote"),
    outputMobileNet: byId("mobileSimplePerfNet"),
  };

  const calculateSimplePerformance = () => {
    const propertyValue = readNumber(fields.propertyValue);
    const ownershipPercent = Math.min(100, readNumber(fields.ownershipPercent));
    const annualIncome = readNumber(fields.annualIncome);
    const annualExpenses = readNumber(fields.annualExpenses);
    const annualFees = readNumber(fields.annualFees);

    const annualCosts = annualExpenses + annualFees;
    const annualNet = annualIncome - annualCosts;
    const ownershipRatio = ownershipPercent / 100;
    const netShare = annualNet * ownershipRatio;
    const monthlyShare = netShare / 12;
    const grossYield = propertyValue > 0 ? (annualIncome / propertyValue) * 100 : 0;
    const netYield = propertyValue > 0 ? (annualNet / propertyValue) * 100 : 0;
    const netMargin = annualIncome > 0 ? (annualNet / annualIncome) * 100 : 0;
    const costRatio = annualIncome > 0 ? (annualCosts / annualIncome) * 100 : 0;
    const health = evaluateSimpleHealth({ netMargin, costRatio, netShare });

    setOutputValue(fields.outputNetShare, netShare, true);
    setOutputValue(fields.outputAnnualNet, annualNet, true);
    setOutputValue(fields.outputMonthlyShare, monthlyShare, true);
    setOutputValue(fields.outputMobileNet, netShare, true);
    setPercentOutputValue(fields.outputGrossYield, grossYield);
    setPercentOutputValue(fields.outputNetYield, netYield, true);
    setPercentOutputValue(fields.outputNetMargin, netMargin, true);
    setPercentOutputValue(fields.outputCostRatio, costRatio);

    if (fields.outputHealthStatus) {
      setTextContent(fields.outputHealthStatus, health.status);
      applyHealthTone(fields.outputHealthStatus, health.tone);
    }
    if (fields.outputHealthNote) {
      setTextContent(fields.outputHealthNote, health.note);
      setSignedClass(fields.outputHealthNote, netShare);
    }
  };

  const wireCurrencyFormatting = () => {
    const currencyInputs = Array.from(form.querySelectorAll("input[data-currency='true']"));
    currencyInputs.forEach((input) => {
      input.addEventListener("focus", () => {
        unformatCurrencyInput(input);
      });
      input.addEventListener("blur", () => {
        formatCurrencyInput(input);
        calculateSimplePerformance();
      });
    });
  };

  const wireEvents = () => {
    const controls = Array.from(form.querySelectorAll("input, select"));
    controls.forEach((control) => {
      control.addEventListener("input", () => {
        if (control.dataset && control.dataset.currency === "true") {
          sanitizeCurrencyInput(control);
        }
        if (control.id === "simplePerfOwnershipPercent") {
          clampPercentInput(control);
        }
        calculateSimplePerformance();
      });

      control.addEventListener("change", () => {
        if (control.id === "simplePerfOwnershipPercent") {
          clampPercentInput(control);
        }
        calculateSimplePerformance();
      });
    });
  };

  const applyDefaults = () => {
    if (fields.propertyValue && !fields.propertyValue.value) {
      fields.propertyValue.value = toEditableNumberString(1100000);
    }
    if (fields.annualIncome && !fields.annualIncome.value) {
      fields.annualIncome.value = toEditableNumberString(267305.94);
    }
    if (fields.annualExpenses && !fields.annualExpenses.value) {
      fields.annualExpenses.value = toEditableNumberString(47532.22);
    }
    if (fields.annualFees && !fields.annualFees.value) {
      fields.annualFees.value = toEditableNumberString(13484.94);
    }
  };

  applyDefaults();
  wireCurrencyFormatting();
  wireEvents();
  Array.from(form.querySelectorAll("input[data-currency='true']")).forEach((input) => {
    formatCurrencyInput(input);
  });
  calculateSimplePerformance();
};
