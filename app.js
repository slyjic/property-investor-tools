import { initSimpleFundCalculator } from "./js/tools/fund.js";
import { initNetProceedsCalculator } from "./js/tools/netProceeds.js";
import { initPerformanceCalculator } from "./js/tools/performance.js";
import { wireMobileSummaryJumpButtons } from "./js/ui/mobileSummary.js";
import { initTooltips } from "./js/ui/tooltips.js";
import { initToolMenu } from "./js/ui/toolMenu.js";

const initApp = () => {
  initToolMenu();
  initTooltips();
  wireMobileSummaryJumpButtons();
  initNetProceedsCalculator();
  initPerformanceCalculator();
  initSimpleFundCalculator();
};

initApp();
