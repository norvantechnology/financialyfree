import { absoluteUrl } from '../../lib/marketing/blog';
import { JsonLd } from './JsonLd';
import { Breadcrumbs } from './primitives';

export function LegalPageLayout({
  title,
  path,
  children,
}: {
  title: string;
  path: string;
  children: React.ReactNode;
}) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: title, item: absoluteUrl(path) },
    ],
  };
  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <section className="mkt-section">
        <div className="mkt-container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
          <article className="mkt-article">
            <h1 className="mkt-serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
              {title}
            </h1>
            {children}
          </article>
        </div>
      </section>
    </>
  );
}
