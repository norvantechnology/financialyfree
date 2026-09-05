'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageSquare,
  Mail,
  Bell,
  CheckCircle2,
  Save,
  Send,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { SidebarLayout } from '../../../../components/sidebar-layout';
import { StaticSnapshotBanner } from '../../../../components/static-snapshot-banner';

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState({
    whatsappTransactional: true,
    whatsappMarketing: false,
    emailAlerts: true,
    emailMarketing: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Today at 05:30 PM (Simulated)');

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLastSavedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      setToastMessage('DPDP consent preferences updated and logged successfully.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSimulateAlert = async (type: string, label: string) => {
    setTriggering(type);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setToastMessage(`Simulated alert "${label}" dispatched to in-app notification center, WhatsApp mock, and Email.`);
    } finally {
      setTriggering(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <SidebarLayout activePath="/dashboard/settings/notifications">
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
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
              background: '#065F46',
              color: '#FFFFFF',
              border: '1px solid #34D399',
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

        <StaticSnapshotBanner
          datasetName="Aureus Notification Hub"
          sourceNotes="Regulatory investor communication registry compliant with the Digital Personal Data Protection (DPDP) Act 2023."
        />

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
            <span>INDIA DPDP ACT 2023 CONSENT CENTER</span>
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
            Notification Preferences
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
            Under India’s Digital Personal Data Protection (DPDP) Act 2023, you have absolute control over how FinanciallyFree communicates with you. We never dispatch unauthorized messaging without your explicit opt-in.
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
                WhatsApp Messaging (Gupshup / Meta Cloud)
              </h2>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Verified WhatsApp Business notifications sent to your registered phone number.
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
                Transactional Alerts (SIP Reminders & BSE StAR Status)
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Alerts 3 days before scheduled SIP debit, OTPs, and BSE StAR mandate confirmations.
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
                Marketing & Live Webinar Announcements
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Invites to new weekend live masterclasses, market outlook reports, and special workshops.
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
                Email Notifications (Amazon SES)
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
            <span>{isSaving ? 'Updating Consent...' : 'Save DPDP Preferences'}</span>
          </button>
        </div>

        {/* Section 3: Live Test & Simulation Sandbox */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-color)',
            padding: 'clamp(var(--space-5), 3vw, var(--space-6))',
          }}
        >
          <div className="category-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} />
            <span>INTEGRATION SANDBOX & EVENT SIMULATION</span>
          </div>
          <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: 'var(--space-1)' }}>
            Test Notification Channels & Adapters
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            Simulate real backend events to verify in-app feed updates and mock WhatsApp / SES log outputs:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
            <button
              disabled={triggering !== null}
              onClick={() => handleSimulateAlert('sip_reminder', 'SIP Installment Reminder')}
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
            >
              <Send size={14} color="var(--color-accent)" />
              <span>{triggering === 'sip_reminder' ? 'Sending...' : 'Trigger SIP Debit Alert'}</span>
            </button>

            <button
              disabled={triggering !== null}
              onClick={() => handleSimulateAlert('webinar_reminder', 'Live Masterclass Alert')}
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
            >
              <Bell size={14} color="#D97706" />
              <span>{triggering === 'webinar_reminder' ? 'Sending...' : 'Trigger Live Webinar Alert'}</span>
            </button>

            <button
              disabled={triggering !== null}
              onClick={() => handleSimulateAlert('kyc_status', 'KRA KYC Verification')}
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
            >
              <CheckCircle2 size={14} color="#059669" />
              <span>{triggering === 'kyc_status' ? 'Sending...' : 'Trigger KYC Approval Alert'}</span>
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
