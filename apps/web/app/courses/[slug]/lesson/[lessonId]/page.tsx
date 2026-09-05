'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  PlayCircle,
  Award,
  ChevronRight,
  ArrowLeft,
  X,
  FileCheck,
} from 'lucide-react';
import { SidebarLayout } from '../../../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../../../components/static-snapshot-banner';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  notes: string;
}

const LESSONS: Record<string, Lesson> = {
  '1': {
    id: '1',
    title: '1.1 Introduction to Techno-Funda Architecture',
    duration: '15 min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    notes:
      'In this introductory lesson, we dissect why pure fundamental value investing often suffers from opportunity cost in Indian markets, and how combining technical stage analysis with fundamental earnings momentum delivers asymmetrical risk-reward.',
  },
  '2': {
    id: '2',
    title: '1.2 Decoding the Three Financial Statements for Alpha',
    duration: '25 min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    notes:
      'Learn how to audit cash flow from operations (CFO) vs reported net profit. Watch out for rapid receivable increases, related-party transactions, and capital work-in-progress (CWIP) parking traps.',
  },
  '3': {
    id: '3',
    title: '2.1 Stan Weinstein Stage Analysis in Indian Equities',
    duration: '30 min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    notes:
      'Four stages of price lifecycle: Stage 1 (Basing), Stage 2 (Advancing / Markup), Stage 3 (Distribution), Stage 4 (Decline). Only allocate long capital in early Stage 2 breakouts.',
  },
  '4': {
    id: '4',
    title: '2.2 Volume Contraction Patterns (VCP) & Pivot Breakouts',
    duration: '35 min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    notes:
      'Detailed analysis of Mark Minervini Volume Contraction Pattern (VCP): volatility compression across 3-4 pullbacks with volume drying up to 50-day average lows before the pivot breakout.',
  },
  '5': {
    id: '5',
    title: '3.1 Position Sizing & Downside Capital Preservation',
    duration: '20 min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    notes:
      'The 1% portfolio risk rule: position size = (Total Portfolio Equity * 0.01) / (Entry Price - Stop Loss). Never average down a losing position.',
  },
};

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the primary indicator that an asset is transitioning into Stage 2 advancing phase?',
    options: [
      'Price breaks above resistance with declining volume',
      'Price breaks above key base with 200 EMA flattening and turning up on 2x average volume',
      'P/E ratio drops below historical average',
      'Promoter holding decreases significantly',
    ],
    correct: 1,
  },
  {
    id: 'q2',
    question: 'In the Volume Contraction Pattern (VCP), what behavior must volume exhibit on successive pullbacks?',
    options: [
      'Volume should expand on pullbacks',
      'Volume must dry up progressively to multi-week lows',
      'Volume is irrelevant as long as RSI is above 70',
      'Volume must spike only on down days',
    ],
    correct: 1,
  },
  {
    id: 'q3',
    question: 'According to institutional risk management, what is the maximum recommended equity risk on a single trade?',
    options: [
      '1% to 2% of total portfolio capital',
      '15% of total portfolio capital',
      '50% on high conviction ideas',
      'Unlimited risk with trailing stops',
    ],
    correct: 0,
  },
];

