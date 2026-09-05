import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';
import { SidebarLayout } from '../../components/sidebar-layout';

export default function DashboardNotFound() {
  return (
    <SidebarLayout activePath="/dashboard/goals">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-6)',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Compass size={26} />
          </div>

          <div className="category-tag" style={{ marginBottom: '8px' }}>
            404 NOT FOUND
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            Dashboard View Not Found
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            The dashboard page or resource requested could not be located in your active workspace.
          </p>

          <Link
            href="/dashboard/goals"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Return to Goals <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
