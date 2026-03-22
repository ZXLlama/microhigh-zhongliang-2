function normalizeMoneyValue(input: string | number): string {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new Error("金額格式不正確");
    }

    return input.toString();
  }

  return input.trim().replace(/[,NT$\s]/gi, "");
}

export function parseMoneyInputToCents(input: string | number): number {
  const normalized = normalizeMoneyValue(input);
  const matched = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!matched) {
    throw new Error(`無法解析金額: ${String(input)}`);
  }

  const sign = matched[1] === "-" ? -1 : 1;
  const integerPart = Number.parseInt(matched[2], 10);
  const fractionPart = matched[3] ? matched[3].padEnd(2, "0") : "00";
  const cents = integerPart * 100 + Number.parseInt(fractionPart, 10);

  return sign * cents;
}

export function formatMoney(cents: number, withCurrencySymbol = true): string {
  const absolute = Math.abs(cents);
  const integerPart = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const hasFraction = fraction !== 0;
  const formattedNumber = hasFraction
    ? `${integerPart.toLocaleString("zh-TW")}.${fraction
        .toString()
        .padStart(2, "0")}`
    : integerPart.toLocaleString("zh-TW");
  const prefix = withCurrencySymbol ? "NT$" : "";
  const sign = cents < 0 ? "-" : "";

  return `${sign}${prefix}${formattedNumber}`;
}

export function sumCents(values: number[]): number {
  return values.reduce((total, current) => total + current, 0);
}