export default function LessonPlayerPage() {
  const params = useParams();
  const lessonId = (params?.lessonId as string) || '1';
  const currentLesson = LESSONS[lessonId] || LESSONS['1'];

  const [activeTab, setActiveTab] = useState<'video' | 'quiz'>('video');
  const [completedLessons, setCompletedLessons] = useState<string[]>(['1']);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certId, setCertId] = useState('');

  const toggleLessonComplete = (id: string) => {
    if (completedLessons.includes(id)) {
      setCompletedLessons(completedLessons.filter((item) => item !== id));
    } else {
      setCompletedLessons([...completedLessons, id]);
    }
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qId]: optIdx });
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct) {
        score++;
      }
    });
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    setQuizScore(pct);
    if (pct >= 70) {
      const generatedCertId = `CERT_FF_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 900 + 100)}`;
      setCertId(generatedCertId);
      setShowCertificate(true);
    }
  };

  return (
    <SidebarLayout activePath="/courses">
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <StaticSnapshotBanner
          datasetName="Aureus LMS Engine"
          sourceNotes="Self-paced learning with verified quiz progress tracking. Educational research material."
        />

        {/* Back to Course Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <Link
            href="/courses/techno-funda-masterclass"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Course Syllabus</span>
          </Link>

          {/* Tab Switcher: Video vs Quiz */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('video')}
              className={activeTab === 'video' ? 'pill-btn pill-btn-active' : 'pill-btn'}
            >
              Video Lesson
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={activeTab === 'quiz' ? 'pill-btn pill-btn-active' : 'pill-btn'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Award size={14} />
              <span>Certification Exam</span>
            </button>
          </div>
        </div>

        {/* Main LMS Layout: Player / Content + Sidebar */}
        <div className="lms-player-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 'var(--space-6)' }}>
          {/* Left Column: Player or Quiz */}
          <div>
            {activeTab === 'video' ? (
              <div>
                {/* Video Player Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#0F172A',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  <video
                    key={currentLesson.videoUrl}
                    controls
                    playsInline
                    src={currentLesson.videoUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Lesson Title & Completion Action */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 'var(--space-6)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      paddingBottom: 'var(--space-4)',
                      borderBottom: '1px solid var(--border-color)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <div>
                      <div className="category-tag">LESSON MODULE</div>
                      <h1
                        className="font-serif"
                        style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}
                      >
                        {currentLesson.title}
                      </h1>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Duration: {currentLesson.duration} • Adaptive Bitrate Stream
                      </span>
                    </div>

                    <button
                      onClick={() => toggleLessonComplete(currentLesson.id)}
                      className={completedLessons.includes(currentLesson.id) ? 'btn btn-outline' : 'btn btn-primary'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: completedLessons.includes(currentLesson.id) ? 'var(--color-accent)' : undefined,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{completedLessons.includes(currentLesson.id) ? 'Completed' : 'Mark as Complete'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Lesson Key Notes & Takeaways
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
                      {currentLesson.notes}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz / Exam Tab */
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: 'var(--space-8)',
                }}
              >
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="category-tag">PASSING THRESHOLD: 70%</div>
                  <h2 className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Techno-Funda Masterclass Certification Exam
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Answer all questions correctly to unlock your verifiable course certificate.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                  {QUIZ_QUESTIONS.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        background: 'var(--bg-surface-raised)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-6)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                        Question {idx + 1}: {q.question}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: selectedAnswers[q.id] === optIdx ? '#E6F4F1' : '#FFFFFF',
                              border: selectedAnswers[q.id] === optIdx ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={selectedAnswers[q.id] === optIdx}
                              onChange={() => handleSelectOption(q.id, optIdx)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {quizScore !== null && (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      background: quizScore >= 70 ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${quizScore >= 70 ? '#A7F3D0' : '#FECACA'}`,
                      marginBottom: 'var(--space-6)',
                      textAlign: 'center',
                    }}
                  >
                    <strong style={{ fontSize: 'var(--text-sm)', color: quizScore >= 70 ? '#065F46' : '#991B1B' }}>
                      Your Score: {quizScore}% — {quizScore >= 70 ? 'PASSED! Verifiable Certificate Generated.' : 'Needs Review (<70%). Try again.'}
                    </strong>
                  </div>
                )}

                <button
                  onClick={handleSubmitQuiz}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Submit Exam & Generate Certificate
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Playlist Sidebar */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              padding: 'var(--space-6)',
              height: 'fit-content',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h4 className="font-serif" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Curriculum Playlist
              </h4>
              <span className="badge-muted" style={{ color: 'var(--color-accent)' }}>
                {completedLessons.length} / 5 Done
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(LESSONS).map((l) => {
                const isCurrent = l.id === currentLesson.id;
                const isDone = completedLessons.includes(l.id);

                return (
                  <Link
                    key={l.id}
                    href={`/courses/techno-funda-masterclass/lesson/${l.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--bg-surface-raised)' : '#FFFFFF',
                      border: isCurrent ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isDone ? (
                        <CheckCircle2 size={16} color="var(--color-accent)" />
                      ) : (
                        <PlayCircle size={16} color={isCurrent ? 'var(--color-accent)' : '#94A3B8'} />
                      )}
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: isCurrent ? 700 : 500, lineHeight: 1.3 }}>
                          {l.title}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{l.duration}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#94A3B8" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Certificate Modal */}
        {showCertificate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                maxWidth: '560px',
                width: '100%',
                padding: 'var(--space-8)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowCertificate(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <Award size={32} color="#D97706" />
              </div>

              <div className="category-tag">CERTIFICATE OF COMPLETION</div>
              <h3 className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginTop: '4px', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                Techno-Funda DIY Masterclass
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                This certifies that the student has successfully completed the curriculum and scored {quizScore}% on the certification exam.
              </p>

              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-primary)',
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div>Verification ID: <strong>{certId}</strong></div>
                <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>Partner ARN-350272 • FutureZenith Insights LLP</div>
              </div>

              <button
                onClick={() => {
                  alert(`Downloaded verifiable digital credential: ${certId}`);
                  setShowCertificate(false);
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FileCheck size={16} />
                <span>Download Verifiable PDF Certificate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
