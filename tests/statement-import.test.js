import { describe, expect, it } from "vitest";

import { parseStatementCsv, parseStatementPdfText } from "../js/import/statementImport.js";

const TARGET_MONTHS = ["Jul 2024", "Aug 2024", "Sep 2024"];

describe("statement import parsing", () => {
  it("parses monthly rows from CSV", () => {
    const csv = `Month,Income,Expenses,Mgmt Fees,Owner Draw
Jul 2024,10000,1200,450,7000
Aug 2024,14000,1700,500,9000`;

    const parsed = parseStatementCsv(csv, TARGET_MONTHS);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.rows).toHaveLength(2);

    const julRow = parsed.rows.find((row) => row.label === "Jul 2024");
    const augRow = parsed.rows.find((row) => row.label === "Aug 2024");

    expect(julRow).toMatchObject({
      label: "Jul 2024",
      income: 10000,
      expenses: 1200,
      fees: 450,
      disbursement: 7000,
    });
    expect(augRow).toMatchObject({
      label: "Aug 2024",
      income: 14000,
      expenses: 1700,
      fees: 500,
      disbursement: 9000,
    });
  });

  it("falls back to positional columns when CSV has no headers", () => {
    const csv = `Jul 2024,5000,800,200,3000
Aug 2024,6000,900,240,3500`;

    const parsed = parseStatementCsv(csv, TARGET_MONTHS);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows.find((row) => row.label === "Jul 2024")).toMatchObject({
      income: 5000,
      expenses: 800,
      fees: 200,
      disbursement: 3000,
    });
  });

  it("parses month and amounts from PDF text", () => {
    const text = `
      Jul 2024   13,000.50   1,300.00   455.00   8,200.10
      Aug 2024   11,100.00   1,050.00   430.00   7,500.00
    `;

    const parsed = parseStatementPdfText(text, TARGET_MONTHS);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.rows).toHaveLength(2);

    expect(parsed.rows.find((row) => row.label === "Jul 2024")).toMatchObject({
      income: 13000.5,
      expenses: 1300,
      fees: 455,
      disbursement: 8200.1,
    });
    expect(parsed.rows.find((row) => row.label === "Aug 2024")).toMatchObject({
      income: 11100,
      expenses: 1050,
      fees: 430,
      disbursement: 7500,
    });
  });

  it("returns warning when no month rows are detected", () => {
    const parsed = parseStatementPdfText("Statement total only $5000", TARGET_MONTHS);
    expect(parsed.rows).toEqual([]);
    expect(parsed.warnings[0]).toContain("Could not detect monthly values");
  });
});
