"use client";

import { Helmet } from "react-helmet-async";
import { seoConfig, getSeoUrl } from "@/configs/seo";

export interface PageSEOProps {
  /** Page title (e.g. "Login | Manazeit") */
  title?: string;
  /** Meta description override */
  description?: string;
  /** Canonical path (e.g. "/login") – full URL is built from config */
  path?: string;
  /** Set to true for auth/utility pages you don't want indexed */
  noIndex?: boolean;
  /** OG image override (full URL) */
  ogImage?: string;
}

/**
 * Use on individual pages to override default meta (title, description, canonical, noindex).
 * Renders inside HelmetProvider; child Helmet overrides root Helmet for same tags.
 */
export function PageSEO({
  title,
  description,
  path,
  noIndex,
  ogImage,
}: PageSEOProps) {
  const canonicalUrl = path ? getSeoUrl(path) : seoConfig.baseUrl;
  const robots = noIndex ? "noindex, nofollow" : `${seoConfig.robots.default}, ${seoConfig.robots.extra}`;
  const image = ogImage || seoConfig.ogImage;

  return (
    <Helmet>
      {title != null && <title>{title}</title>}
      {description != null && <meta name="description" content={description} />}
      {path != null && <link rel="canonical" href={canonicalUrl} />}
      <meta name="robots" content={robots} />
      {noIndex && <meta name="googlebot" content="noindex, nofollow" />}
      {title != null && <meta property="og:title" content={title} />}
      {description != null && <meta property="og:description" content={description} />}
      {path != null && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={image} />
      {title != null && <meta name="twitter:title" content={title} />}
      {description != null && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
