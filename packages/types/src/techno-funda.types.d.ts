import { UUID, ISO8601 } from './common.types';
export type MoodLabel = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
export interface MarketMoodDto {
    score: number;
    label: MoodLabel;
    components: {
        breadth: number;
        vix: number;
        maPositioning: number;
        fiiDiiFlow: number;
    };
    methodology: string;
    dataSource: string;
    lastUpdated: ISO8601;
    version: string;
}
export interface MasterTrackerItemDto {
    id: UUID;
    symbol: string;
    companyName: string;
    sector: string;
    roce: number;
    revenueGrowth3yr: number;
    debtEquity: number;
    qualityScore: number;
    addedAt: ISO8601;
    lastReviewedAt: ISO8601;
    methodology: string;
}
export interface PeadEventDto {
    id: UUID;
    symbol: string;
    companyName: string;
    resultDate: ISO8601;
    actualEps?: number;
    expectedEps?: number;
    surprisePct?: number;
    yoyRevenuePct?: number;
    yoyPatPct?: number;
    priceAtResult: number;
    price20dPost?: number;
    price60dPost?: number;
    drift20d?: number;
    drift60d?: number;
    methodology: string;
}
export type VehicleCategory = '2W' | '3W' | 'PV' | 'CV' | 'Tractor' | 'Other';
export interface VahanDataPointDto {
    id: UUID;
    month: string;
    category: VehicleCategory;
    manufacturer?: string;
    state?: string;
    registrations: number;
    momChange?: number;
    yoyChange?: number;
    dataSource: 'VAHAN / Government of India (parivahan.gov.in)';
    retrievedAt: ISO8601;
}
//# sourceMappingURL=techno-funda.types.d.ts.map