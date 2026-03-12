import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateNetProceedsPdfReport } from "../js/reporting/pdf.js";
import {
  buildPortfolioSummaryPayload,
  generatePortfolioSummaryPdfReport,
} from "../js/reporting/portfolioSummary.js";

class MockPdf {
  static lastInstance = null;

  constructor() {
    MockPdf.lastInstance = this;
    this.pages = 1;
    this.savedFilename = "";
    this.textCalls = [];
    this.internal = {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842,
      },
    };
  }

  setFillColor() {}
  rect() {}
  setTextColor() {}
  setFont() {}
  setFontSize() {}
  setDrawColor() {}
  setLineWidth() {}
  line() {}
  roundedRect() {}
  setPage() {}

  addPage() {
    this.pages += 1;
  }

  splitTextToSize(value) {
    return [String(value)];
  }

  getNumberOfPages() {
    return this.pages;
  }

  text(value) {
    if (Array.isArray(value)) {
      this.textCalls.push(...value.map((line) => String(line)));
      return;
    }
    this.textCalls.push(String(value));
  }

  save(filename) {
    this.savedFilename = filename;
  }
}

const baseReport = {
  salePrice: 1000000,
  purchasePrice: 600000,
  ownershipPercent: 50,
  outstandingMortgage: 100000,
  taxYear: "2025-26",
  taxableIncome: 120000,
  discountApplied: true,
  feeType: "percent",
  agentFeePercent: 2,
  agentFeeGstPercent: 10,
  agentFeeWhole: 22000,
  marketingCost: 10000,
  legalCost: 5000,
  mortgageReleaseCost: 1000,
  titleSearchCost: 500,
  totalSellingCostsWhole: 38500,
  saleShare: 500000,
  purchaseShare: 300000,
  totalSellingCosts: 19250,
  capitalGain: 180750,
  taxableCapitalGain: 90375,
  taxBeforeGain: 29488,
  taxAfterGain: 60506.75,
  estimatedCgt: 31018.75,
  mortgageShare: 100000,
  afterTaxProfit: 49731.25,
  netProceeds: 349731.25,
};

const formatMoney = (value) => `$${Number(value).toFixed(2)}`;
const formatPercent = (value) => `${Number(value).toFixed(2)}%`;

