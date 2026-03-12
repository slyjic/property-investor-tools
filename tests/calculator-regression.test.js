import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

const parseMoneyText = (text) => {
  const parsed = Number.parseFloat(String(text ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePercentText = (text) => {
  const parsed = Number.parseFloat(String(text ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const byId = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: #${id}`);
  }
  return element;
};

const fire = (element, name) => {
  element.dispatchEvent(new window.Event(name, { bubbles: true }));
};

const setInput = (id, value) => {
  const input = byId(id);
  input.value = String(value);
  fire(input, "input");
  fire(input, "change");
};

const setCheckbox = (id, checked) => {
  const checkbox = byId(id);
  checkbox.checked = checked;
  fire(checkbox, "change");
};

const setSelect = (id, value) => {
  const select = byId(id);
  select.value = value;
  fire(select, "change");
};

const setRadio = (id) => {
  const radio = byId(id);
  radio.checked = true;
  fire(radio, "change");
};

const moneyOutput = (id) => parseMoneyText(byId(id).textContent);
const percentOutput = (id) => parsePercentText(byId(id).textContent);
const textOutput = (id) => String(byId(id).textContent ?? "").trim();
const moneyInput = (id) => parseMoneyText(byId(id).value);

const scenarioButton = (tool, action) => {
  const container = document.querySelector(`[data-scenario-tool='${tool}']`);
  if (!container) {
    throw new Error(`Missing scenario controls for tool: ${tool}`);
  }

  const button = container.querySelector(`[data-scenario-action='${action}']`);
  if (!button) {
    throw new Error(`Missing scenario action "${action}" for tool: ${tool}`);
  }

  return button;
};

const scenarioImportInput = (tool) => {
  const container = document.querySelector(`[data-scenario-tool='${tool}']`);
  if (!container) {
    throw new Error(`Missing scenario controls for tool: ${tool}`);
  }

  const input = container.querySelector("[data-scenario-action='import-file']");
  if (!input) {
    throw new Error(`Missing scenario import input for tool: ${tool}`);
  }

  return input;
};

const loadApp = async () => {
  document.open();
  document.write(html);
  document.close();
  window.jspdf = { jsPDF: class MockPdf {} };
  vi.resetModules();
  await import("../app.js");
};

beforeEach(async () => {
  window.localStorage.clear();
  await loadApp();
});

describe("net proceeds calculator regression", () => {
  it("calculates net proceeds with percent commission mode", () => {
    setInput("salePrice", "1000000");
    setInput("purchasePrice", "600000");
    setInput("ownershipPercent", "50");
    setInput("outstandingMortgage", "100000");
    setInput("marketingCost", "10000");
    setInput("legalCost", "5000");
    setInput("mortgageReleaseCost", "1000");
    setInput("titleSearchCost", "500");
    setInput("taxableIncome", "100000");
    setCheckbox("cgtDiscount", true);

    expect(moneyOutput("saleShare")).toBeCloseTo(500000, 2);
    expect(moneyOutput("totalSellingCosts")).toBeCloseTo(19250, 2);
    expect(moneyOutput("estimatedCgt")).toBeCloseTo(31018.75, 2);
    expect(moneyOutput("netProceeds")).toBeCloseTo(349731.25, 2);
  });

  it("keeps mortgage payout as personal (not ownership-scaled)", () => {
    setInput("salePrice", "1000000");
    setInput("purchasePrice", "600000");
    setInput("ownershipPercent", "25");
    setInput("outstandingMortgage", "400000");
    setInput("taxableIncome", "0");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");

    expect(moneyOutput("saleShare")).toBeCloseTo(250000, 2);
    expect(moneyOutput("mortgageShare")).toBeCloseTo(400000, 2);
  });

  it("changes estimated CGT when tax year low bracket changes", () => {
    setInput("salePrice", "100000");
    setInput("purchasePrice", "80000");
    setInput("ownershipPercent", "100");
    setInput("taxableIncome", "20000");
    setInput("outstandingMortgage", "0");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");
    setCheckbox("cgtDiscount", false);

    setSelect("taxYear", "2025-26");
    const cgt2526 = moneyOutput("estimatedCgt");
    setSelect("taxYear", "2026-27");
    const cgt2627 = moneyOutput("estimatedCgt");
    setSelect("taxYear", "2027-28");
    const cgt2728 = moneyOutput("estimatedCgt");

    expect(cgt2526).toBeCloseTo(3200, 2);
    expect(cgt2627).toBeCloseTo(3000, 2);
    expect(cgt2728).toBeCloseTo(2800, 2);
  });

  it("reduces estimated CGT when 50% discount is enabled", () => {
    setInput("salePrice", "100000");
    setInput("purchasePrice", "80000");
    setInput("ownershipPercent", "100");
    setInput("taxableIncome", "20000");
    setInput("outstandingMortgage", "0");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");
    setSelect("taxYear", "2025-26");

    setCheckbox("cgtDiscount", false);
    const noDiscount = moneyOutput("estimatedCgt");
    setCheckbox("cgtDiscount", true);
    const withDiscount = moneyOutput("estimatedCgt");

    expect(noDiscount).toBeCloseTo(3200, 2);
    expect(withDiscount).toBeCloseTo(1600, 2);
  });

  it("calculates agent commission in dollar mode", () => {
    setRadio("agentFeeTypeDollar");
    setInput("salePrice", "1000000");
    setInput("purchasePrice", "900000");
    setInput("ownershipPercent", "100");
    setInput("agentFeeDollar", "25000");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");
    setInput("taxableIncome", "0");
    setInput("outstandingMortgage", "0");
    setCheckbox("cgtDiscount", false);

    expect(moneyOutput("agentFeeComputed")).toBeCloseTo(25000, 2);
    expect(moneyOutput("totalSellingCostsWholeComputed")).toBeCloseTo(25000, 2);
  });

  it("calculates after-tax profit relative to purchase share", () => {
    setInput("salePrice", "900000");
    setInput("purchasePrice", "600000");
    setInput("ownershipPercent", "50");
    setInput("outstandingMortgage", "0");
    setInput("taxableIncome", "0");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");
    setCheckbox("cgtDiscount", false);

    expect(moneyOutput("saleShare")).toBeCloseTo(450000, 2);
    expect(moneyOutput("afterTaxProfit")).toBeCloseTo(113162, 2);
  });

  it("does not apply CGT when capital gain is negative", () => {
    setInput("salePrice", "500000");
    setInput("purchasePrice", "800000");
    setInput("ownershipPercent", "100");
    setInput("taxableIncome", "120000");
    setInput("outstandingMortgage", "0");
    setInput("agentFeePercent", "0");
    setInput("agentFeeGstPercent", "0");
    setInput("marketingCost", "0");
    setInput("legalCost", "0");
    setInput("mortgageReleaseCost", "0");
    setInput("titleSearchCost", "0");
    setCheckbox("cgtDiscount", false);

    expect(moneyOutput("capitalGain")).toBeCloseTo(-300000, 2);
    expect(moneyOutput("taxableCapitalGain")).toBeCloseTo(0, 2);
    expect(moneyOutput("estimatedCgt")).toBeCloseTo(0, 2);
  });
});

describe("performance calculator regression", () => {
  it("loads default annual and monthly metrics", () => {
    expect(moneyOutput("incomeAnnualNet")).toBeCloseTo(206288.78, 2);
    expect(moneyOutput("incomeKpiNetShare")).toBeCloseTo(206288.78, 2);
    expect(percentOutput("incomeKpiCostToIncome")).toBeCloseTo(22.83, 2);
    expect(textOutput("incomeKpiPositiveMonths")).toBe("12 / 12");
  });

  it("scales your-share KPI by ownership percentage", () => {
    setInput("incomeOwnershipPercent", "25");

    expect(moneyOutput("incomeKpiNetShare")).toBeCloseTo(51572.2, 2);
    expect(moneyOutput("mobileIncomeNet")).toBeCloseTo(51572.2, 2);
  });

  it("keeps category totals and monthly totals reconciled by default", () => {
    expect(moneyOutput("incomeAnnualIncome")).toBeCloseTo(267305.94, 2);
    expect(moneyOutput("incomeAnnualExpenses")).toBeCloseTo(47532.22, 2);
    expect(moneyOutput("incomeAnnualFees")).toBeCloseTo(13484.94, 2);
    expect(moneyOutput("incomeMonthlyNet")).toBeCloseTo(206288.78, 2);
    expect(moneyOutput("incomeNetDifference")).toBeCloseTo(0, 2);
  });

  it("updates latest trend value when last month changes", () => {
    const juneIncome = document.querySelector("input[data-month-index='11'][data-month-field='income']");
    const juneExpenses = document.querySelector("input[data-month-index='11'][data-month-field='expenses']");
    const juneFees = document.querySelector("input[data-month-index='11'][data-month-field='fees']");
    if (!juneIncome || !juneExpenses || !juneFees) {
      throw new Error("Missing June month inputs");
    }

    juneIncome.value = "10000";
    fire(juneIncome, "input");
    juneExpenses.value = "0";
    fire(juneExpenses, "input");
    juneFees.value = "0";
    fire(juneFees, "input");

    expect(moneyOutput("incomeTrendNetLatest")).toBeCloseTo(10000, 2);
    expect(percentOutput("incomeTrendMarginLatest")).toBeCloseTo(100, 2);
  });

  it("copies selected month to all months with quick action", () => {
    setSelect("incomeApplySourceMonth", "6");
    byId("incomeApplySourceToAll").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(moneyOutput("incomeTableTotalNet")).toBeCloseTo(371972.16, 2);
    expect(textOutput("incomeKpiPositiveMonths")).toBe("12 / 12");
  });

  it("fills August from July when copy-forward is used", () => {
    const julyIncome = document.querySelector("input[data-month-index='0'][data-month-field='income']");
    const julyExpenses = document.querySelector("input[data-month-index='0'][data-month-field='expenses']");
    const julyFees = document.querySelector("input[data-month-index='0'][data-month-field='fees']");
    if (!julyIncome || !julyExpenses || !julyFees) {
      throw new Error("Missing July month inputs");
    }

    julyIncome.value = "12345";
    fire(julyIncome, "input");
    julyExpenses.value = "222";
    fire(julyExpenses, "input");
    julyFees.value = "111";
    fire(julyFees, "input");

    byId("incomeCopyPrevAcross").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    const augIncome = document.querySelector("input[data-month-index='1'][data-month-field='income']");
    const augExpenses = document.querySelector("input[data-month-index='1'][data-month-field='expenses']");
    const augFees = document.querySelector("input[data-month-index='1'][data-month-field='fees']");
    if (!augIncome || !augExpenses || !augFees) {
      throw new Error("Missing August month inputs");
    }

    expect(parseMoneyText(augIncome.value)).toBeCloseTo(12345, 2);
    expect(parseMoneyText(augExpenses.value)).toBeCloseTo(222, 2);
    expect(parseMoneyText(augFees.value)).toBeCloseTo(111, 2);
  });

  it("flags health as needs attention when all months are loss-making", () => {
    const julyIncome = document.querySelector("input[data-month-index='0'][data-month-field='income']");
    const julyExpenses = document.querySelector("input[data-month-index='0'][data-month-field='expenses']");
    const julyFees = document.querySelector("input[data-month-index='0'][data-month-field='fees']");
    if (!julyIncome || !julyExpenses || !julyFees) {
      throw new Error("Missing July month inputs");
    }

    julyIncome.value = "1000";
    fire(julyIncome, "input");
    julyExpenses.value = "3000";
    fire(julyExpenses, "input");
    julyFees.value = "500";
    fire(julyFees, "input");
    byId("incomeApplySourceToAll").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(textOutput("incomeHealthStatus")).toBe("Needs Attention");
  });
});

describe("simple fund calculator regression", () => {
  it("uses default investment amount to produce monthly and annual distribution", () => {
    expect(moneyOutput("fundMonthlyDistribution")).toBeCloseTo(654.17, 2);
    expect(moneyOutput("fundAnnualDistribution")).toBeCloseTo(7850, 2);
    expect(moneyOutput("fundCapitalPreserved")).toBeCloseTo(100000, 2);
  });

  it("updates distributions when a preset amount is selected", () => {
    byId("simple-fund-calculator")
      .querySelector("[data-fund-preset='250000']")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(moneyOutput("fundMonthlyDistribution")).toBeCloseTo(1635.42, 2);
    expect(moneyOutput("fundAnnualDistribution")).toBeCloseTo(19625, 2);
  });

  it("shows expected rate assumptions", () => {
    expect(percentOutput("fundCashRate")).toBeCloseTo(3.85, 2);
    expect(percentOutput("fundAnnualRate")).toBeCloseTo(7.85, 2);
    expect(percentOutput("fundMonthlyRate")).toBeCloseTo(0.65, 2);
  });

  it("updates distribution with manual investment amount", () => {
    setInput("fundInvestmentAmount", "1500000");

    expect(moneyOutput("fundMonthlyDistribution")).toBeCloseTo(9812.5, 2);
    expect(moneyOutput("fundAnnualDistribution")).toBeCloseTo(117750, 2);
    expect(moneyOutput("fundCapitalPreserved")).toBeCloseTo(1500000, 2);
  });

  it("marks selected preset button as active", () => {
    const preset = byId("simple-fund-calculator").querySelector("[data-fund-preset='500000']");
    if (!preset) {
      throw new Error("Missing fund preset button");
    }

    preset.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(preset.classList.contains("is-active")).toBe(true);
  });

  it("keeps cumulative trend summary aligned to annual distribution", () => {
    setInput("fundInvestmentAmount", "400000");

    expect(moneyOutput("fundTrendCumulativeLatest")).toBeCloseTo(moneyOutput("fundAnnualDistribution"), 2);
  });
});

describe("scenario persistence", () => {
  it("saves and reloads net proceeds inputs from localStorage", () => {
    setInput("salePrice", "1234567");
    setInput("ownershipPercent", "33");
    setSelect("taxYear", "2027-28");
    setCheckbox("cgtDiscount", false);

    scenarioButton("net-proceeds", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const stored = window.localStorage.getItem("pit:scenario:net-proceeds:fy-2025-26");
    expect(stored).toBeTruthy();

    setInput("salePrice", "800000");
    setInput("ownershipPercent", "100");
    setSelect("taxYear", "2025-26");
    setCheckbox("cgtDiscount", true);

    scenarioButton("net-proceeds", "load").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(moneyInput("salePrice")).toBeCloseTo(1234567, 2);
    expect(Number.parseFloat(byId("ownershipPercent").value)).toBeCloseTo(33, 2);
    expect(byId("taxYear").value).toBe("2027-28");
    expect(byId("cgtDiscount").checked).toBe(false);
  });

  it("keeps separate net proceeds scenarios by dataset year", () => {
    setInput("salePrice", "1000000");
    scenarioButton("net-proceeds", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    setSelect("netDatasetYear", "fy-2026-27");
    setInput("salePrice", "2000000");
    scenarioButton("net-proceeds", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(window.localStorage.getItem("pit:scenario:net-proceeds:fy-2025-26")).toBeTruthy();
    expect(window.localStorage.getItem("pit:scenario:net-proceeds:fy-2026-27")).toBeTruthy();

    setSelect("netDatasetYear", "fy-2025-26");
    expect(moneyInput("salePrice")).toBeCloseTo(1000000, 2);
    setSelect("netDatasetYear", "fy-2026-27");
    expect(moneyInput("salePrice")).toBeCloseTo(2000000, 2);
  });

  it("resets fund inputs to defaults and clears saved state", () => {
    setInput("fundInvestmentAmount", "500000");
    scenarioButton("simple-fund", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(window.localStorage.getItem("pit:scenario:simple-fund:fy-2025-26")).toBeTruthy();

    scenarioButton("simple-fund", "reset").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(window.localStorage.getItem("pit:scenario:simple-fund:fy-2025-26")).toBeNull();
    expect(moneyInput("fundInvestmentAmount")).toBeCloseTo(100000, 2);
    expect(moneyOutput("fundAnnualDistribution")).toBeCloseTo(7850, 2);
  });

  it("imports JSON values into performance calculator", async () => {
    const importInput = scenarioImportInput("performance");
    const payload = {
      tool: "performance",
      values: {
        "id:incomeOwnershipPercent": "25",
        "id:incomePropertyValue": "2000000",
      },
    };
    const file = new window.File([JSON.stringify(payload)], "performance.json", {
      type: "application/json",
    });

    Object.defineProperty(importInput, "files", {
      value: [file],
      configurable: true,
    });
    fire(importInput, "change");

    await new Promise((resolve) => {
      window.setTimeout(resolve, 0);
    });

    expect(Number.parseFloat(byId("incomeOwnershipPercent").value)).toBeCloseTo(25, 2);
    expect(moneyInput("incomePropertyValue")).toBeCloseTo(2000000, 2);
    expect(moneyOutput("incomeKpiNetShare")).toBeCloseTo(51572.2, 2);
    expect(window.localStorage.getItem("pit:scenario:performance:fy-2024-25")).toBeTruthy();
  });

  it("restores last used dataset year on reload", async () => {
    setSelect("fundDatasetYear", "fy-2027-28");
    scenarioButton("simple-fund", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    await loadApp();
    expect(byId("fundDatasetYear").value).toBe("fy-2027-28");
  });

  it("shows unsaved-change hint when switching dataset year", () => {
    setInput("salePrice", "1111111");
    setSelect("netDatasetYear", "fy-2026-27");

    const status = document.querySelector("[data-scenario-tool='net-proceeds'] [data-scenario-status]");
    if (!status) {
      throw new Error("Missing net proceeds scenario status");
    }

    expect(String(status.textContent ?? "")).toContain("Unsaved edits were auto-saved before switching");
  });

  it("renders multi-year trend panel when two performance datasets are saved", () => {
    scenarioButton("performance", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    setSelect("incomeDatasetYear", "fy-2025-26");
    setInput("incomeOwnershipPercent", "50");
    scenarioButton("performance", "save").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    const tableWrap = byId("incomeHistoryTableWrap");
    const rows = Array.from(document.querySelectorAll("#incomeHistoryRows tr"));
    const sparklineCard = byId("incomeHistoryTrendCard");

    expect(tableWrap.hidden).toBe(false);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(sparklineCard.hidden).toBe(false);
  });
});
