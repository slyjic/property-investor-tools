export const initTooltips = () => {
  const triggers = Array.from(document.querySelectorAll("[data-tooltip-trigger]"));
  if (!triggers.length) {
    return;
  }

  const getTooltip = (trigger) => {
    const tooltipId = trigger.getAttribute("aria-controls");
    return tooltipId ? document.getElementById(tooltipId) : null;
  };

  const closeTooltip = (trigger) => {
    if (!trigger) {
      return;
    }

    const tooltip = getTooltip(trigger);
    trigger.setAttribute("aria-expanded", "false");
    if (tooltip) {
      tooltip.setAttribute("aria-hidden", "true");
    }
  };

  const openTooltip = (trigger) => {
    if (!trigger) {
      return;
    }

    triggers.forEach((currentTrigger) => {
      if (currentTrigger !== trigger) {
        closeTooltip(currentTrigger);
      }
    });

    const tooltip = getTooltip(trigger);
    trigger.setAttribute("aria-expanded", "true");
    if (tooltip) {
      tooltip.setAttribute("aria-hidden", "false");
    }
  };

  const toggleTooltip = (trigger) => {
    if (trigger.getAttribute("aria-expanded") === "true") {
      closeTooltip(trigger);
      return;
    }

    openTooltip(trigger);
  };

  triggers.forEach((trigger) => {
    closeTooltip(trigger);

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleTooltip(trigger);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeTooltip(trigger);
      }
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-tooltip-trigger], .info-tip-text")) {
      return;
    }

    triggers.forEach((trigger) => {
      closeTooltip(trigger);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    triggers.forEach((trigger) => {
      closeTooltip(trigger);
    });
  });
};
