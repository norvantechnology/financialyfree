import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../lib/marketing/seo';
import {
  SITE,
  AMFI_DISCLOSURE,
  NOT_ADVICE_DISCLAIMER,
  MF_RISK_DISCLAIMER,
} from '../../../../lib/marketing/site';
import { LegalPageLayout } from '../../../../components/marketing/LegalPageLayout';

export const metadata: Metadata = buildPageMetadata({
  title: 'Disclaimer',
  description: `Regulatory and product disclaimer for ${SITE.name} / ${SITE.legalEntity}.`,
  path: '/legal/disclaimer',
});

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Disclaimer" path="/legal/disclaimer">
      <p>Last updated: 16 September 2026.</p>
      <h2>1. Distributor status</h2>
      <p>{AMFI_DISCLOSURE}</p>
      <h2>2. Not investment advice</h2>
      <p>{NOT_ADVICE_DISCLAIMER}</p>
      <h2>3. Market risk</h2>
      <p>{MF_RISK_DISCLAIMER}</p>
      <h2>4. Data &amp; tools</h2>
      <p>
        Market data may be delayed. Screeners, valuation models, and filing parsers can contain
        errors or incomplete upstream data. Always verify against primary exchange documents.
      </p>
      <h2>5. No performance promises</h2>
      <p>
        Past performance does not guarantee future results. We do not publish fabricated testimonials
        or unverifiable user-count claims.
      </p>
      <h2>6. Contact</h2>
      <p>
        {SITE.supportEmail} · {SITE.legalEntity}
      </p>
    </LegalPageLayout>
  );
}
