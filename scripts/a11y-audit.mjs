import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const root = process.cwd();
const host = "127.0.0.1";
const port = 4173;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const safeJoin = (base, target) => {
  const targetPath = path.posix.normalize(`/${target}`).replace(/^\/+/, "");
  const resolved = path.resolve(base, targetPath);
  if (!resolved.startsWith(base)) {
    return null;
  }
  return resolved;
};

const server = createServer(async (req, res) => {
  try {
    const requestPath = (req.url || "/").split("?")[0];
    const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
    const filePath = safeJoin(root, normalizedPath);

    if (!filePath) {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
    res.statusCode = 200;
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

const scenarios = [
  {
    name: "Net Proceeds",
    setup: async () => {},
  },
  {
    name: "Performance",
    setup: async (page) => {
      await page.click("#tab-investment-income");
    },
  },
  {
    name: "Simple Fund",
    setup: async (page) => {
      await page.click("#tab-simple-fund");
    },
  },
];

const summarizeViolation = (violation) => ({
  id: violation.id,
  impact: violation.impact || "unknown",
  help: violation.help,
  description: violation.description,
  nodeCount: violation.nodes.length,
  nodes: violation.nodes.slice(0, 3).map((node) => ({
    target: node.target,
    failureSummary: node.failureSummary || "",
  })),
});

const run = async () => {
  await new Promise((resolve) => {
    server.listen(port, host, resolve);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = `http://${host}:${port}/index.html`;

  const results = [];

  for (const scenario of scenarios) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tab-net-proceeds");
    await scenario.setup(page);

    const axeResult = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .analyze();

    results.push({
      scenario: scenario.name,
      url,
      violations: axeResult.violations.map(summarizeViolation),
    });
  }

  await context.close();
  await browser.close();
  await new Promise((resolve) => {
    server.close(resolve);
  });

  const allViolations = results.flatMap((result) =>
    result.violations.map((violation) => ({ scenario: result.scenario, ...violation })),
  );

  const criticalViolations = allViolations.filter((violation) => violation.impact === "critical");

  const report = {
    generatedAt: new Date().toISOString(),
    scenarios: results,
    totals: {
      scenarios: results.length,
      violations: allViolations.length,
      critical: criticalViolations.length,
    },
  };

  const reportPath = path.resolve(root, "reports/a11y-report.json");
  const summaryPath = path.resolve(root, "reports/a11y-summary.txt");
  const reportsDir = path.dirname(reportPath);
  const jsonText = JSON.stringify(report, null, 2);

  const lines = [
    `A11y audit generated: ${report.generatedAt}`,
    `Scenarios: ${report.totals.scenarios}`,
    `Violations: ${report.totals.violations}`,
    `Critical: ${report.totals.critical}`,
  ];

  for (const result of results) {
    lines.push(`\n[${result.scenario}] ${result.violations.length} violation(s)`);
    for (const violation of result.violations) {
      lines.push(
        `- (${violation.impact}) ${violation.id}: ${violation.help} [nodes: ${violation.nodeCount}]`,
      );
    }
  }

  await mkdir(reportsDir, { recursive: true });
  await Promise.all([writeFile(reportPath, jsonText), writeFile(summaryPath, `${lines.join("\n")}\n`)]);

  console.log(lines.join("\n"));

  if (criticalViolations.length > 0) {
    process.exitCode = 1;
  }
};

run().catch(async (error) => {
  console.error(error);
  await new Promise((resolve) => {
    server.close(resolve);
  }).catch(() => {});
  process.exitCode = 1;
});
