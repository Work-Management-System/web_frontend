"use client";
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
    <html lang="en">
      <body className={poppins.className}>
        <HelmetProvider>
          <Helmet>
            <title>Manazeit - Work Management System | Streamline Your Team's Productivity</title>
            <meta name="description" content="Manazeit is a comprehensive work management platform featuring task management, project tracking, attendance, leave management, and team collaboration. Boost productivity with our all-in-one solution." />
            <meta name="keywords" content="work management, productivity software, task management, project management, team collaboration, attendance tracking, leave management, work reports, team management, project tracking, Manazeit, workflow automation, business management software" />
            <meta name="author" content="Manazeit" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow" />
            <link rel="canonical" href="https://manazeit.com" />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://manazeit.com" />
            <meta property="og:title" content="Manazeit - Work Management System | Streamline Your Team's Productivity" />
            <meta property="og:description" content="The all-in-one platform for project management, task tracking, attendance, and team collaboration. Built for modern teams." />
            <meta property="og:image" content="https://manazeit.com/images/logos/time-sheet-base-logo.png" />
            <meta property="og:site_name" content="Manazeit" />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content="https://manazeit.com" />
            <meta name="twitter:title" content="Manazeit - Work Management System | Streamline Your Team's Productivity" />
            <meta name="twitter:description" content="The all-in-one platform for project management, task tracking, attendance, and team collaboration. Built for modern teams." />
            <meta name="twitter:image" content="https://manazeit.com/images/logos/time-sheet-base-logo.png" />
            
            {/* Additional SEO */}
            <meta name="theme-color" content="#0798bd" />
            <meta name="application-name" content="Manazeit" />
            <link rel="icon" type="image/png" href="/images/logos/time-sheet-base-logo.png" />
            <link rel="apple-touch-icon" href="/images/logos/time-sheet-base-logo.png" />
            <link rel="shortcut icon" href="/images/logos/time-sheet-base-logo.png" />
            
            {/* Structured Data for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  "name": "Manazeit",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "150"
                  },
                  "description": "Comprehensive work management platform featuring task management, project tracking, attendance, leave management, and team collaboration.",
                  "url": "https://manazeit.com",
                  "featureList": [
                    "Task Management",
                    "Project Management",
                    "Attendance Tracking",
                    "Leave Management",
                    "Work Reports",
                    "Team Collaboration",
                    "Multi-tenant Architecture",
                    "Real-time Analytics"
                  ]
                })
              }}
            />
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