describe("pdf report smoke", () => {
  beforeEach(() => {
    MockPdf.lastInstance = null;
  });

  it("generates and saves a PDF report with expected sections", () => {
    const setPdfStatus = vi.fn();
    const recalculate = vi.fn();
    window.jspdf = { jsPDF: MockPdf };

    generateNetProceedsPdfReport({
      getLatestReport: () => baseReport,
      recalculate,
      formatMoney,
      formatPercent,
      setPdfStatus,
    });

    expect(recalculate).toHaveBeenCalledTimes(1);
    expect(MockPdf.lastInstance).not.toBeNull();
    expect(MockPdf.lastInstance.savedFilename).toMatch(/^net-proceeds-report-\d{8}-\d{4}\.pdf$/);
    expect(MockPdf.lastInstance.textCalls).toEqual(
      expect.arrayContaining([
        "Inputs",
        "Calculation Breakdown",
        "Settlement Outcomes",
        "Net cash to you at settlement",
      ]),
    );
    expect(setPdfStatus).toHaveBeenLastCalledWith("PDF report downloaded.", "success");
  });

  it("returns a clear error status when jsPDF is unavailable", () => {
    const setPdfStatus = vi.fn();
    const recalculate = vi.fn();
    window.jspdf = undefined;

    generateNetProceedsPdfReport({
      getLatestReport: () => baseReport,
      recalculate,
      formatMoney,
      formatPercent,
      setPdfStatus,
    });

    expect(recalculate).not.toHaveBeenCalled();
    expect(setPdfStatus).toHaveBeenCalledWith("PDF library did not load. Refresh and try again.", "error");
  });

  it("builds portfolio summary payload from current DOM values", () => {
    document.body.innerHTML = `
      <input id="ownershipPercent" value="25" />
      <input id="taxYear" value="2026-27" />
      <input id="cgtDiscount" type="checkbox" checked />
      <div id="netProceeds">$123,456.78</div>
      <div id="saleShare">$500,000.00</div>
      <div id="totalSellingCosts">$20,000.00</div>
      <div id="estimatedCgt">$30,000.00</div>
      <div id="mortgageShare">$100,000.00</div>
      <div id="afterTaxProfit">$3,456.78</div>
      <div id="incomeHealthStatus">Healthy</div>
      <div id="incomeHealthNote">Strong metrics.</div>
      <div id="incomeKpiNetShare">$206,288.78</div>
      <div id="incomeKpiNetYield">5.66%</div>
      <div id="incomeKpiNetMargin">77.17%</div>
      <div id="incomeKpiCostToIncome">22.83%</div>
      <div id="incomeKpiPositiveMonths">12 / 12</div>
      <div id="incomeKpiRetainedCash">$50,000.00</div>
      <div id="fundAnnualDistribution">$39,250.00</div>
      <div id="fundMonthlyDistribution">$3,270.83</div>
      <div id="fundAnnualRate">7.85%</div>
      <div id="fundCashRate">3.85%</div>
      <div id="fundCapitalPreserved">$500,000.00</div>
    `;

    const payload = buildPortfolioSummaryPayload();

    expect(payload.netProceeds.ownershipPercent).toBeCloseTo(25, 2);
    expect(payload.netProceeds.taxYear).toBe("2026-27");
    expect(payload.netProceeds.netSettlementCash).toBeCloseTo(123456.78, 2);
    expect(payload.performance.healthStatus).toBe("Healthy");
    expect(payload.performance.positiveMonths).toBe("12 / 12");
    expect(payload.fund.annualDistribution).toBeCloseTo(39250, 2);
    expect(payload.fund.annualRatePercent).toBeCloseTo(7.85, 2);
  });

  it("generates and saves a portfolio summary PDF", () => {
    const setPdfStatus = vi.fn();
    window.jspdf = { jsPDF: MockPdf };

    generatePortfolioSummaryPdfReport({
      payload: {
        generatedAt: new Date("2026-03-12T00:00:00Z"),
        netProceeds: {
          ownershipPercent: 25,
          taxYear: "2026-27",
          cgtDiscountApplied: true,
          netSettlementCash: 123456.78,
          saleShare: 500000,
          sellingCostsShare: 20000,
          estimatedCgt: 30000,
          mortgagePayout: 100000,
          afterTaxProfit: 3456.78,
        },
        performance: {
          healthStatus: "Healthy",
          healthNote: "Strong metrics.",
          netOperatingCashflowShare: 206288.78,
          netYieldPercent: 5.66,
          netMarginPercent: 77.17,
          costRatioPercent: 22.83,
          positiveMonths: "12 / 12",
          retainedCash: 50000,
        },
        fund: {
          annualDistribution: 39250,
          monthlyDistribution: 3270.83,
          annualRatePercent: 7.85,
          cashRatePercent: 3.85,
          capitalPreserved: 500000,
        },
      },
      formatMoney,
      formatPercent,
      setPdfStatus,
    });

    expect(MockPdf.lastInstance).not.toBeNull();
    expect(MockPdf.lastInstance.savedFilename).toMatch(/^portfolio-summary-\d{8}-\d{4}\.pdf$/);
    expect(MockPdf.lastInstance.textCalls).toEqual(
      expect.arrayContaining([
        "At-a-glance outcomes",
        "1. Net Proceeds Snapshot",
        "2. Performance Snapshot",
        "3. Simple Fund Snapshot",
      ]),
    );
    expect(setPdfStatus).toHaveBeenLastCalledWith("Portfolio summary PDF downloaded.", "success");
  });
});
