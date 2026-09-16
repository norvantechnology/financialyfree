import type { Metadata } from 'next';
import { buildPageMetadata } from '../../../../lib/marketing/seo';
import { SITE, AMFI_DISCLOSURE, NOT_ADVICE_DISCLAIMER, MF_RISK_DISCLAIMER } from '../../../../lib/marketing/site';
import { LegalPageLayout } from '../../../../components/marketing/LegalPageLayout';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: `Privacy Policy for ${SITE.name} operated by ${SITE.legalEntity}.`,
  path: '/legal/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" path="/legal/privacy-policy">
      <p>Last updated: 16 September 2026.</p>
      <p>
        This Privacy Policy describes how {SITE.legalEntity} (“we”, “us”) processes personal data when
        you use {SITE.name} (the “Platform”).
      </p>
      <h2>1. Data we collect</h2>
      <p>
        Account details (name, email, phone), KYC identifiers required for mutual fund distribution,
        usage logs, subscription/billing metadata (via payment processors), and messages you send via
        Contact forms.
      </p>
      <h2>2. Purpose</h2>
      <p>
        We process data to provide Platform services, complete KYC/distributor obligations, process
        subscriptions, secure accounts, and respond to support requests — consistent with applicable
        Indian law including the Digital Personal Data Protection Act, 2023 where applicable.
      </p>
      <h2>3. Sharing</h2>
      <p>
        We may share data with KYC/KRA providers, exchange/MF execution rails (e.g. BSE StAR MF),
        payment gateways, and infrastructure vendors strictly as needed. We do not sell personal data.
      </p>
      <h2>4. Retention &amp; security</h2>
      <p>
        We retain data as needed for service, legal, and regulatory obligations, and apply safeguards
        appropriate to data sensitivity.
      </p>
      <h2>5. Contact</h2>
      <p>
        Privacy queries: {SITE.supportEmail}. {AMFI_DISCLOSURE}
      </p>
      <p>
        {NOT_ADVICE_DISCLAIMER} {MF_RISK_DISCLAIMER}
      </p>
    </LegalPageLayout>
  );
}
