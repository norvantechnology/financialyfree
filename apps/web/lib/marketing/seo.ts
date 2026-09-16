import type { Metadata } from 'next';
import { SITE } from './site';
import { absoluteUrl } from './blog';

type BuildMetaInput = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  images?: string[];
};

export function buildPageMetadata({
  title,
  description,
  path,
  type = 'website',
  images,
}: BuildMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImages = (images || ['/og-default.svg']).map((src) => ({
    url: absoluteUrl(src),
    width: 1200,
    height: 630,
    alt: title,
  }));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      locale: 'en_IN',
      type,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  };
}
