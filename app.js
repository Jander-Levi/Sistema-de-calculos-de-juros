const monthlyRateInput = document.getElementById("monthlyRate");
const penaltyRateInput = document.getElementById("penaltyRate");
const baseDaysInput = document.getElementById("baseDays");
const defaultCalcDateInput = document.getElementById("defaultCalcDate");
const addRowButton = document.getElementById("addRow");
const resetRowsButton = document.getElementById("resetRows");
const calcBody = document.getElementById("calcBody");

const summaryTotal = document.getElementById("summaryTotal");
const summaryPrincipal = document.getElementById("summaryPrincipal");
const summaryInterest = document.getElementById("summaryInterest");
const summaryPenalty = document.getElementById("summaryPenalty");
const partialSum = document.getElementById("partialSum");
const totalSum = document.getElementById("totalSum");
const firstDiff = document.getElementById("firstDiff");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toNumber(value) {
  if (typeof value !== "string") {
    return 0;
  }
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPositive(value) {
  return value > 0 ? value : 0;
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatPercent(value) {
  return `${percentFormatter.format(value)}%`;
}

function parseDateInput(value) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return Date.UTC(year, month - 1, day);
}

function daysBetween(due, calc) {
  if (due === null || calc === null) {
    return 0;
  }
  const diff = Math.floor((calc - due) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

function localDateInputValue(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function updateMaybe(element, value) {
  if (value === null) {
    element.textContent = "--";
    element.classList.add("muted");
    return;
  }
  element.textContent = formatCurrency(value);
  element.classList.remove("muted");
}

function syncRowIndices() {
  const rows = Array.from(calcBody.querySelectorAll("tr"));
  rows.forEach((row, index) => {
    const indexCell = row.querySelector(".index");
    if (indexCell) {
      indexCell.textContent = String(index + 1);
    }
  });
}

function addRow(prefill = {}) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="index"></td>
    <td><input data-field="amount" type="number" step="0.01" min="0" /></td>
    <td><input data-field="due" type="date" /></td>
    <td><input data-field="calc" type="date" /></td>
    <td class="numeric" data-out="days">0</td>
    <td class="numeric" data-out="dailyRate">0%</td>
    <td class="numeric" data-out="interest">R$ 0,00</td>
    <td class="numeric" data-out="penalty">R$ 0,00</td>
    <td class="numeric" data-out="total">R$ 0,00</td>
    <td><button class="remove-btn" type="button" data-action="remove">Remover</button></td>
  `;

  const amountInput = row.querySelector('[data-field="amount"]');
  const dueInput = row.querySelector('[data-field="due"]');
  const calcInput = row.querySelector('[data-field="calc"]');

  if (amountInput) {
    amountInput.value = prefill.amount ?? "";
  }
  if (dueInput) {
    dueInput.value = prefill.due ?? "";
  }
  if (calcInput) {
    calcInput.value = prefill.calc ?? defaultCalcDateInput.value ?? "";
  }

  calcBody.appendChild(row);
  syncRowIndices();
}

function recalcAll() {
  const monthlyRate = clampPositive(toNumber(monthlyRateInput.value));
  const penaltyRate = clampPositive(toNumber(penaltyRateInput.value));
  const baseDays = clampPositive(Math.floor(toNumber(baseDaysInput.value)));
  const dailyRate = baseDays > 0 ? monthlyRate / baseDays : 0;

  let totals = {
    principal: 0,
    interest: 0,
    penalty: 0,
    total: 0,
  };
  const rowTotals = [];

  const rows = Array.from(calcBody.querySelectorAll("tr"));
  rows.forEach((row) => {
    const amount = clampPositive(
      toNumber(row.querySelector('[data-field="amount"]').value)
    );
    const due = parseDateInput(row.querySelector('[data-field="due"]').value);
    const calc = parseDateInput(row.querySelector('[data-field="calc"]').value);
    const days = daysBetween(due, calc);
    const interest = amount * (dailyRate / 100) * days;
    const penalty = days > 0 ? amount * (penaltyRate / 100) : 0;
    const total = amount + interest + penalty;

    row.querySelector('[data-out="days"]').textContent = String(days);
    row.querySelector('[data-out="dailyRate"]').textContent =
      formatPercent(dailyRate);
    row.querySelector('[data-out="interest"]').textContent =
      formatCurrency(interest);
    row.querySelector('[data-out="penalty"]').textContent =
      formatCurrency(penalty);
    row.querySelector('[data-out="total"]').textContent = formatCurrency(total);

    totals.principal += amount;
    totals.interest += interest;
    totals.penalty += penalty;
    totals.total += total;
    rowTotals.push({ amount, total });
  });

  summaryPrincipal.textContent = formatCurrency(totals.principal);
  summaryInterest.textContent = formatCurrency(totals.interest);
  summaryPenalty.textContent = formatCurrency(totals.penalty);
  summaryTotal.textContent = formatCurrency(totals.total);
  totalSum.textContent = formatCurrency(totals.total);

  const partialValue =
    rowTotals.length >= 2 ? rowTotals[0].total + rowTotals[1].total : null;
  updateMaybe(partialSum, partialValue);

  const firstDiffValue =
    rowTotals.length >= 1 ? rowTotals[0].amount - rowTotals[0].total : null;
  updateMaybe(firstDiff, firstDiffValue);
}

defaultCalcDateInput.value = localDateInputValue(new Date());

addRowButton.addEventListener("click", () => {
  addRow();
  recalcAll();
});

resetRowsButton.addEventListener("click", () => {
  calcBody.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    addRow();
  }
  recalcAll();
});

calcBody.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement) {
    recalcAll();
  }
});

calcBody.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="remove"]');
  if (!button) {
    return;
  }
  const row = button.closest("tr");
  if (row) {
    row.remove();
    syncRowIndices();
    recalcAll();
  }
});

[monthlyRateInput, penaltyRateInput, baseDaysInput].forEach((input) => {
  input.addEventListener("input", recalcAll);
});

for (let i = 0; i < 3; i += 1) {
  addRow();
}
recalcAll();
