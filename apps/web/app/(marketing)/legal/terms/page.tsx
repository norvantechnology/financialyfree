import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../lib/marketing/seo';
import { SITE, AMFI_DISCLOSURE, NOT_ADVICE_DISCLAIMER, MF_RISK_DISCLAIMER } from '../../../../lib/marketing/site';
import { LegalPageLayout } from '../../../../components/marketing/LegalPageLayout';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use',
  description: `Terms of Use for ${SITE.name} operated by ${SITE.legalEntity}.`,
  path: '/legal/terms',
});

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use" path="/legal/terms">
      <p>Last updated: 16 September 2026.</p>
      <p>
        By accessing {SITE.name}, you agree to these Terms with {SITE.legalEntity}.
      </p>
      <h2>1. Services</h2>
      <p>
        The Platform provides goal-planning tools, educational Academy content, Techno-Funda research
        decision-support tools, and mutual fund distribution services under AMFI registration{' '}
        {SITE.amfiArn}.
      </p>
      <h2>2. No investment advice</h2>
      <p>{NOT_ADVICE_DISCLAIMER}</p>
      <h2>3. Accounts &amp; eligibility</h2>
      <p>
        You must provide accurate information, safeguard credentials, and use the Platform only for
        lawful purposes. KYC and investment execution are subject to exchange, AMC, and regulatory
        rules.
      </p>
      <h2>4. Subscriptions</h2>
      <p>
        Paid plans renew according to checkout terms. See Refund Policy for cancellation/refund
        handling.
      </p>
      <h2>5. Acceptable use</h2>
      <p>
        Do not scrape, abuse APIs, reverse engineer, or redistribute proprietary research tooling
        beyond personal use rights granted by your plan.
      </p>
      <h2>6. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.legalEntity} is not liable for investment losses
        or decisions made using educational tools. {MF_RISK_DISCLAIMER}
      </p>
      <h2>7. Contact</h2>
      <p>
        {SITE.supportEmail}. {AMFI_DISCLOSURE}
      </p>
    </LegalPageLayout>
  );
}
