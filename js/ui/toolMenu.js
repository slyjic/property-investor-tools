export const initToolMenu = () => {
  const tabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-tool-panel]"));
  const mobileSelect = document.getElementById("toolMenuSelect");

  if (!tabs.length || !panels.length) {
    return;
  }

  const panelIdToHash = {
    "tool-net-proceeds": "net-proceeds",
    "tool-simple-performance": "simple-performance",
    "tool-investment-income": "advanced-performance",
    "tool-simple-fund": "simple-fund",
  };

  const hashToPanelId = {
    "net-proceeds": "tool-net-proceeds",
    "simple-performance": "tool-simple-performance",
    "advanced-performance": "tool-investment-income",
    "simple-fund": "tool-simple-fund",
  };

  const getEnabledTabs = () => tabs.filter((tab) => !tab.disabled);

  const resolvePanelIdFromHash = () => {
    const rawHash = String(window.location.hash || "")
      .replace(/^#/, "")
      .trim()
      .toLowerCase();

    if (!rawHash) {
      return "";
    }

    if (panels.some((panel) => panel.id === rawHash)) {
      return rawHash;
    }

    return hashToPanelId[rawHash] || "";
  };

  const syncMobileSelect = (panelId) => {
    if (!mobileSelect) {
      return;
    }

    const option = Array.from(mobileSelect.options).find((item) => item.value === panelId && !item.disabled);
    if (!option) {
      return;
    }
    mobileSelect.value = panelId;
  };

  const syncHash = (panelId) => {
    const nextHash = panelIdToHash[panelId] || panelId;
    if (!nextHash) {
      return;
    }
    if (window.location.hash === `#${nextHash}`) {
      return;
    }
    window.history.replaceState(null, "", `#${nextHash}`);
  };

  const activatePanel = (panelId, { updateHash = true, focusTab = false } = {}) => {
    const targetTab = tabs.find((tab) => tab.dataset.toolTab === panelId);
    if (!targetTab || targetTab.disabled) {
      return false;
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

    syncMobileSelect(panelId);
    if (updateHash) {
      syncHash(panelId);
    }
    if (focusTab) {
      targetTab.focus();
    }
    return true;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.disabled) {
        return;
      }
      const targetPanel = tab.dataset.toolTab;
      if (!targetPanel) {
        return;
      }
      activatePanel(targetPanel, { updateHash: true, focusTab: false });
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
      nextTab.focus();
    });
  });

  if (mobileSelect) {
    mobileSelect.addEventListener("change", () => {
      const targetPanel = mobileSelect.value;
      if (!targetPanel) {
        return;
      }
      const option = Array.from(mobileSelect.options).find((item) => item.value === targetPanel);
      if (!option || option.disabled) {
        return;
      }
      activatePanel(targetPanel, { updateHash: true, focusTab: false });
    });
  }

  window.addEventListener("hashchange", () => {
    const hashPanelId = resolvePanelIdFromHash();
    if (!hashPanelId) {
      return;
    }
    activatePanel(hashPanelId, { updateHash: false, focusTab: false });
  });

  const enabledTabs = getEnabledTabs();
  const defaultTab =
    enabledTabs.find((tab) => tab.classList.contains("is-active")) || enabledTabs[0] || tabs[0];
  const hashPanelId = resolvePanelIdFromHash();

  if (hashPanelId && activatePanel(hashPanelId, { updateHash: false, focusTab: false })) {
    return;
  }

  if (defaultTab && defaultTab.dataset.toolTab) {
    activatePanel(defaultTab.dataset.toolTab, { updateHash: true, focusTab: false });
  }
};
