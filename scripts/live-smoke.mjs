import { chromium } from "playwright";

const baseUrl = process.argv[2] || "https://investortool.netlify.app";

const parseMoney = (text) => {
  const n = Number.parseFloat(String(text ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const parsePercent = (text) => {
  const n = Number.parseFloat(String(text ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const result = {
    url: baseUrl,
    checks: [],
  };

  const add = (name, ok, detail = "") => {
    result.checks.push({ name, ok, detail });
  };

  try {
    const resp = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    add("page-load", !!resp && resp.ok(), `status=${resp ? resp.status() : "none"}`);

    await page.waitForSelector("#tab-net-proceeds", { timeout: 15000 });
    add("net-tab-visible", true);
    add("net-dataset-visible", await page.locator("#netDatasetYear").isVisible());
    add(
      "net-dataset-badge-visible",
      await page.locator("[data-scenario-tool='net-proceeds'] [data-scenario-badge]").isVisible(),
    );

    const portfolioPdfButtonVisible = await page.locator("#downloadPortfolioSummaryPdf").isVisible();
    add("portfolio-pdf-button-visible", portfolioPdfButtonVisible);

    // Net proceeds: live update
    await page.fill("#salePrice", "1000000");
    await page.fill("#purchasePrice", "600000");
    await page.fill("#ownershipPercent", "50");
    await page.fill("#taxableIncome", "100000");
    await page.fill("#outstandingMortgage", "100000");
    await page.fill("#marketingCost", "10000");
    await page.fill("#legalCost", "5000");
    await page.locator("#netSectionCosts details.field-details > summary").click();
    await page.fill("#mortgageReleaseCost", "1000");
    await page.fill("#titleSearchCost", "500");

    await page.waitForTimeout(250);
    const netText = await page.locator("#netProceeds").textContent();
    const netVal = parseMoney(netText);
    add("net-proceeds-updates", Math.abs(netVal) > 0, `net=${netText}`);

    const pdfBtnVisible = await page.locator("#downloadPdf").isVisible();
    add("pdf-button-visible", pdfBtnVisible);

    // Performance tab
    await page.click("#tab-investment-income");
    await page
      .waitForSelector("#investment-income-calculator:not([hidden])", { timeout: 10000 })
      .catch(() => {});
    const perfVisible = await page.locator("#investment-income-calculator").isVisible();
    add("performance-tab-opens", perfVisible);
    add("performance-dataset-visible", await page.locator("#incomeDatasetYear").isVisible());
    add(
      "performance-dataset-badge-visible",
      await page.locator("[data-scenario-tool='performance'] [data-scenario-badge]").isVisible(),
    );

    const beforePerf = parseMoney(await page.locator("#incomeKpiNetShare").textContent());
    await page.fill("#incomeOwnershipPercent", "25");
    await page.waitForTimeout(250);
    const afterPerf = parseMoney(await page.locator("#incomeKpiNetShare").textContent());
    add("performance-live-update", afterPerf !== beforePerf, `before=${beforePerf}, after=${afterPerf}`);

    // Fund tab
    await page.click("#tab-simple-fund");
    const fundVisible = await page.locator("#simple-fund-calculator").isVisible();
    add("fund-tab-opens", fundVisible);
    add("fund-dataset-visible", await page.locator("#fundDatasetYear").isVisible());
    add(
      "fund-dataset-badge-visible",
      await page.locator("[data-scenario-tool='simple-fund'] [data-scenario-badge]").isVisible(),
    );

    const beforeFund = parseMoney(await page.locator("#fundAnnualDistribution").textContent());
    await page.click("#fundInvestmentAmount");
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Backspace");
    await page.type("#fundInvestmentAmount", "500000");
    await page.waitForTimeout(250);
    const annualRatePercent = parsePercent(await page.locator("#fundAnnualRate").textContent());
    const expectedFund = (500000 * annualRatePercent) / 100;
    const afterFund = parseMoney(await page.locator("#fundAnnualDistribution").textContent());
    add(
      "fund-live-update",
      Math.abs(afterFund - expectedFund) < 1,
      `before=${beforeFund}, expected=${expectedFund.toFixed(2)}, after=${afterFund}`,
    );

    const failed = result.checks.filter((c) => !c.ok);
    for (const c of result.checks) {
      console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` :: ${c.detail}` : ""}`);
    }

    if (failed.length) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("FAIL smoke-execution ::", error.message);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
};

run();
