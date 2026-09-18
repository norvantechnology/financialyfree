/** Canonical marketing site constants - verified against PRD / codebase only. */

export const SITE = {
  name: 'GoalCompass',
  legalEntity: 'FutureZenith Insights LLP',
  /** Numeric ARN only - display as ARN-350272 via AMFI_DISCLOSURE */
  amfiArn: '350272',
  supportEmail: 'support@goalcompass.in',
  businessEmail: 'hello@goalcompass.in',
  /** Placeholder until ops confirms registered office line - keep non-misleading */
  addressLines: [
    'FutureZenith Insights LLP',
    'India',
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://goalcompass.in',
  tagline: 'Monthly SIPs & clear Nifty stock research for Indian investors',
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

/** Verified product stats only - no fabricated user/testimonial counts. */
export const VERIFIED_STATS = [
  {
    value: 20,
    suffix: '',
    label: 'Research Tools',
    detail: 'Market mood, fair value, screeners & more in the live product',
  },
  {
    value: 9,
    suffix: '',
    label: 'Valuation Models',
    detail: 'Clear fair-value views to ask: is this stock expensive?',
  },
  {
    value: 4,
    suffix: '',
    label: 'Goal Types',
    detail: 'Emergency, retirement, education, wealth',
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
    description: 'Full Techno-Funda research suite - all institutional desks and screeners.',
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

/** Canonical FAQ set - single source of truth for home + /faq. */
export const HOME_FAQS = [
  {
    question: 'How does GoalCompass help me invest?',
    answer:
      'GoalCompass helps you plan monthly SIPs for clear goals, finish paperless KYC, invest via exchange-routed mutual fund orders, and research Nifty stocks with simple tools - plus beginner courses when you need them.',
  },
  {
    question: 'What is included in the free Starter plan?',
    answer:
      'Starter includes SIP goal planners (emergency fund, retirement, education, wealth), your dashboard, intro Academy lessons, paperless KYC, and mutual fund order routing - free forever. Paid plans unlock the full research suite and advanced courses.',
  },
  {
    question: 'How do mutual fund investments get executed?',
    answer:
      'After paperless KYC, your SIPs and one-time investments are routed through BSE StAR MF exchange infrastructure, with UPI Autopay or e-NACH for monthly investing. Your money goes to the fund house - GoalCompass does not hold it.',
  },
  {
    question: 'What is the stock research suite?',
    answer:
      'Track B is our set of 20 research tools for DIY investors: Market Mood Index, fair-value models, earnings and order screeners, sector heatmaps, Nifty options views, and insider/promoter alerts. Educational decision-support only - not personal advice.',
  },
  {
    question: 'Are my funds and personal data secure?',
    answer:
      'Yes. Investments settle via BSE StAR MF and partner fund houses. GoalCompass never holds your money. Your data is protected with bank-grade 256-bit SSL.',
  },
  {
    question: 'Can I upgrade or change plans later?',
    answer:
      'Yes. Start free, then upgrade from Pricing or Billing whenever you need the full research suite or Academy access.',
  },
] as const;

/** Pricing-page scoped FAQs (subset) - full set lives in HOME_FAQS /faq. */
export const PRICING_FAQS = [
  HOME_FAQS[1],
  HOME_FAQS[5],
  HOME_FAQS[2],
  HOME_FAQS[0],
] as const;

/** Unified platform journey - reused on Track A flow + How it works. */
export const PLATFORM_STEPS = [
  { title: 'Plan', detail: 'Set a goal and size your SIP with the shared calc engine' },
  { title: 'Learn', detail: 'Academy lessons and compliance context' },
  { title: 'Research', detail: 'Unlock stock research tools when you need deeper analysis' },
  { title: 'Invest', detail: 'Complete paperless KYC and route via BSE StAR MF' },
] as const;

export const MF_RISK_DISCLAIMER =
  'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully before investing.';

export const NOT_ADVICE_DISCLAIMER =
  'Educational and decision-support only. Not investment advice. Not a SEBI-registered Research Analyst or Investment Adviser.';

export const AMFI_DISCLOSURE = `AMFI-registered Mutual Fund Distributor · ARN-${SITE.amfiArn} · ${SITE.legalEntity}.`;
