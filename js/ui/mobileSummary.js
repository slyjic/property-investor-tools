export const wireMobileSummaryJumpButtons = () => {
  const jumpButtons = Array.from(document.querySelectorAll("[data-scroll-target]"));
  jumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      if (!targetId) {
        return;
      }
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
};
