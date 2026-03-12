import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateNetProceedsPdfReport } from "../js/reporting/pdf.js";

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
});
