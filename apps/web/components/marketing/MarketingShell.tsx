import React from 'react';
import '../../styles/marketing.css';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { ComplianceBanner } from './primitives';

export function MarketingShell({
  children,
  solidHeader = false,
}: {
  children: React.ReactNode;
  solidHeader?: boolean;
}) {
  return (
    <div className="mkt">
      <ComplianceBanner />
      <MarketingHeader forceSolid={solidHeader} />
      {children}
      <MarketingFooter />
    </div>
  );
}
