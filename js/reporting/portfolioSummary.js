const parseNumberText = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const readText = (id) => {
  const element = document.getElementById(id);
  return element ? String(element.textContent ?? "").trim() : "";
};

const readInputValue = (id) => {
  const element = document.getElementById(id);
  return element ? String(element.value ?? "").trim() : "";
};

const readCheckboxValue = (id) => {
  const element = document.getElementById(id);
  return Boolean(element && element.checked);
};

export const buildPortfolioSummaryPayload = () => ({
  generatedAt: new Date(),
  netProceeds: {
    ownershipPercent: parseNumberText(readInputValue("ownershipPercent")),
    taxYear: readInputValue("taxYear"),
    cgtDiscountApplied: readCheckboxValue("cgtDiscount"),
    netSettlementCash: parseNumberText(readText("netProceeds")),
    saleShare: parseNumberText(readText("saleShare")),
    sellingCostsShare: parseNumberText(readText("totalSellingCosts")),
    estimatedCgt: parseNumberText(readText("estimatedCgt")),
    mortgagePayout: parseNumberText(readText("mortgageShare")),
    afterTaxProfit: parseNumberText(readText("afterTaxProfit")),
  },
  performance: {
    healthStatus: readText("incomeHealthStatus") || "-",
    healthNote: readText("incomeHealthNote") || "-",
    netOperatingCashflowShare: parseNumberText(readText("incomeKpiNetShare")),
    netYieldPercent: parseNumberText(readText("incomeKpiNetYield")),
    netMarginPercent: parseNumberText(readText("incomeKpiNetMargin")),
    costRatioPercent: parseNumberText(readText("incomeKpiCostToIncome")),
    positiveMonths: readText("incomeKpiPositiveMonths") || "-",
    retainedCash: parseNumberText(readText("incomeKpiRetainedCash")),
  },
  fund: {
    annualDistribution: parseNumberText(readText("fundAnnualDistribution")),
    monthlyDistribution: parseNumberText(readText("fundMonthlyDistribution")),
    annualRatePercent: parseNumberText(readText("fundAnnualRate")),
    cashRatePercent: parseNumberText(readText("fundCashRate")),
    capitalPreserved: parseNumberText(readText("fundCapitalPreserved")),
  },
});

