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

    await page.waitForSelector("#launch-net-proceeds", { timeout: 15000 });
    add("tool-library-visible", await page.locator("#toolHome").isVisible());
    add("tool-workspace-hidden-by-default", !(await page.locator("#toolWorkspace").isVisible()));
    add("advanced-tool-card-removed", (await page.locator(".tool-card-disabled").count()) === 0);

    add("site-nav-menu-visible", await page.locator(".site-nav-menu-trigger").isVisible());
    add("portfolio-pdf-button-visible", await page.locator("#downloadPortfolioSummaryPdf").isVisible());

    await page.click("#downloadPortfolioSummaryPdf");
    await page.waitForSelector("#portfolioSummaryModal:not([hidden])", { timeout: 15000 });
    add("portfolio-summary-modal-opens", await page.locator("#portfolioSummaryModal").isVisible());
    await page.click("#portfolioSummaryModalCancel");
    await page.waitForTimeout(100);
    add("portfolio-summary-modal-cancels", !(await page.locator("#portfolioSummaryModal").isVisible()));

    await page.click("#downloadPortfolioSummaryPdf");
    await page.waitForSelector("#portfolioSummaryModal:not([hidden])", { timeout: 15000 });
    await page.waitForFunction(() => Boolean(window.jspdf && window.jspdf.jsPDF), { timeout: 15000 });
    const portfolioSummaryDownloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await page.click("#portfolioSummaryModalConfirm");
    const portfolioSummaryDownload = await portfolioSummaryDownloadPromise;
    add(
      "portfolio-summary-download-starts",
      /^portfolio-summary-\d{8}-\d{4}\.pdf$/.test(portfolioSummaryDownload.suggestedFilename()),
      portfolioSummaryDownload.suggestedFilename(),
    );
    add("portfolio-summary-modal-confirms", !(await page.locator("#portfolioSummaryModal").isVisible()));

    await page.click(".site-nav-menu-trigger");
    add(
      "site-nav-library-action-visible",
      await page.locator(".site-nav-menu-btn[data-tool-home]").isVisible(),
    );
    add(
      "site-nav-net-tool-visible",
      await page.locator(".site-nav-menu-btn[data-tool-launch='tool-net-proceeds']").isVisible(),
    );
    add(
      "site-nav-performance-tool-visible",
      await page.locator(".site-nav-menu-btn[data-tool-launch='tool-simple-performance']").isVisible(),
    );
    add(
      "site-nav-fund-tool-visible",
      await page.locator(".site-nav-menu-btn[data-tool-launch='tool-simple-fund']").isVisible(),
    );
    await page.click(".site-nav-menu-btn[data-tool-launch='tool-simple-performance']");
    await page.waitForSelector("#tool-simple-performance:not([hidden])", { timeout: 15000 });
    add(
      "site-nav-menu-closes-on-selection",
      !(await page.locator(".site-nav-menu").evaluate((el) => el.open)),
    );

    await page.click(".site-nav-menu-trigger");
    await page.mouse.click(20, 20);
    await page.waitForTimeout(100);
    add(
      "site-nav-menu-closes-on-outside-click",
      !(await page.locator(".site-nav-menu").evaluate((el) => el.open)),
    );

    await page.goto(`${baseUrl}#net-proceeds`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#tool-net-proceeds:not([hidden])", { timeout: 15000 });
    add("net-panel-visible", await page.locator("#tool-net-proceeds").isVisible());
    add("net-dataset-removed", !(await page.locator("#netDatasetYear").isVisible()));
    add(
      "net-dataset-badge-removed",
      !(await page.locator("[data-scenario-tool='net-proceeds'] [data-scenario-badge]").isVisible()),
    );

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

    // Simple performance tool
    await page.goto(`${baseUrl}#simple-performance`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#tool-simple-performance:not([hidden])", { timeout: 15000 });
    const simplePerfVisible = await page.locator("#simple-performance-calculator").isVisible();
    add("simple-performance-tab-opens", simplePerfVisible);
    const beforeSimplePerf = parseMoney(await page.locator("#simplePerfNetShare").textContent());
    await page.fill("#simplePerfOwnershipPercent", "25");
    await page.waitForTimeout(250);
    const afterSimplePerf = parseMoney(await page.locator("#simplePerfNetShare").textContent());
    add(
      "simple-performance-live-update",
      afterSimplePerf !== beforeSimplePerf,
      `before=${beforeSimplePerf}, after=${afterSimplePerf}`,
    );

    // Fund tool
    await page.goto(`${baseUrl}#simple-fund`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#tool-simple-fund:not([hidden])", { timeout: 15000 });
    const fundVisible = await page.locator("#simple-fund-calculator").isVisible();
    add("fund-tab-opens", fundVisible);
    add("fund-dataset-removed", !(await page.locator("#fundDatasetYear").isVisible()));

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
