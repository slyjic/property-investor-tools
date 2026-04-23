export const PUBLIC_TOOLS = [
  {
    panelId: "tool-net-proceeds",
    hash: "net-proceeds",
    navLabel: "Net Proceeds",
    title: "Net Proceeds Calculator",
    description: "Estimate cash left after costs, CGT, and loan payout.",
    cardDescription: "Estimate cash left after costs, CGT, and loan payout.",
    cardKicker: "Free calculator",
    highlights: ["Ownership aware", "CGT estimate", "PDF report"],
    tags: ["Settlement", "Ownership", "PDF"],
    visual: {
      variantClass: "tool-card-visual-net",
      type: "badges",
      items: [
        { label: "Sale", className: "tool-card-badge tool-card-badge-positive" },
        { label: "CGT", className: "tool-card-badge tool-card-badge-negative" },
      ],
    },
  },
  {
    panelId: "tool-simple-performance",
    hash: "simple-performance",
    navLabel: "Simple Performance",
    title: "Simple Performance Calculator",
    description: "Enter one year of totals for a quick income and health snapshot.",
    cardDescription: "Enter one year of totals for a fast health and yield snapshot.",
    cardKicker: "Free calculator",
    highlights: ["Annual snapshot", "No uploads", "Health view"],
    tags: ["Annual", "Health", "Yield"],
    visual: {
      variantClass: "tool-card-visual-performance",
      type: "orb",
    },
  },
  {
    panelId: "tool-simple-fund",
    hash: "simple-fund",
    navLabel: "Simple Fund",
    title: "Simple Investment Fund Calculator",
    description: "Estimate 12 months of income from a capital-stable fund.",
    cardDescription: "Project 12 months of income from a capital-stable fund.",
    cardKicker: "Free calculator",
    highlights: ["Income focused", "12-month schedule", "Capital preserved"],
    tags: ["Income", "12-month schedule", "Capital stable"],
    visual: {
      variantClass: "tool-card-visual-fund",
      type: "pills",
      items: [
        { label: "Income", className: "tool-card-pill" },
        { label: "12 months", className: "tool-card-pill" },
        { label: "Rate linked", className: "tool-card-pill" },
      ],
    },
  },
];

export const PUBLIC_TOOL_COUNT = PUBLIC_TOOLS.length;

export const PANEL_ID_TO_HASH = Object.freeze(
  Object.fromEntries(PUBLIC_TOOLS.map((tool) => [tool.panelId, tool.hash])),
);

export const HASH_TO_PANEL_ID = Object.freeze(
  Object.fromEntries(PUBLIC_TOOLS.map((tool) => [tool.hash, tool.panelId])),
);

export const getToolByPanelId = (panelId = "") =>
  PUBLIC_TOOLS.find((tool) => tool.panelId === panelId) || null;

export const getToolByHash = (hash = "") => PUBLIC_TOOLS.find((tool) => tool.hash === hash) || null;
