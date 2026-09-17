import { SITE } from './site';

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingMinutes: number;
};

export type BlogPost = BlogPostMeta & { content: string };

/**
 * Markdown-driven seed articles (no CMS). Extend by appending to BLOG_POSTS.
 * Content uses simple markdown subset rendered by `renderBlogMarkdown`.
 */
const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'goal-based-sip-vs-lump-sum',
    title: 'Goal-Based SIPs: Why Horizon Matters More Than Timing',
    description:
      'How Emergency Fund, Retirement/FIRE, Child Education, and Wealth Creation goals change SIP sizing — using the same engine behind GoalCompass.',
    date: '2026-09-10',
    author: 'GoalCompass Research',
    tags: ['Goals', 'SIP', 'Education'],
    readingMinutes: 6,
    content: `
## Why goals beat guesswork

Most investors start with "How much should I invest?" A better question is "What must this money do by when?"

GoalCompass's Track A maps capital to four horizons: **Emergency Fund**, **Retirement / FIRE**, **Child Education**, and **Wealth Creation**. Each has different return assumptions, liquidity needs, and glide paths.

## SIP maths in plain language

The SIP required for a target corpus is the standard future-value of an annuity:

- Grow what you already have at the expected rate
- Cover the remaining gap with monthly contributions
- Round up so the plan stays conservative

Our calculators use the shared \`@ff/calc\` engine so the preview on the homepage matches the dashboard planner.

## Compliance note

This article is **educational**. Mutual fund investments are subject to market risks. GoalCompass is an AMFI-registered distributor (ARN-350272), not a SEBI RA/IA.
`.trim(),
  },
  {
    slug: 'what-is-techno-funda',
    title: 'What Is Techno-Funda? A Tour of 20 Research Desks',
    description:
      'From Market Mood and Valuation Lab to Order Tracker and F&O PCR — how the research suite is organised for DIY investors.',
    date: '2026-09-12',
    author: 'GoalCompass Research',
    tags: ['Techno-Funda', 'Research'],
    readingMinutes: 7,
    content: `
## Two tracks, one platform

**Track A** helps you plan and execute goal-based mutual fund investing. **Track B** — Techno-Funda — is a decision-support research suite with **20** institutional tabs.

## Desks that matter on day one

1. **Market Mood Index** — composite sentiment telemetry  
2. **Valuation Lab** — nine models including DCF and Graham  
3. **PEAD Screener** — post-earnings drift candidates  
4. **Order Tracker** — LODR order wins with PDF annexure values  
5. **Sector Heatmap & F&O** — rotation and derivatives context  

## How to use it responsibly

Techno-Funda is **not investment advice**. Cross-check filings, manage risk, and treat every screener as a starting point for your own homework.
`.trim(),
  },
  {
    slug: 'amfi-distributor-vs-investment-advice',
    title: 'AMFI Distributor vs Investment Advice: Know the Difference',
    description:
      'Why ARN-350272 matters, what FutureZenith Insights LLP can and cannot do, and how our disclaimers protect you.',
    date: '2026-09-14',
    author: 'GoalCompass Research',
    tags: ['Compliance', 'AMFI'],
    readingMinutes: 5,
    content: `
## What an AMFI MFD does

As an **AMFI-registered Mutual Fund Distributor** (ARN-350272, FutureZenith Insights LLP), we can help you complete KYC and route mutual fund orders via exchange platforms such as **BSE StAR MF**.

## What we do not do

We are **not** a SEBI-registered Research Analyst or Investment Adviser. Techno-Funda tools and Academy content are educational / decision-support. We do not provide personalised securities recommendations.

## Always remember

Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.
`.trim(),
  },
];

export function getAllPosts(): BlogPostMeta[] {
  return BLOG_POSTS.map(({ content: _c, ...meta }) => meta).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

/** Minimal markdown → HTML for seed articles (headings, paragraphs, bold, code, lists). */
export function renderBlogMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      html.push(`<h2>${inline(line.slice(2))}</h2>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line) || line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+|^-\s+/, ''))}</li>`);
      continue;
    }
    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return html.join('\n');
}

export function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
