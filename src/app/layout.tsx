"use client";
// Import polyfill first to fix React 19 compatibility with react-joyride
import '@/utils/react-dom-polyfill';
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@/app/global.css";
import { Provider } from "react-redux";
import store, { persistor } from "@/redux/store";
import { Toaster } from 'react-hot-toast';
import { PersistGate } from 'redux-persist/integration/react';
import { Poppins } from "next/font/google";
import 'sweetalert2/dist/sweetalert2.min.css';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { seoConfig, getAllStructuredData } from "@/configs/seo";

const poppins = Poppins({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className} suppressHydrationWarning>
        <HelmetProvider>
          <Helmet>
            <title>{seoConfig.defaultTitle}</title>
            <meta name="description" content={seoConfig.defaultDescription} />
            <meta name="keywords" content={seoConfig.keywords} />
            <meta name="author" content={seoConfig.author} />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content={`${seoConfig.robots.default}, ${seoConfig.robots.extra}`} />
            <meta name="googlebot" content={seoConfig.robots.default} />
            <link rel="canonical" href={seoConfig.baseUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={seoConfig.baseUrl} />
            <meta property="og:title" content={seoConfig.defaultTitle} />
            <meta property="og:description" content={seoConfig.shortDescription} />
            <meta property="og:image" content={seoConfig.ogImage} />
            <meta property="og:site_name" content={seoConfig.siteName} />
            <meta property="og:locale" content={seoConfig.locale} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={seoConfig.baseUrl} />
            <meta name="twitter:title" content={seoConfig.defaultTitle} />
            <meta name="twitter:description" content={seoConfig.shortDescription} />
            <meta name="twitter:image" content={seoConfig.ogImage} />
            <meta name="twitter:site" content={seoConfig.twitterHandle} />

            {/* Additional SEO */}
            <meta name="theme-color" content={seoConfig.themeColor} />
            <meta name="application-name" content={seoConfig.siteName} />
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" type="image/png" href="/images/logos/manazeit_logo.png" />
            <link rel="apple-touch-icon" href="/images/logos/manazeit_logo.png" />
            <link rel="shortcut icon" href="/images/logos/manazeit_logo.png" />

            {/* Structured Data (JSON-LD) for SEO */}
            {getAllStructuredData().map((schema, i) => (
              <script
                key={i}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
              />
            ))}
          </Helmet>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <ThemeProvider theme={baselightTheme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                {children}
                <Toaster
                  position={'top-right'}
                  toastOptions={{
                    className: 'react-hot-toast',
                  }}
                  gutter={2} />
              </ThemeProvider>
            </PersistGate>
          </Provider>
        </HelmetProvider>
      </body>
    </html>
  );
}
