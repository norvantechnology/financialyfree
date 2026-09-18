'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/options-lab.css';
import { X, ShieldCheck, CheckCircle2, ExternalLink, Zap, Lock } from 'lucide-react';
import { BrokerType } from '@ff/types';
import { ensureFreshAccessToken } from '../../lib/auth-client';

interface BrokerInfo {
  broker: BrokerType;
  name: string;
  description: string;
  isConnected: boolean;
  status?: string;
  tokenExpiresAt?: string | null;
  badge?: string;
}

interface BrokerConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess?: (broker: BrokerType) => void;
}

export const BrokerConnectModal: React.FC<BrokerConnectModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess,
}) => {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([
    {
      broker: 'sandbox',
      name: 'Sandbox / Paper Trading Environment',
      description: 'Simulated paper trading with 10 Lakhs INR capital. Fills at real live market ticks.',
      isConnected: false,
      badge: 'Free & Instant',
    },
    {
      broker: 'zerodha',
      name: 'Zerodha (Kite Connect v3)',
      description: 'Connect Kite API credentials for real-time binary ticker streaming and tick data.',
      isConnected: false,
      badge: 'OAuth v3',
    },
    {
      broker: 'upstox',
      name: 'Upstox (v2 Pro API)',
      description: 'Connect Upstox v2 for sub-millisecond Protobuf market feeds and live option chains.',
      isConnected: false,
      badge: 'Fastest Ticks',
    },
    {
      broker: 'dhan',
      name: 'Dhan HQ (v2)',
      description: 'Direct Dhan API connectivity with zero brokerage for super-traders.',
      isConnected: false,
      badge: 'Dhan v2',
    },
    {
      broker: 'angelone',
      name: 'Angel One (SmartAPI)',
      description: 'SmartStream WebSocket data feeds for index options and stocks.',
      isConnected: false,
      badge: 'SmartAPI',
    },
    {
      broker: 'fyers',
      name: 'Fyers (v3 Data API)',
      description: 'Multi-threaded live tick streaming across NSE and BSE F&O segments.',
      isConnected: false,
      badge: 'Fyers v3',
    },
  ]);

  const [loadingBroker, setLoadingBroker] = useState<BrokerType | null>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const authHeaders = async (): Promise<HeadersInit> => {
    const token = await ensureFreshAccessToken();
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchBrokersStatus();
  }, [isOpen]);

  const fetchBrokersStatus = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/v1/options/brokers', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setBrokers((prev) =>
            prev.map((p) => {
              const found = json.data.find((b: any) => b.broker === p.broker);
              return found
                ? {
                    ...p,
                    isConnected: found.isConnected,
                    status: found.status,
                    tokenExpiresAt: found.tokenExpiresAt,
                  }
                : p;
            }),
          );
        }
      }
    } catch {
      // Offline fallback
    }
  };

  const handleConnect = async (broker: BrokerType) => {
    setLoadingBroker(broker);
    setActiveMessage(null);

    if (broker === 'sandbox') {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/v1/options/brokers/sandbox/callback', {
          method: 'POST',
          headers,
          body: JSON.stringify({ code: `SANDBOX_AUTH_${Date.now()}` }),
        });
        if (res.ok) {
          setActiveMessage('Sandbox environment connected successfully! Real ticks enabled.');
          await fetchBrokersStatus();
          if (onConnectSuccess) onConnectSuccess(broker);
        } else if (res.status === 401) {
          setActiveMessage('Please sign in to connect a broker.');
        }
      } catch {
        setActiveMessage('Failed connecting to sandbox broker.');
      } finally {
        setLoadingBroker(null);
      }
      return;
    }

    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/v1/options/brokers/${broker}/auth-url`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.authUrl) {
          window.location.href = json.data.authUrl;
        }
      } else if (res.status === 401) {
        setActiveMessage('Please sign in to connect a broker.');
      }
    } catch (err: any) {
      setActiveMessage(`Could not initiate ${broker} OAuth: ${err.message}`);
    } finally {
      setLoadingBroker(null);
    }
  };

  const handleDisconnect = async (broker: BrokerType) => {
    setLoadingBroker(broker);
    try {
      const headers = await authHeaders();
      await fetch(`/api/v1/options/brokers/${broker}`, { method: 'DELETE', headers });
      await fetchBrokersStatus();
    } catch {
    } finally {
      setLoadingBroker(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="opt-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="opt-broker-modal-title">
      <div className="opt-broker-modal">
        <div className="opt-broker-modal-header">
          <div className="opt-broker-modal-title-row">
            <div className="opt-broker-modal-icon" aria-hidden>
              <Zap className="w-5 h-5" />
            </div>
            <div className="opt-broker-modal-titles">
              <h2 id="opt-broker-modal-title">Connect Trading Broker</h2>
              <p>Stream live tick-by-tick option chains and execute paper trades.</p>
            </div>
          </div>
          <button type="button" className="opt-modal-close-btn" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="opt-broker-security">
          <ShieldCheck className="opt-broker-security-icon" aria-hidden />
          <p>
            <strong>Bank-Grade Token Security:</strong> Access tokens are encrypted at rest using
            AES-256-GCM. We never store trading PINs or passwords. Analytics and educational decision
            support only.
          </p>
        </div>

        {activeMessage && (
          <div className="opt-broker-message" role="status">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            <span>{activeMessage}</span>
          </div>
        )}

        <div className="opt-broker-list">
          {brokers.map((b) => (
            <div
              key={b.broker}
              className={`opt-broker-row ${b.isConnected ? 'is-connected' : ''}`}
            >
              <div className="opt-broker-row-copy">
                <div className="opt-broker-row-title">
                  <span className="opt-broker-name">{b.name}</span>
                  {b.badge ? <span className="opt-broker-badge">{b.badge}</span> : null}
                  {b.isConnected ? (
                    <span className="opt-broker-badge is-active">
                      <span className="opt-broker-badge-dot" aria-hidden />
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="opt-broker-desc">{b.description}</p>
                {b.isConnected && b.tokenExpiresAt ? (
                  <p className="opt-broker-token">
                    Token valid until:{' '}
                    {new Date(b.tokenExpiresAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                ) : null}
              </div>

              <div className="opt-broker-row-action">
                {b.isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(b.broker)}
                    disabled={loadingBroker === b.broker}
                    className="opt-broker-btn opt-broker-btn--disconnect"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(b.broker)}
                    disabled={loadingBroker === b.broker}
                    className="opt-broker-btn opt-broker-btn--connect"
                  >
                    {loadingBroker === b.broker ? (
                      <span className="opt-broker-spinner" aria-hidden />
                    ) : (
                      <>
                        Connect
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="opt-broker-footer">
          <div className="opt-broker-footer-note">
            <Lock className="w-3.5 h-3.5" aria-hidden />
            <span>End-to-end encrypted session keys</span>
          </div>
          <button type="button" className="opt-broker-btn opt-broker-btn--close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
