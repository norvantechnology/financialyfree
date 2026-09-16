import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '../../../lib/marketing/seo';
import { getAllPosts } from '../../../lib/marketing/blog';
import { absoluteUrl } from '../../../lib/marketing/blog';
import { JsonLd } from '../../../components/marketing/JsonLd';
import { Breadcrumbs, Reveal } from '../../../components/marketing/primitives';
import { NOT_ADVICE_DISCLAIMER } from '../../../lib/marketing/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog — Goals, Research & Compliance Explainers',
  description:
    'Educational articles on goal-based SIPs, Techno-Funda research, and AMFI distributor compliance from FinanciallyFree.',
  path: '/blog',
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
          <Reveal>
            <span className="mkt-kicker">Blog</span>
            <h1 className="mkt-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: 0 }}>
              Notes for disciplined investors
            </h1>
            <p className="mkt-lead">{NOT_ADVICE_DISCLAIMER}</p>
          </Reveal>
          <div className="mkt-grid-3">
            {posts.map((post) => (
              <article key={post.slug} className="mkt-card">
                <time dateTime={post.date} style={{ fontSize: '0.82rem', color: 'var(--mkt-muted)' }}>
                  {new Date(post.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
                <h2 className="mkt-serif" style={{ fontSize: '1.2rem', margin: '8px 0' }}>
                  <Link href={`/blog/${post.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {post.title}
                  </Link>
                </h2>
                <p style={{ color: 'var(--mkt-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {post.description}
                </p>
                <Link href={`/blog/${post.slug}`} className="mkt-btn mkt-btn-outline-dark">
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
