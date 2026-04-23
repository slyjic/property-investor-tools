import { initSimpleFundCalculator } from "./js/tools/fund.js";
import { initNetProceedsCalculator } from "./js/tools/netProceeds.js";
import { initPerformanceCalculator } from "./js/tools/performance.js";
import { initSimplePerformanceCalculator } from "./js/tools/performanceSimple.js";
import { wireMobileSummaryJumpButtons } from "./js/ui/mobileSummary.js";
import { renderSiteShell } from "./js/ui/react/SiteShell.jsx";
import { initScenarioStorage } from "./js/ui/scenarioStorage.js";
import { initTooltips } from "./js/ui/tooltips.js";
import { initToolMenu } from "./js/ui/toolMenu.js";

const initApp = () => {
  renderSiteShell();
  initToolMenu();
  initTooltips();
  wireMobileSummaryJumpButtons();
  initNetProceedsCalculator();
  initSimplePerformanceCalculator();
  initPerformanceCalculator();
  initSimpleFundCalculator();
  initScenarioStorage();
};

initApp();