export const generatePortfolioSummaryPdfReport = ({ payload, formatMoney, formatPercent, setPdfStatus }) => {
  const jsPdfConstructor = window.jspdf && window.jspdf.jsPDF;
  if (!jsPdfConstructor) {
    setPdfStatus("PDF library did not load. Refresh and try again.", "error");
    return;
  }

  if (!payload) {
    setPdfStatus("No summary data available to export.", "error");
    return;
  }

  try {
    const doc = new jsPdfConstructor({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    const bottomMargin = 44;
    const colors = {
      headerBg: [14, 34, 46],
      headerAccent: [255, 164, 79],
      heading: [23, 53, 70],
      body: [41, 58, 69],
      muted: [105, 122, 135],
      rowAlt: [246, 250, 252],
      rowBorder: [217, 226, 232],
      highlightBg: [226, 247, 235],
      highlightBorder: [105, 212, 159],
      highlightText: [20, 89, 58],
      highlightTextNegative: [140, 39, 49],
    };

    const now = payload.generatedAt instanceof Date ? payload.generatedAt : new Date();
    let y = 0;

    const drawHeader = () => {
      const headerHeight = 90;
      doc.setFillColor(...colors.headerBg);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFillColor(...colors.headerAccent);
      doc.rect(0, headerHeight - 4, pageWidth, 4, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("Property Investor Toolkit - Portfolio Summary", margin, 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(224, 234, 240);
      doc.text(`Generated: ${now.toLocaleString("en-AU")}`, margin, 54);
      doc.text("High-level estimate across all current tool inputs", margin, 69);
      y = headerHeight + 18;
    };

    const ensureSpace = (needed = 16) => {
      if (y + needed > pageHeight - bottomMargin) {
        doc.addPage();
        drawHeader();
      }
    };

    const drawSection = (title) => {
      ensureSpace(28);
      doc.setDrawColor(...colors.rowBorder);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);

      doc.setTextColor(...colors.heading);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin, y + 18);
      y += 26;
    };

    const drawRows = (rows) => {
      const labelWidth = contentWidth * 0.58;
      const valueWidth = contentWidth * 0.34;
      const labelX = margin + 10;
      const valueX = margin + contentWidth - 10;
      const lineGap = 12;

      rows.forEach((row, rowIndex) => {
        const labelLines = doc.splitTextToSize(String(row.label), labelWidth);
        const valueLines = doc.splitTextToSize(String(row.value), valueWidth);
        const rowHeight = Math.max(labelLines.length, valueLines.length) * lineGap + 10;

        ensureSpace(rowHeight + 2);

        if (rowIndex % 2 === 0) {
          doc.setFillColor(...colors.rowAlt);
          doc.rect(margin, y, contentWidth, rowHeight, "F");
        }

        doc.setDrawColor(...colors.rowBorder);
        doc.setLineWidth(0.5);
        doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

        doc.setTextColor(...colors.body);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.8);
        labelLines.forEach((line, lineIndex) => {
          doc.text(line, labelX, y + 14 + lineIndex * lineGap);
        });

        doc.setFont("helvetica", "bold");
        valueLines.forEach((line, lineIndex) => {
          doc.text(line, valueX, y + 14 + lineIndex * lineGap, { align: "right" });
        });

        y += rowHeight;
      });
      y += 10;
    };

    const drawPrimarySummary = () => {
      ensureSpace(126);
      const boxHeight = 116;

      doc.setFillColor(...colors.highlightBg);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "F");
      doc.setDrawColor(...colors.highlightBorder);
      doc.setLineWidth(1.2);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "S");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.highlightText);
      doc.setFontSize(10);
      doc.text("At-a-glance outcomes", margin + 14, y + 22);

      const firstColumnX = margin + 14;
      const secondColumnX = margin + contentWidth / 2 + 4;

      doc.setFontSize(8.8);
      doc.text("Net settlement cash", firstColumnX, y + 40);
      doc.text("Annual fund distribution", secondColumnX, y + 40);

      doc.setFontSize(18);
      const netColor =
        payload.netProceeds.netSettlementCash >= 0 ? colors.highlightText : colors.highlightTextNegative;
      doc.setTextColor(...netColor);
      doc.text(formatMoney(payload.netProceeds.netSettlementCash), firstColumnX, y + 62);

      doc.setTextColor(...colors.highlightText);
      doc.text(formatMoney(payload.fund.annualDistribution), secondColumnX, y + 62);

      doc.setFontSize(8.8);
      doc.text("Net operating cashflow (your share)", firstColumnX, y + 82);
      doc.text("Investment health", secondColumnX, y + 82);

      doc.setFontSize(12.5);
      doc.text(formatMoney(payload.performance.netOperatingCashflowShare), firstColumnX, y + 102);
      doc.text(payload.performance.healthStatus, secondColumnX, y + 102);

      y += boxHeight + 14;
    };

    drawHeader();
    drawPrimarySummary();

    drawSection("1. Net Proceeds Snapshot");
    drawRows([
      { label: "Tax year", value: payload.netProceeds.taxYear || "-" },
      {
        label: "Beneficial ownership applied",
        value: formatPercent(payload.netProceeds.ownershipPercent),
      },
      {
        label: "50% CGT discount",
        value: payload.netProceeds.cgtDiscountApplied ? "Applied" : "Not applied",
      },
      {
        label: "Net cash to you at settlement",
        value: formatMoney(payload.netProceeds.netSettlementCash),
      },
      {
        label: "Gross proceeds at your ownership share",
        value: formatMoney(payload.netProceeds.saleShare),
      },
      {
        label: "Your apportioned disposal costs",
        value: formatMoney(payload.netProceeds.sellingCostsShare),
      },
      {
        label: "Estimated CGT payable",
        value: formatMoney(payload.netProceeds.estimatedCgt),
      },
      {
        label: "Loan payout at settlement",
        value: formatMoney(payload.netProceeds.mortgagePayout),
      },
      {
        label: "After-tax profit vs acquisition share",
        value: formatMoney(payload.netProceeds.afterTaxProfit),
      },
    ]);

    drawSection("2. Performance Snapshot");
    drawRows([
      { label: "Health status", value: payload.performance.healthStatus },
      { label: "Health note", value: payload.performance.healthNote },
      {
        label: "Net operating cashflow (your share)",
        value: formatMoney(payload.performance.netOperatingCashflowShare),
      },
      { label: "Net yield", value: formatPercent(payload.performance.netYieldPercent) },
      { label: "Net margin", value: formatPercent(payload.performance.netMarginPercent) },
      { label: "Cost ratio", value: formatPercent(payload.performance.costRatioPercent) },
      { label: "Positive months", value: payload.performance.positiveMonths },
      { label: "Cash retained after draws", value: formatMoney(payload.performance.retainedCash) },
    ]);

    drawSection("3. Simple Fund Snapshot");
    drawRows([
      {
        label: "Total projected distribution (12 months)",
        value: formatMoney(payload.fund.annualDistribution),
      },
      { label: "Projected monthly distribution", value: formatMoney(payload.fund.monthlyDistribution) },
      {
        label: "Target annual return rate",
        value: formatPercent(payload.fund.annualRatePercent),
      },
      { label: "RBA cash rate used", value: formatPercent(payload.fund.cashRatePercent) },
      { label: "Capital available (withdrawable)", value: formatMoney(payload.fund.capitalPreserved) },
    ]);

    ensureSpace(28);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.muted);
    doc.text("Planning estimate only. This report is not financial or tax advice.", margin, y);

    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      "-",
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("");

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...colors.rowBorder);
      doc.setLineWidth(0.6);
      doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.muted);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 15, {
        align: "right",
      });
    }

    doc.save(`portfolio-summary-${stamp}.pdf`);
    setPdfStatus("Portfolio summary PDF downloaded.", "success");
  } catch {
    setPdfStatus("Could not create summary PDF. Please try again.", "error");
  }
};
