'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/options-lab.css';
import { X, ShieldCheck, CheckCircle2, ExternalLink, Zap, Lock } from 'lucide-react';
import { BrokerType } from '@ff/types';

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

  useEffect(() => {
    if (!isOpen) return;
    fetchBrokersStatus();
  }, [isOpen]);

  const fetchBrokersStatus = async () => {
    try {
      const res = await fetch('/api/v1/options/brokers');
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
        // Complete immediate sandbox handshake
        const res = await fetch('/api/v1/options/brokers/sandbox/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: `SANDBOX_AUTH_${Date.now()}` }),
        });
        if (res.ok) {
          setActiveMessage('Sandbox environment connected successfully! Real ticks enabled.');
          await fetchBrokersStatus();
          if (onConnectSuccess) onConnectSuccess(broker);
        }
      } catch {
        setActiveMessage('Failed connecting to sandbox broker.');
      } finally {
        setLoadingBroker(null);
      }
      return;
    }

    // For real brokers: fetch OAuth authorization URL
    try {
      const res = await fetch(`/api/v1/options/brokers/${broker}/auth-url`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.authUrl) {
          window.location.href = json.data.authUrl;
        }
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
      await fetch(`/api/v1/options/brokers/${broker}`, { method: 'DELETE' });
      await fetchBrokersStatus();
    } catch {
    } finally {
      setLoadingBroker(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="opt-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="opt-modal-card relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 font-sans" style={{ maxWidth: '42rem' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">Connect Trading Broker</h2>
              <p className="text-xs text-neutral-400">
                Stream live tick-by-tick option chains and execute paper trades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="opt-modal-close-btn p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Legal Disclaimer Banner */}
        <div className="px-6 py-3 bg-neutral-950/40 border-b border-neutral-800/80 flex items-start gap-3 text-xs text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-emerald-400">Bank-Grade Token Security:</span> Access tokens are
            encrypted at rest using AES-256-GCM. We never store trading PINs or passwords. Analytics and educational
            decision support only.
          </div>
        </div>

        {activeMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {activeMessage}
          </div>
        )}

        {/* Broker List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {brokers.map((b) => (
            <div
              key={b.broker}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                b.isConnected
                  ? 'bg-emerald-950/20 border-emerald-800/50'
                  : 'bg-neutral-850/40 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-white">{b.name}</span>
                  {b.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                      {b.badge}
                    </span>
                  )}
                  {b.isConnected && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{b.description}</p>
                {b.isConnected && b.tokenExpiresAt && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Token Valid Until: {new Date(b.tokenExpiresAt).toLocaleDateString()} {new Date(b.tokenExpiresAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                {b.isConnected ? (
                  <button
                    onClick={() => handleDisconnect(b.broker)}
                    disabled={loadingBroker === b.broker}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-300 hover:bg-rose-950/50 border border-rose-800/40 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(b.broker)}
                    disabled={loadingBroker === b.broker}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md hover:shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingBroker === b.broker ? (
                      <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Connect
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-neutral-500" />
            End-to-end encrypted session keys
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
