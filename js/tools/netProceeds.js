import { TAX_BRACKETS } from "../config/constants.js";
import { computeNetProceeds } from "../calculations/net.js";
import { generateNetProceedsPdfReport } from "../reporting/pdf.js";
import {
  byId,
  clampPercentInput,
  createFrameScheduler,
  formatCurrencyInput,
  formatMoney,
  formatPercent,
  readNumber,
  sanitizeCurrencyInput,
  setOutputValue,
  unformatCurrencyInput,
} from "../shared/runtime.js";

export const initNetProceedsCalculator = () => {
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
    pdfStatus: byId("pdfStatus"),
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
    fields.pdfStatus.textContent = message;
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
          fields.pdfStatus.textContent = "";
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
      taxBracketsByYear: TAX_BRACKETS,
    });

    latestReport = calculation;

    if (fields.outputOwnershipApplied) {
      fields.outputOwnershipApplied.textContent = `${calculation.ownershipPercent.toFixed(2)}%`;
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
        setPdfStatus,
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
