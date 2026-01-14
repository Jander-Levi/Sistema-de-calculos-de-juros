const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function formatPercent(value) {
  return `${percentFormatter.format(value)}%`;
}
