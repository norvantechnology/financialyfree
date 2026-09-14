'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

interface CatalogCourse {
  slug: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  level: string;
  badge: string;
  gradient: string;
  modulesCount: number;
  isEnrolled: boolean;
  progressPct: number;
}

export default function CoursesCatalogPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = React.useState<CatalogCourse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  React.useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/courses`);
        if (res.ok) {
          const apiCourses = await res.json();
          if (Array.isArray(apiCourses) && apiCourses.length > 0) {
            const mapped: CatalogCourse[] = apiCourses.map((c: any) => {
              const isPead = c.slug?.includes('pead');
              return {
                slug: c.slug,
                title: c.title,
                description: c.description,
                duration: `${(c.totalDuration / 60).toFixed(1)} Hours`,
                lessons: c.lessonCount || 5,
                level: c.level || 'All Levels',
                badge: isPead ? 'Pro Technicals' : 'Flagship Curriculum',
                gradient: isPead
                  ? 'linear-gradient(135deg, #0F766E, #134E4A)'
                  : 'linear-gradient(135deg, #1E293B, #0F172A)',
                modulesCount: isPead ? 2 : 3,
                isEnrolled: !isPead,
                progressPct: !isPead ? 40 : 0,
              };
            });
            setCourses(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to load courses from API', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, [apiUrl]);

  return (
    <SidebarLayout activePath="/courses">
      <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus Curriculum LMS"
          sourceNotes="Self-paced modules, interactive video playback, and graded investor education quizzes."
        />

        {/* Page Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="category-tag">EDUCATION & LMS</div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginBottom: '8px',
            }}
          >
            {t.nav.courses} & Certifications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0, maxWidth: '640px' }}>
            Systematic investing courses designed to transform retail investors into disciplined capital compounders with verified completion certifications.
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(14px, 3vw, 24px)',
              marginBottom: 'clamp(20px, 4vw, 40px)',
            }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                className="card animate-pulse"
                style={{ height: '380px', background: '#F4F1EA', borderRadius: 'var(--radius-xl)' }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(14px, 3vw, 24px)',
              marginBottom: 'clamp(20px, 4vw, 40px)',
            }}
          >
            {courses.map((c) => (
            <div
              key={c.slug}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              {/* Card Header Header */}
              <div
                style={{
                  height: '140px',
                  background: c.gradient,
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
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
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
              <div
                style={{
                  padding: 'var(--space-6)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2
                    className="font-serif"
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {c.title}
                  </h2>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: 'var(--space-6)',
                      lineHeight: 1.5,
                    }}
                  >
                    {c.description}
                  </p>

                  {c.isEnrolled && (
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 'var(--text-xs)',
                          marginBottom: '6px',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>Course Progress</span>
                        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{c.progressPct}%</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: '#E8E4DC',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${c.progressPct}%`,
                            height: '100%',
                            background: 'var(--color-accent)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="btn btn-outline"
                    style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                  >
                    <span>Syllabus</span>
                  </Link>
                  <Link
                    href={`/courses/${c.slug}/lesson/1`}
                    className="btn btn-primary"
                    style={{ flex: 2, textDecoration: 'none', justifyContent: 'center' }}
                  >
                    <span>{c.isEnrolled ? 'Resume' : 'Preview'}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </SidebarLayout>
  );
}
