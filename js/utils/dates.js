const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDateInput(value) {
  if (!value) {
    return null;
  }
  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) {
    return null;
  }
  return Date.UTC(year, month - 1, day);
}

export function daysBetween(due, calc) {
  if (due === null || calc === null) {
    return 0;
  }
  const diff = Math.floor((calc - due) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

export function localDateInputValue(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}
