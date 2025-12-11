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
            <title>Manazeit - Work Management System</title>
            <meta name="description" content="Manazeit - Comprehensive work management and productivity platform" />
            <meta name="keywords" content="work management, productivity, task management, project management, Manazeit" />
            <meta name="author" content="Manazeit" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta property="og:title" content="Manazeit - Work Management System" />
            <meta property="og:description" content="Comprehensive work management and productivity platform" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Manazeit - Work Management System" />
            <meta name="twitter:description" content="Comprehensive work management and productivity platform" />
            <link rel="icon" type="image/png" href="/images/logos/time-sheet-base-logo.png" />
            <link rel="apple-touch-icon" href="/images/logos/time-sheet-base-logo.png" />
            <link rel="shortcut icon" href="/images/logos/time-sheet-base-logo.png" />
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
