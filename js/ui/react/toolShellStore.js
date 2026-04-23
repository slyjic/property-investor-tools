import { getToolByHash, getToolByPanelId } from "../../config/toolCatalog.js";

const listeners = new Set();

let snapshot = {
  activePanelId: "",
  isHome: true,
};

const notify = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export const subscribeToolShell = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToolShellSnapshot = () => snapshot;

export const setToolShellView = ({ activePanelId = "", isHome = !activePanelId } = {}) => {
  const nextPanelId = getToolByPanelId(activePanelId)?.panelId || "";
  const nextSnapshot = {
    activePanelId: nextPanelId,
    isHome: Boolean(isHome || !nextPanelId),
  };

  if (snapshot.activePanelId === nextSnapshot.activePanelId && snapshot.isHome === nextSnapshot.isHome) {
    return;
  }

  snapshot = nextSnapshot;
  notify();
};

export const syncToolShellViewFromLocation = () => {
  const rawHash = String(window.location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  const tool = getToolByHash(rawHash);
  setToolShellView({
    activePanelId: tool?.panelId || "",
    isHome: !tool,
  });
};
