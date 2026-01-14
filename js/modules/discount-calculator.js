import { formatCurrency } from "../utils/formatters.js";
import { clampNonNegative, sanitizeNonNegative, toNumber } from "../utils/numbers.js";

export function initDiscountCalculator() {
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
    summaryTotalDiscountHero.textContent = formatCurrency(values.totalDiscount);
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
    )} | Desc ${formatCurrency(values.totalDiscount)} | Final ${formatCurrency(
      values.finalValue
    )}`;
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
