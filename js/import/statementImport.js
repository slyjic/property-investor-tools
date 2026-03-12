const MONTH_LOOKUP = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows
    .map((cells) => cells.map((cell) => String(cell ?? "").trim()))
    .filter((cells) => cells.some((cell) => cell !== ""));
};

const toAmount = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const inBrackets = raw.startsWith("(") && raw.endsWith(")");
  let normalized = raw.replace(/[()$]/g, "").replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/,/g, "");
  } else if (normalized.includes(",") && !normalized.includes(".")) {
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return inBrackets ? -Math.abs(parsed) : parsed;
};

const toYear = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed >= 100) {
    return parsed;
  }
  return parsed >= 70 ? 1900 + parsed : 2000 + parsed;
};

const parseMonthToken = (value) => {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/[,]/g, " ");
  if (!text.trim()) {
    return null;
  }

  const monthNameMatch = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b(?:[\s\-\/]*([0-9]{2,4}))?/,
  );
  if (monthNameMatch) {
    const monthNumber = MONTH_LOOKUP[monthNameMatch[1]];
    const yearValue = monthNameMatch[2] ? toYear(monthNameMatch[2]) : null;
    return {
      monthNumber,
      yearValue,
    };
  }

  const yearMonthMatch = text.match(/\b([0-9]{4})[\/\-]([0-9]{1,2})\b/);
  if (yearMonthMatch) {
    return {
      monthNumber: Number.parseInt(yearMonthMatch[2], 10),
      yearValue: Number.parseInt(yearMonthMatch[1], 10),
    };
  }

  const monthYearMatch = text.match(/\b([0-9]{1,2})[\/\-]([0-9]{2,4})\b/);
  if (monthYearMatch) {
    return {
      monthNumber: Number.parseInt(monthYearMatch[1], 10),
      yearValue: toYear(monthYearMatch[2]),
    };
  }

  return null;
};

const createTargetMonthMeta = (targetMonthLabels) => {
  const exactKeyToLabel = new Map();
  const monthOnlyToLabel = new Map();

  (targetMonthLabels || []).forEach((label) => {
    const parsed = parseMonthToken(label);
    if (!parsed || !parsed.monthNumber) {
      return;
    }

    const monthOnlyKey = `${parsed.monthNumber}`;
    monthOnlyToLabel.set(monthOnlyKey, label);

    if (parsed.yearValue) {
      const exactKey = `${parsed.yearValue}-${parsed.monthNumber}`;
      exactKeyToLabel.set(exactKey, label);
    }
  });

  return {
    exactKeyToLabel,
    monthOnlyToLabel,
  };
};

const resolveTargetLabel = (monthText, targetMonthMeta) => {
  const parsed = parseMonthToken(monthText);
  if (!parsed || !parsed.monthNumber) {
    return "";
  }

  if (parsed.yearValue) {
    const exactLabel = targetMonthMeta.exactKeyToLabel.get(`${parsed.yearValue}-${parsed.monthNumber}`);
    if (exactLabel) {
      return exactLabel;
    }
  }

  return targetMonthMeta.monthOnlyToLabel.get(`${parsed.monthNumber}`) || "";
};

const detectColumns = (headers, hasHeaderRow) => {
  const indices = Array.from({ length: headers.length }, (_, index) => index);
  const normalizedHeaders = headers.map(normalizeHeader);

  const findByPattern = (pattern, excluded = []) =>
    normalizedHeaders.findIndex((header, index) => !excluded.includes(index) && pattern.test(header));

  let monthIndex = -1;
  if (hasHeaderRow) {
    monthIndex = findByPattern(/month|period|statementdate|date/);
  }
  if (monthIndex < 0) {
    monthIndex = 0;
  }

  const pickDetectedOrFallback = (detectedIndex, fallbackIndex) => {
    if (detectedIndex >= 0) {
      return detectedIndex;
    }
    if (Number.isInteger(fallbackIndex) && fallbackIndex >= 0) {
      return fallbackIndex;
    }
    return -1;
  };

  const remaining = indices.filter((index) => index !== monthIndex);

  const incomeIndex = pickDetectedOrFallback(
    findByPattern(/income|rent|revenue|credit|receipts?/, [monthIndex]),
    remaining[0],
  );
  const expensesIndex = pickDetectedOrFallback(
    findByPattern(/expenses?|outgoings?|costs?/, [monthIndex, incomeIndex]),
    remaining[1],
  );
  const feesIndex = pickDetectedOrFallback(
    findByPattern(/fee|management|agency|commission/, [monthIndex, incomeIndex, expensesIndex]),
    remaining[2],
  );
  const disbursementIndex = pickDetectedOrFallback(
    findByPattern(/draw|disbursement|owner|payment|distribution/, [
      monthIndex,
      incomeIndex,
      expensesIndex,
      feesIndex,
    ]),
    remaining[3],
  );

  return {
    monthIndex,
    incomeIndex,
    expensesIndex,
    feesIndex,
    disbursementIndex,
  };
};

