'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Video,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Lock,
  PlayCircle,
  ExternalLink,
  X,
  Tag,
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n/language-context';

interface WebinarItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  topic: string;
  scheduledAt: string;
  durationMinutes: number;
  instructorName: string;
  instructorBio: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  tierRequired: 'FREE' | 'PRO' | 'ELITE';
  thumbnailUrl: string;
  meetingUrl?: string;
  replayUrl?: string;
  linkedCompanies: string[];
  isRegistered?: boolean;
  userJoinUrl?: string;
}

const INITIAL_WEBINARS: WebinarItem[] = [
  {
    id: 'w1',
    slug: 'weekly-techno-funda-alpha-breakdown',
    title: 'Weekly Techno-Funda Alpha Breakdown: Stage 2 Breakouts',
    description:
      'Live interactive session breaking down high-conviction breakout setups from the Nifty 500, evaluating quarterly revenue acceleration, volume contraction patterns (VCP), and institutional accumulation footprints.',
    topic: 'Weekly Market Analysis & Sector Rotation',
    scheduledAt: '2026-09-12T11:00:00+05:30',
    durationMinutes: 75,
    instructorName: 'Sandeep Kumar (CMT, CFA)',
    instructorBio: 'Founder & Head of Research at FinanciallyFree. 14+ years in institutional equity research.',
    status: 'scheduled',
    tierRequired: 'FREE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
    meetingUrl: 'https://meet.financiallyfree.in/room/weekly-techno-funda-alpha-breakdown',
    linkedCompanies: ['TRENT', 'HAL', 'BEL', 'DIXON'],
    isRegistered: false,
  },
  {
    id: 'w2',
    slug: 'quarterly-pead-deep-dive',
    title: 'Q1 FY27 Earnings Season: Mastering Post-Earnings Announcement Drift (PEAD)',
    description:
      'Deep dive into institutional earnings surprise screening. Learn how to catch the 48-hour institutional post-earnings drift window and avoid valuation traps in guidance downgrades.',
    topic: 'Quarterly Earnings & PEAD Strategy',
    scheduledAt: '2026-09-19T14:30:00+05:30',
    durationMinutes: 90,
    instructorName: 'Sandeep Kumar (CMT, CFA)',
    instructorBio: 'Founder & Head of Research at FinanciallyFree. 14+ years in institutional equity research.',
    status: 'scheduled',
    tierRequired: 'PRO',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop',
    meetingUrl: 'https://meet.financiallyfree.in/room/quarterly-pead-deep-dive',
    linkedCompanies: ['POLYCAB', 'KAYNES', 'SOLARINDS'],
    isRegistered: false,
  },
  {
    id: 'w3',
    slug: 'mastering-mf-portfolio-construction',
    title: 'Masterclass: Engineering a High-XIRR Goal-Linked Mutual Fund Portfolio',
    description:
      'Recording of our live session covering core-and-satellite asset allocation, rolling return comparisons between Flexicap and Midcap categories, and tax harvesting strategies.',
    topic: 'Mutual Funds & Goal Allocation',
    scheduledAt: '2026-08-28T18:00:00+05:30',
    durationMinutes: 60,
    instructorName: 'Priya Sharma (CFP)',
    instructorBio: 'Lead Wealth Strategist at FinanciallyFree, SEBI Registered Investment Advisor.',
    status: 'completed',
    tierRequired: 'FREE',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
    meetingUrl: 'https://meet.financiallyfree.in/room/mastering-mf-portfolio-construction',
    replayUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    linkedCompanies: ['HDFCBANK', 'ICICIBANK', 'INFY'],
    isRegistered: true,
  },
];

