'use client';

import React from 'react';

export default function GlobalRootError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#F8F6F1',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E8E4DC',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#DC2626',
              marginBottom: '8px',
            }}
          >
            System Error
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '12px',
            }}
          >
            Platform Initialization Issue
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            A critical platform error occurred. Please refresh the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  );
}
