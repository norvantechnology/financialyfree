/** Safe Indian locale number formatting - never throws on null/undefined. */
export function fmtNum(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || value === '') return '-';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('en-IN', options);
}

export function fmtInr(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  const formatted = fmtNum(value, options);
  return formatted === '-' ? '-' : `₹${formatted}`;
}
