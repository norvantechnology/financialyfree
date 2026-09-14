'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Info,
  X,
  Lock,
  Search,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

export interface IndexItem {
  symbol: string;
  current: number;
  change: number;
  changePct: number;
}

export interface TechnoFundaTab {
  id: string;
  label: string;
  shortLabel?: string;
  badge?: string;
  icon?: LucideIcon;
  isLocked?: boolean;
}

export type TabCategory =
  | 'ALL'
  | 'MOMENTUM'
  | 'SMART_MONEY'
  | 'DERIVATIVES'
  | 'EARNINGS'
  | 'SECTOR_MACRO'
  | 'PRIMARY_MARKETS';

export const TAB_CATEGORY_MAP: Record<string, TabCategory> = {
  '52w-screener': 'MOMENTUM',
  'delivery-momentum': 'MOMENTUM',
  circuits: 'MOMENTUM',
  deals: 'SMART_MONEY',
  insider: 'SMART_MONEY',
  shareholding: 'SMART_MONEY',
  fno: 'DERIVATIVES',
  mmi: 'DERIVATIVES',
  pead: 'EARNINGS',
  results: 'EARNINGS',
  valuation: 'EARNINGS',
  'master-tracker': 'EARNINGS',
  news: 'EARNINGS',
  'sector-heatmap': 'SECTOR_MACRO',
  'bank-nbfc': 'SECTOR_MACRO',
  vahan: 'SECTOR_MACRO',
  orders: 'SECTOR_MACRO',
  ipo: 'PRIMARY_MARKETS',
  dividends: 'PRIMARY_MARKETS',
  buybacks: 'PRIMARY_MARKETS',
};

export const TAB_CATEGORIES: { id: TabCategory; label: string; shortLabel: string }[] = [
  { id: 'ALL', label: 'All 20 Tools', shortLabel: 'All' },
  { id: 'MOMENTUM', label: 'Momentum & Breakouts', shortLabel: 'Momentum' },
  { id: 'SMART_MONEY', label: 'Smart Money & Insiders', shortLabel: 'Smart Money' },
  { id: 'DERIVATIVES', label: 'Derivatives & Macro', shortLabel: 'Derivatives' },
  { id: 'EARNINGS', label: 'Earnings & Valuation', shortLabel: 'Earnings' },
  { id: 'SECTOR_MACRO', label: 'Sectors & Industry', shortLabel: 'Sectors' },
  { id: 'PRIMARY_MARKETS', label: 'Primary Markets', shortLabel: 'Primary' },
];

export interface TechnoFundaShellProps {
  indices: IndexItem[];
  indiaVix: number;
  isRefreshingFeeds: boolean;
  onRefreshFeeds: () => void | Promise<void>;
  feedLatencyMs?: number;
  lastSyncTimestamp?: string;
  indicesStale?: {
    isStale: boolean;
    lastUpdated?: string;
  };
  tabs: TechnoFundaTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
  disclaimer?: {
    text: string;
    subtext?: string;
    onDismiss?: () => void;
    dismissed?: boolean;
  };
  children: React.ReactNode;
}

