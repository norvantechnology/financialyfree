import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  absoluteUrl,
  getAllSlugs,
  getPostBySlug,
  renderBlogMarkdown,
} from '../../../../lib/marketing/blog';
import { buildPageMetadata } from '../../../../lib/marketing/seo';
import { JsonLd } from '../../../../components/marketing/JsonLd';
import { Breadcrumbs } from '../../../../components/marketing/primitives';
import { SITE } from '../../../../lib/marketing/site';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
  });
}

export default function BlogArticlePage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: absoluteUrl(`/blog/${post.slug}`),
      },
    ],
  };

  return (
    <>
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <article className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
          />
          <header style={{ maxWidth: 720, margin: '0 auto 28px' }}>
            <p className="mkt-text-muted" style={{ fontSize: '0.9rem' }}>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              {' · '}
              {post.readingMinutes} min read · {post.author}
            </p>
            <h1 className="mkt-serif mkt-page-title" style={{ margin: '8px 0 12px' }}>
              {post.title}
            </h1>
            <p className="mkt-text-muted" style={{ fontSize: '1.05rem' }}>{post.description}</p>
          </header>
          <div
            className="mkt-article"
            dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(post.content) }}
          />
          <footer className="mkt-article" style={{ marginTop: 40, fontSize: '0.9rem', color: 'var(--mkt-muted)' }}>
            <p>
              <Link href="/blog">← Back to blog</Link>
            </p>
          </footer>
        </div>
      </article>
    </>
  );
}
