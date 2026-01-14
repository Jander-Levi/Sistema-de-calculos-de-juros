export function toNumber(value) {
  if (typeof value !== "string") {
    return 0;
  }
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clampNonNegative(value) {
  return value < 0 ? 0 : value;
}

export function sanitizeNonNegative(input) {
  if (!input || input.type !== "number" || input.value.trim() === "") {
    return;
  }
  const parsed = toNumber(input.value);
  if (parsed < 0) {
    input.value = "0";
  }
}
