import { formatCurrency, formatPercent } from "../utils/formatters.js";
import { clampNonNegative, sanitizeNonNegative, toNumber } from "../utils/numbers.js";
import {
  daysBetween,
  localDateInputValue,
  parseDateInput,
} from "../utils/dates.js";
import { updateMaybe } from "../utils/dom.js";

export function initInterestCalculator() {
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

  if (
    !monthlyRateInput ||
    !penaltyRateInput ||
    !baseDaysInput ||
    !defaultCalcDateInput ||
    !addRowButton ||
    !resetRowsButton ||
    !calcBody
  ) {
    return;
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
      <td>
        <button class="remove-btn" type="button" data-action="remove">
          Remover
        </button>
      </td>
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
    const monthlyRate = clampNonNegative(toNumber(monthlyRateInput.value));
    const penaltyRate = clampNonNegative(toNumber(penaltyRateInput.value));
    const baseDays = clampNonNegative(
      Math.floor(toNumber(baseDaysInput.value))
    );
    const dailyRate = baseDays > 0 ? monthlyRate / baseDays : 0;

    const totals = {
      principal: 0,
      interest: 0,
      penalty: 0,
      total: 0,
    };
    const rowTotals = [];

    const rows = Array.from(calcBody.querySelectorAll("tr"));
    rows.forEach((row) => {
      const amount = clampNonNegative(
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
      row.querySelector('[data-out="total"]').textContent =
        formatCurrency(total);

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
      sanitizeNonNegative(event.target);
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
    input.addEventListener("input", () => {
      sanitizeNonNegative(input);
      recalcAll();
    });
  });

  for (let i = 0; i < 3; i += 1) {
    addRow();
  }
  recalcAll();
}