const toImportedRows = (rowsByLabel) =>
  Array.from(rowsByLabel.values()).map((row) => ({
    label: row.label,
    income: row.income ?? 0,
    expenses: row.expenses ?? 0,
    fees: row.fees ?? 0,
    disbursement: row.disbursement ?? 0,
  }));

const fillRowValues = (targetRow, values) => {
  if (!targetRow || !values) {
    return;
  }

  if (values.income !== null) {
    targetRow.income = values.income;
  }
  if (values.expenses !== null) {
    targetRow.expenses = values.expenses;
  }
  if (values.fees !== null) {
    targetRow.fees = values.fees;
  }
  if (values.disbursement !== null) {
    targetRow.disbursement = values.disbursement;
  }
};

const toDetectedMonth = (parsedMonth) => {
  if (
    !parsedMonth ||
    !Number.isInteger(parsedMonth.monthNumber) ||
    !Number.isInteger(parsedMonth.yearValue)
  ) {
    return null;
  }

  return {
    monthNumber: parsedMonth.monthNumber,
    yearValue: parsedMonth.yearValue,
  };
};

const isLikelyHeaderRow = (cells) => {
  const normalized = Array.isArray(cells) ? cells.map(normalizeHeader) : [];
  const headerHits = normalized.filter((header) =>
    /(month|period|statementdate|date|income|rent|revenue|credit|receipts?|expenses?|outgoings?|costs?|fee|management|agency|commission|draw|disbursement|owner|payment|distribution)/.test(
      header,
    ),
  ).length;

  return headerHits >= 2;
};

export const parseStatementCsv = (text, targetMonthLabels) => {
  const csvRows = parseCsv(String(text ?? ""));
  if (csvRows.length < 2) {
    return {
      rows: [],
      warnings: ["CSV did not contain enough rows to import."],
    };
  }

  const targetMonthMeta = createTargetMonthMeta(targetMonthLabels);
  const likelyHeaderRow = csvRows[0];
  const hasHeaderRow = isLikelyHeaderRow(likelyHeaderRow);
  const columns = detectColumns(likelyHeaderRow, hasHeaderRow);
  const dataRows = hasHeaderRow ? csvRows.slice(1) : csvRows;

  const rowsByLabel = new Map();
  const warnings = [];
  const detectedMonths = [];

  dataRows.forEach((row) => {
    const monthText = row[columns.monthIndex] || "";
    const parsedMonth = toDetectedMonth(parseMonthToken(monthText));
    if (parsedMonth) {
      detectedMonths.push(parsedMonth);
    }
    const targetLabel = resolveTargetLabel(monthText, targetMonthMeta);
    if (!targetLabel) {
      return;
    }

    const importedRow = rowsByLabel.get(targetLabel) || {
      label: targetLabel,
      income: 0,
      expenses: 0,
      fees: 0,
      disbursement: 0,
    };

    fillRowValues(importedRow, {
      income: columns.incomeIndex >= 0 ? toAmount(row[columns.incomeIndex]) : null,
      expenses: columns.expensesIndex >= 0 ? toAmount(row[columns.expensesIndex]) : null,
      fees: columns.feesIndex >= 0 ? toAmount(row[columns.feesIndex]) : null,
      disbursement: columns.disbursementIndex >= 0 ? toAmount(row[columns.disbursementIndex]) : null,
    });

    rowsByLabel.set(targetLabel, importedRow);
  });

  const rows = toImportedRows(rowsByLabel);
  if (!rows.length) {
    warnings.push("No monthly rows were detected from this CSV.");
  }

  return {
    rows,
    warnings,
    detectedMonths,
  };
};

const extractAmountsFromLine = (line) => {
  const matches = Array.from(String(line ?? "").matchAll(/\(?-?\$?\d[\d,]*(?:\.\d{1,2})?\)?/g), (match) =>
    toAmount(match[0]),
  ).filter((value) => Number.isFinite(value));

  if (!matches.length) {
    return [];
  }

  if (matches.length >= 4) {
    return matches.slice(-4);
  }

  if (matches.length === 3) {
    return [matches[0], matches[1], matches[2], null];
  }

  if (matches.length === 2) {
    return [matches[0], matches[1], null, null];
  }

  return [matches[0], null, null, null];
};

