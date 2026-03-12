export const generateNetProceedsPdfReport = ({
  getLatestReport,
  recalculate,
  formatMoney,
  formatPercent,
  setPdfStatus,
}) => {
  const jsPdfConstructor = window.jspdf && window.jspdf.jsPDF;

  if (!jsPdfConstructor) {
    setPdfStatus("PDF library did not load. Refresh and try again.", "error");
    return;
  }

  recalculate();

  const report = getLatestReport();
  if (!report) {
    setPdfStatus("No calculations available to export.", "error");
    return;
  }

  try {
    const doc = new jsPdfConstructor({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    const bottomMargin = 44;
    const headerHeight = 86;
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
    const now = new Date();
    let y = 0;

    const drawHeader = () => {
      doc.setFillColor(...colors.headerBg);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFillColor(...colors.headerAccent);
      doc.rect(0, headerHeight - 4, pageWidth, 4, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("Investment Property Net Proceeds Report", margin, 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(224, 234, 240);
      doc.text(`Generated: ${now.toLocaleString("en-AU")}`, margin, 54);
      doc.text(`Tax year: ${report.taxYear}`, margin, 69);

      y = headerHeight + 20;
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

    const drawRightAlignedLines = (lines, rightX, startY, gap = 12) => {
      lines.forEach((line, index) => {
        doc.text(line, rightX, startY + index * gap, { align: "right" });
      });
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
        drawRightAlignedLines(valueLines, valueX, y + 14, lineGap);

        y += rowHeight;
      });
      y += 10;
    };

    const drawNetProceedsHighlight = (value) => {
      ensureSpace(84);

      const boxHeight = 72;
      doc.setFillColor(...colors.highlightBg);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "F");
      doc.setDrawColor(...colors.highlightBorder);
      doc.setLineWidth(1.2);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.highlightText);
      doc.text("Net cash to you at settlement", margin + 14, y + 24);

      doc.setFontSize(22);
      if (value >= 0) {
        doc.setTextColor(...colors.highlightText);
      } else {
        doc.setTextColor(...colors.highlightTextNegative);
      }
      doc.text(formatMoney(value), margin + contentWidth - 14, y + 50, { align: "right" });
      y += boxHeight + 14;
    };

    drawHeader();

    const inputRows = [
      { label: "Contract sale price (whole asset)", value: formatMoney(report.salePrice) },
      { label: "Acquisition price (whole asset)", value: formatMoney(report.purchasePrice) },
      { label: "Beneficial ownership", value: formatPercent(report.ownershipPercent) },
      { label: "Debt payout at settlement (personal)", value: formatMoney(report.outstandingMortgage) },
      { label: "Expected taxable income (excluding gain)", value: formatMoney(report.taxableIncome) },
      { label: "50% CGT discount", value: report.discountApplied ? "Yes" : "No" },
      {
        label: "Commission input",
        value:
          report.feeType === "percent"
            ? `Percentage mode: ${formatPercent(report.agentFeePercent)} + ${formatPercent(report.agentFeeGstPercent)} GST`
            : "Dollar mode",
      },
      { label: "Marketing and advertising", value: formatMoney(report.marketingCost) },
      { label: "Legal and conveyancing", value: formatMoney(report.legalCost) },
      { label: "Discharge and settlement fees", value: formatMoney(report.mortgageReleaseCost) },
      { label: "Title and due-diligence searches", value: formatMoney(report.titleSearchCost) },
    ];

    const breakdownRows = [
      {
        label: "Commission (asset level)",
        value:
          report.feeType === "percent"
            ? `${formatMoney(report.salePrice)} x ${formatPercent(report.agentFeePercent)} x (1 + ${formatPercent(report.agentFeeGstPercent)}) = ${formatMoney(report.agentFeeWhole)}`
            : `${formatMoney(report.agentFeeWhole)} (manual amount)`,
      },
      { label: "Total disposal costs (asset level)", value: formatMoney(report.totalSellingCostsWhole) },
      {
        label: "Proceeds at beneficial ownership share",
        value: `${formatMoney(report.salePrice)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.saleShare)}`,
      },
      {
        label: "Acquisition share",
        value: `${formatMoney(report.purchasePrice)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.purchaseShare)}`,
      },
      {
        label: "Apportioned disposal costs",
        value: `${formatMoney(report.totalSellingCostsWhole)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.totalSellingCosts)}`,
      },
      {
        label: "Capital gain/loss",
        value: `${formatMoney(report.saleShare)} - ${formatMoney(report.purchaseShare)} - ${formatMoney(report.totalSellingCosts)} = ${formatMoney(report.capitalGain)}`,
      },
      { label: "Taxable capital gain", value: formatMoney(report.taxableCapitalGain) },
      { label: "Income tax on base income", value: formatMoney(report.taxBeforeGain) },
      { label: "Income tax with taxable gain", value: formatMoney(report.taxAfterGain) },
      {
        label: "Incremental CGT estimate",
        value: `${formatMoney(report.taxAfterGain)} - ${formatMoney(report.taxBeforeGain)} = ${formatMoney(report.estimatedCgt)}`,
      },
    ];

    const resultRows = [
      { label: "Gross proceeds at your beneficial ownership share", value: formatMoney(report.saleShare) },
      { label: "Your apportioned disposal costs (excl. CGT)", value: formatMoney(report.totalSellingCosts) },
      { label: "Your taxable capital gain", value: formatMoney(report.taxableCapitalGain) },
      { label: "Incremental CGT estimate", value: formatMoney(report.estimatedCgt) },
      { label: "Debt payout at settlement", value: formatMoney(report.mortgageShare) },
      { label: "After-tax profit vs acquisition share", value: formatMoney(report.afterTaxProfit) },
    ];

    drawSection("Inputs");
    drawRows(inputRows);

    drawSection("Calculation Breakdown");
    drawRows(breakdownRows);

    drawSection("Settlement Outcomes");
    drawRows(resultRows);
    drawNetProceedsHighlight(report.netProceeds);

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
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: "right" });
    }

    doc.save(`net-proceeds-report-${stamp}.pdf`);
    setPdfStatus("PDF report downloaded.", "success");
  } catch (error) {
    setPdfStatus("Could not create PDF. Please try again.", "error");
  }
};
