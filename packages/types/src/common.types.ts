// ── Common utility types ────────────────────────────────────────────────

export type UUID = string;

export type ISO8601 = string;

export type INRAmount = number; // Always stored in paise (integer) or rupees (float) — annotated per field

export type Percentage = number; // 0–100 (not 0–1 decimal form)

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type DataState = 'loading' | 'success' | 'error' | 'empty' | 'stale';

export interface SourcedValue {
  value: number;
  sourceId: string;
  sourceDate: ISO8601;
  lastUpdated: ISO8601;
  isEstimate: boolean;
}

/** Formats a number in Indian lakh/crore style */
export function formatINR(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
