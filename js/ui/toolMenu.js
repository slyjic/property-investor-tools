export const initToolMenu = () => {
  const tabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-tool-panel]"));

  if (!tabs.length || !panels.length) {
    return;
  }

  const activatePanel = (panelId) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.toolTab === panelId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetPanel = tab.dataset.toolTab;
      if (!targetPanel) {
        return;
      }
      activatePanel(targetPanel);
    });
  });

  const defaultTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  if (defaultTab && defaultTab.dataset.toolTab) {
    activatePanel(defaultTab.dataset.toolTab);
  }
};
