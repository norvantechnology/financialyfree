'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/marketing/hooks';

export function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={ref} className={`mkt-reveal ${inView ? 'in' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, value]);

  useEffect(() => {
    if (!started || reduced) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration, reduced]);

  return (
    <span ref={ref} className="tabular mkt-serif">
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

export function FAQAccordion({
  items,
  idPrefix = 'faq',
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
  idPrefix?: string;
}) {
  return (
    <div className="mkt-faq">
      {items.map((item, i) => (
        <details key={item.question} id={`${idPrefix}-${i}`}>
          <summary>
            <span>{item.question}</span>
            <span aria-hidden className="mkt-text-muted" style={{ fontSize: 18 }}>
              +
            </span>
          </summary>
          <div className="ans">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  badge,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <article className="mkt-card">
      {badge ? <div className="mkt-kicker">{badge}</div> : null}
      {icon ? <div className="mkt-card-icon">{icon}</div> : null}
      <h3 className="mkt-serif mkt-card-title">{title}</h3>
      <p className="mkt-text-muted" style={{ margin: 0, lineHeight: 1.55 }}>
        {description}
      </p>
    </article>
  );
}

export function CtaSection({
  title = 'Start with a free goal plan',
  subtitle = 'Use the same SIP engine as the dashboard, then unlock research tools when you are ready.',
  primaryHref = '/auth/register',
  primaryLabel = 'Get Started Free',
  secondaryHref = '/techno-funda',
  secondaryLabel = 'Explore Research Suite',
}: {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="mkt-section mkt-section-dark mkt-section-cta" aria-labelledby="mkt-final-cta">
      <div className="mkt-container mkt-cta-center">
        <h2 id="mkt-final-cta" style={{ marginBottom: 12 }}>
          {title}
        </h2>
        <p className="mkt-lead" style={{ marginBottom: 24 }}>
          {subtitle}
        </p>
        <div className="mkt-hero-ctas">
          <a href={primaryHref} className="mkt-btn mkt-btn-primary">
            {primaryLabel}
          </a>
          <a href={secondaryHref} className="mkt-btn mkt-btn-ghost">
            {secondaryLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

export function ComplianceBanner() {
  return (
    <div className="mkt-compliance-bar" role="note">
      <div className="mkt-container">
        AMFI ARN-350272 · Educational decision-support only · Not investment advice · Mutual fund
        investments are subject to market risks
      </div>
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="mkt-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 ? <span aria-hidden>/</span> : null}
          {item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
