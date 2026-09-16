import type { MetadataRoute } from 'next';
import { SITE } from '../lib/marketing/site';

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api/', '/checkout/', '/kyc', '/auth/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
