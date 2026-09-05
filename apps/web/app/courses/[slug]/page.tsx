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
import { SidebarLayout } from '../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../components/static-snapshot-banner';

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
    <SidebarLayout activePath="/courses">
      <div style={{ maxWidth: '1040px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Syllabus Architecture"
          sourceNotes="Structured curriculum aligned with SEBI guidelines for retail education and systematic equity execution."
        />

        {/* Course Hero Banner */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
            marginBottom: 'var(--space-8)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} />
            <span>FLAGSHIP CURRICULUM</span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)',
              lineHeight: 1.2,
            }}
          >
            {course.title}
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
              maxWidth: '720px',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.6,
            }}
          >
            {course.description}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--color-accent)" />
              {course.duration} on-demand video
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} color="var(--color-accent)" />
              {course.totalLessons} lessons & assignments
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="var(--color-accent)" />
              Verifiable Completion Certificate
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Link
              href="/courses/techno-funda-masterclass/lesson/1"
              className="btn btn-primary"
              style={{
                textDecoration: 'none',
              }}
            >
              <PlayCircle size={16} />
              <span>Start Learning (Free Preview)</span>
            </Link>
            <Link
              href="/checkout/diy-masterclass"
              className="btn btn-outline"
              style={{
                textDecoration: 'none',
              }}
            >
              <span>Unlock Lifetime Access (₹14,999)</span>
            </Link>
          </div>
        </div>

        {/* Curriculum Syllabus Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Course Curriculum & Lessons
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {course.modules.length} Modules · {course.totalLessons} Lessons
          </span>
        </div>

        {/* Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}>
          {course.modules.map((mod, mIdx) => (
            <div
              key={mod.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-raised)',
                }}
              >
                <span className="category-tag">
                  Module {mIdx + 1}
                </span>
                <h3
                  className="font-serif"
                  style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}
                >
                  {mod.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px', margin: 0 }}>
                  {mod.description}
                </p>
              </div>

              <div style={{ padding: 'var(--space-2) var(--space-6)' }}>
                {mod.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '14px 0',
                      borderBottom: '1px solid #F0ECE1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 220px' }}>
                      {lesson.isPreview ? (
                        <PlayCircle size={18} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                      ) : (
                        <Lock size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lesson.title}
                      </span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{lesson.duration}</span>
                      {lesson.isPreview ? (
                        <Link
                          href={`/courses/techno-funda-masterclass/lesson/${lesson.id}`}
                          className="badge-muted"
                          style={{
                            color: 'var(--color-accent)',
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            textDecoration: 'none',
                          }}
                        >
                          Free Preview
                        </Link>
                      ) : (
                        <span
                          className="badge-muted"
                          style={{
                            color: '#64748B',
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
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
    </SidebarLayout>
  );
}
