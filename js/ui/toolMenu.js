import { HASH_TO_PANEL_ID, PANEL_ID_TO_HASH, PUBLIC_TOOLS, getToolByPanelId } from "../config/toolCatalog.js";
import { setToolShellView } from "./react/toolShellStore.js";

export const initToolMenu = () => {
  const tabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-tool-panel]"));
  const mobileSelect = document.getElementById("toolMenuSelect");
  const launchButtons = Array.from(document.querySelectorAll("[data-tool-launch]"));
  const homeButtons = Array.from(document.querySelectorAll("[data-tool-home]"));
  const homeView = document.getElementById("toolHome");
  const workspace = document.getElementById("toolWorkspace");
  const homeTitle = document.getElementById("tool-library-title");
  const workspaceTitle = document.getElementById("workspaceToolTitle");

  if (!tabs.length || !panels.length) {
    return;
  }

  const getEnabledTabs = () => tabs.filter((tab) => !tab.disabled);

  const resolvePanelIdFromHash = () => {
    const rawHash = String(window.location.hash || "")
      .replace(/^#/, "")
      .trim()
      .toLowerCase();

    if (!rawHash) {
      return "";
    }

    return HASH_TO_PANEL_ID[rawHash] || "";
  };

  const focusElement = (element) => {
    if (!element || typeof element.focus !== "function") {
      return;
    }

    window.requestAnimationFrame(() => {
      element.focus();
    });
  };

  const closeAllScenarioMenus = () => {
    document.querySelectorAll("[data-scenario-menu][open]").forEach((menu) => {
      menu.open = false;
    });
  };

  const showHome = ({ updateHash = true, focusHeading = false } = {}) => {
    if (homeView) {
      homeView.hidden = false;
    }
    if (workspace) {
      workspace.hidden = true;
    }

    closeAllScenarioMenus();
    setToolShellView({
      activePanelId: "",
      isHome: true,
    });

    if (updateHash && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    document.title = "Property Investor Tools";

    if (focusHeading) {
      focusElement(homeTitle);
    }
  };

  const syncMobileSelect = (panelId) => {
    if (!mobileSelect) {
      return;
    }

    const option = Array.from(mobileSelect.options).find((item) => item.value === panelId && !item.disabled);
    if (option) {
      mobileSelect.value = panelId;
    }
  };

  const syncHash = (panelId) => {
    const nextHash = PANEL_ID_TO_HASH[panelId] || "";
    if (!nextHash || window.location.hash === `#${nextHash}`) {
      return;
    }

    window.history.replaceState(null, "", `#${nextHash}`);
  };

  const activatePanel = (panelId, { updateHash = true, focusTab = false, focusWorkspace = false } = {}) => {
    const targetTab = tabs.find((tab) => tab.dataset.toolTab === panelId);
    if (!targetTab || targetTab.disabled) {
      return false;
    }

    if (homeView) {
      homeView.hidden = true;
    }
    if (workspace) {
      workspace.hidden = false;
    }

    tabs.forEach((tab) => {
      const isActive = tab.dataset.toolTab === panelId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    closeAllScenarioMenus();
    setToolShellView({
      activePanelId: panelId,
      isHome: false,
    });
    syncMobileSelect(panelId);

    if (updateHash) {
      syncHash(panelId);
    }

    document.title = `${getToolByPanelId(panelId)?.title || "Property Investor Tools"} | Property Investor Tools`;

    if (focusTab) {
      targetTab.focus();
    } else if (focusWorkspace) {
      focusElement(workspaceTitle);
    }

    return true;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetPanel = tab.dataset.toolTab;
      if (!targetPanel || tab.disabled) {
        return;
      }

      activatePanel(targetPanel, { updateHash: true });
    });

    tab.addEventListener("keydown", (event) => {
      const enabledTabs = getEnabledTabs();
      const currentIndex = enabledTabs.indexOf(tab);
      if (currentIndex === -1) {
        return;
      }

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % enabledTabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = enabledTabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextTab = enabledTabs[nextIndex];
      const targetPanel = nextTab.dataset.toolTab;
      if (!targetPanel) {
        return;
      }

      activatePanel(targetPanel, { updateHash: true, focusTab: true });
    });
  });

  launchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetPanel = button.dataset.toolLaunch;
      if (!targetPanel) {
        return;
      }

      activatePanel(targetPanel, { updateHash: true, focusWorkspace: true });
      workspace?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });

  homeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showHome({ updateHash: true, focusHeading: true });
      homeView?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });

  mobileSelect?.addEventListener("change", () => {
    const targetPanel = mobileSelect.value;
    const option = Array.from(mobileSelect.options).find((item) => item.value === targetPanel);
    if (!targetPanel || !option || option.disabled) {
      return;
    }

    activatePanel(targetPanel, { updateHash: true });
  });

  window.addEventListener("hashchange", () => {
    const hashPanelId = resolvePanelIdFromHash();
    if (!hashPanelId) {
      showHome({ updateHash: false });
      return;
    }

    if (!activatePanel(hashPanelId, { updateHash: false })) {
      showHome({ updateHash: false });
    }
  });

  const enabledTabs = getEnabledTabs();
  const defaultTab =
    enabledTabs.find((tab) => tab.classList.contains("is-active")) || enabledTabs[0] || tabs[0];
  const hashPanelId = resolvePanelIdFromHash();

  if (hashPanelId && activatePanel(hashPanelId, { updateHash: false })) {
    return;
  }

  if (
    defaultTab?.dataset.toolTab &&
    PUBLIC_TOOLS.some((tool) => tool.panelId === defaultTab.dataset.toolTab)
  ) {
    tabs.forEach((tab) => {
      const isActive = tab === defaultTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
    });
  }

  showHome({ updateHash: false });
};
