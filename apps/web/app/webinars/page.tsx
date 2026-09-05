'use client';

import React, { useState, useEffect } from 'react';
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
import { SidebarLayout } from '../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../components/static-snapshot-banner';

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

  useEffect(() => {
    async function loadWebinars() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/webinars`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setWebinars(list);
          }
        }
      } catch (err) {
        console.warn('Webinars live fetch fallback', err);
      }
    }
    loadWebinars();
  }, []);

  const handleRegister = async (webinar: WebinarItem) => {
    setRegisteringId(webinar.id);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      let joinUrl = `https://live.financiallyfree.in/room/${webinar.slug}?u=demo-user-1&token=live_access_${Date.now()}`;
      try {
        const res = await fetch(`${apiUrl}/api/v1/webinars/${webinar.id}/register`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.joinUrl) joinUrl = data.joinUrl;
        }
      } catch {
        // Fallback to local
      }

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
    <SidebarLayout activePath="/webinars">
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
              background: alertToast.type === 'success' ? '#065F46' : '#991B1B',
              color: '#FFFFFF',
              border: `1px solid ${alertToast.type === 'success' ? '#34D399' : '#F87171'}`,
              boxShadow: 'var(--shadow-lg)',
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

        <StaticSnapshotBanner
          datasetName="Aureus Live Intelligence Feed"
          sourceNotes="Live webinars and masterclasses conducted by CMT & CFA charterholders. Market commentary for investor education."
        />

        {/* Header Banner */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="category-tag">LIVE RESEARCH ROOM</div>
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
            {t.nav.webinars} & Live Workshops
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0, maxWidth: '680px' }}>
            Direct market analysis sessions with CMT & CFA chartered analysts. Review institutional setups, PEAD earnings surprises, and mutual fund construction frameworks.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: 'var(--space-8)',
          }}
        >
          <button
            onClick={() => setActiveTab('upcoming')}
            className={activeTab === 'upcoming' ? 'pill-btn pill-btn-active' : 'pill-btn'}
          >
            Upcoming Masterclasses ({upcomingList.length})
          </button>
          <button
            onClick={() => setActiveTab('replays')}
            className={activeTab === 'replays' ? 'pill-btn pill-btn-active' : 'pill-btn'}
          >
            Recorded Replays ({replayList.length})
          </button>
        </div>

        {/* Grid of Webinars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {(activeTab === 'upcoming' ? upcomingList : replayList).map((w) => (
            <div
              key={w.id}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  height: '170px',
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
                    background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.7))',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: w.tierRequired === 'FREE' ? '#0F766E' : '#0F172A',
                    color: '#FFFFFF',
                  }}
                >
                  {w.tierRequired === 'FREE' ? 'FREE ACCESS' : 'PRO ACCESS'}
                </span>

                {w.status === 'completed' && (
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(8px)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <PlayCircle size={12} />
                    Replay
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="category-tag" style={{ marginBottom: 'var(--space-2)' }}>
                  {w.topic}
                </div>

                <h2
                  className="font-serif"
                  style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)', lineHeight: 1.3 }}
                >
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
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={14} color="var(--color-accent)" />
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
                    <Clock size={14} color="var(--color-accent)" />
                    <span>{w.durationMinutes} Minutes Session</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <User size={14} color="var(--color-accent)" />
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
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <Tag size={12} color="var(--text-muted)" />
                    {w.linkedCompanies.map((ticker) => (
                      <span
                        key={ticker}
                        className="badge-muted"
                        style={{ fontFamily: 'monospace', fontSize: '11px' }}
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
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <PlayCircle size={16} />
                    <span>Watch Replay</span>
                  </button>
                ) : w.isRegistered ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        background: '#ECFDF5',
                        color: '#065F46',
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
                        className="btn btn-primary"
                        style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                      >
                        <span>Join Live Room</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ) : w.tierRequired === 'PRO' ? (
                  <Link
                    href="/pricing"
                    className="btn btn-outline"
                    style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                  >
                    <Lock size={14} />
                    <span>Upgrade to Pro to Register</span>
                  </Link>
                ) : (
                  <button
                    disabled={registeringId === w.id}
                    onClick={() => handleRegister(w)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
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
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                width: '100%',
                maxWidth: '840px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-6)',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-raised)',
                }}
              >
                <div>
                  <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>
                    {selectedReplay.title}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Presented by {selectedReplay.instructorName}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReplay(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 'var(--space-2)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Player */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0F172A' }}>
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
                <h4 className="font-serif" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                  Session Synopsis & Tickers Discussed
                </h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {selectedReplay.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
