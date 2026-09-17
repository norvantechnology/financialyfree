/** Canonical marketing site constants — verified against PRD / codebase only. */

export const SITE = {
  name: 'GoalCompass',
  legalEntity: 'FutureZenith Insights LLP',
  /** Numeric ARN only — display as ARN-350272 via AMFI_DISCLOSURE */
  amfiArn: '350272',
  supportEmail: 'support@goalcompass.in',
  businessEmail: 'hello@goalcompass.in',
  /** Placeholder until ops confirms registered office line — keep non-misleading */
  addressLines: [
    'FutureZenith Insights LLP',
    'India',
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://goalcompass.in',
  tagline: 'Goal-based mutual fund investing & Techno-Funda research',
} as const;


export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/courses', label: 'Academy' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/** Verified product stats only — no fabricated user/testimonial counts. */
export const VERIFIED_STATS = [
  {
    value: 20,
    suffix: '',
    label: 'Research Tools',
    detail: 'Techno-Funda suite tabs in the live product',
  },
  {
    value: 9,
    suffix: '',
    label: 'Valuation Models',
    detail: 'DCF, Reverse DCF, Graham, Lynch, DDM & more',
  },
  {
    value: 4,
    suffix: '',
    label: 'Goal Horizons',
    detail: 'Emergency, Retirement/FIRE, Education, Wealth',
  },
  {
    value: 2200,
    suffix: '+',
    label: 'Companies Tracked',
    detail: 'NSE shareholding / equities universe coverage',
  },
] as const;

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: '₹0',
    period: 'Free forever',
    description: 'Goal calculators, basic dashboard, and introductory Academy lessons.',
    features: [
      'Multi-goal SIP & FIRE calculators',
      'Inflation-adjusted projections',
      'Introductory LMS lessons',
      'Market Mood overview',
      'Paperless KYC',
      'MF execution via BSE StAR MF*',
    ],
    cta: 'Get Starter',
    href: '/auth/register',
    highlighted: false,
  },
  {
    id: 'tools-annual',
    name: 'Tools Annual',
    priceLabel: '₹9,999',
    period: '/ year',
    description: 'Full Techno-Funda research suite — all institutional desks and screeners.',
    features: [
      'All 20 research tools',
      '9 valuation models',
      'Order Tracker, PEAD, F&O, Insider feeds',
      'Sector heatmap & deal trackers',
      'Paperless KYC + MF execution*',
    ],
    cta: 'Get Tools Annual',
    href: '/checkout/tools-annual',
    highlighted: true,
  },
  {
    id: 'diy-bundle',
    name: 'DIY Wealth Bundle',
    priceLabel: '₹14,999',
    period: '/ year',
    description: 'Tools Annual plus the full Academy course library (Zero to Hero).',
    features: [
      'Everything in Tools Annual',
      'Full LMS Academy library',
      'Structured investing curriculum',
      'Goal + research workflow',
    ],
    cta: 'Get DIY Bundle',
    href: '/checkout/diy-wealth-bundle',
    highlighted: false,
  },
  {
    id: 'all-access',
    name: 'All-Access Mastermind',
    priceLabel: '₹24,999',
    period: '/ year',
    description: 'Full platform plus research community and priority Q&A access.',
    features: [
      'Everything in DIY Bundle',
      'Research community access',
      'Direct Q&A support',
      'Priority updates',
    ],
    cta: 'Get All-Access',
    href: '/checkout/all-access-bundle',
    highlighted: false,
  },
] as const;

/** Canonical FAQ set — single source of truth for home + /faq. */
export const HOME_FAQS = [
  {
    question: 'How does GoalCompass help me invest?',
    answer:
      'GoalCompass is an all-in-one platform providing automated goal-based SIP planning, 100% paperless KYC, 20 institutional-grade research tools, and a structured investing academy to help you make confident, data-backed financial decisions.',
  },
  {
    question: 'What is included in the free Starter plan?',
    answer:
      'Starter includes goal-based SIP calculators (Emergency Fund, Retirement/FIRE, Child Education, Wealth Creation), your personal dashboard, introductory Academy lessons, paperless KYC, and automated mutual fund execution — free forever. Paid plans unlock the 20-tool research suite and advanced masterclasses.',
  },
  {
    question: 'How do mutual fund investments get executed?',
    answer:
      'After completing quick paperless KYC, your SIPs and lumpsum investments are routed securely through BSE StAR MF exchange infrastructure with instant UPI Autopay and e-NACH mandate setup. Your money goes straight to fund houses with zero intermediaries holding your funds.',
  },
  {
    question: 'What is the Techno-Funda Research Suite?',
    answer:
      'Techno-Funda is our suite of 20 research tools for self-directed equity analysis: Market Mood Index, 9 valuation models (DCF, Graham, Peter Lynch, etc.), Smart Screeners (PEAD earnings surprises, Order wins, Breakouts), Sector Heatmaps, F&O sentiment, and Insider trading radars.',
  },
  {
    question: 'Are my funds and personal data secure?',
    answer:
      'Yes. Your investments are settled directly via BSE StAR MF and partner AMCs. GoalCompass never holds your money. Your data is encrypted with bank-grade 256-bit SSL protocols.',
  },
  {
    question: 'Can I upgrade or change plans later?',
    answer:
      'Yes. Start free, then upgrade to Tools Annual, DIY Wealth Bundle, or All-Access Mastermind from Pricing or Billing whenever you need advanced research or Academy access.',
  },
] as const;

/** Pricing-page scoped FAQs (subset) — full set lives in HOME_FAQS /faq. */
export const PRICING_FAQS = [
  HOME_FAQS[1],
  HOME_FAQS[5],
  HOME_FAQS[2],
  HOME_FAQS[0],
] as const;

/** Unified platform journey — reused on Track A flow + How it works. */
export const PLATFORM_STEPS = [
  { title: 'Plan', detail: 'Set a goal and size your SIP with the shared calc engine' },
  { title: 'Learn', detail: 'Academy lessons and compliance context' },
  { title: 'Research', detail: 'Unlock Techno-Funda desks when you need deeper analysis' },
  { title: 'Invest', detail: 'Complete paperless KYC and route via BSE StAR MF' },
] as const;

export const MF_RISK_DISCLAIMER =
  'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully before investing.';

export const NOT_ADVICE_DISCLAIMER =
  'Educational and decision-support only. Not investment advice. Not a SEBI-registered Research Analyst or Investment Adviser.';

export const AMFI_DISCLOSURE = `AMFI-registered Mutual Fund Distributor · ARN-${SITE.amfiArn} · ${SITE.legalEntity}.`;
