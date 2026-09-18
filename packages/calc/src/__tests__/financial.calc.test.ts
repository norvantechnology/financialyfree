import {
  calculatePE,
  calculatePB,
  calculateROE,
  calculateROCE,
  calculateROA,
  calculateDebtEquity,
  calculateEV,
  calculateEVEBITDA,
  calculateEVSales,
  calculateFCF,
  calculateNetDebtEBITDA,
  calculateInterestCoverage,
  calculatePEG,
  calculateDCF,
  calculateReverseDCF,
  calculateScenarioBlend,
  calculateBuybackReturn,
  calculateBuybackPremium,
  calculateGrahamValuation,
  calculatePeterLynchFairValue,
  calculateDividendDiscountModel,
  calculateAssetBasedValuation,
  calculateResidualIncome,
  calculateHistoricalMultipleRange,
  calculatePeadMetrics,
  truncatePermittedExcerpt,
} from '../financial.calc';

// ═══════════════════════════════════════════════════════════════════════
// 1. RATIO FUNCTIONS  manually verified arithmetic
// ═══════════════════════════════════════════════════════════════════════

describe('calculatePE', () => {
  test('₹650 price / ₹47 EPS = 13.83x', () => {
    // Manual: 650 / 47 = 13.82978...
    const result = calculatePE(650, 47);
    expect(result).toBeCloseTo(13.83, 1);
  });

  test('Returns null for zero EPS', () => {
    expect(calculatePE(650, 0)).toBeNull();
  });

  test('Returns null for negative EPS', () => {
    expect(calculatePE(650, -5)).toBeNull();
  });
});

describe('calculatePB', () => {
  test('₹650 price / ₹230 BVPS = 2.826x', () => {
    // Manual: 650 / 230 = 2.8260869...
    const result = calculatePB(650, 230);
    expect(result).toBeCloseTo(2.826, 2);
  });

  test('Returns null for zero book value', () => {
    expect(calculatePB(650, 0)).toBeNull();
  });
});

describe('calculateROE', () => {
  test('PAT=31769, Equity=155600 → 20.42%', () => {
    // Manual: (31769 / 155600) * 100 = 20.4175...
    const result = calculateROE(31769, 155600);
    expect(result).toBeCloseTo(20.42, 1);
  });

  test('Returns null for zero equity', () => {
    expect(calculateROE(31769, 0)).toBeNull();
  });
});

describe('calculateROCE', () => {
  test('EBIT=18000, Capital=120000 → 15.00%', () => {
    // Manual: (18000 / 120000) * 100 = 15.0
    expect(calculateROCE(18000, 120000)).toBeCloseTo(15.0, 1);
  });
});

describe('calculateROA', () => {
  test('PAT=31769, Assets=400000 → 7.94%', () => {
    // Manual: (31769 / 400000) * 100 = 7.94225
    expect(calculateROA(31769, 400000)).toBeCloseTo(7.94, 1);
  });
});

