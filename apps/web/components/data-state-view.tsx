import React from 'react';
import { AlertTriangle, Database, RefreshCw, Layers, Clock } from 'lucide-react';
import { formatRelativeTime } from '../lib/time-utils';

export interface DataStateProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  isStale?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  lastUpdated?: string;
  source?: string;
  children?: React.ReactNode;
}

export function DataLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '56px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export function DataEmptyState({
  title = 'No Records Found',
  description = 'There are no active records matching your current criteria or filters.',
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px dashed var(--border-color, #E8E4DC)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#F8F6F1',
          color: '#64748B',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Layers size={22} />
      </div>
      <h3
        className="font-serif"
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary, #111827)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-muted, #6B7280)',
          maxWidth: '420px',
          margin: '0 auto 20px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '8px 18px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function DataErrorState({
  message = 'Unable to synchronize table dataset from live provider.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#FEF2F2',
        borderRadius: '12px',
        border: '1px solid #FEE2E2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={20} color="#DC2626" />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B' }}>
            Data Loading Interrupted
          </div>
          <div style={{ fontSize: '12px', color: '#B91C1C' }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Retry Query
        </button>
      )}
    </div>
  );
}

export function DataStaleIndicator({
  lastUpdated,
  onRefresh,
}: {
  lastUpdated?: string;
  onRefresh?: () => void;
}) {
  const relTime = formatRelativeTime(lastUpdated);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: '#FFFBEB',
        border: '1px solid #FEF3C7',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#92400E',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={12} />
        <span title={lastUpdated}>
          Cached snapshot ({relTime ? `updated ${relTime}` : lastUpdated || 'earlier today'})
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            background: 'none',
            border: 'none',
            color: '#B45309',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '11px',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Refresh Feed
        </button>
      )}
    </div>
  );
}

export function DataSourceMeta({
  source = 'Daily Portfolio & NAV Feed',
  lastUpdated,
}: {
  source?: string;
  lastUpdated?: string;
}) {
  const relTime = formatRelativeTime(lastUpdated);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted, #6B7280)',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle, #F0ECE3)',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Database size={12} />
        <span>Source: {source}</span>
      </div>
      {lastUpdated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={lastUpdated}>
          <Clock size={12} />
          <span>Last sync: {relTime ? `${relTime}` : lastUpdated}</span>
        </div>
      )}
    </div>
  );
}

export function DataStateContainer({
  isLoading,
  isEmpty,
  isError,
  isStale,
  errorMessage,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  lastUpdated,
  source,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <DataLoadingSkeleton />;
  }

  if (isError) {
    return <DataErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <DataEmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div>
      {isStale && <DataStaleIndicator lastUpdated={lastUpdated} onRefresh={onRetry} />}
      {children}
      {(source || lastUpdated) && <DataSourceMeta source={source} lastUpdated={lastUpdated} />}
    </div>
  );
}
