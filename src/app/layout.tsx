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
      <body>
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
      </body>
    </html>
  );
}