describe('calculateDebtEquity', () => {
  test('Debt=84200, Equity=155600 → 0.541', () => {
    // Manual: 84200 / 155600 = 0.54113...
    expect(calculateDebtEquity(84200, 155600)).toBeCloseTo(0.541, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. EV-BASED MULTIPLES  manually verified
// ═══════════════════════════════════════════════════════════════════════

describe('calculateEV', () => {
  test('MarketCap=240000 + Debt=84200 - Cash=45000 + MinorityInt=0 = 279200', () => {
    // Manual: 240000 + 84200 - 45000 + 0 = 279200
    expect(calculateEV(240000, 84200, 45000, 0)).toBe(279200);
  });

  test('With minority interest: 240000 + 84200 - 45000 + 5000 = 284200', () => {
    expect(calculateEV(240000, 84200, 45000, 5000)).toBe(284200);
  });
});

describe('calculateEVEBITDA', () => {
  test('EV=279200 / EBITDA=18754 = 14.89x', () => {
    // Manual: 279200 / 18754 = 14.888...
    const result = calculateEVEBITDA(279200, 18754);
    expect(result).toBeCloseTo(14.89, 1);
  });

  test('Returns null for zero EBITDA', () => {
    expect(calculateEVEBITDA(279200, 0)).toBeNull();
  });
});

describe('calculateEVSales', () => {
  test('EV=279200 / Sales=104839 = 2.663x', () => {
    // Manual: 279200 / 104839 = 2.6631...
    const result = calculateEVSales(279200, 104839);
    expect(result).toBeCloseTo(2.663, 2);
  });

  test('Returns null for zero sales', () => {
    expect(calculateEVSales(279200, 0)).toBeNull();
  });

  test('Returns null for negative sales', () => {
    expect(calculateEVSales(279200, -100)).toBeNull();
  });
});

describe('calculateFCF', () => {
  test('CFO=20000 - Capex=8000 = 12000', () => {
    expect(calculateFCF(20000, 8000)).toBe(12000);
  });
});

describe('calculateNetDebtEBITDA', () => {
  test('(84200 - 45000) / 18754 = 2.089x', () => {
    // Manual: 39200 / 18754 = 2.0889...
    expect(calculateNetDebtEBITDA(84200, 45000, 18754)).toBeCloseTo(2.089, 2);
  });
});

describe('calculateInterestCoverage', () => {
  test('EBIT=18000 / Interest=3000 = 6.0x', () => {
    expect(calculateInterestCoverage(18000, 3000)).toBe(6.0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. PEG RATIO  manually verified
// ═══════════════════════════════════════════════════════════════════════

describe('calculatePEG', () => {
  test('PE=13.83 / Growth=12% = 1.152', () => {
    // Manual: 13.83 / 12 = 1.1525
    const result = calculatePEG(13.83, 12);
    expect(result).toBeCloseTo(1.1525, 3);
  });

  test('PE=20 / Growth=25% = 0.80 (attractive)', () => {
    // Manual: 20 / 25 = 0.80
    expect(calculatePEG(20, 25)).toBeCloseTo(0.80, 2);
  });

  test('Returns null for zero growth', () => {
    expect(calculatePEG(15, 0)).toBeNull();
  });

  test('Returns null for negative growth', () => {
    expect(calculatePEG(15, -5)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. DCF  manually verified with two WACC scenarios (proves reactivity)
// ═══════════════════════════════════════════════════════════════════════

describe('calculateDCF', () => {
  // Using simple 5-year FCF projections: [13000, 14560, 16307, 18264, 20456]
  const baseFCFs = [13000, 14560, 16307, 18264, 20456];

  test('WACC=10.5%, Terminal Growth=4.5% → intrinsic value per share', () => {
    // Manual arithmetic:
    // PV of FCFs at 10.5%:
    //   13000/1.105   = 11764.71
    //   14560/1.105^2 = 11924.52
    //   16307/1.105^3 = 12087.05
    //   18264/1.105^4 = 12252.34
    //   20456/1.105^5 = 12420.44
    //   Sum PV(FCFs) = 60449.06
    //
    // Terminal Value = 20456*(1.045)/(0.105-0.045) = 20456*1.045/0.06 = 356244.67
    // PV(TV) = 356244.67/1.105^5 = 356244.67/1.64745 = 216218.21
    //
    // EV = 60449.06 + 216218.21 = 276667.27
    // Equity = 276667.27 - 84200 = 192467.27
    // Price/share = 192467.27 / 6766 = 28.45
    const result = calculateDCF({
      fcfProjections: baseFCFs,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      netDebt: 84200,
      sharesOutstanding: 6766,
    });

    expect(result.intrinsicValuePerShare).toBeCloseTo(28.45, 0);
    expect(result.pvOfFCFs).toBeCloseTo(60442, -2);
    expect(result.enterpriseValue).toBeGreaterThan(250000);
    expect(result.equityValue).toBeGreaterThan(0);
  });

  test('WACC=15% → lower intrinsic value (proves reactivity)', () => {
    // Higher WACC means heavier discounting → lower value
    // Manual:
    //   PV of FCFs at 15%:
    //     13000/1.15   = 11304.35
    //     14560/1.15^2 = 11009.23
    //     16307/1.15^3 = 10720.07
    //     18264/1.15^4 = 10447.70
    //     20456/1.15^5 = 10172.08
    //     Sum PV(FCFs) = 53653.43
    //
    //   TV = 20456*1.045/(0.15-0.045) = 20456*1.045/0.105 = 203643.24
    //   PV(TV) = 203643.24/1.15^5 = 203643.24/2.01136 = 101245.46
    //
    //   EV = 53653.43 + 101245.46 = 154898.89
    //   Equity = 154898.89 - 84200 = 70698.89
    //   Price/share = 70698.89 / 6766 = 10.45
    const resultHigh = calculateDCF({
      fcfProjections: baseFCFs,
      wacc: 15,
      terminalGrowthRate: 4.5,
      netDebt: 84200,
      sharesOutstanding: 6766,
    });

    const resultBase = calculateDCF({
      fcfProjections: baseFCFs,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      netDebt: 84200,
      sharesOutstanding: 6766,
    });

    // Higher WACC → lower value
    expect(resultHigh.intrinsicValuePerShare).toBeLessThan(resultBase.intrinsicValuePerShare);
    expect(resultHigh.intrinsicValuePerShare).toBeCloseTo(10.45, 0);
  });

  test('Returns auditable formula string', () => {
    const result = calculateDCF({
      fcfProjections: baseFCFs,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      netDebt: 84200,
      sharesOutstanding: 6766,
    });
    expect(result.formula).toContain('DCF');
    expect(result.formula.length).toBeGreaterThan(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. REVERSE DCF  manually verified
// ═══════════════════════════════════════════════════════════════════════

describe('calculateReverseDCF', () => {
  test('Given CMP=650, finds implied growth rate', () => {
    const result = calculateReverseDCF({
      currentPrice: 650,
      sharesOutstanding: 6766,
      netDebt: 84200,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      projectionYears: 5,
      lastFCF: 13128, // EBITDA * 0.7 as FCF proxy
    });

    // The implied growth rate should be a reasonable percentage
    expect(result.impliedGrowthRate).toBeGreaterThan(0);
    expect(result.impliedGrowthRate).toBeLessThan(100);
    expect(result.impliedEquityValue).toBe(650 * 6766); // 4397900
    expect(result.formula).toContain('Reverse DCF');
  });

  test('Higher market price → higher implied growth', () => {
    const lowPrice = calculateReverseDCF({
      currentPrice: 400,
      sharesOutstanding: 6766,
      netDebt: 84200,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      projectionYears: 5,
      lastFCF: 13128,
    });

    const highPrice = calculateReverseDCF({
      currentPrice: 1000,
      sharesOutstanding: 6766,
      netDebt: 84200,
      wacc: 10.5,
      terminalGrowthRate: 4.5,
      projectionYears: 5,
      lastFCF: 13128,
    });

    expect(highPrice.impliedGrowthRate).toBeGreaterThan(lowPrice.impliedGrowthRate);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. SCENARIO BLEND  manually verified
// ═══════════════════════════════════════════════════════════════════════

describe('calculateScenarioBlend', () => {
  test('Bull=₹900 (25%), Base=₹650 (50%), Bear=₹400 (25%) → ₹650', () => {
    // Manual: (25/100)*900 + (50/100)*650 + (25/100)*400
    //       = 225 + 325 + 100 = 650
    const result = calculateScenarioBlend([
      { label: 'Bull', probability: 25, intrinsicValue: 900 },
      { label: 'Base', probability: 50, intrinsicValue: 650 },
      { label: 'Bear', probability: 25, intrinsicValue: 400 },
    ]);

    expect(result.weightedValue).toBeCloseTo(650, 1);
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios[0].contribution).toBeCloseTo(225, 1);
    expect(result.scenarios[1].contribution).toBeCloseTo(325, 1);
    expect(result.scenarios[2].contribution).toBeCloseTo(100, 1);
  });

  test('Asymmetric weights: Bull=₹1000 (10%), Base=₹700 (60%), Bear=₹300 (30%) → ₹610', () => {
    // Manual: (10/100)*1000 + (60/100)*700 + (30/100)*300
    //       = 100 + 420 + 90 = 610
    const result = calculateScenarioBlend([
      { label: 'Bull', probability: 10, intrinsicValue: 1000 },
      { label: 'Base', probability: 60, intrinsicValue: 700 },
      { label: 'Bear', probability: 30, intrinsicValue: 300 },
    ]);

    expect(result.weightedValue).toBeCloseTo(610, 1);
  });

  test('Empty scenarios → weightedValue = 0', () => {
    const result = calculateScenarioBlend([]);
    expect(result.weightedValue).toBe(0);
  });

  test('Probabilities that don\'t sum to 100 are normalised', () => {
    // e.g. 30+30+30=90, each effectively 33.3%
    // Manual: (30/90)*900 + (30/90)*600 + (30/90)*300 = 300+200+100 = 600
    const result = calculateScenarioBlend([
      { label: 'Bull', probability: 30, intrinsicValue: 900 },
      { label: 'Base', probability: 30, intrinsicValue: 600 },
      { label: 'Bear', probability: 30, intrinsicValue: 300 },
    ]);

    expect(result.weightedValue).toBeCloseTo(600, 1);
  });

  test('Returns auditable formula', () => {
    const result = calculateScenarioBlend([
      { label: 'Base', probability: 100, intrinsicValue: 500 },
    ]);
    expect(result.formula).toContain('Weighted Value');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. BUYBACK RETURN  manually verified
// ═══════════════════════════════════════════════════════════════════════

describe('calculateBuybackReturn', () => {
  test('Standard buyback calculation', () => {
    // Invested ₹1,00,000 at CMP ₹500 → 200 shares
    // Buyback price ₹600, 10M shares out of 100M total (10% ratio)
    // Expected acceptance: 10%
    // Accepted: floor(200 * min(10/100, 10M/100M)) = floor(200*0.1) = 20
    // Remaining: 180
    // Proceeds: 20*600 + 180*500 = 12000 + 90000 = 102000
    // Profit: 102000 - 100000 = 2000
    // Return: 2000/100000 * 100 = 2%
    const result = calculateBuybackReturn(100000, 500, 600, 10_000_000, 100_000_000, 10);
    expect(result.eligibleShares).toBe(200);
    expect(result.acceptedShares).toBe(20);
    expect(result.expectedProceeds).toBe(102000);
    expect(result.expectedProfit).toBe(2000);
    expect(result.expectedReturnPct).toBeCloseTo(2.0, 1);
  });

  test('Direct retail acceptance ratio without shares outstanding', () => {
    // Invested ₹1,50,000 at CMP ₹300 → 500 shares
    // Buyback price ₹375 (25% premium)
    // Direct retail acceptance ratio: 40%
    // Accepted shares: floor(500 * 0.40) = 200 shares
    // Remaining shares: 300 shares
    // Buyback proceeds: 200 * 375 = ₹75,000
    // Remaining value: 300 * 300 = ₹90,000
    // Total proceeds: 75,000 + 90,000 = ₹1,65,000
    // Expected profit: 1,65,000 - 1,50,000 = ₹15,000
    // Return %: (15,000 / 1,50,000) * 100 = 10.0%
    const result = calculateBuybackReturn(150000, 300, 375, 0, 0, 40);
    expect(result.eligibleShares).toBe(500);
    expect(result.acceptedShares).toBe(200);
    expect(result.expectedProceeds).toBe(165000);
    expect(result.expectedProfit).toBe(15000);
    expect(result.expectedReturnPct).toBeCloseTo(10.0, 1);
  });

  test('Handles zero or invalid inputs gracefully', () => {
    const zeroRes = calculateBuybackReturn(0, 500, 600);
    expect(zeroRes.eligibleShares).toBe(0);
    expect(zeroRes.expectedProfit).toBe(0);
  });
});

describe('calculateBuybackPremium', () => {
  test('Calculates positive tender offer premium', () => {
    // Buyback at ₹600 with CMP ₹500 → +20.0%
    expect(calculateBuybackPremium(500, 600)).toBeCloseTo(20.0, 1);
    // Buyback at ₹1200 with CMP ₹1000 → +20.0%
    expect(calculateBuybackPremium(1000, 1200)).toBeCloseTo(20.0, 1);
  });

  test('Calculates discount or zero premium correctly', () => {
    expect(calculateBuybackPremium(500, 500)).toBe(0);
    expect(calculateBuybackPremium(500, 450)).toBeCloseTo(-10.0, 1);
  });

  test('Returns null on invalid or zero current price', () => {
    expect(calculateBuybackPremium(0, 500)).toBeNull();
    expect(calculateBuybackPremium(-100, 500)).toBeNull();
    expect(calculateBuybackPremium(NaN, 500)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. EXTENDED VALUATION METHODS  Graham, Lynch, DDM, Asset, RI, Hist
// ═══════════════════════════════════════════════════════════════════════

describe('calculateGrahamValuation', () => {
  test('Calculates Graham Number: sqrt(22.5 * 20 * 100) = sqrt(45000) = 212.13', () => {
    const res = calculateGrahamValuation(20, 100, 5000, 2000, 10);
    expect(res.grahamNumber).toBeCloseTo(212.13, 1);
    expect(res.ncavPerShare).toBeCloseTo(300, 1); // (5000 - 2000) / 10
  });

  test('Returns null when EPS is non-positive', () => {
    const res = calculateGrahamValuation(-5, 100);
    expect(res.grahamNumber).toBeNull();
  });
});

describe('calculatePeterLynchFairValue', () => {
  test('Lynch fair value = EPS * Growth (e.g. 25 * 15 = 375)', () => {
    const res = calculatePeterLynchFairValue(300, 25, 15);
    expect(res.fairValue).toBe(375);
    expect(res.currentPEG).toBeCloseTo(0.8, 1); // (300/25)/15 = 12/15 = 0.8
  });
});

describe('calculateDividendDiscountModel', () => {
  test('Gordon Growth: D0=10, g=5%, r=10% -> D1=10.5, P0 = 10.5 / (0.10 - 0.05) = 210', () => {
    const res = calculateDividendDiscountModel(10, 5, 10, 200);
    expect(res.intrinsicValue).toBe(210);
    expect(res.dividendYield).toBe(5);
  });

  test('Returns null if r <= g', () => {
    const res = calculateDividendDiscountModel(10, 10, 8);
    expect(res.intrinsicValue).toBeNull();
  });
});

describe('calculateAssetBasedValuation', () => {
  test('Book Value = (1000 - 400)/10 = 60, Liquidation with 20% haircut = (800 - 400)/10 = 40', () => {
    const res = calculateAssetBasedValuation(1000, 400, 10, 20);
    expect(res.bookValuePerShare).toBe(60);
    expect(res.liquidationValuePerShare).toBe(40);
  });
});

describe('calculateResidualIncome', () => {
  test('BVPS=100, ROE=20%, r=12%, g=4% -> RI1 = 100*(0.20-0.12) = 8, PV = 8 / (0.12-0.04) = 100, Total = 200', () => {
    const res = calculateResidualIncome(100, 20, 12, 4);
    expect(res.residualIncomeYear1).toBe(8);
    expect(res.intrinsicValue).toBe(200);
  });
});

describe('calculateHistoricalMultipleRange', () => {
  test('EPS=30, High=25, Median=20, Low=15 -> High=750, Med=600, Low=450', () => {
    const res = calculateHistoricalMultipleRange(30, 25, 20, 15);
    expect(res.highFairValue).toBe(750);
    expect(res.medianFairValue).toBe(600);
    expect(res.lowFairValue).toBe(450);
  });
});

describe('calculatePeadMetrics', () => {
  test('evaluates surprise % and 20d drift with high conviction rule', () => {
    const res = calculatePeadMetrics({
      actualEps: 18.4,
      expectedEps: 14.3,
      priceAtResult: 6850,
      price20dPost: 7420,
      yoyPatPct: 126.2,
      baselinePatGrowth: 15.0,
    });
    expect(res.surprisePct).toBeCloseTo(28.67, 1);
    expect(res.drift20d).toBeCloseTo(8.32, 1);
    expect(res.sueScore).toBe(11.12);
    expect(res.isHighConviction).toBe(true);
    expect(res.methodology).toContain('PRD Section 69.3');
  });
});

describe('truncatePermittedExcerpt (PRD Section 22 Copyright Compliance)', () => {
  test('truncates text with > 28 words to exactly 28 words with ellipsis', () => {
    const rawFeedDesc =
      'Tata Motors has launched a €14.1-per-share cash tender offer for Iveco Group, valuing the Italian commercial vehicle maker at €3.82 billion. Backed by Iveco board, this transaction creates a formidable commercial vehicle champion in European and Asian markets.';
    const wordCount = rawFeedDesc.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(28);

    const excerpt = truncatePermittedExcerpt(rawFeedDesc, 28);
    expect(excerpt.endsWith('...')).toBe(true);
    const excerptWithoutEllipsis = excerpt.replace(/\.\.\.$/, '');
    const excerptWords = excerptWithoutEllipsis.split(' ');
    expect(excerptWords.length).toBe(28);
    expect(excerpt).toBe(
      'Tata Motors has launched a €14.1-per-share cash tender offer for Iveco Group, valuing the Italian commercial vehicle maker at €3.82 billion. Backed by Iveco board, this transaction creates...',
    );
  });

  test('preserves text with <= 28 words without appending ellipsis', () => {
    const shortDesc = 'Over 150 companies are turning ex-record date for dividends this week.';
    const excerpt = truncatePermittedExcerpt(shortDesc, 28);
    expect(excerpt).toBe(shortDesc);
    expect(excerpt.endsWith('...')).toBe(false);
  });

  test('strips HTML tags, CDATA wrappers, and HTML entities', () => {
    const htmlDesc =
      '<![CDATA[<p>Indian equities may remain volatile as <b>rising crude</b> prices &amp; elevated bond yields weigh on sentiment.&nbsp;</p>]]>';
    const excerpt = truncatePermittedExcerpt(htmlDesc, 28);
    expect(excerpt).toBe(
      'Indian equities may remain volatile as rising crude prices & elevated bond yields weigh on sentiment.',
    );
  });

  test('handles null, undefined, empty, and whitespace strings gracefully', () => {
    expect(truncatePermittedExcerpt(null)).toBe('');
    expect(truncatePermittedExcerpt(undefined)).toBe('');
    expect(truncatePermittedExcerpt('')).toBe('');
    expect(truncatePermittedExcerpt('   ')).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 10. VALUATION LAB AUDIT - EXACT HARDCODED ASSERTIONS (DEMO & EDGE CASES)
// ═══════════════════════════════════════════════════════════════════════

describe('Valuation Lab Audit - Exact Hardcoded Assertions for Demo & Edge Cases', () => {
  // 1. DCF Model (Demo Tata Motors consolidated)
  describe('Model 1: DCF (Discounted Cash Flow)', () => {
    test('Demo Case: Tata Motors Base, Bear, Bull, EV, Equity Value', () => {
      const ebitda = 18754;
      const netDebt = 84200;
      const shares = 6766;

      const computeCase = (g: number, w: number, tg: number) => {
        const f1 = (ebitda * 0.7) * (1 + g / 100);
        const f2 = f1 * (1 + g / 100);
        const f3 = f2 * (1 + g / 100);
        const f4 = f3 * (1 + (g - 1) / 100);
        const f5 = f4 * (1 + (g - 2) / 100);
        return calculateDCF({
          fcfProjections: [f1, f2, f3, f4, f5],
          wacc: w,
          terminalGrowthRate: tg,
          netDebt,
          sharesOutstanding: shares,
        });
      };

      // Base Case: 12.0% g, 10.5% WACC, 4.5% tg
      const baseResult = computeCase(12.0, 10.5, 4.5);
      expect(Math.round(baseResult.intrinsicValuePerShare)).toBe(33);
      expect(Math.round(baseResult.enterpriseValue)).toBe(305939);
      expect(Math.round(baseResult.equityValue)).toBe(221739);

      // Bear Case: 9.0% g, 12.0% WACC, 4.0% tg
      const bearResult = computeCase(9.0, 12.0, 4.0);
      expect(Math.round(bearResult.intrinsicValuePerShare)).toBe(18);

      // Bull Case: 15.0% g, 9.0% WACC, 5.0% tg
      const bullResult = computeCase(15.0, 9.0, 5.0);
      expect(Math.round(bullResult.intrinsicValuePerShare)).toBe(64);
    });

    test('Edge Case: WACC <= Terminal Growth returns NaN with clear error message', () => {
      const res = calculateDCF({
        fcfProjections: [1000, 1100, 1200, 1300, 1400],
        wacc: 4.5,
        terminalGrowthRate: 4.5,
        netDebt: 1000,
        sharesOutstanding: 100,
      });
      expect(Number.isNaN(res.intrinsicValuePerShare)).toBe(true);
      expect(Number.isNaN(res.enterpriseValue)).toBe(true);
      expect(Number.isNaN(res.equityValue)).toBe(true);
      expect(res.formula).toContain('Error: WACC must exceed terminal growth rate');
    });

    test('Reactivity: Modifying WACC recalculates value', () => {
      const fcf = [1000, 1100, 1200, 1300, 1400];
      const r1 = calculateDCF({ fcfProjections: fcf, wacc: 10, terminalGrowthRate: 4, netDebt: 500, sharesOutstanding: 100 });
      const r2 = calculateDCF({ fcfProjections: fcf, wacc: 12, terminalGrowthRate: 4, netDebt: 500, sharesOutstanding: 100 });
      expect(r1.intrinsicValuePerShare).not.toBe(r2.intrinsicValuePerShare);
      expect(r1.intrinsicValuePerShare).toBeGreaterThan(r2.intrinsicValuePerShare);
    });
  });

  // 2. Reverse DCF Model
  describe('Model 2: Reverse DCF', () => {
    test('Demo Case: CMP=650, Shares=6766, Debt=84200, WACC=10.5%, TG=4.5%, FCF=13128', () => {
      const res = calculateReverseDCF({
        currentPrice: 650,
        sharesOutstanding: 6766,
        netDebt: 84200,
        wacc: 10.5,
        terminalGrowthRate: 4.5,
        projectionYears: 5,
        lastFCF: 13128,
      });
      expect(res.impliedGrowthRate).toBeCloseTo(95.73, 1);
      expect(res.impliedEquityValue).toBe(4397900);
    });

    test('Edge Case: WACC <= TG or FCF <= 0 returns NaN', () => {
      const r1 = calculateReverseDCF({
        currentPrice: 650,
        sharesOutstanding: 6766,
        netDebt: 84200,
        wacc: 4.5,
        terminalGrowthRate: 4.5,
        projectionYears: 5,
        lastFCF: 13128,
      });
      expect(Number.isNaN(r1.impliedGrowthRate)).toBe(true);
      expect(r1.formula).toContain('Error');

      const r2 = calculateReverseDCF({
        currentPrice: 650,
        sharesOutstanding: 6766,
        netDebt: 84200,
        wacc: 10.5,
        terminalGrowthRate: 4.5,
        projectionYears: 5,
        lastFCF: -100,
      });
      expect(Number.isNaN(r2.impliedGrowthRate)).toBe(true);
    });
  });

  // 3. Relative P/E
  describe('Model 3: Relative P/E', () => {
    test('Demo Case: CMP=650, EPS=47, Peer P/E=18x', () => {
      const pe = calculatePE(650, 47);
      expect(pe).toBeCloseTo(13.83, 2);
      const fairValue = 47 * 18;
      expect(fairValue).toBe(846);
    });

    test('Edge Case: Zero or negative EPS returns null', () => {
      expect(calculatePE(650, 0)).toBeNull();
      expect(calculatePE(650, -10)).toBeNull();
    });
  });

  // 4. Relative EV/EBITDA
  describe('Model 4: Relative EV/EBITDA', () => {
    test('Demo Case: MCap=240000, Debt=84200, Cash=45000, EBITDA=18754, Peer Multiple=14x, Shares=6766', () => {
      const ev = calculateEV(240000, 84200, 45000);
      expect(ev).toBe(279200);
      const currentMultiple = calculateEVEBITDA(ev, 18754);
      expect(currentMultiple).toBeCloseTo(14.887, 2);

      const fairEV = 18754 * 14;
      expect(fairEV).toBe(262556);
      const fairEquity = Math.max(0, fairEV - 84200 + 45000);
      expect(fairEquity).toBe(223356);
      const fairPrice = Math.round(fairEquity / 6766);
      expect(fairPrice).toBe(33);
    });

    test('Edge Case: Zero or negative EBITDA returns null', () => {
      expect(calculateEVEBITDA(279200, 0)).toBeNull();
      expect(calculateEVEBITDA(279200, -500)).toBeNull();
    });
  });

  // 5. Relative EV/Sales
  describe('Model 5: Relative EV/Sales', () => {
    test('Demo Case: MCap=240000, Debt=84200, Cash=45000, Sales=104839, Peer Multiple=2.5x, Shares=6766', () => {
      const ev = calculateEV(240000, 84200, 45000);
      expect(ev).toBe(279200);
      const currentMultiple = calculateEVSales(ev, 104839);
      expect(currentMultiple).toBeCloseTo(2.663, 2);

      const fairEV = 104839 * 2.5;
      expect(fairEV).toBe(262097.5);
      const fairEquity = Math.max(0, fairEV - 84200 + 45000);
      expect(fairEquity).toBe(222897.5);
      const fairPrice = Math.round(fairEquity / 6766);
      expect(fairPrice).toBe(33);
    });

    test('Edge Case: Zero or negative Sales returns null', () => {
      expect(calculateEVSales(279200, 0)).toBeNull();
      expect(calculateEVSales(279200, -1000)).toBeNull();
    });
  });

  // 6. Relative P/B
  describe('Model 6: Relative P/B', () => {
    test('Demo Case: CMP=650, BVPS=230, Peer Multiple=3.0x', () => {
      const currentPB = calculatePB(650, 230);
      expect(currentPB).toBeCloseTo(2.826, 2);
      const fairValue = 230 * 3.0;
      expect(fairValue).toBe(690);
    });

    test('Edge Case: Zero or negative BVPS returns null', () => {
      expect(calculatePB(650, 0)).toBeNull();
      expect(calculatePB(650, -50)).toBeNull();
    });
  });

  // 7. Historical Multiple Range
  describe('Model 7: Historical Multiple Range', () => {
    test('Demo Case: EPS=47, 5Y High=28.5x, Median=22.0x, Low=16.0x', () => {
      const res = calculateHistoricalMultipleRange(47, 28.5, 22.0, 16.0);
      expect(res.lowFairValue).toBe(752);
      expect(res.medianFairValue).toBe(1034);
      expect(res.highFairValue).toBe(1339.5);
    });

    test('Edge Case: Zero or negative metric returns 0 with error formula', () => {
      const res = calculateHistoricalMultipleRange(-10, 25, 20, 15);
      expect(res.lowFairValue).toBe(0);
      expect(res.medianFairValue).toBe(0);
      expect(res.highFairValue).toBe(0);
      expect(res.formula).toContain('Error: Metric value (EPS or EBITDA) must be positive.');
    });
  });

  // 8. Benjamin Graham Number & NCAV
  describe('Model 8: Benjamin Graham Number & NCAV', () => {
    test('Demo Case: EPS=47, BVPS=230, CA=120000, Liab=90000, Shares=6766', () => {
      const res = calculateGrahamValuation(47, 230, 120000, 90000, 6766);
      expect(res.grahamNumber).toBe(493.18);
      expect(res.ncavPerShare).toBe(4.43);
    });

    test('Edge Case: Negative EPS or BVPS returns null Graham Number', () => {
      const r1 = calculateGrahamValuation(-5, 230);
      expect(r1.grahamNumber).toBeNull();
      const r2 = calculateGrahamValuation(47, -20);
      expect(r2.grahamNumber).toBeNull();
    });
  });

  // 9. Peter Lynch Fair Value
  describe('Model 9: Peter Lynch Fair Value', () => {
    test('Demo Case: CMP=650, EPS=47, Growth=15%', () => {
      const res = calculatePeterLynchFairValue(650, 47, 15);
      expect(res.fairValue).toBe(705);
      expect(res.currentPEG).toBeCloseTo(0.92, 2);
      expect(res.verdict).toBe('Fair Value Zone (PEG ≈ 1.0)');
    });

    test('Edge Case: Zero or negative EPS/growth returns fairValue null and null PEG', () => {
      const res = calculatePeterLynchFairValue(650, -5, 15);
      expect(res.fairValue).toBeNull();
      expect(res.currentPEG).toBeNull();
      expect(res.verdict).toContain('Requires positive EPS');
    });
  });

  // 10. Dividend Discount Model (DDM)
  describe('Model 10: Dividend Discount Model', () => {
    test('Demo Case: D0=12.5, g=6%, r=11%, Price=650', () => {
      const res = calculateDividendDiscountModel(12.5, 6, 11, 650);
      expect(res.intrinsicValue).toBe(265);
      expect(res.dividendYield).toBeCloseTo(1.92, 2);
    });

    test('Edge Case: r <= g returns null intrinsic value', () => {
      const res = calculateDividendDiscountModel(12.5, 11, 11, 650);
      expect(res.intrinsicValue).toBeNull();
      expect(res.formula).toContain('Error');
    });
  });

  // 11. Asset-Based / Liquidation
  describe('Model 11: Asset-Based / Liquidation', () => {
    test('Demo Case: TotalAssets=250000, TotalLiab=95000, Shares=6766, Haircut=20%', () => {
      const res = calculateAssetBasedValuation(250000, 95000, 6766, 20);
      expect(res.bookValuePerShare).toBe(22.91);
      expect(res.liquidationValuePerShare).toBe(15.52);
    });

    test('Edge Case: Shares <= 0 returns 0 with error formula', () => {
      const res = calculateAssetBasedValuation(250000, 95000, 0, 20);
      expect(res.bookValuePerShare).toBe(0);
      expect(res.liquidationValuePerShare).toBe(0);
      expect(res.formula).toContain('Error: Shares outstanding must be greater than 0.');
    });
  });

  // 12. Residual Income Model
  describe('Model 12: Residual Income Model', () => {
    test('Demo Case: BVPS=230, ROE=18.5%, r=11%, g=4%', () => {
      const res = calculateResidualIncome(230, 18.5, 11, 4);
      expect(res.residualIncomeYear1).toBe(17.25);
      expect(res.intrinsicValue).toBe(476.43);
    });

    test('Edge Case: r <= g or BVPS <= 0 returns null intrinsic value', () => {
      const r1 = calculateResidualIncome(230, 18.5, 4, 4);
      expect(r1.intrinsicValue).toBeNull();
      expect(r1.formula).toContain('Error');

      const r2 = calculateResidualIncome(-50, 18.5, 11, 4);
      expect(r2.intrinsicValue).toBeNull();
    });
  });
});



