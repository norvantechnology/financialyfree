/**
 * Shared Canonical Goal Categories Taxonomy
 * Single Source of Truth across Overview tiles, Goal Wizard modal, and calculations.
 */

export type CanonicalGoalType =
  | 'emergency_fund'
  | 'retirement'
  | 'child_education'
  | 'wealth_creation';

export interface GoalCategoryConfig {
  id: CanonicalGoalType;
  label: string;
  subtitle: string;
  desc: string;
  defaultCorpus: number;
  defaultHorizonYears: number;
  defaultSavings: number;
  defaultRiskBand: 'conservative' | 'balanced' | 'growth';
  color: string;
  href: string;
}

export const GOAL_CATEGORIES: readonly GoalCategoryConfig[] = [
  {
    id: 'emergency_fund',
    label: 'Emergency Fund',
    subtitle: 'Liquidity & Safety Cushion',
    desc: '3 to 6 months of living expenses, fully safe, liquid, and protected.',
    defaultCorpus: 600000,
    defaultHorizonYears: 2,
    defaultSavings: 100000,
    defaultRiskBand: 'conservative',
    color: '#0F766E',
    href: '/dashboard/goals?type=emergency_fund',
  },
  {
    id: 'retirement',
    label: 'Retirement (FIRE)',
    subtitle: 'Financial Independence & Early Retirement',
    desc: 'Attain your financial independence corpus on your tailored timeline.',
    defaultCorpus: 25000000,
    defaultHorizonYears: 15,
    defaultSavings: 1000000,
    defaultRiskBand: 'growth',
    color: '#0F172A',
    href: '/dashboard/goals?type=retirement',
  },
  {
    id: 'child_education',
    label: "Child's Higher Education",
    subtitle: 'Premier University & Future Studies',
    desc: 'Compound capital for premier higher education without taking on debt.',
    defaultCorpus: 5000000,
    defaultHorizonYears: 10,
    defaultSavings: 400000,
    defaultRiskBand: 'balanced',
    color: '#0F766E',
    href: '/dashboard/goals?type=child_education',
  },
  {
    id: 'wealth_creation',
    label: 'Long-Term Wealth Creation',
    subtitle: 'Compounding Equity Portfolio',
    desc: 'Compound capital above inflation across diversified equity indices.',
    defaultCorpus: 10000000,
    defaultHorizonYears: 7,
    defaultSavings: 500000,
    defaultRiskBand: 'growth',
    color: '#0F172A',
    href: '/dashboard/goals?type=wealth_creation',
  },
] as const;

export function getGoalCategory(typeOrId?: string): GoalCategoryConfig | undefined {
  if (!typeOrId) return undefined;
  const normalized = typeOrId.toLowerCase().trim();
  return GOAL_CATEGORIES.find(
    (c) =>
      c.id === normalized ||
      c.label.toLowerCase() === normalized ||
      (normalized === 'home_purchase' && c.id === 'wealth_creation') ||
      (normalized.includes('retire') && c.id === 'retirement') ||
      (normalized.includes('child') && c.id === 'child_education') ||
      (normalized.includes('emerg') && c.id === 'emergency_fund'),
  );
}

export function getGoalCategoryFallback(typeOrId?: string): GoalCategoryConfig {
  return getGoalCategory(typeOrId) || GOAL_CATEGORIES[1]; // default to retirement
}