const extractPdfMonthSegments = (text) => {
  const fullText = String(text ?? "");
  const monthPattern =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:[\s\-\/]*[0-9]{2,4})?/gi;
  const matches = Array.from(fullText.matchAll(monthPattern));
  if (!matches.length) {
    return [];
  }

  return matches
    .map((match, index) => {
      const start = typeof match.index === "number" ? match.index : 0;
      const next = matches[index + 1];
      const end = next && typeof next.index === "number" ? next.index : fullText.length;
      return fullText.slice(start, end).trim();
    })
    .filter(Boolean);
};

export const parseStatementPdfText = (text, targetMonthLabels) => {
  const lines = String(text ?? "")
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const targetMonthMeta = createTargetMonthMeta(targetMonthLabels);
  const rowsByLabel = new Map();
  const warnings = [];
  const detectedMonths = [];

  lines.forEach((line, index) => {
    const parsedMonth = toDetectedMonth(parseMonthToken(line));
    if (parsedMonth) {
      detectedMonths.push(parsedMonth);
    }

    const targetLabel = resolveTargetLabel(line, targetMonthMeta);
    if (!targetLabel) {
      return;
    }

    let amounts = extractAmountsFromLine(line);
    if (amounts.filter((value) => Number.isFinite(value)).length < 2 && lines[index + 1]) {
      amounts = extractAmountsFromLine(`${line} ${lines[index + 1]}`);
    }

    if (!amounts.length) {
      return;
    }

    const importedRow = rowsByLabel.get(targetLabel) || {
      label: targetLabel,
      income: 0,
      expenses: 0,
      fees: 0,
      disbursement: 0,
    };

    fillRowValues(importedRow, {
      income: amounts[0],
      expenses: amounts[1],
      fees: amounts[2],
      disbursement: amounts[3],
    });

    rowsByLabel.set(targetLabel, importedRow);
  });

  if (!rowsByLabel.size) {
    const segments = extractPdfMonthSegments(lines.join(" "));
    segments.forEach((segment) => {
      const parsedMonth = toDetectedMonth(parseMonthToken(segment));
      if (parsedMonth) {
        detectedMonths.push(parsedMonth);
      }

      const targetLabel = resolveTargetLabel(segment, targetMonthMeta);
      if (!targetLabel) {
        return;
      }

      const amounts = extractAmountsFromLine(segment);
      if (!amounts.length) {
        return;
      }

      const importedRow = rowsByLabel.get(targetLabel) || {
        label: targetLabel,
        income: 0,
        expenses: 0,
        fees: 0,
        disbursement: 0,
      };

      fillRowValues(importedRow, {
        income: amounts[0],
        expenses: amounts[1],
        fees: amounts[2],
        disbursement: amounts[3],
      });

      rowsByLabel.set(targetLabel, importedRow);
    });
  }

  const rows = toImportedRows(rowsByLabel);
  if (!rows.length) {
    warnings.push(
      "Could not detect monthly values in this PDF automatically. Try CSV export or adjust values manually.",
    );
  }

  return {
    rows,
    warnings,
    detectedMonths,
  };
};

export const parseStatementPdfFile = async (file, targetMonthLabels) => {
  if (!file) {
    return {
      rows: [],
      warnings: ["No PDF file selected."],
    };
  }

  if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== "function") {
    return {
      rows: [],
      warnings: ["PDF parser not available. Refresh and try again."],
    };
  }

  if (window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({
    data: arrayBuffer,
  });
  const pdf = await loadingTask.promise;
  const pageTexts = [];

  const toPageLines = (items) => {
    const lines = [];
    let currentParts = [];
    let previousY = null;

    items.forEach((item) => {
      const text = String(item?.str ?? "").trim();
      if (!text) {
        return;
      }

      const yValue =
        Array.isArray(item?.transform) && Number.isFinite(item.transform[5]) ? item.transform[5] : null;

      if (
        currentParts.length > 0 &&
        previousY !== null &&
        yValue !== null &&
        Math.abs(yValue - previousY) > 2.8
      ) {
        lines.push(currentParts.join(" "));
        currentParts = [];
      }

      currentParts.push(text);
      if (yValue !== null) {
        previousY = yValue;
      }
    });

    if (currentParts.length) {
      lines.push(currentParts.join(" "));
    }

    return lines;
  };

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = toPageLines(textContent.items).join("\n");
    pageTexts.push(pageText);
  }

  const fullText = pageTexts.join("\n");
  return parseStatementPdfText(fullText, targetMonthLabels);
};
