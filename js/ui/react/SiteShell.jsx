import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { PUBLIC_TOOL_COUNT, PUBLIC_TOOLS, getToolByPanelId } from "../../config/toolCatalog.js";
import { exportPortfolioSummary } from "../portfolioSummary.js";
import { getToolShellSnapshot, subscribeToolShell, syncToolShellViewFromLocation } from "./toolShellStore.js";

const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const roots = new Map();

const getCurrentTool = (activePanelId) => getToolByPanelId(activePanelId) || PUBLIC_TOOLS[0];

const useToolShell = () => useSyncExternalStore(subscribeToolShell, getToolShellSnapshot);

const ToolCardVisual = ({ tool }) => {
  const visualClassName = `tool-card-visual ${tool.visual.variantClass}`;

  if (tool.visual.type === "orb") {
    return (
      <div className={visualClassName} aria-hidden="true">
        <span className="tool-card-orb"></span>
      </div>
    );
  }

  return (
    <div className={visualClassName} aria-hidden="true">
      {tool.visual.items.map((item) => (
        <span key={item.label} className={item.className}>
          {item.label}
        </span>
      ))}
    </div>
  );
};

const HeaderShell = () => {
  const { activePanelId } = useToolShell();
  const activeTool = getCurrentTool(activePanelId);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState({ message: "", tone: "" });
  const statusTimerRef = useRef(null);
  const navRef = useRef(null);
  const modalRef = useRef(null);
  const modalPanelRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  const closeNav = () => {
    flushSync(() => {
      setIsNavOpen(false);
    });
  };

  const setPdfStatus = (message, tone = "") => {
    flushSync(() => {
      setStatus({ message, tone });
    });

    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    if (message) {
      statusTimerRef.current = window.setTimeout(() => {
        setStatus({ message: "", tone: "" });
        statusTimerRef.current = null;
      }, 5200);
    }
  };

  const closeModal = () => {
    flushSync(() => {
      setIsModalOpen(false);
    });
  };

  const handleExportConfirm = () => {
    closeModal();
    exportPortfolioSummary(setPdfStatus);
  };

  useEffect(() => {
    document.title = activePanelId
      ? `${activeTool.title} | Property Investor Tools`
      : "Property Investor Tools";
  }, [activePanelId, activeTool.title]);

  useEffect(() => {
    if (!isNavOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (navRef.current?.contains(event.target)) {
        return;
      }
      closeNav();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    };

    document.addEventListener("click", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNavOpen]);

  useEffect(() => {
    document.body.classList.toggle("has-site-modal-open", isModalOpen);

    if (!isModalOpen) {
      if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === "function") {
        window.requestAnimationFrame(() => {
          lastFocusedElementRef.current.focus();
        });
      }
      return () => {
        document.body.classList.remove("has-site-modal-open");
      };
    }

    lastFocusedElementRef.current = document.activeElement;
    window.requestAnimationFrame(() => {
      confirmButtonRef.current?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        modalRef.current?.querySelectorAll(MODAL_FOCUSABLE_SELECTOR) || [],
      ).filter(
        (element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true",
      );

      if (!focusableElements.length) {
        event.preventDefault();
        modalPanelRef.current?.focus?.();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const isFocusInsideModal = modalRef.current?.contains(activeElement);

      if (event.shiftKey) {
        if (!isFocusInsideModal || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!isFocusInsideModal || activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("has-site-modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(
    () => () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }
    },
    [],
  );

  return (
    <>
      <div className="site-nav-shell">
        <div className="site-nav">
          <a className="site-brand" href="#home" aria-label="Property Investor Tools home">
            <span className="site-brand-mark" aria-hidden="true">
              ✦
            </span>
            <span className="site-brand-text">Investor Tools</span>
          </a>
          <div className="site-nav-actions">
            <button
              className="button-secondary site-nav-export"
              id="downloadPortfolioSummaryPdf"
              type="button"
              onClick={() => {
                flushSync(() => {
                  setIsModalOpen(true);
                });
              }}
            >
              Export Summary
            </button>
            <details className="site-nav-menu" open={isNavOpen} ref={navRef}>
              <summary
                className="site-nav-menu-trigger"
                aria-label="Open site menu"
                aria-expanded={isNavOpen ? "true" : "false"}
                title="Open site menu"
                onClick={(event) => {
                  event.preventDefault();
                  flushSync(() => {
                    setIsNavOpen((currentValue) => !currentValue);
                  });
                }}
              >
                <span className="site-nav-menu-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                    <path d="M3 5h10M3 8h10M3 11h10" />
                  </svg>
                </span>
                <span className="visually-hidden">Open site menu</span>
              </summary>
              <div className="site-nav-menu-list">
                <button className="site-nav-menu-btn" type="button" data-tool-home onClick={closeNav}>
                  Tool Library
                </button>
                {PUBLIC_TOOLS.map((tool) => (
                  <button
                    key={tool.panelId}
                    className={`site-nav-menu-btn${activePanelId === tool.panelId ? " is-active" : ""}`}
                    type="button"
                    data-tool-launch={tool.panelId}
                    aria-current={activePanelId === tool.panelId ? "true" : undefined}
                    onClick={closeNav}
                  >
                    {tool.navLabel}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
        <p
          className={`pdf-status site-nav-pdf-status${status.tone === "success" ? " is-success" : ""}${
            status.tone === "error" ? " is-error" : ""
          }`}
          id="portfolioPdfStatus"
          aria-live="polite"
        >
          {status.message}
        </p>
      </div>

      <div
        className="site-export-modal"
        id="portfolioSummaryModal"
        hidden={!isModalOpen}
        aria-hidden={!isModalOpen}
        ref={modalRef}
      >
        <div className="site-export-backdrop" id="portfolioSummaryModalBackdrop" onClick={closeModal}></div>
        <section
          className="site-export-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolioSummaryModalTitle"
          aria-describedby="portfolioSummaryModalDesc"
          ref={modalPanelRef}
          tabIndex={-1}
        >
          <button
            className="site-export-close"
            id="portfolioSummaryModalClose"
            type="button"
            aria-label="Close export summary dialog"
            onClick={closeModal}
          >
            <span aria-hidden="true">×</span>
          </button>
          <p className="section-kicker">Export Summary</p>
          <h2 id="portfolioSummaryModalTitle">Ready to export your PDF summary?</h2>
          <p className="site-export-description" id="portfolioSummaryModalDesc">
            One PDF using the current values shown in your three tools.
          </p>
          <ul className="site-export-checklist" aria-label="Export summary notes">
            <li>
              <span className="site-export-check" aria-hidden="true">
                ✓
              </span>
              <span>Uses the values currently shown on screen</span>
            </li>
            <li>
              <span className="site-export-check" aria-hidden="true">
                ✓
              </span>
              <span>Downloads straight to your device</span>
            </li>
            <li>
              <span className="site-export-check" aria-hidden="true">
                ✓
              </span>
              <span>Nothing is uploaded or saved online</span>
            </li>
          </ul>
          <p className="site-export-footnote">
            Need to make changes first? Cancel, update your inputs, then export.
          </p>
          <div className="site-export-actions">
            <button
              className="button-secondary"
              id="portfolioSummaryModalCancel"
              type="button"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="button-primary"
              id="portfolioSummaryModalConfirm"
              type="button"
              onClick={handleExportConfirm}
              ref={confirmButtonRef}
            >
              Download PDF
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

const ToolHomeShell = () => {
  const { activePanelId, isHome } = useToolShell();

  return (
    <section className="tool-home" id="toolHome" aria-labelledby="tool-library-title" hidden={!isHome}>
      <div className="tool-home-head">
        <div>
          <p className="section-kicker">Tool Library</p>
          <h2 id="tool-library-title" tabIndex={-1}>
            Choose a tool.
          </h2>
          <p className="tool-home-copy">Three quick calculators for sale, performance, and income.</p>
          <div className="tool-home-signals" aria-label="Public site highlights">
            <span>3 public calculators</span>
            <span>No sign-in required</span>
            <span>PDF and JSON export</span>
          </div>
        </div>
      </div>

      <div className="tool-library-grid">
        {PUBLIC_TOOLS.map((tool, index) => {
          const isActive = activePanelId === tool.panelId;
          const isFeatured = index === 0;

          return (
            <article
              key={tool.panelId}
              className={`tool-card${isFeatured ? " is-featured" : ""}${isActive ? " is-active" : ""}`}
              data-tool-card={tool.panelId}
            >
              <ToolCardVisual tool={tool} />
              <p className="tool-card-kicker">{tool.cardKicker}</p>
              <h3>{tool.navLabel}</h3>
              <p>{tool.cardDescription}</p>
              <div className="tool-card-tags" aria-label={`${tool.navLabel} highlights`}>
                {tool.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button
                className="tool-card-cta"
                id={`launch-${tool.hash}`}
                type="button"
                data-tool-launch={tool.panelId}
                aria-current={isActive ? "true" : undefined}
              >
                Open tool
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const WorkspaceContextShell = () => {
  const { activePanelId } = useToolShell();
  const currentTool = getCurrentTool(activePanelId);
  const currentIndex = PUBLIC_TOOLS.findIndex((tool) => tool.panelId === currentTool.panelId);

  return (
    <div className="workspace-context" aria-live="polite">
      <button className="workspace-context-back" type="button" data-tool-home>
        Back to Tool Library
      </button>
      <div className="workspace-context-copy">
        <p className="workspace-context-kicker">Focused calculator</p>
        <p className="workspace-context-title" id="workspaceToolTitle" tabIndex={-1}>
          {currentTool.title}
        </p>
        <p className="workspace-context-description" id="workspaceToolDescription">
          {currentTool.description}
        </p>
      </div>
      <p className="workspace-context-meta" id="workspaceToolMeta">
        {currentIndex + 1} of {PUBLIC_TOOL_COUNT} public calculators
      </p>
    </div>
  );
};

const renderIntoRoot = (rootId, element) => {
  const container = document.getElementById(rootId);
  if (!container) {
    return;
  }

  if (!roots.has(rootId)) {
    roots.set(rootId, createRoot(container));
  }

  flushSync(() => {
    roots.get(rootId).render(element);
  });
};

export const renderSiteShell = () => {
  syncToolShellViewFromLocation();
  renderIntoRoot("siteHeaderRoot", <HeaderShell />);
  renderIntoRoot("toolHomeRoot", <ToolHomeShell />);
  renderIntoRoot("workspaceContextRoot", <WorkspaceContextShell />);
};