export default function WebinarsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'replays'>('upcoming');
  const [webinars, setWebinars] = useState<WebinarItem[]>(INITIAL_WEBINARS);
  const [selectedReplay, setSelectedReplay] = useState<WebinarItem | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRegister = async (webinar: WebinarItem) => {
    setRegisteringId(webinar.id);

    try {
      // Simulate API call to POST /webinars/:id/register
      await new Promise((resolve) => setTimeout(resolve, 600));

      const joinUrl = `https://live.financiallyfree.in/room/${webinar.slug}?u=demo-user-1&token=live_access_${Date.now()}`;
      setWebinars((prev) =>
        prev.map((w) =>
          w.id === webinar.id
            ? { ...w, isRegistered: true, userJoinUrl: joinUrl }
            : w,
        ),
      );

      setAlertToast({
        type: 'success',
        message: `Registered successfully for "${webinar.title}"! Join link has been sent to your email & WhatsApp.`,
      });
    } catch {
      setAlertToast({
        type: 'error',
        message: 'Could not complete registration. Please try again.',
      });
    } finally {
      setRegisteringId(null);
      setTimeout(() => setAlertToast(null), 5000);
    }
  };

  const upcomingList = webinars.filter((w) => w.status === 'scheduled' || w.status === 'live');
  const replayList = webinars.filter((w) => w.status === 'completed');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      {/* Toast Alert */}
      {alertToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 100,
            padding: 'var(--space-4) var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            background: alertToast.type === 'success' ? '#065f46' : '#991b1b',
            color: '#fff',
            border: `1px solid ${alertToast.type === 'success' ? '#34d399' : '#f87171'}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            maxWidth: '450px',
          }}
        >
          {alertToast.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{alertToast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-primary-400)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          <Video size={14} />
          <span>Interactive Masterclasses & Live Research</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }}>
          {t.nav.webinars} & Live Workshops
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Direct market analysis sessions with CMT & CFA chartered analysts. Review institutional setups, PEAD earnings surprises, and mutual fund construction frameworks.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'upcoming' ? 'var(--color-primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          Upcoming Masterclasses ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('replays')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'replays' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'replays' ? 'var(--color-primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          Recorded Replays ({replayList.length})
        </button>
      </div>

      {/* Grid of Webinars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {(activeTab === 'upcoming' ? upcomingList : replayList).map((w) => (
          <div
            key={w.id}
            style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                height: '180px',
                backgroundImage: `url(${w.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(10, 15, 29, 0.2), rgba(10, 15, 29, 0.85))',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  background: w.tierRequired === 'FREE' ? '#065f46' : '#6d28d9',
                  color: '#fff',
                }}
              >
                {w.tierRequired === 'FREE' ? 'FREE ACCESS' : 'PRO MEMBER ONLY'}
              </span>

              {w.status === 'completed' && (
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <PlayCircle size={12} />
                  Replay Available
                </span>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Topic */}
              <div
                style={{
                  color: 'var(--color-primary-400)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {w.topic}
              </div>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                {w.title}
              </h2>

              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-5)',
                  flex: 1,
                }}
              >
                {w.description}
              </p>

              {/* Meta information */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={14} color="var(--color-primary-400)" />
                  <span>
                    {new Date(w.scheduledAt).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    IST
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Clock size={14} color="var(--color-primary-400)" />
                  <span>{w.durationMinutes} Minutes Session</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <User size={14} color="var(--color-primary-400)" />
                  <span>{w.instructorName}</span>
                </div>
              </div>

              {/* Tickers Tag List */}
              {w.linkedCompanies && w.linkedCompanies.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  <Tag size={12} color="var(--text-muted)" />
                  {w.linkedCompanies.map((ticker) => (
                    <span
                      key={ticker}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {w.status === 'completed' ? (
                <button
                  onClick={() => setSelectedReplay(w)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-primary-500)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <PlayCircle size={16} />
                  Watch Replay & Recording
                </button>
              ) : w.isRegistered ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-success-400)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Seat Confirmed
                  </div>
                  {w.userJoinUrl && (
                    <a
                      href={w.userJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                        color: '#fff',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <span>Join Live Room</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : w.tierRequired === 'PRO' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <Link
                    href="/pricing"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: 'var(--text-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Lock size={14} />
                    Upgrade to Pro to Register
                  </Link>
                </div>
              ) : (
                <button
                  disabled={registeringId === w.id}
                  onClick={() => handleRegister(w)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-primary-500)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    opacity: registeringId === w.id ? 0.7 : 1,
                  }}
                >
                  <Video size={16} />
                  <span>{registeringId === w.id ? 'Securing Seat...' : 'Reserve Free Seat'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Replay Video Player Modal */}
      {selectedReplay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              maxWidth: '840px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-5) var(--space-6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '2px' }}>
                  {selectedReplay.title}
                </h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Presented by {selectedReplay.instructorName}
                </div>
              </div>
              <button
                onClick={() => setSelectedReplay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
              <video
                controls
                autoPlay
                playsInline
                src={selectedReplay.replayUrl}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Notes footer */}
            <div style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Session Synopsis & Tickers Discussed
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedReplay.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
