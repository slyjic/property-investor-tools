import { initSimpleFundCalculator } from "./js/tools/fund.js";
import { initNetProceedsCalculator } from "./js/tools/netProceeds.js";
import { initPerformanceCalculator } from "./js/tools/performance.js";
import { initSimplePerformanceCalculator } from "./js/tools/performanceSimple.js";
import { wireMobileSummaryJumpButtons } from "./js/ui/mobileSummary.js";
import { initPortfolioSummary } from "./js/ui/portfolioSummary.js";
import { initScenarioStorage } from "./js/ui/scenarioStorage.js";
import { initTooltips } from "./js/ui/tooltips.js";
import { initToolMenu } from "./js/ui/toolMenu.js";

const initApp = () => {
  initToolMenu();
  initTooltips();
  wireMobileSummaryJumpButtons();
  initPortfolioSummary();
  initNetProceedsCalculator();
  initSimplePerformanceCalculator();
  initPerformanceCalculator();
  initSimpleFundCalculator();
  initScenarioStorage();
};

initApp();
