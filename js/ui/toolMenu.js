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
      tab.tabIndex = isActive ? 0 : -1;
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

    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      if (currentIndex === -1) {
        return;
      }

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      const targetPanel = nextTab.dataset.toolTab;
      if (!targetPanel) {
        return;
      }

      activatePanel(targetPanel);
      nextTab.focus();
    });
  });

  const defaultTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  if (defaultTab && defaultTab.dataset.toolTab) {
    activatePanel(defaultTab.dataset.toolTab);
  }
};
