import { formatCurrency } from "./formatters.js";

export function updateMaybe(element, value) {
  if (!element) {
    return;
  }
  if (value === null) {
    element.textContent = "--";
    element.classList.add("muted");
    return;
  }
  element.textContent = formatCurrency(value);
  element.classList.remove("muted");
}
