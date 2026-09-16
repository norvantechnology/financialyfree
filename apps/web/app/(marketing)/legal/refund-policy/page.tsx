import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../lib/marketing/seo';
import { SITE } from '../../../../lib/marketing/site';
import { LegalPageLayout } from '../../../../components/marketing/LegalPageLayout';

export const metadata: Metadata = buildPageMetadata({
  title: 'Refund Policy',
  description: `Refund Policy for ${SITE.name} subscriptions operated by ${SITE.legalEntity}.`,
  path: '/legal/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy" path="/legal/refund-policy">
      <p>Last updated: 16 September 2026.</p>
      <h2>1. Digital subscriptions</h2>
      <p>
        Tools Annual, DIY Wealth Bundle, and All-Access Mastermind are digital annual subscriptions.
        Access begins when payment succeeds and entitlements unlock.
      </p>
      <h2>2. Refund window</h2>
      <p>
        If you have not meaningfully consumed paid research/Academy access, you may request a refund
        within <strong>7 days</strong> of purchase by emailing {SITE.supportEmail} with your order ID.
        Approved refunds are processed to the original payment method via our payment gateway.
      </p>
      <h2>3. Non-refundable cases</h2>
      <p>
        Refunds may be declined after substantial usage of paid desks/courses, after the 7-day
        window, for chargeback abuse, or where prohibited by payment-partner rules.
      </p>
      <h2>4. Mutual fund investments</h2>
      <p>
        Mutual fund purchase and SIP amounts are governed directly by AMC scheme and exchange rules, not by this
        platform subscription refund policy.
      </p>
      <h2>5. Contact</h2>
      <p>
        Billing: {SITE.supportEmail}. Entity: {SITE.legalEntity}.
      </p>
    </LegalPageLayout>
  );
}
