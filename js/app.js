(() => {
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const percentFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });

  function formatCurrency(value) {
    return currencyFormatter.format(value);
  }

  function formatPercent(value) {
    return `${percentFormatter.format(value)}%`;
  }

  function toNumber(value) {
    if (typeof value !== "string") {
      return 0;
    }
    const normalized = value.replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clampNonNegative(value) {
    return value < 0 ? 0 : value;
  }

  function sanitizeNonNegative(input) {
    if (!input || input.type !== "number" || input.value.trim() === "") {
      return;
    }
    const parsed = toNumber(input.value);
    if (parsed < 0) {
      input.value = "0";
    }
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function parseDateInput(value) {
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

  function initTabs() {
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

  function initInterestCalculator() {
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
        const due = parseDateInput(
          row.querySelector('[data-field="due"]').value
        );
        const calc = parseDateInput(
          row.querySelector('[data-field="calc"]').value
        );
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

  function initDiscountCalculator() {
    const monthlyValueInput = document.getElementById("monthlyValue");
    const discountBaseDaysInput = document.getElementById("discountBaseDays");
    const hoursPerDayInput = document.getElementById("hoursPerDay");
    const dayQtyInput = document.getElementById("dayQty");
    const hourQtyInput = document.getElementById("hourQty");
    const minuteQtyInput = document.getElementById("minuteQty");

    const dayDiscountOutput = document.getElementById("dayDiscount");
    const hourDiscountOutput = document.getElementById("hourDiscount");

    const summaryMonthlyHero = document.getElementById("summaryMonthlyHero");
    const summaryTotalDiscountHero = document.getElementById(
      "summaryTotalDiscountHero"
    );
    const summaryFinalHero = document.getElementById("summaryFinalHero");

    const summaryMonthly = document.getElementById("summaryMonthly");
    const summaryDayDiscount = document.getElementById("summaryDayDiscount");
    const summaryHourDiscount = document.getElementById("summaryHourDiscount");
    const summaryTotalDiscount = document.getElementById("summaryTotalDiscount");
    const summaryFinal = document.getElementById("summaryFinal");

    const saveCalcButton = document.getElementById("saveCalc");
    const resetCalcButton = document.getElementById("resetCalc");
    const historyList = document.getElementById("historyList");

    if (
      !monthlyValueInput ||
      !discountBaseDaysInput ||
      !hoursPerDayInput ||
      !dayQtyInput ||
      !hourQtyInput ||
      !minuteQtyInput
    ) {
      return;
    }

    const readNumber = (input) => clampNonNegative(toNumber(input.value));

    const calculateValues = () => {
      const monthlyValue = readNumber(monthlyValueInput);
      const baseDays = readNumber(discountBaseDaysInput);
      const hoursPerDay = readNumber(hoursPerDayInput);
      const qtyDays = readNumber(dayQtyInput);
      const qtyHours = readNumber(hourQtyInput);
      const qtyMinutes = readNumber(minuteQtyInput);

      const valueDay = baseDays > 0 ? monthlyValue / baseDays : 0;
      const discountDays = valueDay * qtyDays;
      const totalHours = qtyHours + qtyMinutes / 60;
      const valueHour =
        baseDays > 0 && hoursPerDay > 0
          ? monthlyValue / baseDays / hoursPerDay
          : 0;
      const discountHours = valueHour * totalHours;
      const totalDiscount = discountDays + discountHours;
      const finalValue = monthlyValue - totalDiscount;

      return {
        monthlyValue,
        discountDays,
        discountHours,
        totalDiscount,
        finalValue,
      };
    };

    const updateOutputs = (values) => {
      dayDiscountOutput.textContent = formatCurrency(values.discountDays);
      hourDiscountOutput.textContent = formatCurrency(values.discountHours);

      summaryMonthlyHero.textContent = formatCurrency(values.monthlyValue);
      summaryTotalDiscountHero.textContent = formatCurrency(
        values.totalDiscount
      );
      summaryFinalHero.textContent = formatCurrency(values.finalValue);

      summaryMonthly.textContent = formatCurrency(values.monthlyValue);
      summaryDayDiscount.textContent = formatCurrency(values.discountDays);
      summaryHourDiscount.textContent = formatCurrency(values.discountHours);
      summaryTotalDiscount.textContent = formatCurrency(values.totalDiscount);
      summaryFinal.textContent = formatCurrency(values.finalValue);
    };

    const recalc = () => {
      const values = calculateValues();
      updateOutputs(values);
    };

    const removeHistoryEmpty = () => {
      if (!historyList) {
        return;
      }
      const emptyItem = historyList.querySelector(".history-empty");
      if (emptyItem) {
        emptyItem.remove();
      }
    };

    const saveHistory = (values) => {
      if (!historyList) {
        return;
      }
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const time = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const item = document.createElement("li");
      item.className = "history-item";
      item.textContent = `${date} ${time} | Mensal ${formatCurrency(
        values.monthlyValue
      )} | Desc ${formatCurrency(
        values.totalDiscount
      )} | Final ${formatCurrency(values.finalValue)}`;
      historyList.appendChild(item);
      removeHistoryEmpty();
    };

    const resetForm = () => {
      monthlyValueInput.value = "";
      discountBaseDaysInput.value = "30";
      hoursPerDayInput.value = "24";
      dayQtyInput.value = "0";
      hourQtyInput.value = "0";
      minuteQtyInput.value = "0";
      recalc();
    };

    [
      monthlyValueInput,
      discountBaseDaysInput,
      hoursPerDayInput,
      dayQtyInput,
      hourQtyInput,
      minuteQtyInput,
    ]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener("input", () => {
          sanitizeNonNegative(input);
          recalc();
        });
      });

    if (saveCalcButton) {
      saveCalcButton.addEventListener("click", () => {
        const values = calculateValues();
        saveHistory(values);
      });
    }

    if (resetCalcButton) {
      resetCalcButton.addEventListener("click", resetForm);
    }

    recalc();
  }

  const start = () => {
    initTabs();
    initInterestCalculator();
    initDiscountCalculator();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
