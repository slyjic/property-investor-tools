export const SCENARIO_STORAGE_PREFIX = "pit:scenario:";

export const createScenarioStorageKey = (toolId, datasetId = "") => {
  const safeToolId = String(toolId ?? "").trim();
  if (!safeToolId) {
    return "";
  }

  const safeDatasetId = String(datasetId ?? "").trim();
  if (!safeDatasetId) {
    return `${SCENARIO_STORAGE_PREFIX}${safeToolId}`;
  }

  return `${SCENARIO_STORAGE_PREFIX}${safeToolId}:${safeDatasetId}`;
};
