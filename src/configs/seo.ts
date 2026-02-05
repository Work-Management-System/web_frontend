/**
 * Centralized SEO configuration for Manazeit Work Management.
 * Use this for meta tags, Open Graph, Twitter, JSON-LD, sitemap, and manifest.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://manazeit.com";
const SITE_NAME = "Manazeit";
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/logos/manazeit_logo.png`;
const THEME_COLOR = "#0798bd";

export const seoConfig = {
  baseUrl: BASE_URL.replace(/\/$/, ""),
  siteName: SITE_NAME,
  defaultTitle: `${SITE_NAME} - Work Management System | Streamline Your Team's Productivity`,
  defaultDescription:
    "Manazeit is a comprehensive work management platform featuring task management, project tracking, attendance, leave management, and team collaboration. Boost productivity with our all-in-one solution.",
  shortDescription:
    "The all-in-one platform for project management, task tracking, attendance, and team collaboration. Built for modern teams.",
  keywords: [
    "work management",
    "productivity software",
    "task management",
    "project management",
    "team collaboration",
    "attendance tracking",
    "leave management",
    "work reports",
    "team management",
    "project tracking",
    "Manazeit",
    "workflow automation",
    "business management software",
    "Kanban",
    "timesheet",
    "multi-tenant",
  ].join(", "),
  author: SITE_NAME,
  themeColor: THEME_COLOR,
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || DEFAULT_OG_IMAGE,
  locale: "en_US",
  twitterHandle: "@manazeit",
  social: {
    facebook: "https://www.facebook.com/manazeit/",
    twitter: "https://x.com/manazeit",
    instagram: "https://www.instagram.com/manazeit.com/",
    linkedin: "https://linkedin.com/company/manazeit/",
    email: "info@manazeit.com",
    website: "https://www.manazeit.com",
  },
  robots: {
    default: "index, follow",
    extra: "max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
  featureList: [
    "Task Management",
    "Project Management",
    "Attendance Tracking",
    "Leave Management",
    "Work Reports",
    "Team Collaboration",
    "Multi-tenant Architecture",
    "Real-time Analytics",
    "Kanban Boards",
    "Daily Work Reports",
    "Role-based Access",
  ],
} as const;

/** Public routes to include in sitemap (path only, base URL appended in sitemap) */
export const sitemapRoutes = [
  "",
  "/blog",
  "/login",
  "/register",
  "/set-password",
] as const;

/** Build full URL for a path */
export function getSeoUrl(path: string): string {
  const base = seoConfig.baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** SoftwareApplication schema for JSON-LD */
export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoConfig.siteName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: seoConfig.baseUrl,
    description: "Comprehensive work management platform featuring task management, project tracking, attendance, leave management, and team collaboration.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    featureList: seoConfig.featureList,
  };
}

/** Organization schema for JSON-LD */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.siteName,
    url: seoConfig.baseUrl,
    logo: seoConfig.ogImage,
    sameAs: [
      seoConfig.social.facebook,
      seoConfig.social.twitter,
      seoConfig.social.instagram,
      seoConfig.social.linkedin,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: seoConfig.social.email,
      contactType: "customer service",
      url: seoConfig.social.website,
    },
  };
}

/** WebSite schema for JSON-LD (helps with sitelinks search box) */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.siteName,
    url: seoConfig.baseUrl,
    description: seoConfig.defaultDescription,
    publisher: {
      "@type": "Organization",
      name: seoConfig.siteName,
      logo: {
        "@type": "ImageObject",
        url: seoConfig.ogImage,
      },
    },
    inLanguage: "en-US",
  };
}

/** All JSON-LD schemas to inject in layout */
export function getAllStructuredData() {
  return [
    getSoftwareApplicationSchema(),
    getOrganizationSchema(),
    getWebSiteSchema(),
  ];
}
