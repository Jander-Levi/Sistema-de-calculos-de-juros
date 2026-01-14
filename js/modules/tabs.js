export function initTabs() {
  const tabButtons = Array.from(
    document.querySelectorAll('[data-tab-target][role="tab"]')
  );
  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const tabTriggers = Array.from(document.querySelectorAll("[data-tab-open]"));

  if (!tabButtons.length || !tabPanels.length) {
    return;
  }

  const setActiveTab = (target) => {
    if (!target) {
      return;
    }

    tabButtons.forEach((button) => {
      const isActive = button.dataset.tabTarget === target;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    tabPanels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === target;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  };

  const initialTarget =
    tabButtons.find((button) => button.classList.contains("is-active"))
      ?.dataset.tabTarget || tabButtons[0].dataset.tabTarget;

  setActiveTab(initialTarget);

  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(button.dataset.tabTarget);
    });
  });

  tabTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(trigger.dataset.tabOpen);
    });
  });
}
