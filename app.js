(() => {
  const form = document.querySelector("#property-calculator");
  if (!form) {
    return;
  }

  const TAX_BRACKETS = {
    "2025-26": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 0.16 },
      { min: 45000, max: 135000, rate: 0.3 },
      { min: 135000, max: 190000, rate: 0.37 },
      { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ],
    "2026-27": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 0.15 },
      { min: 45000, max: 135000, rate: 0.3 },
      { min: 135000, max: 190000, rate: 0.37 },
      { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ],
    "2027-28": [
      { min: 0, max: 18200, rate: 0 },
      { min: 18200, max: 45000, rate: 0.14 },
      { min: 45000, max: 135000, rate: 0.3 },
      { min: 135000, max: 190000, rate: 0.37 },
      { min: 190000, max: Number.POSITIVE_INFINITY, rate: 0.45 }
    ]
  };

  const moneyFormatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const currencyInputFormatter = new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const byId = (id) => document.getElementById(id);

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
    pdfStatus: byId("pdfStatus")
  };
  let latestReport = null;
  let statusTimerId = null;

  const agentFeeTypeInputs = Array.from(document.querySelectorAll("input[name='agentFeeType']"));
  const agentPercentBlock = document.querySelector("[data-agent-percent]");
  const agentDollarBlock = document.querySelector("[data-agent-dollar]");
  const currencyInputs = Array.from(form.querySelectorAll("input[data-currency='true']"));

  const normalizeNumericString = (value) => {
    const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
    if (!cleaned) {
      return "";
    }
    const firstDotIndex = cleaned.indexOf(".");
    if (firstDotIndex === -1) {
      return cleaned;
    }
    const integerPart = cleaned.slice(0, firstDotIndex);
    const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
    return `${integerPart}.${decimalPart}`;
  };

  const parseCurrencyValue = (value) => {
    const normalized = normalizeNumericString(value);
    if (!normalized) {
      return Number.NaN;
    }
    return Number.parseFloat(normalized);
  };

  const toEditableNumberString = (value) => {
    if (!Number.isFinite(value)) {
      return "";
    }
    return value.toFixed(2).replace(/\.?0+$/, "");
  };

  const readNumber = (input) => {
    if (!input) {
      return 0;
    }
    const parsed =
      input.dataset && input.dataset.currency === "true"
        ? parseCurrencyValue(input.value)
        : Number.parseFloat(input.value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  const clampPercentInput = (input) => {
    clampRangeInput(input, 0, 100);
  };

  const clampRangeInput = (input, min, max) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = Number.parseFloat(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    input.value = toEditableNumberString(clamped);
  };

  const selectedAgentFeeType = () => {
    const checked = agentFeeTypeInputs.find((input) => input.checked);
    return checked ? checked.value : "percent";
  };

  const calculateIncomeTax = (income, brackets) => {
    const taxableIncome = Math.max(0, income);
    let tax = 0;

    brackets.forEach((bracket) => {
      if (taxableIncome <= bracket.min) {
        return;
      }
      const taxableSlice = Math.min(taxableIncome, bracket.max) - bracket.min;
      if (taxableSlice > 0) {
        tax += taxableSlice * bracket.rate;
      }
    });

    return tax;
  };

  const formatMoney = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const formatPercent = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

  const sanitizeCurrencyInput = (input) => {
    if (!input) {
      return;
    }
    input.value = normalizeNumericString(input.value);
  };

  const formatCurrencyInput = (input) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = parseCurrencyValue(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    input.value = `$${currencyInputFormatter.format(Math.max(0, parsed))}`;
  };

  const unformatCurrencyInput = (input) => {
    if (!input || input.value.trim() === "") {
      return;
    }
    const parsed = parseCurrencyValue(input.value);
    if (!Number.isFinite(parsed)) {
      input.value = "";
      return;
    }
    input.value = toEditableNumberString(Math.max(0, parsed));
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

  const setOutputValue = (element, value, useSignClass = false) => {
    if (!element) {
      return;
    }

    element.textContent = formatMoney(value);

    if (useSignClass) {
      element.classList.remove("value-positive", "value-negative");
      if (value > 0) {
        element.classList.add("value-positive");
      } else if (value < 0) {
        element.classList.add("value-negative");
      }
    }
  };

  const setTrendToneClass = (element, value) => {
    if (!element) {
      return;
    }

    element.classList.remove("is-positive", "is-negative", "is-neutral");
    if (value > 0) {
      element.classList.add("is-positive");
      return;
    }
    if (value < 0) {
      element.classList.add("is-negative");
      return;
    }
    element.classList.add("is-neutral");
  };

  const renderSparkline = (
    svgElement,
    values,
    {
      baseline = 0,
      lineColor = "#69d49f",
      areaColor = "rgba(105, 212, 159, 0.2)",
      baselineColor = "rgba(188, 218, 223, 0.3)"
    } = {}
  ) => {
    if (!svgElement) {
      return;
    }

    const safeValues = Array.isArray(values)
      ? values.map((value) => (Number.isFinite(value) ? value : 0))
      : [];
    if (!safeValues.length) {
      svgElement.innerHTML = "";
      return;
    }

    const width = 300;
    const height = 88;
    const padX = 6;
    const padY = 8;
    let minValue = Math.min(...safeValues);
    let maxValue = Math.max(...safeValues);

    if (Number.isFinite(baseline)) {
      minValue = Math.min(minValue, baseline);
      maxValue = Math.max(maxValue, baseline);
    }

    if (minValue === maxValue) {
      minValue -= 1;
      maxValue += 1;
    }

    const valueRange = maxValue - minValue;
    const xStep = safeValues.length > 1 ? (width - padX * 2) / (safeValues.length - 1) : 0;
    const yFor = (value) => padY + ((maxValue - value) / valueRange) * (height - padY * 2);
    const pointFor = (value, index) => {
      const x = padX + index * xStep;
      const y = yFor(value);
      return { x, y, text: `${x.toFixed(2)},${y.toFixed(2)}` };
    };

    const points = safeValues.map((value, index) => pointFor(value, index));
    const polylinePoints = points.map((point) => point.text).join(" ");
    const baselineY = yFor(Number.isFinite(baseline) ? baseline : minValue);
    const areaPoints = `${points[0].x.toFixed(2)},${baselineY.toFixed(2)} ${polylinePoints} ${points[points.length - 1].x.toFixed(2)},${baselineY.toFixed(2)}`;

    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svgElement.innerHTML = `
      <line x1="${padX}" y1="${baselineY.toFixed(2)}" x2="${(width - padX).toFixed(2)}" y2="${baselineY.toFixed(2)}"
        stroke="${baselineColor}" stroke-width="1" stroke-dasharray="3 3"></line>
      <polyline points="${areaPoints}" fill="${areaColor}" stroke="none"></polyline>
      <polyline points="${polylinePoints}" fill="none" stroke="${lineColor}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"></polyline>
    `;
  };

  const setDetailsOpenState = (container, detailsSelector, isOpen) => {
    if (!container) {
      return;
    }
    container.querySelectorAll(detailsSelector).forEach((detailsElement) => {
      detailsElement.open = isOpen;
    });
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
    const salePrice = readNumber(fields.salePrice);
    const purchasePrice = readNumber(fields.purchasePrice);
    const outstandingMortgage = readNumber(fields.outstandingMortgage);
    const ownershipPercent = Math.min(100, readNumber(fields.ownershipPercent));
    const ownershipRatio = ownershipPercent / 100;
    const feeType = selectedAgentFeeType();
    const agentFeePercent = readNumber(fields.agentFeePercent);
    const agentFeeGstPercent = readNumber(fields.agentFeeGstPercent);

    let agentFeeWhole = 0;
    if (feeType === "percent") {
      const commissionRate = agentFeePercent / 100;
      const gstRate = agentFeeGstPercent / 100;
      const baseCommission = salePrice * commissionRate;
      agentFeeWhole = baseCommission * (1 + gstRate);
    } else {
      agentFeeWhole = readNumber(fields.agentFeeDollar);
    }

    const marketingCost = readNumber(fields.marketingCost);
    const legalCost = readNumber(fields.legalCost);
    const mortgageReleaseCost = readNumber(fields.mortgageReleaseCost);
    const titleSearchCost = readNumber(fields.titleSearchCost);
    const additionalSellingCostsWhole = marketingCost + legalCost + mortgageReleaseCost + titleSearchCost;

    const totalSellingCostsWhole = agentFeeWhole + additionalSellingCostsWhole;
    const saleShare = salePrice * ownershipRatio;
    const purchaseShare = purchasePrice * ownershipRatio;
    const totalSellingCosts = totalSellingCostsWhole * ownershipRatio;
    const capitalGain = saleShare - purchaseShare - totalSellingCosts;
    const discountMultiplier = fields.cgtDiscount && fields.cgtDiscount.checked ? 0.5 : 1;
    const taxableCapitalGain = Math.max(0, capitalGain) * discountMultiplier;

    const chosenTaxYear = fields.taxYear && TAX_BRACKETS[fields.taxYear.value] ? fields.taxYear.value : "2025-26";
    const brackets = TAX_BRACKETS[chosenTaxYear];

    const taxableIncome = readNumber(fields.taxableIncome);
    const taxBeforeGain = calculateIncomeTax(taxableIncome, brackets);
    const taxAfterGain = calculateIncomeTax(taxableIncome + taxableCapitalGain, brackets);
    const estimatedCgt = Math.max(0, taxAfterGain - taxBeforeGain);
    const mortgageShare = outstandingMortgage;

    const netProceeds = saleShare - totalSellingCosts - estimatedCgt - mortgageShare;
    const afterTaxProfit = netProceeds - purchaseShare;

    latestReport = {
      salePrice,
      purchasePrice,
      ownershipPercent,
      ownershipRatio,
      outstandingMortgage,
      taxYear: chosenTaxYear,
      feeType,
      agentFeePercent,
      agentFeeGstPercent,
      agentFeeWhole,
      marketingCost,
      legalCost,
      mortgageReleaseCost,
      titleSearchCost,
      totalSellingCostsWhole,
      saleShare,
      purchaseShare,
      totalSellingCosts,
      capitalGain,
      taxableCapitalGain,
      discountApplied: Boolean(fields.cgtDiscount && fields.cgtDiscount.checked),
      taxableIncome,
      taxBeforeGain,
      taxAfterGain,
      estimatedCgt,
      mortgageShare,
      netProceeds,
      afterTaxProfit
    };

    if (fields.outputOwnershipApplied) {
      fields.outputOwnershipApplied.textContent = `${ownershipPercent.toFixed(2)}%`;
    }
    setOutputValue(fields.outputAgentFee, agentFeeWhole);
    setOutputValue(fields.outputAdditionalSellingCosts, additionalSellingCostsWhole);
    setOutputValue(fields.outputTotalSellingCostsWholeComputed, totalSellingCostsWhole);
    setOutputValue(fields.outputTotalSellingCostsInline, totalSellingCosts);
    setOutputValue(fields.outputSaleShare, saleShare);
    setOutputValue(fields.outputTotalSellingCosts, totalSellingCosts);
    setOutputValue(fields.outputCapitalGain, capitalGain, true);
    setOutputValue(fields.outputTaxableCapitalGain, taxableCapitalGain);
    setOutputValue(fields.outputTaxOnIncomeOnly, taxBeforeGain);
    setOutputValue(fields.outputTaxOnIncomeWithGain, taxAfterGain);
    setOutputValue(fields.outputEstimatedCgt, estimatedCgt);
    setOutputValue(fields.outputMortgageShare, mortgageShare);
    setOutputValue(fields.outputNetProceeds, netProceeds, true);
    setOutputValue(fields.outputMobileNetProceeds, netProceeds, true);
    setOutputValue(fields.outputAfterTaxProfit, afterTaxProfit, true);
  };

  const generatePdfReport = () => {
    const jsPdfConstructor = window.jspdf && window.jspdf.jsPDF;

    if (!jsPdfConstructor) {
      setPdfStatus("PDF library did not load. Refresh and try again.", "error");
      return;
    }

    calculate();

    if (!latestReport) {
      setPdfStatus("No calculations available to export.", "error");
      return;
    }

    const report = latestReport;

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
        highlightTextNegative: [140, 39, 49]
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
              : "Dollar mode"
        },
        { label: "Marketing and advertising", value: formatMoney(report.marketingCost) },
        { label: "Legal and conveyancing", value: formatMoney(report.legalCost) },
        { label: "Discharge and settlement fees", value: formatMoney(report.mortgageReleaseCost) },
        { label: "Title and due-diligence searches", value: formatMoney(report.titleSearchCost) }
      ];

      const breakdownRows = [
        {
          label: "Commission (asset level)",
          value:
            report.feeType === "percent"
              ? `${formatMoney(report.salePrice)} x ${formatPercent(report.agentFeePercent)} x (1 + ${formatPercent(report.agentFeeGstPercent)}) = ${formatMoney(report.agentFeeWhole)}`
              : `${formatMoney(report.agentFeeWhole)} (manual amount)`
        },
        { label: "Total disposal costs (asset level)", value: formatMoney(report.totalSellingCostsWhole) },
        {
          label: "Proceeds at beneficial ownership share",
          value: `${formatMoney(report.salePrice)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.saleShare)}`
        },
        {
          label: "Acquisition share",
          value: `${formatMoney(report.purchasePrice)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.purchaseShare)}`
        },
        {
          label: "Apportioned disposal costs",
          value: `${formatMoney(report.totalSellingCostsWhole)} x ${formatPercent(report.ownershipPercent)} = ${formatMoney(report.totalSellingCosts)}`
        },
        {
          label: "Capital gain/loss",
          value: `${formatMoney(report.saleShare)} - ${formatMoney(report.purchaseShare)} - ${formatMoney(report.totalSellingCosts)} = ${formatMoney(report.capitalGain)}`
        },
        { label: "Taxable capital gain", value: formatMoney(report.taxableCapitalGain) },
        { label: "Income tax on base income", value: formatMoney(report.taxBeforeGain) },
        { label: "Income tax with taxable gain", value: formatMoney(report.taxAfterGain) },
        {
          label: "Incremental CGT estimate",
          value: `${formatMoney(report.taxAfterGain)} - ${formatMoney(report.taxBeforeGain)} = ${formatMoney(report.estimatedCgt)}`
        }
      ];

      const resultRows = [
        { label: "Gross proceeds at your beneficial ownership share", value: formatMoney(report.saleShare) },
        { label: "Your apportioned disposal costs (excl. CGT)", value: formatMoney(report.totalSellingCosts) },
        { label: "Your taxable capital gain", value: formatMoney(report.taxableCapitalGain) },
        { label: "Incremental CGT estimate", value: formatMoney(report.estimatedCgt) },
        { label: "Debt payout at settlement", value: formatMoney(report.mortgageShare) },
        { label: "After-tax profit vs acquisition share", value: formatMoney(report.afterTaxProfit) }
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
        String(now.getMinutes()).padStart(2, "0")
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

  const wireEvents = () => {
    const inputs = Array.from(form.querySelectorAll("input, select"));

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        if (input.dataset && input.dataset.currency === "true") {
          sanitizeCurrencyInput(input);
        }
        if (input.id === "ownershipPercent") {
          clampPercentInput(input);
        }
        calculate();
      });
      input.addEventListener("change", () => {
        if (input.name === "agentFeeType") {
          syncAgentFeeInputs();
        }
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
    fields.downloadPdf.addEventListener("click", generatePdfReport);
  };

  const wireMobileSummaryJumpButtons = () => {
    const jumpButtons = Array.from(document.querySelectorAll("[data-scroll-target]"));
    if (!jumpButtons.length) {
      return;
    }

    jumpButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.scrollTarget;
        if (!targetId) {
          return;
        }
        const target = byId(targetId);
        if (!target) {
          return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const initToolMenu = () => {
    const tabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-tool-panel]"));

    if (!tabs.length || !panels.length) {
      return;
    }

    const panelMap = new Map(panels.map((panel) => [panel.id, panel]));

    const activatePanel = (panelId) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.toolTab === panelId;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.id === panelId;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });

    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const panelId = tab.dataset.toolTab;
        if (panelId && panelMap.has(panelId)) {
          activatePanel(panelId);
        }
      });
    });

    const defaultTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
    if (defaultTab && defaultTab.dataset.toolTab) {
      activatePanel(defaultTab.dataset.toolTab);
    }
  };

  const initInvestmentIncomeCalculator = () => {
    const incomeForm = document.querySelector("#investment-income-calculator");
    if (!incomeForm) {
      return;
    }

    const statementRowsBody = byId("incomeStatementRows");
    if (!statementRowsBody) {
      return;
    }
    const statementCardsContainer = byId("incomeStatementCards");
    const incomeCardsExpandButton = byId("incomeCardsExpand");
    const incomeCardsCollapseButton = byId("incomeCardsCollapse");

    const DEFAULT_STATEMENT_MONTHS = [
      { label: "Jul 2024", income: 31469.73, expenses: 1099.0, fees: 1645.35, disbursement: 28725.38 },
      { label: "Aug 2024", income: 21388.97, expenses: 2903.25, fees: 1082.93, disbursement: 18040.67 },
      { label: "Sep 2024", income: 20883.52, expenses: 1877.72, fees: 1057.66, disbursement: 17948.14 },
      { label: "Oct 2024", income: 22952.53, expenses: 649.0, fees: 1132.04, disbursement: 21171.49 },
      { label: "Nov 2024", income: 21628.53, expenses: 5390.33, fees: 1094.92, disbursement: 15143.28 },
      { label: "Dec 2024", income: 12713.18, expenses: 10784.91, fees: 652.51, disbursement: 1275.76 },
      { label: "Jan 2025", income: 33453.88, expenses: 770.0, fees: 1686.2, disbursement: 30997.68 },
      { label: "Feb 2025", income: 9803.18, expenses: 2444.2, fees: 503.64, disbursement: 5381.7 },
      { label: "Mar 2025", income: 21703.53, expenses: 7857.8, fees: 1022.07, disbursement: 14297.3 },
      { label: "Apr 2025", income: 36294.98, expenses: 11060.6, fees: 1832.33, disbursement: 23402.05 },
      { label: "May 2025", income: 13985.38, expenses: 2607.41, fees: 713.32, disbursement: 10664.65 },
      { label: "Jun 2025", income: 21028.53, expenses: 88.0, fees: 1061.97, disbursement: 19305.07 }
    ];

    const incomeFields = {
      propertyValue: byId("incomePropertyValue"),
      ownershipPercent: byId("incomeOwnershipPercent"),
      startingCash: byId("incomeStartingCash"),
      applySourceMonth: byId("incomeApplySourceMonth"),
      applySourceToAllButton: byId("incomeApplySourceToAll"),
      copyPrevAcrossButton: byId("incomeCopyPrevAcross"),
      rentGst: byId("incomeRentGst"),
      rentGstFree: byId("incomeRentGstFree"),
      outgoingsRecovered: byId("incomeOutgoingsRecovered"),
      otherIncome: byId("incomeOtherIncome"),
      councilRates: byId("incomeCouncilRates"),
      waterRates: byId("incomeWaterRates"),
      insurance: byId("incomeInsurance"),
      landTax: byId("incomeLandTax"),
      gardening: byId("incomeGardening"),
      fireSafety: byId("incomeFireSafety"),
      repairs: byId("incomeRepairs"),
      capex: byId("incomeCapex"),
      otherExpenses: byId("incomeOtherExpenses"),
      managementFees: byId("incomeManagementFees"),
      otherFees: byId("incomeOtherFees"),
      outputAnnualIncome: byId("incomeAnnualIncome"),
      outputAnnualExpenses: byId("incomeAnnualExpenses"),
      outputAnnualFees: byId("incomeAnnualFees"),
      outputAnnualNet: byId("incomeAnnualNet"),
      outputGrossYield: byId("incomeGrossYield"),
      outputNetYield: byId("incomeNetYield"),
      outputMonthlyNet: byId("incomeMonthlyNet"),
      outputMonthlyAverageNet: byId("incomeMonthlyAverageNet"),
      outputOwnerDisbursements: byId("incomeOwnerDisbursements"),
      outputBestMonth: byId("incomeBestMonth"),
      outputWorstMonth: byId("incomeWorstMonth"),
      outputNetDifference: byId("incomeNetDifference"),
      outputYourShareMonthly: byId("incomeYourShareMonthly"),
      outputTableTotalIncome: byId("incomeTableTotalIncome"),
      outputTableTotalExpenses: byId("incomeTableTotalExpenses"),
      outputTableTotalFees: byId("incomeTableTotalFees"),
      outputTableTotalDisbursement: byId("incomeTableTotalDisbursement"),
      outputTableTotalNet: byId("incomeTableTotalNet"),
      outputTableTotalMargin: byId("incomeTableTotalMargin"),
      outputMonthlyStripIncome: byId("incomeMonthlyStripIncome"),
      outputMonthlyStripNet: byId("incomeMonthlyStripNet"),
      outputMonthlyStripAvg: byId("incomeMonthlyStripAvg"),
      outputMonthlyStripPositive: byId("incomeMonthlyStripPositive"),
      outputQuarter1Net: byId("incomeQuarter1Net"),
      outputQuarter1Margin: byId("incomeQuarter1Margin"),
      outputQuarter2Net: byId("incomeQuarter2Net"),
      outputQuarter2Margin: byId("incomeQuarter2Margin"),
      outputQuarter3Net: byId("incomeQuarter3Net"),
      outputQuarter3Margin: byId("incomeQuarter3Margin"),
      outputQuarter4Net: byId("incomeQuarter4Net"),
      outputQuarter4Margin: byId("incomeQuarter4Margin"),
      outputHealthStatus: byId("incomeHealthStatus"),
      outputHealthStatusCard: byId("incomeHealthStatusCard"),
      outputHealthNote: byId("incomeHealthNote"),
      outputHealthNoteCard: byId("incomeHealthNoteCard"),
      outputKpiNetShare: byId("incomeKpiNetShare"),
      outputKpiNetShareCard: byId("incomeKpiNetShareCard"),
      outputKpiNetYield: byId("incomeKpiNetYield"),
      outputKpiNetYieldCard: byId("incomeKpiNetYieldCard"),
      outputKpiNetMargin: byId("incomeKpiNetMargin"),
      outputKpiNetMarginCard: byId("incomeKpiNetMarginCard"),
      outputKpiCostToIncome: byId("incomeKpiCostToIncome"),
      outputKpiCostToIncomeCard: byId("incomeKpiCostToIncomeCard"),
      outputKpiPositiveMonths: byId("incomeKpiPositiveMonths"),
      outputKpiPositiveMonthsCard: byId("incomeKpiPositiveMonthsCard"),
      outputKpiRetainedCash: byId("incomeKpiRetainedCash"),
      outputTrendNetLatest: byId("incomeTrendNetLatest"),
      outputTrendMarginLatest: byId("incomeTrendMarginLatest"),
      outputTrendNetSparkline: byId("incomeNetSparkline"),
      outputTrendMarginSparkline: byId("incomeMarginSparkline"),
      trendNetCard: byId("incomeNetTrendCard"),
      trendMarginCard: byId("incomeMarginTrendCard"),
      outputMobileSummaryNet: byId("mobileIncomeNet")
    };

    const setPercentOutput = (element, value, useSignClass = false) => {
      if (!element) {
        return;
      }
      element.textContent = `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

      if (useSignClass) {
        element.classList.remove("value-positive", "value-negative");
        if (value > 0) {
          element.classList.add("value-positive");
        } else if (value < 0) {
          element.classList.add("value-negative");
        }
      }
    };

    const setLabelledMoneyOutput = (element, label, value, useSignClass = false) => {
      if (!element) {
        return;
      }

      const safeLabel = label || "-";
      element.textContent = `${safeLabel}: ${formatMoney(value)}`;

      if (useSignClass) {
        element.classList.remove("value-positive", "value-negative");
        if (value > 0) {
          element.classList.add("value-positive");
        } else if (value < 0) {
          element.classList.add("value-negative");
        }
      }
    };

    const setTextOutput = (element, text) => {
      if (!element) {
        return;
      }
      element.textContent = text;
    };

    const setHealthState = (status, note, tone) => {
      const applyToneClass = (element) => {
        if (!element) {
          return;
        }
        element.classList.remove("is-strong", "is-stable", "is-watch");
        if (tone === "strong") {
          element.classList.add("is-strong");
        } else if (tone === "stable") {
          element.classList.add("is-stable");
        } else if (tone === "watch") {
          element.classList.add("is-watch");
        }
      };

      if (incomeFields.outputHealthStatus) {
        incomeFields.outputHealthStatus.textContent = status;
        applyToneClass(incomeFields.outputHealthStatus);
      }
      if (incomeFields.outputHealthStatusCard) {
        incomeFields.outputHealthStatusCard.textContent = status;
        applyToneClass(incomeFields.outputHealthStatusCard);
      }
      if (incomeFields.outputHealthNote) {
        incomeFields.outputHealthNote.textContent = note;
      }
      if (incomeFields.outputHealthNoteCard) {
        incomeFields.outputHealthNoteCard.textContent = note;
      }
    };

    const evaluateHealth = (annualMargin, costToIncome, positiveMonths, totalMonths) => {
      const marginScore = annualMargin >= 55 ? 3 : annualMargin >= 35 ? 2 : annualMargin >= 20 ? 1 : 0;
      const costScore = costToIncome <= 40 ? 3 : costToIncome <= 55 ? 2 : costToIncome <= 70 ? 1 : 0;
      const stabilityScore = positiveMonths >= 11 ? 3 : positiveMonths >= 9 ? 2 : positiveMonths >= 7 ? 1 : 0;
      const score = marginScore + costScore + stabilityScore;

      if (score >= 7) {
        return {
          status: "Healthy",
          tone: "strong",
          note: `Strong operating cashflow profile with ${positiveMonths}/${totalMonths} positive months and controlled costs.`
        };
      }

      if (score >= 4) {
        return {
          status: "Stable",
          tone: "stable",
          note: `Generally performing well, but monitor operating margins and cost pressure over time.`
        };
      }

      return {
        status: "Needs Attention",
        tone: "watch",
        note: `Operating profitability or month-to-month consistency is under pressure and needs closer review.`
      };
    };

    let monthRows = [];

    const syncPairedInputValue = (source, target) => {
      if (!source || !target) {
        return;
      }
      target.value = source.value;
    };

    const wireMirroredInputs = (inputA, inputB) => {
      if (!inputA || !inputB) {
        return;
      }

      const mirrorValue = (source, target, eventName) => {
        syncPairedInputValue(source, target);
        if (eventName === "blur") {
          window.setTimeout(() => {
            syncPairedInputValue(source, target);
          }, 0);
        }
      };

      ["input", "change", "blur"].forEach((eventName) => {
        inputA.addEventListener(eventName, () => {
          mirrorValue(inputA, inputB, eventName);
        });
        inputB.addEventListener(eventName, () => {
          mirrorValue(inputB, inputA, eventName);
        });
      });
    };

    const setSignedClass = (element, value) => {
      if (!element) {
        return;
      }
      element.classList.remove("value-positive", "value-negative");
      if (value > 0) {
        element.classList.add("value-positive");
      } else if (value < 0) {
        element.classList.add("value-negative");
      }
    };

    const buildStatementRows = () => {
      monthRows = [];
      statementRowsBody.innerHTML = "";
      if (statementCardsContainer) {
        statementCardsContainer.innerHTML = "";
      }

      DEFAULT_STATEMENT_MONTHS.forEach((month, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="statement-month">${month.label}</td>
          <td>
            <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
              data-month-index="${index}" data-month-field="income" value="${toEditableNumberString(month.income)}" />
          </td>
          <td>
            <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
              data-month-index="${index}" data-month-field="expenses" value="${toEditableNumberString(month.expenses)}" />
          </td>
          <td>
            <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
              data-month-index="${index}" data-month-field="fees" value="${toEditableNumberString(month.fees)}" />
          </td>
          <td>
            <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
              data-month-index="${index}" data-month-field="disbursement" value="${toEditableNumberString(month.disbursement)}" />
          </td>
          <td><span class="statement-net" data-month-output="net">$0.00</span></td>
          <td><span class="statement-margin" data-month-output="margin">0.00%</span></td>
        `;
        statementRowsBody.appendChild(row);

        let cardIncomeInput = null;
        let cardExpensesInput = null;
        let cardFeesInput = null;
        let cardDisbursementInput = null;
        let cardNetOutput = null;
        let cardMarginOutput = null;

        if (statementCardsContainer) {
          const card = document.createElement("article");
          card.className = "statement-card";
          card.innerHTML = `
            <details class="statement-card-details" ${index === 0 ? "open" : ""}>
              <summary class="statement-card-summary">
                <div class="statement-card-summary-main">
                  <h4>${month.label}</h4>
                  <p>Tap to edit monthly inputs</p>
                </div>
                <div class="statement-card-summary-metrics">
                  <span class="statement-card-net" data-month-output-mobile="net">$0.00</span>
                  <strong class="statement-card-margin" data-month-output-mobile="margin">0.00%</strong>
                </div>
              </summary>
              <div class="statement-card-body">
                <div class="statement-card-grid">
                  <label class="statement-card-field">
                    <span>Gross income</span>
                    <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                      data-month-index="${index}" data-month-field-mobile="income" value="${toEditableNumberString(month.income)}" />
                  </label>
                  <label class="statement-card-field">
                    <span>Operating expenses</span>
                    <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                      data-month-index="${index}" data-month-field-mobile="expenses" value="${toEditableNumberString(month.expenses)}" />
                  </label>
                  <label class="statement-card-field">
                    <span>Management fees</span>
                    <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                      data-month-index="${index}" data-month-field-mobile="fees" value="${toEditableNumberString(month.fees)}" />
                  </label>
                  <label class="statement-card-field">
                    <span>Owner draw / disbursement</span>
                    <input type="text" inputmode="decimal" data-currency="true" autocomplete="off"
                      data-month-index="${index}" data-month-field-mobile="disbursement" value="${toEditableNumberString(month.disbursement)}" />
                  </label>
                </div>
              </div>
            </details>
          `;
          statementCardsContainer.appendChild(card);

          cardIncomeInput = card.querySelector("input[data-month-field-mobile='income']");
          cardExpensesInput = card.querySelector("input[data-month-field-mobile='expenses']");
          cardFeesInput = card.querySelector("input[data-month-field-mobile='fees']");
          cardDisbursementInput = card.querySelector("input[data-month-field-mobile='disbursement']");
          cardNetOutput = card.querySelector("[data-month-output-mobile='net']");
          cardMarginOutput = card.querySelector("[data-month-output-mobile='margin']");
        }

        const rowData = {
          label: month.label,
          incomeInput: row.querySelector("input[data-month-field='income']"),
          expensesInput: row.querySelector("input[data-month-field='expenses']"),
          feesInput: row.querySelector("input[data-month-field='fees']"),
          disbursementInput: row.querySelector("input[data-month-field='disbursement']"),
          outputNet: row.querySelector("[data-month-output='net']"),
          outputMargin: row.querySelector("[data-month-output='margin']"),
          incomeInputMobile: cardIncomeInput,
          expensesInputMobile: cardExpensesInput,
          feesInputMobile: cardFeesInput,
          disbursementInputMobile: cardDisbursementInput,
          outputNetMobile: cardNetOutput,
          outputMarginMobile: cardMarginOutput
        };

        wireMirroredInputs(rowData.incomeInput, rowData.incomeInputMobile);
        wireMirroredInputs(rowData.expensesInput, rowData.expensesInputMobile);
        wireMirroredInputs(rowData.feesInput, rowData.feesInputMobile);
        wireMirroredInputs(rowData.disbursementInput, rowData.disbursementInputMobile);
        monthRows.push(rowData);
      });
    };

    const applyCategoryDefaults = () => {
      const defaultValues = [
        [incomeFields.rentGst, 207941.74],
        [incomeFields.rentGstFree, 34800.0],
        [incomeFields.outgoingsRecovered, 23915.2],
        [incomeFields.otherIncome, 649.0],
        [incomeFields.councilRates, 7357.61],
        [incomeFields.waterRates, 3756.98],
        [incomeFields.insurance, 10784.91],
        [incomeFields.landTax, 16128.95],
        [incomeFields.gardening, 5346.0],
        [incomeFields.fireSafety, 1590.26],
        [incomeFields.repairs, 1430.0],
        [incomeFields.capex, 1099.0],
        [incomeFields.otherExpenses, 38.51],
        [incomeFields.managementFees, 13429.94],
        [incomeFields.otherFees, 55.0]
      ];

      defaultValues.forEach(([input, value]) => {
        if (!input) {
          return;
        }
        input.value = toEditableNumberString(value);
      });
    };

    const setStatementCellValues = (rowData, netValue, netMarginPercent) => {
      [rowData.outputNet, rowData.outputNetMobile].forEach((element) => {
        if (!element) {
          return;
        }
        element.textContent = formatMoney(netValue);
        setSignedClass(element, netValue);
      });

      [rowData.outputMargin, rowData.outputMarginMobile].forEach((element) => {
        if (!element) {
          return;
        }
        element.textContent = `${netMarginPercent.toFixed(2)}%`;
        setSignedClass(element, netMarginPercent);
      });
    };

    const monthValueKeys = ["income", "expenses", "fees", "disbursement"];

    const getRowInputByKey = (rowData, key, useMobile = false) => {
      if (!rowData) {
        return null;
      }
      if (key === "income") {
        return useMobile ? rowData.incomeInputMobile : rowData.incomeInput;
      }
      if (key === "expenses") {
        return useMobile ? rowData.expensesInputMobile : rowData.expensesInput;
      }
      if (key === "fees") {
        return useMobile ? rowData.feesInputMobile : rowData.feesInput;
      }
      if (key === "disbursement") {
        return useMobile ? rowData.disbursementInputMobile : rowData.disbursementInput;
      }
      return null;
    };

    const setRowFieldValue = (rowData, key, value) => {
      const desktopInput = getRowInputByKey(rowData, key, false);
      const mobileInput = getRowInputByKey(rowData, key, true);

      if (desktopInput) {
        desktopInput.value = value;
      }
      if (mobileInput) {
        mobileInput.value = value;
      }
    };

    const readRowFieldValue = (rowData, key) => {
      const desktopInput = getRowInputByKey(rowData, key, false);
      if (desktopInput) {
        return desktopInput.value;
      }
      const mobileInput = getRowInputByKey(rowData, key, true);
      return mobileInput ? mobileInput.value : "";
    };

    const copyRowValues = (sourceRow, targetRow) => {
      if (!sourceRow || !targetRow) {
        return;
      }
      monthValueKeys.forEach((key) => {
        setRowFieldValue(targetRow, key, readRowFieldValue(sourceRow, key));
      });
    };

    const calculateInvestmentIncome = () => {
      const propertyValue = readNumber(incomeFields.propertyValue);
      const ownershipPercent = Math.min(100, readNumber(incomeFields.ownershipPercent));
      const ownershipRatio = ownershipPercent / 100;
      const startingCash = readNumber(incomeFields.startingCash);

      const annualIncome =
        readNumber(incomeFields.rentGst) +
        readNumber(incomeFields.rentGstFree) +
        readNumber(incomeFields.outgoingsRecovered) +
        readNumber(incomeFields.otherIncome);

      const annualExpenses =
        readNumber(incomeFields.councilRates) +
        readNumber(incomeFields.waterRates) +
        readNumber(incomeFields.insurance) +
        readNumber(incomeFields.landTax) +
        readNumber(incomeFields.gardening) +
        readNumber(incomeFields.fireSafety) +
        readNumber(incomeFields.repairs) +
        readNumber(incomeFields.capex) +
        readNumber(incomeFields.otherExpenses);

      const annualFees = readNumber(incomeFields.managementFees) + readNumber(incomeFields.otherFees);
      const annualNet = annualIncome - annualExpenses - annualFees;
      const annualMargin = annualIncome > 0 ? (annualNet / annualIncome) * 100 : 0;
      const grossYield = propertyValue > 0 ? (annualIncome / propertyValue) * 100 : 0;
      const netYield = propertyValue > 0 ? (annualNet / propertyValue) * 100 : 0;

      let monthlyIncomeTotal = 0;
      let monthlyExpensesTotal = 0;
      let monthlyFeesTotal = 0;
      let monthlyDisbursementTotal = 0;
      let positiveMonths = 0;
      const quarterSummaries = Array.from({ length: 4 }, () => ({ income: 0, net: 0 }));
      const monthNetSeries = [];
      const monthMarginSeries = [];

      let bestMonth = { label: "-", value: Number.NEGATIVE_INFINITY };
      let worstMonth = { label: "-", value: Number.POSITIVE_INFINITY };

      monthRows.forEach((rowData, index) => {
        const monthIncome = readNumber(rowData.incomeInput);
        const monthExpenses = readNumber(rowData.expensesInput);
        const monthFees = readNumber(rowData.feesInput);
        const monthDisbursement = readNumber(rowData.disbursementInput);

        const monthNet = monthIncome - monthExpenses - monthFees;
        const monthMargin = monthIncome > 0 ? (monthNet / monthIncome) * 100 : 0;
        monthNetSeries.push(monthNet);
        monthMarginSeries.push(monthMargin);

        if (monthNet >= 0) {
          positiveMonths += 1;
        }

        monthlyIncomeTotal += monthIncome;
        monthlyExpensesTotal += monthExpenses;
        monthlyFeesTotal += monthFees;
        monthlyDisbursementTotal += monthDisbursement;
        const quarterIndex = Math.floor(index / 3);
        if (quarterSummaries[quarterIndex]) {
          quarterSummaries[quarterIndex].income += monthIncome;
          quarterSummaries[quarterIndex].net += monthNet;
        }

        if (monthNet > bestMonth.value) {
          bestMonth = { label: rowData.label, value: monthNet };
        }
        if (monthNet < worstMonth.value) {
          worstMonth = { label: rowData.label, value: monthNet };
        }

        setStatementCellValues(rowData, monthNet, monthMargin);
      });

      const monthlyNet = monthlyIncomeTotal - monthlyExpensesTotal - monthlyFeesTotal;
      const monthlyAverageNet = monthRows.length ? monthlyNet / monthRows.length : 0;
      const costToIncome =
        monthlyIncomeTotal > 0 ? ((monthlyExpensesTotal + monthlyFeesTotal) / monthlyIncomeTotal) * 100 : 0;
      const retainedCash = startingCash + monthlyNet - monthlyDisbursementTotal;
      const netDifference = annualNet - monthlyNet;
      const yourShareNet = monthlyNet * ownershipRatio;
      const yourShareMonthly = monthlyAverageNet * ownershipRatio;
      const monthlyNetMargin = monthlyIncomeTotal > 0 ? (monthlyNet / monthlyIncomeTotal) * 100 : 0;
      const health = evaluateHealth(annualMargin, costToIncome, positiveMonths, monthRows.length);
      const latestNet = monthNetSeries.length ? monthNetSeries[monthNetSeries.length - 1] : 0;
      const latestMargin = monthMarginSeries.length ? monthMarginSeries[monthMarginSeries.length - 1] : 0;

      setOutputValue(incomeFields.outputAnnualIncome, annualIncome);
      setOutputValue(incomeFields.outputAnnualExpenses, annualExpenses);
      setOutputValue(incomeFields.outputAnnualFees, annualFees);
      setOutputValue(incomeFields.outputAnnualNet, annualNet, true);
      setPercentOutput(incomeFields.outputGrossYield, grossYield);
      setPercentOutput(incomeFields.outputNetYield, netYield, true);
      setOutputValue(incomeFields.outputMonthlyNet, monthlyNet, true);
      setOutputValue(incomeFields.outputMonthlyAverageNet, monthlyAverageNet, true);
      setOutputValue(incomeFields.outputOwnerDisbursements, monthlyDisbursementTotal);
      setLabelledMoneyOutput(
        incomeFields.outputBestMonth,
        bestMonth.label,
        Number.isFinite(bestMonth.value) ? bestMonth.value : 0,
        true
      );
      setLabelledMoneyOutput(
        incomeFields.outputWorstMonth,
        worstMonth.label,
        Number.isFinite(worstMonth.value) ? worstMonth.value : 0,
        true
      );
      setOutputValue(incomeFields.outputNetDifference, netDifference, true);
      setOutputValue(incomeFields.outputYourShareMonthly, yourShareMonthly, true);

      setOutputValue(incomeFields.outputTableTotalIncome, monthlyIncomeTotal);
      setOutputValue(incomeFields.outputTableTotalExpenses, monthlyExpensesTotal);
      setOutputValue(incomeFields.outputTableTotalFees, monthlyFeesTotal);
      setOutputValue(incomeFields.outputTableTotalDisbursement, monthlyDisbursementTotal);
      setOutputValue(incomeFields.outputTableTotalNet, monthlyNet, true);
      setPercentOutput(incomeFields.outputTableTotalMargin, monthlyNetMargin, true);
      setOutputValue(incomeFields.outputMonthlyStripIncome, monthlyIncomeTotal);
      setOutputValue(incomeFields.outputMonthlyStripNet, monthlyNet, true);
      setOutputValue(incomeFields.outputMonthlyStripAvg, monthlyAverageNet, true);
      setTextOutput(incomeFields.outputMonthlyStripPositive, `${positiveMonths} / ${monthRows.length}`);
      const quarterNetOutputs = [
        incomeFields.outputQuarter1Net,
        incomeFields.outputQuarter2Net,
        incomeFields.outputQuarter3Net,
        incomeFields.outputQuarter4Net
      ];
      const quarterMarginOutputs = [
        incomeFields.outputQuarter1Margin,
        incomeFields.outputQuarter2Margin,
        incomeFields.outputQuarter3Margin,
        incomeFields.outputQuarter4Margin
      ];
      quarterSummaries.forEach((quarter, index) => {
        const quarterMargin = quarter.income > 0 ? (quarter.net / quarter.income) * 100 : 0;
        setOutputValue(quarterNetOutputs[index], quarter.net, true);
        setPercentOutput(quarterMarginOutputs[index], quarterMargin, true);
      });

      setOutputValue(incomeFields.outputKpiNetShare, yourShareNet, true);
      setOutputValue(incomeFields.outputKpiNetShareCard, yourShareNet, true);
      setOutputValue(incomeFields.outputMobileSummaryNet, yourShareNet, true);
      setPercentOutput(incomeFields.outputKpiNetYield, netYield, true);
      setPercentOutput(incomeFields.outputKpiNetYieldCard, netYield, true);
      setPercentOutput(incomeFields.outputKpiNetMargin, annualMargin, true);
      setPercentOutput(incomeFields.outputKpiNetMarginCard, annualMargin, true);
      setPercentOutput(incomeFields.outputKpiCostToIncome, costToIncome);
      setPercentOutput(incomeFields.outputKpiCostToIncomeCard, costToIncome);
      setTextOutput(incomeFields.outputKpiPositiveMonths, `${positiveMonths} / ${monthRows.length}`);
      setTextOutput(incomeFields.outputKpiPositiveMonthsCard, `${positiveMonths} / ${monthRows.length}`);
      setOutputValue(incomeFields.outputKpiRetainedCash, retainedCash, true);
      setOutputValue(incomeFields.outputTrendNetLatest, latestNet, true);
      setPercentOutput(incomeFields.outputTrendMarginLatest, latestMargin, true);
      renderSparkline(incomeFields.outputTrendNetSparkline, monthNetSeries, {
        baseline: 0,
        lineColor: "#69d49f",
        areaColor: "rgba(105, 212, 159, 0.2)",
        baselineColor: "rgba(188, 218, 223, 0.28)"
      });
      renderSparkline(incomeFields.outputTrendMarginSparkline, monthMarginSeries, {
        baseline: 0,
        lineColor: "#ffa44f",
        areaColor: "rgba(255, 164, 79, 0.22)",
        baselineColor: "rgba(188, 218, 223, 0.28)"
      });
      setTrendToneClass(incomeFields.trendNetCard, latestNet);
      setTrendToneClass(incomeFields.trendMarginCard, latestMargin);

      setHealthState(health.status, health.note, health.tone);
    };

    const wireIncomeCurrencyFormatting = () => {
      const incomeCurrencyInputs = Array.from(incomeForm.querySelectorAll("input[data-currency='true']"));

      incomeCurrencyInputs.forEach((input) => {
        input.addEventListener("focus", () => {
          unformatCurrencyInput(input);
        });

        input.addEventListener("blur", () => {
          formatCurrencyInput(input);
          calculateInvestmentIncome();
        });
      });
    };

    const formatAllIncomeCurrencyInputs = () => {
      const incomeCurrencyInputs = Array.from(incomeForm.querySelectorAll("input[data-currency='true']"));
      incomeCurrencyInputs.forEach((input) => {
        formatCurrencyInput(input);
      });
    };

    const wireIncomeEvents = () => {
      const inputs = Array.from(incomeForm.querySelectorAll("input, select"));

      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          if (input.dataset && input.dataset.currency === "true") {
            sanitizeCurrencyInput(input);
          }
          if (input.id === "incomeOwnershipPercent") {
            clampPercentInput(input);
          }
          calculateInvestmentIncome();
        });

        input.addEventListener("change", () => {
          if (input.id === "incomeOwnershipPercent") {
            clampPercentInput(input);
          }
          calculateInvestmentIncome();
        });
      });
    };

    buildStatementRows();
    if (incomeCardsExpandButton) {
      incomeCardsExpandButton.addEventListener("click", () => {
        setDetailsOpenState(statementCardsContainer, ".statement-card-details", true);
      });
    }
    if (incomeCardsCollapseButton) {
      incomeCardsCollapseButton.addEventListener("click", () => {
        setDetailsOpenState(statementCardsContainer, ".statement-card-details", false);
      });
    }
    if (incomeFields.applySourceToAllButton) {
      incomeFields.applySourceToAllButton.addEventListener("click", () => {
        const sourceIndex = Number.parseInt(incomeFields.applySourceMonth ? incomeFields.applySourceMonth.value : "0", 10);
        if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= monthRows.length) {
          return;
        }
        const sourceRow = monthRows[sourceIndex];
        monthRows.forEach((rowData, index) => {
          if (index === sourceIndex) {
            return;
          }
          copyRowValues(sourceRow, rowData);
        });
        calculateInvestmentIncome();
      });
    }
    if (incomeFields.copyPrevAcrossButton) {
      incomeFields.copyPrevAcrossButton.addEventListener("click", () => {
        const snapshotValues = monthRows.map((rowData) => {
          const values = {};
          monthValueKeys.forEach((key) => {
            values[key] = readRowFieldValue(rowData, key);
          });
          return values;
        });

        for (let index = 1; index < monthRows.length; index += 1) {
          const previousValues = snapshotValues[index - 1];
          monthValueKeys.forEach((key) => {
            setRowFieldValue(monthRows[index], key, previousValues[key]);
          });
        }

        calculateInvestmentIncome();
      });
    }
    applyCategoryDefaults();
    wireIncomeCurrencyFormatting();
    formatAllIncomeCurrencyInputs();
    wireIncomeEvents();
    calculateInvestmentIncome();
  };

  const initSimpleFundCalculator = () => {
    const fundForm = document.querySelector("#simple-fund-calculator");
    if (!fundForm) {
      return;
    }

    const fundRowsBody = byId("fundDistributionRows");
    if (!fundRowsBody) {
      return;
    }
    const fundCardsContainer = byId("fundDistributionCards");

    const FUND_BASE_SPREAD_PERCENT = 4.0;
    const FUND_RBA_CASH_RATE_PERCENT = 3.85;

    const fundFields = {
      investmentAmount: byId("fundInvestmentAmount"),
      presetButtons: Array.from(fundForm.querySelectorAll("[data-fund-preset]")),
      outputCashRate: byId("fundCashRate"),
      outputAnnualRate: byId("fundAnnualRate"),
      outputMonthlyRate: byId("fundMonthlyRate"),
      outputMonthlyDistribution: byId("fundMonthlyDistribution"),
      outputAnnualDistribution: byId("fundAnnualDistribution"),
      outputCapitalPreserved: byId("fundCapitalPreserved"),
      outputStartDate: byId("fundStartDate"),
      outputSnapshotMonthly: byId("fundSnapshotMonthly"),
      outputSnapshotAnnual: byId("fundSnapshotAnnual"),
      outputSnapshotCapital: byId("fundSnapshotCapital"),
      outputTrendMonthlyLatest: byId("fundTrendMonthlyLatest"),
      outputTrendCumulativeLatest: byId("fundTrendCumulativeLatest"),
      outputTrendMonthlySparkline: byId("fundMonthlySparkline"),
      outputTrendCumulativeSparkline: byId("fundCumulativeSparkline"),
      trendMonthlyCard: byId("fundMonthlyTrendCard"),
      trendCumulativeCard: byId("fundCumulativeTrendCard"),
      outputMobileSummaryAnnual: byId("mobileFundAnnual"),
      expandCardsButton: byId("fundCardsExpand"),
      collapseCardsButton: byId("fundCardsCollapse")
    };
    let fundCardsExpanded = false;

    const dateFormatter = new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const addMonths = (date, monthsToAdd) => {
      const shifted = new Date(date.getTime());
      const day = shifted.getDate();
      shifted.setDate(1);
      shifted.setMonth(shifted.getMonth() + monthsToAdd);
      const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
      shifted.setDate(Math.min(day, lastDay));
      return shifted;
    };

    const setPercentOutput = (element, value) => {
      if (!element) {
        return;
      }
      element.textContent = formatPercent(value);
    };

    const renderDistributionRows = (startDate, monthlyDistribution, investmentAmount) => {
      fundRowsBody.innerHTML = "";
      if (fundCardsContainer) {
        fundCardsContainer.innerHTML = "";
      }
      let cumulativeDistribution = 0;

      for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
        const distributionDate = addMonths(startDate, monthIndex);
        cumulativeDistribution += monthlyDistribution;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>M${monthIndex + 1}</td>
          <td>${dateFormatter.format(distributionDate)}</td>
          <td>${formatMoney(monthlyDistribution)}</td>
          <td>${formatMoney(cumulativeDistribution)}</td>
          <td>${formatMoney(investmentAmount)}</td>
        `;

        fundRowsBody.appendChild(row);

        if (fundCardsContainer) {
          const card = document.createElement("article");
          card.className = "fund-card";
          const detailsOpenAttribute = fundCardsExpanded ? "open" : "";
          card.innerHTML = `
            <details class="fund-card-details" ${detailsOpenAttribute}>
              <summary class="fund-card-summary">
                <div class="fund-card-head">
                  <h4>M${monthIndex + 1}</h4>
                  <p>${dateFormatter.format(distributionDate)}</p>
                </div>
                <div class="fund-card-summary-amount">
                  <span>Monthly distribution</span>
                  <strong>${formatMoney(monthlyDistribution)}</strong>
                </div>
              </summary>
              <dl class="fund-card-list">
                <div>
                  <dt>Cumulative distribution</dt>
                  <dd>${formatMoney(cumulativeDistribution)}</dd>
                </div>
                <div>
                  <dt>Capital balance</dt>
                  <dd>${formatMoney(investmentAmount)}</dd>
                </div>
              </dl>
            </details>
          `;
          fundCardsContainer.appendChild(card);
        }
      }
    };

    const setFundCardsOpenState = (isOpen) => {
      fundCardsExpanded = isOpen;
      setDetailsOpenState(fundCardsContainer, ".fund-card-details", isOpen);
    };

    const syncPresetButtonState = (investmentAmount) => {
      if (!fundFields.presetButtons || !fundFields.presetButtons.length) {
        return;
      }

      fundFields.presetButtons.forEach((button) => {
        const presetAmount = Number.parseFloat(button.dataset.fundPreset || "0");
        const isActive = Number.isFinite(presetAmount) && Math.abs(presetAmount - investmentAmount) < 0.01;
        button.classList.toggle("is-active", isActive);
      });
    };

    const calculateFundDistributions = () => {
      const investmentAmount = readNumber(fundFields.investmentAmount);
      const annualRatePercent = FUND_BASE_SPREAD_PERCENT + FUND_RBA_CASH_RATE_PERCENT;
      const monthlyRatePercent = annualRatePercent / 12;
      const monthlyDistribution = investmentAmount * (annualRatePercent / 100) / 12;
      const annualDistribution = monthlyDistribution * 12;
      const projectionStartDate = new Date();
      const monthlyDistributionSeries = Array.from({ length: 12 }, () => monthlyDistribution);
      const cumulativeDistributionSeries = monthlyDistributionSeries.map((value, index) => value * (index + 1));

      setPercentOutput(fundFields.outputCashRate, FUND_RBA_CASH_RATE_PERCENT);
      setPercentOutput(fundFields.outputAnnualRate, annualRatePercent);
      setPercentOutput(fundFields.outputMonthlyRate, monthlyRatePercent);
      setOutputValue(fundFields.outputMonthlyDistribution, monthlyDistribution);
      setOutputValue(fundFields.outputAnnualDistribution, annualDistribution);
      setOutputValue(fundFields.outputMobileSummaryAnnual, annualDistribution);
      setOutputValue(fundFields.outputCapitalPreserved, investmentAmount);
      setOutputValue(fundFields.outputSnapshotMonthly, monthlyDistribution);
      setOutputValue(fundFields.outputSnapshotAnnual, annualDistribution);
      setOutputValue(fundFields.outputSnapshotCapital, investmentAmount);
      setOutputValue(fundFields.outputTrendMonthlyLatest, monthlyDistribution);
      setOutputValue(fundFields.outputTrendCumulativeLatest, annualDistribution);
      renderSparkline(fundFields.outputTrendMonthlySparkline, monthlyDistributionSeries, {
        baseline: 0,
        lineColor: "#ffd4a8",
        areaColor: "rgba(255, 164, 79, 0.2)",
        baselineColor: "rgba(255, 212, 168, 0.34)"
      });
      renderSparkline(fundFields.outputTrendCumulativeSparkline, cumulativeDistributionSeries, {
        baseline: 0,
        lineColor: "#ffa44f",
        areaColor: "rgba(255, 164, 79, 0.24)",
        baselineColor: "rgba(255, 212, 168, 0.34)"
      });
      setTrendToneClass(fundFields.trendMonthlyCard, monthlyDistribution);
      setTrendToneClass(fundFields.trendCumulativeCard, annualDistribution);

      if (fundFields.outputStartDate) {
        fundFields.outputStartDate.textContent = dateFormatter.format(projectionStartDate);
      }

      syncPresetButtonState(investmentAmount);
      renderDistributionRows(projectionStartDate, monthlyDistribution, investmentAmount);
    };

    if (fundFields.investmentAmount) {
      if (!fundFields.investmentAmount.value.trim()) {
        fundFields.investmentAmount.value = "100000";
      }

      fundFields.investmentAmount.addEventListener("focus", () => {
        unformatCurrencyInput(fundFields.investmentAmount);
      });

      fundFields.investmentAmount.addEventListener("input", () => {
        sanitizeCurrencyInput(fundFields.investmentAmount);
        calculateFundDistributions();
      });

      fundFields.investmentAmount.addEventListener("change", () => {
        calculateFundDistributions();
      });

      fundFields.investmentAmount.addEventListener("blur", () => {
        formatCurrencyInput(fundFields.investmentAmount);
        calculateFundDistributions();
      });

      formatCurrencyInput(fundFields.investmentAmount);
    }

    if (fundFields.presetButtons && fundFields.presetButtons.length) {
      fundFields.presetButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const presetAmount = Number.parseFloat(button.dataset.fundPreset || "0");
          if (!Number.isFinite(presetAmount) || !fundFields.investmentAmount) {
            return;
          }
          fundFields.investmentAmount.value = `$${currencyInputFormatter.format(Math.max(0, presetAmount))}`;
          calculateFundDistributions();
        });
      });
    }

    if (fundFields.expandCardsButton) {
      fundFields.expandCardsButton.addEventListener("click", () => {
        setFundCardsOpenState(true);
      });
    }

    if (fundFields.collapseCardsButton) {
      fundFields.collapseCardsButton.addEventListener("click", () => {
        setFundCardsOpenState(false);
      });
    }

    calculateFundDistributions();
  };

  initToolMenu();
  wireCurrencyFormatting();
  syncAgentFeeInputs();
  formatAllCurrencyInputs();
  wireEvents();
  wirePdfExport();
  wireMobileSummaryJumpButtons();
  initInvestmentIncomeCalculator();
  initSimpleFundCalculator();
  calculate();
})();
