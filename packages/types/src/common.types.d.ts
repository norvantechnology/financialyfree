export type UUID = string;
export type ISO8601 = string;
export type INRAmount = number;
export type Percentage = number;
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
export declare function formatINR(amount: number): string;
//# sourceMappingURL=common.types.d.ts.map