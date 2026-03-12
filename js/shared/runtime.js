const moneyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyInputFormatter = new Intl.NumberFormat("en-AU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const byId = (id) => document.getElementById(id);

export const normalizeNumericString = (value) => {
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

export const parseCurrencyValue = (value) => {
  const normalized = normalizeNumericString(value);
  if (!normalized) {
    return Number.NaN;
  }
  return Number.parseFloat(normalized);
};

export const toEditableNumberString = (value) => {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export const readNumber = (input) => {
  if (!input) {
    return 0;
  }
  const parsed =
    input.dataset && input.dataset.currency === "true"
      ? parseCurrencyValue(input.value)
      : Number.parseFloat(input.value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const clampRangeInput = (input, min, max) => {
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

export const clampPercentInput = (input) => {
  clampRangeInput(input, 0, 100);
};

export const formatMoney = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

export const formatCurrencyValue = (value) => `$${currencyInputFormatter.format(Math.max(0, value))}`;

export const sanitizeCurrencyInput = (input) => {
  if (!input) {
    return;
  }
  input.value = normalizeNumericString(input.value);
};

export const formatCurrencyInput = (input) => {
  if (!input || input.value.trim() === "") {
    return;
  }
  const parsed = parseCurrencyValue(input.value);
  if (!Number.isFinite(parsed)) {
    input.value = "";
    return;
  }
  input.value = formatCurrencyValue(parsed);
};

export const unformatCurrencyInput = (input) => {
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

export const setSignedClass = (element, value) => {
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

export const setOutputValue = (element, value, useSignClass = false) => {
  if (!element) {
    return;
  }
  element.textContent = formatMoney(value);

  if (useSignClass) {
    setSignedClass(element, value);
  }
};

export const setTrendToneClass = (element, value) => {
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

export const setDetailsOpenState = (container, detailsSelector, isOpen) => {
  if (!container) {
    return;
  }
  container.querySelectorAll(detailsSelector).forEach((detailsElement) => {
    detailsElement.open = isOpen;
  });
};

export const renderSparkline = (
  svgElement,
  values,
  {
    baseline = 0,
    lineColor = "#69d49f",
    areaColor = "rgba(105, 212, 159, 0.2)",
    baselineColor = "rgba(188, 218, 223, 0.3)",
  } = {},
) => {
  if (!svgElement) {
    return;
  }

  const safeValues = Array.isArray(values) ? values.map((value) => (Number.isFinite(value) ? value : 0)) : [];
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

export const createFrameScheduler = (callback) => {
  let isCoolingDown = false;

  const scheduleFrame =
    typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (fn) => window.setTimeout(fn, 16);

  return () => {
    if (isCoolingDown) {
      return;
    }

    callback();
    isCoolingDown = true;
    scheduleFrame(() => {
      isCoolingDown = false;
    });
  };
};
