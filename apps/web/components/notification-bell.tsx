'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, ShieldCheck, Clock } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'SIP Due in 3 Days',
    message: 'Your monthly SIP of ₹10,000 for "Retirement 2045" is scheduled on the 10th.',
    type: 'sip_reminder',
    isRead: false,
    createdAt: '10 min ago',
  },
  {
    id: 'n2',
    title: 'Live Masterclass Starting Soon',
    message: 'Weekly Techno-Funda Alpha Breakdown begins in 15 minutes. Join live with Sandeep Kumar.',
    type: 'webinar_reminder',
    isRead: false,
    createdAt: '1 hour ago',
  },
  {
    id: 'n3',
    title: 'KYC Verified (BSE StAR MF)',
    message: 'Your CVL KRA verification is approved! UCC UCC_89124 has been activated.',
    type: 'kyc_status',
    isRead: true,
    createdAt: '1 day ago',
  },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          position: 'relative',
          padding: '8px',
          cursor: 'pointer',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'var(--color-primary-400)' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}
        title="Notifications & Alerts"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'var(--color-danger-500)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '360px',
            background: 'var(--surface-card)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--color-primary-400)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary-400)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: n.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: n.isRead ? 600 : 700,
                        color: n.isRead ? 'var(--text-primary)' : 'var(--color-primary-300)',
                      }}
                    >
                      {n.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Clock size={10} />
                      {n.createdAt}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/dashboard/settings/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '11px',
                color: 'var(--color-primary-400)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={12} />
              DPDP Consent & Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
