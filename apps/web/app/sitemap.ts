import type { MetadataRoute } from 'next';
import { getAllSlugs } from '../lib/marketing/blog';
import { SITE } from '../lib/marketing/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, '');
  const staticPaths = [
    '',
    '/about',
    '/features',
    '/pricing',
    '/contact',
    '/blog',
    '/faq',
    '/legal/privacy-policy',
    '/legal/terms',
    '/legal/refund-policy',
    '/legal/disclaimer',
    '/courses',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/blog' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/pricing' || path === '/features' ? 0.9 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = getAllSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