export function TechnoFundaShell({
  indices,
  indiaVix,
  isRefreshingFeeds,
  onRefreshFeeds,
  feedLatencyMs: _feedLatencyMs,
  lastSyncTimestamp: _lastSyncTimestamp,
  indicesStale: _indicesStale,
  tabs,
  activeTab,
  onTabChange,
  title,
  subtitle: _subtitle,
  headerActions,
  disclaimer,
  children,
}: TechnoFundaShellProps) {
  const [localDismissed, setLocalDismissed] = useState(false);
  const isDismissed = disclaimer?.dismissed ?? localDismissed;

  // Navigation category clustering
  const [selectedCategory, setSelectedCategory] = useState<TabCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const quickFinderRef = useRef<HTMLDivElement | null>(null);
  const tabBarRef = useRef<HTMLElement | null>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const categoryRibbonRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detect which category the active tab belongs to
  const activeTabCategory = TAB_CATEGORY_MAP[activeTab] || 'ALL';

  // Count tabs per category
  const categoryCounts = useMemo(() => {
    const counts: Record<TabCategory, number> = {
      ALL: tabs.length,
      MOMENTUM: 0,
      SMART_MONEY: 0,
      DERIVATIVES: 0,
      EARNINGS: 0,
      SECTOR_MACRO: 0,
      PRIMARY_MARKETS: 0,
    };
    tabs.forEach((tab) => {
      const cat = TAB_CATEGORY_MAP[tab.id];
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [tabs]);

  // Filter tabs according to category selection
  const displayedTabs = useMemo(() => {
    if (selectedCategory === 'ALL') return tabs;
    return tabs.filter((tab) => TAB_CATEGORY_MAP[tab.id] === selectedCategory);
  }, [tabs, selectedCategory]);

  // Quick Finder matching or suggested tabs
  const matchingTabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      // Default suggested tools when search input is focused
      const popularIds = ['mmi', 'sector-heatmap', '52w-screener', 'delivery-momentum', 'fno', 'deals', 'pead', 'circuits'];
      return tabs.filter((t) => popularIds.includes(t.id));
    }
    return tabs.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        (t.shortLabel && t.shortLabel.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
    );
  }, [tabs, searchQuery]);

  // Listen for click/touch outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (quickFinderRef.current && !quickFinderRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Listen for `/` keyboard shortcut to focus tool search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Listen for scroll to show floating mobile quick nav button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkScrollability = useCallback(() => {
    const nav = tabBarRef.current;
    if (!nav) return;
    const { scrollLeft, scrollWidth, clientWidth } = nav;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    const nav = tabBarRef.current;
    if (!nav) return;
    const distance = Math.max(nav.clientWidth * 0.45, 220);
    nav.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
    setTimeout(checkScrollability, 350);
  };

  const scrollToActiveTab = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const nav = tabBarRef.current;
    const activeBtn = tabButtonRefs.current.get(activeTab);

    if (!nav || !activeBtn) return;

    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    const currentScrollLeft = nav.scrollLeft;
    const btnCenterRelativeToNav = btnRect.left - navRect.left + (btnRect.width / 2);
    const navCenter = navRect.width / 2;
    const targetScrollLeft = currentScrollLeft + (btnCenterRelativeToNav - navCenter);

    nav.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior,
    });
    setTimeout(checkScrollability, 350);
  }, [activeTab, checkScrollability]);

  useEffect(() => {
    scrollToActiveTab('smooth');
    const rafId = requestAnimationFrame(() => {
      scrollToActiveTab('smooth');
      checkScrollability();
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeTab, displayedTabs, scrollToActiveTab, checkScrollability]);

  // Mouse wheel horizontal scrolling listener for tab bar and category ribbon
  useEffect(() => {
    const nav = tabBarRef.current;
    const catRibbon = categoryRibbonRef.current;

    checkScrollability();

    const handleScroll = () => {
      checkScrollability();
    };

    const handleWheelNav = (e: WheelEvent) => {
      if (!nav) return;
      if (nav.scrollWidth > nav.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          nav.scrollLeft += e.deltaY * 1.1;
          checkScrollability();
        }
      }
    };

    const handleWheelCat = (e: WheelEvent) => {
      if (!catRibbon) return;
      if (catRibbon.scrollWidth > catRibbon.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          catRibbon.scrollLeft += e.deltaY * 1.1;
        }
      }
    };

    if (nav) {
      nav.addEventListener('scroll', handleScroll, { passive: true });
      nav.addEventListener('wheel', handleWheelNav, { passive: false });
    }
    if (catRibbon) {
      catRibbon.addEventListener('wheel', handleWheelCat, { passive: false });
    }
    window.addEventListener('resize', checkScrollability);

    return () => {
      if (nav) {
        nav.removeEventListener('scroll', handleScroll);
        nav.removeEventListener('wheel', handleWheelNav);
      }
      if (catRibbon) {
        catRibbon.removeEventListener('wheel', handleWheelCat);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, displayedTabs]);

  const handleCategorySelect = (catId: TabCategory) => {
    setSelectedCategory(catId);
    if (catId !== 'ALL') {
      const tabsInCat = tabs.filter((t) => TAB_CATEGORY_MAP[t.id] === catId);
      const isCurrentTabInCat = tabsInCat.some((t) => t.id === activeTab);
      if (!isCurrentTabInCat && tabsInCat.length > 0) {
        onTabChange(tabsInCat[0].id);
      }
    }
  };

  const handleSelectToolFromSearch = (tabId: string) => {
    setSelectedCategory('ALL'); // reset to show full ribbon or match category
    onTabChange(tabId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const scrollToTopNavigation = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tf-shell-wrapper">
      {/* ── 1. Slim Market Indices Ticker Ribbon ────── */}
      <div className="tf-ticker-bar" role="region" aria-label="Market Indices Ticker">
        <div className="tf-ticker-items-container">
          {(!indices || indices.length === 0) ? (
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}>
              {isRefreshingFeeds ? (
                <>
                  <div style={{ width: '12px', height: '12px', border: '2px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Connecting to market indices feed...</span>
                </>
              ) : (
                <span>Market indices feed offline</span>
              )}
            </div>
          ) : (
            <>
              {indices.map((idx) => {
                const isPositive = idx.change >= 0;
                return (
                  <div key={idx.symbol} className="tf-ticker-chip">
                    <span className="tf-ticker-symbol">{idx.symbol}</span>
                    <span className="tf-ticker-val">
                      {idx.current.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className="tf-ticker-chg"
                      style={{ color: isPositive ? '#16A34A' : '#DC2626' }}
                    >
                      {isPositive ? '+' : ''}
                      {idx.changePct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}

              {indiaVix != null && indiaVix > 0 && (
                <div className="tf-ticker-chip tf-ticker-chip-vix">
                  <span className="tf-ticker-symbol">INDIA VIX</span>
                  <span className="tf-ticker-val">{indiaVix.toFixed(2)}</span>
                  <span
                    className="tf-vix-pill"
                    style={{
                      background: indiaVix <= 15 ? '#DCFCE7' : indiaVix <= 20 ? '#FEF3C7' : '#FEE2E2',
                      color: indiaVix <= 15 ? '#166534' : indiaVix <= 20 ? '#92400E' : '#991B1B',
                    }}
                  >
                    {indiaVix <= 15 ? 'Low Vol' : indiaVix <= 20 ? 'Moderate' : 'High Vol'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sync action button */}
        <div className="tf-ticker-actions">
          <button
            id="tf-refresh-feeds-btn"
            type="button"
            onClick={onRefreshFeeds}
            disabled={isRefreshingFeeds}
            className="tf-ticker-refresh-btn"
            title="Sync market data"
          >
            <RefreshCw size={12} className={isRefreshingFeeds ? 'animate-spin' : ''} />
            <span className="tf-ticker-refresh-text">{isRefreshingFeeds ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Sticky Glassmorphic Navigation Center ────── */}
      <div className="tf-sticky-nav-container">
        {/* Header row with Title and Quick Finder */}
        <div className="tf-header-row">
          <div className="tf-title-group">
            <h1 className="tf-page-title">{title}</h1>
          </div>

          <div className="tf-header-actions">
            {/* Quick Tool Finder */}
            <div ref={quickFinderRef} className="tf-quick-finder-wrapper">
              <div className="tf-quick-finder-input-box">
                <Search size={14} className="tf-finder-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search research tools..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="tf-quick-finder-input"
                  aria-label="Search research tools"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="tf-finder-clear-btn"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <span className="tf-finder-kbd" title="Shortcut: Press / to search">/</span>
                )}
              </div>

              {/* Autocomplete dropdown */}
              {isSearchOpen && matchingTabs.length > 0 && (
                <div className="tf-finder-dropdown">
                  <div className="tf-finder-dropdown-header">
                    <span>
                      {searchQuery.trim()
                        ? `Matching Tools (${matchingTabs.length})`
                        : 'Suggested Research Tools'}
                    </span>
                  </div>
                  <div className="tf-finder-results-list">
                    {matchingTabs.map((t) => {
                      const TabIcon = t.icon;
                      const cat = TAB_CATEGORY_MAP[t.id];
                      const catLabel = TAB_CATEGORIES.find((c) => c.id === cat)?.shortLabel;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectToolFromSearch(t.id)}
                          className={`tf-finder-dropdown-item ${t.id === activeTab ? 'tf-finder-item-active' : ''}`}
                        >
                          <div className="tf-finder-item-main">
                            {TabIcon && <TabIcon size={14} className="tf-finder-item-icon" />}
                            <span className="tf-finder-item-label">{t.label}</span>
                          </div>
                          {catLabel && (
                            <span className="tf-finder-item-category">{catLabel}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Friendly empty state when no matches */}
              {isSearchOpen && searchQuery.trim().length > 0 && matchingTabs.length === 0 && (
                <div className="tf-finder-dropdown">
                  <div className="tf-finder-empty-state">
                    <p className="tf-finder-empty-title">No tools found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="tf-finder-empty-hint">Try searching for &lsquo;52W&rsquo;, &lsquo;Heatmap&rsquo;, &lsquo;F&amp;O&rsquo;, or &lsquo;Deals&rsquo;</p>
                  </div>
                </div>
              )}
            </div>

            {headerActions}
          </div>
        </div>

        {/* ── 2.1 Thematic Category Ribbon ── */}
        <div
          ref={categoryRibbonRef}
          className="tf-category-ribbon"
          role="tablist"
          aria-label="Tool Categories"
        >
          {TAB_CATEGORIES.map((cat) => {
            const isCategoryActive = selectedCategory === cat.id;
            const isParentOfCurrent = activeTabCategory === cat.id && selectedCategory === 'ALL';
            const count = categoryCounts[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isCategoryActive}
                onClick={() => handleCategorySelect(cat.id)}
                className={`tf-category-btn ${isCategoryActive ? 'tf-category-btn-active' : ''} ${isParentOfCurrent ? 'tf-category-btn-parent' : ''}`}
              >
                <span className="tf-category-btn-label">{cat.shortLabel}</span>
                <span className="tf-category-btn-count">({count})</span>
              </button>
            );
          })}
        </div>

        {/* ── 2.2 Horizontal Research Tabs Bar with Attached Controls ── */}
        {displayedTabs && displayedTabs.length > 0 && (
          <div className="tf-tab-bar-container">
            {/* Desktop Left Attached End-Cap Button */}
            {canScrollLeft && (
              <div className="tf-tab-edge-attached tf-tab-edge-left">
                <button
                  type="button"
                  onClick={() => handleScrollTabs('left')}
                  className="tf-tab-attached-btn"
                  aria-label="Scroll tabs left"
                  title="Previous tabs"
                >
                  <ChevronLeft size={15} />
                </button>
              </div>
            )}

            {/* Mobile Left Touch-Through Fade Hint */}
            {canScrollLeft && <div className="tf-tab-mobile-fade-left" aria-hidden="true" />}

            <nav
              ref={tabBarRef}
              className="tf-horizontal-tab-bar"
              aria-label="Research Navigation"
            >
              {displayedTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      if (el) {
                        tabButtonRefs.current.set(tab.id, el);
                      } else {
                        tabButtonRefs.current.delete(tab.id);
                      }
                    }}
                    type="button"
                    onClick={() => {
                      onTabChange(tab.id);
                      const nav = tabBarRef.current;
                      const btn = tabButtonRefs.current.get(tab.id);
                      if (nav && btn) {
                        const navRect = nav.getBoundingClientRect();
                        const btnRect = btn.getBoundingClientRect();
                        const currentScrollLeft = nav.scrollLeft;
                        const btnCenterRelativeToNav = btnRect.left - navRect.left + (btnRect.width / 2);
                        const navCenter = navRect.width / 2;
                        const targetScrollLeft = currentScrollLeft + (btnCenterRelativeToNav - navCenter);
                        nav.scrollTo({
                          left: Math.max(0, targetScrollLeft),
                          behavior: 'smooth',
                        });
                        setTimeout(checkScrollability, 350);
                      }
                    }}
                    className={`tf-tab-btn ${isActive ? 'tf-tab-btn-active' : ''}`}
                    title={tab.label}
                  >
                    {IconComp && <IconComp size={13} className="tf-tab-icon" />}
                    <span className="tf-tab-full-label">{tab.label}</span>
                    <span className="tf-tab-short-label">{tab.shortLabel || tab.label}</span>
                    {tab.isLocked && (
                      <Lock
                        size={10}
                        style={{
                          flexShrink: 0,
                          color: '#D97706',
                          marginLeft: '4px',
                          opacity: 0.85,
                        }}
                        aria-label="Pro Feature"
                      />
                    )}
                    {tab.badge && (
                      <span className={`tf-tab-badge ${isActive ? 'tf-tab-badge-active' : ''}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Right Touch-Through Fade Hint */}
            {canScrollRight && <div className="tf-tab-mobile-fade-right" aria-hidden="true" />}

            {/* Desktop Right Attached End-Cap Button */}
            {canScrollRight && (
              <div className="tf-tab-edge-attached tf-tab-edge-right">
                <button
                  type="button"
                  onClick={() => handleScrollTabs('right')}
                  className="tf-tab-attached-btn"
                  aria-label="Scroll tabs right"
                  title="More tabs"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Dismissible Disclaimer Strip ── */}
      {disclaimer && !isDismissed && (
        <div className="tf-disclaimer-strip" role="alert">
          <div className="tf-disclaimer-content">
            <Info size={13} className="tf-disclaimer-icon" />
            <span className="tf-disclaimer-text">
              <strong>Notice:</strong> {disclaimer.text}
              {disclaimer.subtext && <span className="tf-disclaimer-subtext"> {disclaimer.subtext}</span>}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalDismissed(true);
              disclaimer.onDismiss?.();
            }}
            className="tf-disclaimer-close-btn"
            aria-label="Dismiss notice"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── 4. Main Content Area ── */}
      <div className="tf-content-area">{children}</div>

      {/* ── 5. Mobile Floating "Back to Top Navigation" Button ── */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTopNavigation}
          className="tf-floating-top-btn"
          aria-label="Scroll back to top tools navigation"
          title="Back to tools"
        >
          <ArrowUp size={14} />
          <span>Tools</span>
        </button>
      )}
    </div>
  );
}
