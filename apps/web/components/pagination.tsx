'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
  compact?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items',
  className = '',
  compact = false,
}: PaginationProps) {
  // Safe bounds
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Generate visible page numbers with smart ellipsis windowing
  const pageNumbers = useMemo(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const showLeftEllipsis = safeCurrentPage > 3;
    const showRightEllipsis = safeCurrentPage < safeTotalPages - 2;

    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (showRightEllipsis) {
      pages.push('ellipsis');
    }

    if (safeTotalPages > 1) {
      pages.push(safeTotalPages);
    }

    return pages;
  }, [safeCurrentPage, safeTotalPages]);

  // Range calculation
  const rangeInfo = useMemo(() => {
    if (typeof totalItems !== 'number' || typeof itemsPerPage !== 'number' || totalItems <= 0) {
      return null;
    }
    const start = (safeCurrentPage - 1) * itemsPerPage + 1;
    const end = Math.min(safeCurrentPage * itemsPerPage, totalItems);
    return `${start}-${end} of ${totalItems}`;
  }, [safeCurrentPage, itemsPerPage, totalItems]);

  if (safeTotalPages <= 1 && (!totalItems || totalItems <= (itemsPerPage || 10))) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`tf-pagination-container ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '16px',
        marginTop: '16px',
        borderTop: '1px solid #EAE6DF',
      }}
    >
      {/* Range Info */}
      <div
        className="tf-pagination-info"
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {rangeInfo ? (
          <>
            <span style={{ fontWeight: 600, color: '#0F172A' }}>{rangeInfo}</span>
            <span>{itemName}</span>
          </>
        ) : (
          <span>
            Page <strong style={{ color: '#0F172A' }}>{safeCurrentPage}</strong> of{' '}
            <strong style={{ color: '#0F172A' }}>{safeTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div
        className="tf-pagination-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {/* First Page (Only on desktop if many pages) */}
        {!compact && safeTotalPages > 6 && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            title="First page"
            className="tf-page-nav-btn tf-page-nav-first"
            aria-label="Go to first page"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '34px',
              height: '34px',
              padding: '0 6px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              background: safeCurrentPage === 1 ? '#F8FAFC' : '#FFFFFF',
              color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
              cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronsLeft size={15} />
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          title="Previous page"
          className="tf-page-nav-btn"
          aria-label="Go to previous page"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: '34px',
            height: '34px',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            background: safeCurrentPage === 1 ? '#F8FAFC' : '#FFFFFF',
            color: safeCurrentPage === 1 ? '#94A3B8' : '#1E293B',
            cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronLeft size={15} />
          <span className="tf-pagination-label-desktop">Prev</span>
        </button>

        {/* Desktop Page Numbers */}
        <div className="tf-pagination-pages" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {pageNumbers.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    height: '34px',
                    color: '#94A3B8',
                    fontSize: '13px',
                    fontWeight: 700,
                    userSelect: 'none',
                  }}
                >
                  &hellip;
                </span>
              );
            }

            const isActive = page === safeCurrentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                className={`tf-page-num-btn ${isActive ? 'tf-page-active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '34px',
                  height: '34px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  background: isActive ? '#0F172A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#334155',
                  cursor: isActive ? 'default' : 'pointer',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '0 1px 3px rgba(15, 23, 42, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile Compact Page Indicator */}
        <div
          className="tf-pagination-mobile-indicator"
          style={{
            display: 'none',
            fontSize: '12px',
            fontWeight: 600,
            color: '#1E293B',
            padding: '0 8px',
          }}
        >
          {safeCurrentPage} / {safeTotalPages}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === safeTotalPages}
          title="Next page"
          className="tf-page-nav-btn"
          aria-label="Go to next page"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: '34px',
            height: '34px',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            background: safeCurrentPage === safeTotalPages ? '#F8FAFC' : '#FFFFFF',
            color: safeCurrentPage === safeTotalPages ? '#94A3B8' : '#1E293B',
            cursor: safeCurrentPage === safeTotalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          <span className="tf-pagination-label-desktop">Next</span>
          <ChevronRight size={15} />
        </button>

        {/* Last Page (Only on desktop if many pages) */}
        {!compact && safeTotalPages > 6 && (
          <button
            type="button"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={safeCurrentPage === safeTotalPages}
            title="Last page"
            className="tf-page-nav-btn tf-page-nav-last"
            aria-label="Go to last page"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '34px',
              height: '34px',
              padding: '0 6px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              background: safeCurrentPage === safeTotalPages ? '#F8FAFC' : '#FFFFFF',
              color: safeCurrentPage === safeTotalPages ? '#94A3B8' : '#334155',
              cursor: safeCurrentPage === safeTotalPages ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronsRight size={15} />
          </button>
        )}
      </div>
    </nav>
  );
}
