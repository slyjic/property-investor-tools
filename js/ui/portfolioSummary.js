import { formatMoney, formatPercent } from "../shared/runtime.js";
import {
  buildPortfolioSummaryPayload,
  generatePortfolioSummaryPdfReport,
} from "../reporting/portfolioSummary.js";

export const exportPortfolioSummary = (setPdfStatus) => {
  const payload = buildPortfolioSummaryPayload();
  generatePortfolioSummaryPdfReport({
    payload,
    formatMoney,
    formatPercent,
    setPdfStatus,
  });
};
