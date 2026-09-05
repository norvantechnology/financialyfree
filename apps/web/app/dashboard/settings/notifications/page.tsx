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
      // Simulate PUT /notifications/consent
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
      // Simulate POST /notifications/simulate-alert
      await new Promise((resolve) => setTimeout(resolve, 600));
      setToastMessage(`Simulated alert "${label}" dispatched to in-app notification center, WhatsApp mock, and Email.`);
    } finally {
      setTriggering(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      {/* Back navigation */}
      <Link
        href="/dashboard/goals"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
          textDecoration: 'none',
          marginBottom: 'var(--space-6)',
        }}
      >
        <ArrowLeft size={14} />
        <span>Back to Dashboard</span>
      </Link>

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
            background: '#065f46',
            color: '#fff',
            border: '1px solid #34d399',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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

      {/* Header Banner */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--color-success-400)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            marginBottom: 'var(--space-3)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <ShieldCheck size={14} />
          <span>India DPDP Act 2023 Compliant Consent Center</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800 }}>
          Notification Preferences & Data Consent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Under India’s Digital Personal Data Protection (DPDP) Act 2023, you have absolute control over how FinanciallyFree communicates with you. We never dispatch unauthorized messaging without your explicit opt-in.
        </p>
      </div>

      {/* Section 1: WhatsApp Preferences */}
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
            }}
          >
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
              WhatsApp Messaging (Gupshup / Twilio)
            </h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
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
            padding: 'var(--space-3) 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ maxWidth: '80%' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Transactional Alerts (SIP Reminders & BSE StAR Status)
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Alerts 3 days before scheduled SIP debit, OTPs, and BSE StAR mandate confirmations.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.whatsappTransactional}
            onChange={() => handleToggle('whatsappTransactional')}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-500)' }}
          />
        </div>

        {/* Toggle 2: Marketing */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) 0',
          }}
        >
          <div style={{ maxWidth: '80%' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Marketing & Live Webinar Announcements
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Invites to new weekend live masterclasses, market outlook reports, and special workshops.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.whatsappMarketing}
            onChange={() => handleToggle('whatsappMarketing')}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-500)' }}
          />
        </div>
      </div>

      {/* Section 2: Email Preferences */}
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--color-primary-400)',
            }}
          >
            <Mail size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Email Notifications (Amazon SES / SendGrid)
            </h2>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
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
            padding: 'var(--space-3) 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ maxWidth: '80%' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Account, Billing & Portfolio Reports
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Subscription invoices, annual tax statements (capital gains), and goal milestone badges.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.emailAlerts}
            onChange={() => handleToggle('emailAlerts')}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-500)' }}
          />
        </div>

        {/* Toggle 2: Weekly Digest */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) 0',
          }}
        >
          <div style={{ maxWidth: '80%' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Weekly Techno-Funda Alpha & PEAD Digest
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Weekend recap of institutional accumulation setups and earnings surprise revisions.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.emailMarketing}
            onChange={() => handleToggle('emailMarketing')}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary-500)' }}
          />
        </div>
      </div>

      {/* Save Button & Audit Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-10)',
        }}
      >
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Audit Trail: Last verified at {lastSavedTime}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary-500)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <Save size={16} />
          <span>{isSaving ? 'Updating Consent...' : 'Save DPDP Preferences'}</span>
        </button>
      </div>

      {/* Section 3: Live Test & Simulation Sandbox */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          padding: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-warning-400)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: 'var(--space-2)',
          }}
        >
          <AlertCircle size={14} />
          <span>Integration Sandbox & Event Trigger Simulation</span>
        </div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Test Notification Channels & Adapters
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Simulate real backend events to verify in-app feed updates and mock WhatsApp / SES log outputs:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <button
            disabled={triggering !== null}
            onClick={() => handleSimulateAlert('sip_reminder', 'SIP Installment Reminder')}
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Send size={12} color="var(--color-primary-400)" />
            <span>{triggering === 'sip_reminder' ? 'Sending...' : 'Trigger SIP Debit Alert'}</span>
          </button>

          <button
            disabled={triggering !== null}
            onClick={() => handleSimulateAlert('webinar_reminder', 'Live Masterclass Alert')}
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Bell size={12} color="var(--color-warning-400)" />
            <span>{triggering === 'webinar_reminder' ? 'Sending...' : 'Trigger Live Webinar Alert'}</span>
          </button>

          <button
            disabled={triggering !== null}
            onClick={() => handleSimulateAlert('kyc_status', 'KRA KYC Verification')}
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <CheckCircle2 size={12} color="var(--color-success-400)" />
            <span>{triggering === 'kyc_status' ? 'Sending...' : 'Trigger KYC Approval Alert'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
