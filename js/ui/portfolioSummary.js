import { byId, formatMoney, formatPercent, setTextContent } from "../shared/runtime.js";
import {
  buildPortfolioSummaryPayload,
  generatePortfolioSummaryPdfReport,
} from "../reporting/portfolioSummary.js";

export const initPortfolioSummary = () => {
  const downloadButton = byId("downloadPortfolioSummaryPdf");
  const status = byId("portfolioPdfStatus");
  if (!downloadButton) {
    return;
  }

  let statusTimerId = null;

  const setStatus = (message, tone = "") => {
    if (!status) {
      return;
    }

    setTextContent(status, message);
    status.classList.remove("is-success", "is-error");
    if (tone === "success") {
      status.classList.add("is-success");
    } else if (tone === "error") {
      status.classList.add("is-error");
    }

    if (statusTimerId) {
      window.clearTimeout(statusTimerId);
      statusTimerId = null;
    }

    if (message) {
      statusTimerId = window.setTimeout(() => {
        if (!status) {
          return;
        }
        setTextContent(status, "");
        status.classList.remove("is-success", "is-error");
      }, 5200);
    }
  };

  downloadButton.addEventListener("click", () => {
    const payload = buildPortfolioSummaryPayload();
    generatePortfolioSummaryPdfReport({
      payload,
      formatMoney,
      formatPercent,
      setPdfStatus: setStatus,
    });
  });
};
