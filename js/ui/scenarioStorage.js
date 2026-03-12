import { createScenarioStorageKey } from "../shared/scenarioStorageKeys.js";

const CONTROL_SELECTOR = "input, select, textarea";
const SCHEMA_VERSION = 2;
const LAST_DATASET_PREFIX = "pit:last-dataset:";

const isScenarioUiControl = (control) => Boolean(control?.closest?.("[data-scenario-controls]"));

const controlKeyFor = (control) => {
  if (!control) {
    return "";
  }

  if (control.id) {
    return `id:${control.id}`;
  }

  if (control.name) {
    return `name:${control.name}`;
  }

  const monthIndex = control.dataset?.monthIndex;
  const monthField = control.dataset?.monthField || control.dataset?.monthFieldMobile;
  if (monthIndex && monthField) {
    return `month:${monthIndex}:${monthField}`;
  }

  return "";
};

const getControlValue = (control) => {
  if (control.type === "checkbox" || control.type === "radio") {
    return Boolean(control.checked);
  }
  return String(control.value ?? "");
};

const setControlValue = (control, value) => {
  if (control.type === "checkbox" || control.type === "radio") {
    control.checked = Boolean(value);
    return;
  }
  control.value = String(value ?? "");
};

const collectFormSnapshot = (form) => {
  const values = {};
  const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR));

  controls.forEach((control) => {
    if (isScenarioUiControl(control)) {
      return;
    }
    const key = controlKeyFor(control);
    if (!key || key in values) {
      return;
    }
    values[key] = getControlValue(control);
  });

  return values;
};

const buildControlGroups = (form) => {
  const groups = new Map();
  const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR));

  controls.forEach((control) => {
    if (isScenarioUiControl(control)) {
      return;
    }
    const key = controlKeyFor(control);
    if (!key) {
      return;
    }
    const group = groups.get(key) || [];
    group.push(control);
    groups.set(key, group);
  });

  return groups;
};

const triggerControlUpdate = (control) => {
  control.dispatchEvent(new window.Event("input", { bubbles: true }));
  control.dispatchEvent(new window.Event("change", { bubbles: true }));
};

const applyFormSnapshot = (form, values) => {
  if (!values || typeof values !== "object") {
    return;
  }

  const groupedControls = buildControlGroups(form);
  Object.entries(values).forEach(([key, value]) => {
    const controls = groupedControls.get(key);
    if (!controls || !controls.length) {
      return;
    }

    controls.forEach((control) => {
      setControlValue(control, value);
    });

    triggerControlUpdate(controls[0]);
  });
};

const parseImportedSnapshot = (rawText) => {
  const data = JSON.parse(rawText);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid file format.");
  }

  const values = data.values && typeof data.values === "object" ? data.values : data;
  if (!values || typeof values !== "object") {
    throw new Error("Missing input values.");
  }

  return {
    tool: typeof data.tool === "string" ? data.tool : "",
    datasetId: typeof data.datasetId === "string" ? data.datasetId : "",
    values,
  };
};

const createDebounced = (callback, delayMs) => {
  let timerId = null;

  return () => {
    if (timerId) {
      window.clearTimeout(timerId);
    }

    timerId = window.setTimeout(() => {
      timerId = null;
      callback();
    }, delayMs);
  };
};

const toSlug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toExportFileName = (toolId, datasetId = "") => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const datasetSegment = toSlug(datasetId);
  if (datasetSegment) {
    return `${toolId}-${datasetSegment}-scenario-${stamp}.json`;
  }
  return `${toolId}-scenario-${stamp}.json`;
};

