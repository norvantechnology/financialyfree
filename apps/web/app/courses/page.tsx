'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';

export default function CoursesCatalogPage() {
  const { t } = useTranslation();
  const courses = [
    {
      slug: 'techno-funda-masterclass',
      title: 'Techno-Funda DIY Masterclass',
      description:
        'A comprehensive institutional framework blending fundamental moats, earnings momentum (PEAD), and technical stage analysis.',
      duration: '3.5 Hours',
      lessons: 5,
      level: 'All Levels',
      badge: 'Flagship Curriculum',
      thumbnail: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
      modulesCount: 3,
      isEnrolled: true,
      progressPct: 40,
    },
    {
      slug: 'advanced-pead-screener',
      title: 'Mastering Post-Earnings Drift (PEAD)',
      description:
        'How to identify high-probability quarterly earnings surprises and execute within the 48-hour institutional reaction window.',
      duration: '1.5 Hours',
      lessons: 3,
      level: 'Advanced',
      badge: 'Pro Technicals',
      thumbnail: 'linear-gradient(135deg, #f59e0b, #ec4899)',
      modulesCount: 2,
      isEnrolled: false,
      progressPct: 0,
    },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Top Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-primary-400)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          <BookOpen size={14} />
          <span>Institutional Learning Management System (LMS)</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
          {t.nav.courses} & Certifications
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Systematic investing courses designed to transform retail investors into disciplined capital compounders.
        </p>
      </div>

      {/* Courses Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {courses.map((c) => (
          <div
            key={c.slug}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Thumbnail Header */}
            <div
              style={{
                height: '160px',
                background: c.thumbnail,
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <span
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {c.badge}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-4)', color: '#ffffff', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {c.duration}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} />
                  {c.lessons} Lessons ({c.modulesCount} Modules)
                </span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  {c.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                  {c.description}
                </p>

                {c.isEnrolled && (
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Course Progress</span>
                      <span style={{ color: 'var(--color-primary-400)', fontWeight: 700 }}>{c.progressPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${c.progressPct}%`, height: '100%', background: 'var(--color-primary-500)' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Link
                  href={`/courses/${c.slug}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>Syllabus</span>
                </Link>
                <Link
                  href={`/courses/${c.slug}/lesson/1`}
                  style={{
                    flex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                    color: '#ffffff',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
                  }}
                >
                  <span>{c.isEnrolled ? 'Resume Learning' : 'Preview Course'}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
