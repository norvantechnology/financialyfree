'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Lock,
  PlayCircle,
  Award,
  Sparkles,
} from 'lucide-react';

export default function CourseDetailPage() {
  const course = {
    title: 'Techno-Funda DIY Masterclass',
    description:
      'A comprehensive institutional framework blending fundamental moats, earnings momentum (PEAD), and technical stage analysis.',
    level: 'All Levels',
    duration: '3.5 Hours',
    totalLessons: 5,
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Fundamental Moats & Earnings Quality',
        description: 'Screening for high-ROCE compounders and promoter integrity.',
        lessons: [
          { id: '1', title: '1.1 Introduction to Techno-Funda Architecture', duration: '15 min', isPreview: true },
          { id: '2', title: '1.2 Decoding the Three Financial Statements for Alpha', duration: '25 min', isPreview: false },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Technical Timing, Stage Analysis & VCP',
        description: 'Precision entries using 50/200 EMA and volume contractions.',
        lessons: [
          { id: '3', title: '2.1 Stan Weinstein Stage Analysis in Indian Equities', duration: '30 min', isPreview: false },
          { id: '4', title: '2.2 Volume Contraction Patterns (VCP) & Pivot Breakouts', duration: '35 min', isPreview: false },
        ],
      },
      {
        id: 'm3',
        title: 'Module 3: Portfolio Sizing & Certification Exam',
        description: 'Position sizing, stop-loss discipline, and masterclass examination.',
        lessons: [
          { id: '5', title: '3.1 Position Sizing & Downside Capital Preservation', duration: '20 min', isPreview: false },
        ],
      },
    ],
  };

  return (
    <div style={{ maxWidth: '1000px', margin: 'var(--space-10) auto', padding: '0 var(--space-6)' }}>
      {/* Course Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}
      >
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
            marginBottom: 'var(--space-2)',
          }}
        >
          <Sparkles size={14} />
          <span>Flagship Curriculum</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>
          {course.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: '720px', marginBottom: 'var(--space-6)' }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-6)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            {course.duration} on-demand video
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} />
            {course.totalLessons} lessons & assignments
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} />
            Verifiable Completion Certificate
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Link
            href="/courses/techno-funda-masterclass/lesson/1"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
            }}
          >
            <PlayCircle size={18} />
            <span>Start Learning (Free Preview)</span>
          </Link>
          <Link
            href="/checkout/diy-masterclass"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>Unlock Lifetime Access (₹14,999)</span>
          </Link>
        </div>
      </div>

      {/* Curriculum Syllabus Accordion */}
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        Course Curriculum & Lessons
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {course.modules.map((mod, mIdx) => (
          <div
            key={mod.id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                Module {mIdx + 1}
              </span>
              <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginTop: '2px' }}>{mod.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                {mod.description}
              </p>
            </div>

            <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
              {mod.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {lesson.isPreview ? (
                      <PlayCircle size={16} color="var(--color-primary-400)" />
                    ) : (
                      <Lock size={16} color="var(--text-muted)" />
                    )}
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{lesson.title}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{lesson.duration}</span>
                    {lesson.isPreview ? (
                      <Link
                        href={`/courses/techno-funda-masterclass/lesson/${lesson.id}`}
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-primary-400)',
                          background: 'rgba(14, 165, 233, 0.1)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Free Preview
                      </Link>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Enrolled Only
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