const downloadJson = (fileName, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const wireScenarioControls = (container) => {
  const toolId = container.dataset.scenarioTool || "";
  const formId = container.dataset.scenarioForm || "";
  const datasetInputId = container.dataset.scenarioDatasetInput || "";
  const form = formId ? document.getElementById(formId) : null;
  const datasetInput = datasetInputId ? document.getElementById(datasetInputId) : null;
  if (!toolId || !form) {
    return;
  }

  const statusElement = container.querySelector("[data-scenario-status]");
  const badgeElement = container.querySelector("[data-scenario-badge]");
  const saveButton = container.querySelector("[data-scenario-action='save']");
  const loadButton = container.querySelector("[data-scenario-action='load']");
  const resetButton = container.querySelector("[data-scenario-action='reset']");
  const exportButton = container.querySelector("[data-scenario-action='export']");
  const importButton = container.querySelector("[data-scenario-action='import']");
  const importFileInput = container.querySelector("[data-scenario-action='import-file']");
  const scenarioMenu = container.querySelector("[data-scenario-menu]");

  const defaultValues = collectFormSnapshot(form);
  let statusTimerId = null;
  let isApplyingSnapshot = false;
  let activeDatasetId = datasetInput && datasetInput.value ? datasetInput.value : "";
  let hasUnsavedChanges = false;
  const lastDatasetStorageKey = `${LAST_DATASET_PREFIX}${toolId}`;

  const getDatasetLabel = (datasetId = "") => {
    if (!datasetInput) {
      return "";
    }

    const matchedOption = Array.from(datasetInput.options).find((option) => option.value === datasetId);
    return matchedOption ? String(matchedOption.textContent ?? "").trim() : datasetId;
  };

  const datasetSuffix = (datasetId = "") => {
    const label = getDatasetLabel(datasetId);
    if (!label) {
      return "";
    }
    return ` (${label})`;
  };

  const hasDatasetOption = (datasetId = "") => {
    if (!datasetInput || !datasetId) {
      return false;
    }

    return Array.from(datasetInput.options).some((option) => option.value === datasetId);
  };

  const persistLastDataset = (datasetId = "") => {
    if (!datasetId) {
      return;
    }

    try {
      window.localStorage.setItem(lastDatasetStorageKey, datasetId);
    } catch {
      // Ignore storage failures.
    }
  };

  const updateDatasetBadge = (datasetId = "") => {
    if (!badgeElement) {
      return;
    }

    const label = getDatasetLabel(datasetId);
    badgeElement.textContent = label ? `Editing: ${label}` : "";
  };

  const emitScenarioUpdate = (action, datasetId = activeDatasetId) => {
    window.dispatchEvent(
      new window.CustomEvent("pit:scenario-updated", {
        detail: {
          toolId,
          action,
          datasetId,
        },
      }),
    );
  };

  const getStorageKey = (datasetId = activeDatasetId) => createScenarioStorageKey(toolId, datasetId);

  const setStatus = (message, tone = "") => {
    if (!statusElement) {
      return;
    }

    statusElement.textContent = message;
    statusElement.classList.remove("is-success", "is-error");
    if (tone === "success") {
      statusElement.classList.add("is-success");
    } else if (tone === "error") {
      statusElement.classList.add("is-error");
    }

    if (statusTimerId) {
      window.clearTimeout(statusTimerId);
      statusTimerId = null;
    }

    if (message) {
      statusTimerId = window.setTimeout(() => {
        if (statusElement) {
          statusElement.textContent = "";
          statusElement.classList.remove("is-success", "is-error");
        }
      }, 4200);
    }
  };

  const saveToStorage = (showStatus = false, datasetId = activeDatasetId) => {
    try {
      const payload = {
        version: SCHEMA_VERSION,
        tool: toolId,
        datasetId,
        savedAt: new Date().toISOString(),
        values: collectFormSnapshot(form),
      };
      window.localStorage.setItem(getStorageKey(datasetId), JSON.stringify(payload));
      hasUnsavedChanges = false;
      persistLastDataset(datasetId);
      updateDatasetBadge(datasetId);
      emitScenarioUpdate("save", datasetId);
      if (showStatus) {
        setStatus(`Inputs saved in this browser${datasetSuffix(datasetId)}.`, "success");
      }
    } catch {
      if (showStatus) {
        setStatus("Could not save inputs on this device.", "error");
      }
    }
  };

  const loadFromStorage = (showStatus = true, datasetId = activeDatasetId) => {
    try {
      const datasetKey = getStorageKey(datasetId);
      const legacyKey = createScenarioStorageKey(toolId);
      const raw = window.localStorage.getItem(datasetKey) || window.localStorage.getItem(legacyKey);
      if (!raw) {
        if (showStatus) {
          setStatus(`No saved inputs found${datasetSuffix(datasetId)}.`, "error");
        }
        return false;
      }

      const parsed = parseImportedSnapshot(raw);
      isApplyingSnapshot = true;
      applyFormSnapshot(form, parsed.values);
      isApplyingSnapshot = false;
      hasUnsavedChanges = false;
      persistLastDataset(datasetId);
      updateDatasetBadge(datasetId);
      emitScenarioUpdate("load", datasetId);

      if (showStatus) {
        setStatus(`Saved inputs loaded${datasetSuffix(datasetId)}.`, "success");
      }
      return true;
    } catch {
      isApplyingSnapshot = false;
      if (showStatus) {
        setStatus("Saved inputs are invalid. Reset or import a new file.", "error");
      }
      return false;
    }
  };

  const resetToDefaults = () => {
    isApplyingSnapshot = true;
    applyFormSnapshot(form, defaultValues);
    isApplyingSnapshot = false;

    try {
      window.localStorage.removeItem(getStorageKey(activeDatasetId));
    } catch {
      // Ignore storage remove failures.
    }

    hasUnsavedChanges = false;
    persistLastDataset(activeDatasetId);
    updateDatasetBadge(activeDatasetId);
    emitScenarioUpdate("reset", activeDatasetId);
    setStatus(`Inputs reset to defaults${datasetSuffix(activeDatasetId)}.`, "success");
  };

  const exportSnapshot = () => {
    try {
      const payload = {
        version: SCHEMA_VERSION,
        tool: toolId,
        datasetId: activeDatasetId,
        exportedAt: new Date().toISOString(),
        values: collectFormSnapshot(form),
      };
      downloadJson(toExportFileName(toolId, activeDatasetId), payload);
      setStatus(`Scenario exported as JSON${datasetSuffix(activeDatasetId)}.`, "success");
    } catch {
      setStatus("Could not export scenario.", "error");
    }
  };

  const importSnapshotFromFile = async (file) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = parseImportedSnapshot(text);
      if (payload.tool && payload.tool !== toolId) {
        setStatus("This file is for a different calculator.", "error");
        return;
      }

      isApplyingSnapshot = true;
      applyFormSnapshot(form, payload.values);
      isApplyingSnapshot = false;
      hasUnsavedChanges = false;
      saveToStorage(false, activeDatasetId);
      emitScenarioUpdate("import", activeDatasetId);
      setStatus(`Scenario imported${datasetSuffix(activeDatasetId)}.`, "success");
    } catch {
      isApplyingSnapshot = false;
      setStatus("Invalid JSON file.", "error");
    }
  };

  const scheduleAutosave = createDebounced(() => {
    if (isApplyingSnapshot) {
      return;
    }
    saveToStorage(false, activeDatasetId);
  }, 260);

  const onAutosaveEvent = () => {
    if (isApplyingSnapshot) {
      return;
    }
    hasUnsavedChanges = true;
    scheduleAutosave();
  };

  const closeScenarioMenu = () => {
    if (scenarioMenu && scenarioMenu.open) {
      scenarioMenu.open = false;
    }
  };

  form.addEventListener("input", onAutosaveEvent);
  form.addEventListener("change", onAutosaveEvent);

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      saveToStorage(true, activeDatasetId);
      closeScenarioMenu();
    });
  }

  if (loadButton) {
    loadButton.addEventListener("click", () => {
      loadFromStorage(true, activeDatasetId);
      closeScenarioMenu();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetToDefaults();
      closeScenarioMenu();
    });
  }

  if (exportButton) {
    exportButton.addEventListener("click", () => {
      exportSnapshot();
      closeScenarioMenu();
    });
  }

  if (importButton && importFileInput) {
    importButton.addEventListener("click", () => {
      closeScenarioMenu();
      importFileInput.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", async () => {
      const [file] = Array.from(importFileInput.files || []);
      await importSnapshotFromFile(file || null);
      importFileInput.value = "";
    });
  }

  if (datasetInput) {
    try {
      const restoredDatasetId = window.localStorage.getItem(lastDatasetStorageKey);
      if (restoredDatasetId && hasDatasetOption(restoredDatasetId)) {
        datasetInput.value = restoredDatasetId;
        activeDatasetId = restoredDatasetId;
      }
    } catch {
      // Ignore storage read failures.
    }

    updateDatasetBadge(activeDatasetId);

    datasetInput.addEventListener("change", () => {
      const previousDatasetId = activeDatasetId;
      const hadUnsavedBeforeSwitch = hasUnsavedChanges;
      if (hadUnsavedBeforeSwitch) {
        saveToStorage(false, previousDatasetId);
      }

      activeDatasetId = datasetInput.value;
      persistLastDataset(activeDatasetId);
      updateDatasetBadge(activeDatasetId);

      const loaded = loadFromStorage(false, activeDatasetId);
      if (!loaded) {
        isApplyingSnapshot = true;
        applyFormSnapshot(form, defaultValues);
        isApplyingSnapshot = false;
        hasUnsavedChanges = false;
      }

      const switchMessage = loaded
        ? `Switched to ${getDatasetLabel(activeDatasetId)}. Saved inputs loaded.`
        : `Switched to ${getDatasetLabel(activeDatasetId)}. Using default inputs.`;
      setStatus(
        hadUnsavedBeforeSwitch
          ? `Unsaved edits were auto-saved before switching. ${switchMessage}`
          : switchMessage,
        "success",
      );
      emitScenarioUpdate("dataset-change", activeDatasetId);
    });
  } else {
    updateDatasetBadge(activeDatasetId);
  }

  loadFromStorage(false, activeDatasetId);
};

export const initScenarioStorage = () => {
  const containers = Array.from(document.querySelectorAll("[data-scenario-controls]"));
  containers.forEach((container) => {
    wireScenarioControls(container);
  });
};
