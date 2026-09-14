'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageSquare,
  Mail,
  CheckCircle2,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { SidebarLayout } from '../../../../components/sidebar-layout';

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState({
    whatsappTransactional: true,
    whatsappMarketing: false,
    emailAlerts: true,
    emailMarketing: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Consent Active');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  React.useEffect(() => {
    async function loadConsent() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/notifications/consent`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences({
            whatsappTransactional: Boolean(data.whatsappTransactional),
            whatsappMarketing: Boolean(data.whatsappMarketing),
            emailAlerts: Boolean(data.emailAlerts),
            emailMarketing: Boolean(data.emailMarketing),
          });
          if (data.updatedAt) {
            setLastSavedTime(
              new Date(data.updatedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            );
          } else {
            setLastSavedTime('Default Consent Active');
          }
        }
      } catch (err) {
        console.warn('Failed to load DPDP consent', err);
        setLastSavedTime('Local fallback');
      }
    }
    loadConsent();
  }, [apiUrl]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/notifications/consent`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(preferences),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      setPreferences({
        whatsappTransactional: Boolean(saved.whatsappTransactional),
        whatsappMarketing: Boolean(saved.whatsappMarketing),
        emailAlerts: Boolean(saved.emailAlerts),
        emailMarketing: Boolean(saved.emailMarketing),
      });
      setLastSavedTime(
        new Date(saved.updatedAt || Date.now()).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      );
      setToastMessage('DPDP consent preferences saved successfully.');
    } catch (err: any) {
      setToastMessage(`Failed to save preferences: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <SidebarLayout activePath="/dashboard/settings/notifications">
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 100,
              padding: 'var(--space-4) var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              background: toastMessage.includes('Failed') ? '#B91C1C' : '#065F46',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              maxWidth: '480px',
            }}
          >
            <CheckCircle2 size={20} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{toastMessage}</span>
          </div>
        )}

        {/* Back navigation */}
        <Link
          href="/dashboard/goals"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'none',
            marginBottom: 'var(--space-4)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Goals Workspace</span>
        </Link>

        {/* Header Banner */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            <span>PRIVACY &amp; NOTIFICATIONS</span>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginTop: '4px',
              marginBottom: '8px',
            }}
          >
            Communication Preferences
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
            You have complete control over how FinanciallyFree communicates with you. We respect your attention and only send alerts that you choose to receive.
          </p>
        </div>

        {/* Section 1: WhatsApp Preferences */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: 'clamp(var(--space-5), 3vw, var(--space-6))',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: '#ECFDF5',
                color: '#15803D',
              }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                WhatsApp Messaging
              </h2>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Verified WhatsApp notifications sent to your registered phone number.
              </div>
            </div>
          </div>

          {/* Toggle 1: Transactional */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) 0',
              borderBottom: '1px solid #F0ECE1',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Transactional Alerts (SIP Reminders &amp; Mandate Status)
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Alerts 3 days before scheduled SIP debit, OTPs, and mandate confirmations.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                aria-label="Toggle WhatsApp Transactional Alerts"
                checked={preferences.whatsappTransactional}
                onChange={() => handleToggle('whatsappTransactional')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Toggle 2: Marketing */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) 0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Product & Market Announcements
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Invites to market outlook reports, research updates, and special workshops.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                aria-label="Toggle WhatsApp Marketing Alerts"
                checked={preferences.whatsappMarketing}
                onChange={() => handleToggle('whatsappMarketing')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Section 2: Email Preferences */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: 'clamp(var(--space-5), 3vw, var(--space-6))',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: '#F0F9FF',
                color: '#0369A1',
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <h2 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Email Notifications
              </h2>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Transactional receipts and research digests delivered to your registered inbox.
              </div>
            </div>
          </div>

          {/* Toggle 1: Account / Security */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) 0',
              borderBottom: '1px solid #F0ECE1',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Account, Billing & Portfolio Reports
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Subscription invoices, annual tax statements (capital gains), and goal milestone badges.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                aria-label="Toggle Email Account and Billing Reports"
                checked={preferences.emailAlerts}
                onChange={() => handleToggle('emailAlerts')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Toggle 2: Weekly Digest */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) 0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Weekly Techno-Funda Alpha & PEAD Digest
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Weekend recap of institutional accumulation setups and earnings surprise revisions.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                aria-label="Toggle Weekly Techno-Funda Digest"
                checked={preferences.emailMarketing}
                onChange={() => handleToggle('emailMarketing')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Save Button & Audit Info */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-10)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Audit Trail: Last verified at {lastSavedTime}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
