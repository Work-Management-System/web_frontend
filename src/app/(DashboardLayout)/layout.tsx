"use client";
// Import polyfill first to fix React 19 compatibility
import '@/utils/react-dom-polyfill';
import { styled, Container, Box, useMediaQuery } from "@mui/material";
import React, { createContext, useEffect, useState } from "react";
import Header from "@/app/(DashboardLayout)/layout/header/Header";
import Sidebar from "@/app/(DashboardLayout)/layout/sidebar/Sidebar";
import Footer from "./layout/footer/page";
import { Toaster } from 'react-hot-toast';
import NextTopLoader from "nextjs-toploader";
import { useAppselector } from "@/redux/store";
import createAxiosInstance from "../axiosInstance";
import { useRouter } from "next/navigation";
import { PaletteChangeProvider } from "@/contextapi/PaletteChangeContext";
import { TourProvider } from "@/contextapi/TourContext";
import { getMessaging, getToken } from "firebase/messaging";
import app from '@/utils/firebase';

export const SubscriptionContext = createContext<{
  isSubscriptionActive: boolean | null;
  setIsSubscriptionActive: React.Dispatch<React.SetStateAction<boolean | null>>;
}>({
  isSubscriptionActive: null,
  setIsSubscriptionActive: () => { },
});

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  backgroundImage: "var(--primary-background-image)", // Fallback image
  backgroundColor: "var(--primary-bg-colors)", // Fallback color with slight opacity
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundAttachment: "fixed", // Key for parallax effect
  position: "relative",
  overflow: "hidden",
  // "&::before": { // Optional overlay for readability
  //   content: '""',
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   width: "100%",
  //   height: "100%",
  //   background: "rgba(0, 0, 0, 0.2)", // Subtle dark overlay
  //   zIndex: 0,
  // },
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "0px",
  flexDirection: "column",
  zIndex: 1, // Ensure content is above background overlay
  backgroundColor: "transparent", // Allow background to show through
  overflowY: "auto", // Enable scrolling for content
}));

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState<boolean | null>(null);
  const [sidebarRenderKey, setSidebarRenderKey] = useState<number>(0);
  const [token, setToken] = useState('');
  const selectedColor = 'var(--primary-bg-colors)';
  const Mobile = useMediaQuery('(max-width: 767px)');
  const axiosInstance = createAxiosInstance();
  const router = useRouter();
  const authData = useAppselector((state) => state.auth.value);
  const tenantId = authData?.tenant?.id;
  const roleId = authData?.role?.id;
  console.log("Tenant ID:", tenantId);
  console.log("Role ID:", roleId);

  const checkRole = async (roleId: string) => {
    try {
      const response = await axiosInstance.get(`/role-management/get-one/${roleId}`);
      const data = response.data;
      console.log("roleId name: ", data?.data?.name);
      return data?.data?.name || null;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  };

  const checkTenantSubscription = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/subscription/tenant-plans/${id}`);
      const data = response.data;
      if (data.status === "success" && data.data.length > 0) {
        return data.data[0].status === "active";
      }
      return false;
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      return false;
    }
  };

  const rerenderSidebar = () => {
    setSidebarRenderKey((prev) => prev + 1); // Increment to force Sidebar rerender
  };

  const messaging = getMessaging(app);
  async function requestPermissionAndGenerateToken() {
    try {
      const permission = await Notification.requestPermission();
      // setNotificationPermissionStatus(permission);
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          // console.log('Registering Service Worker...');
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          // console.log('Waiting for Service Worker to be Ready...');
          const registration = await navigator.serviceWorker.ready;
          console.log('Service Worker Ready');
        }
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const currentToken = await getToken(messaging, {
            vapidKey: 'BN23rYWK-5ENfDeGBWlZ5xfv-F0U-tad8YF_b7K2POuGSEm61KNdIbo98vWv9jSzX9y1bMUlAPWFEwicPVs-BGA',
            serviceWorkerRegistration: registration,
          });
          if (currentToken) {
            console.log(currentToken);
            setToken(currentToken);
            const payload = {
              token: currentToken,
              userId: authData?.user?.id,
            };

            await axiosInstance.post(`/notification/save-fcm-token`, payload);
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        }
      } else {
        console.log('Notification permission not granted.');
      }
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  }

  useEffect(() => {
    const initialize = async () => {
      if (!tenantId && !roleId) {
        console.log('Returning from here.');
        return;
      }

      try {
        const role = await checkRole(roleId);
        console.log("User role is:", role);

        if (role === "SuperAdmin" || role === "Developer") {
          setIsSubscriptionActive(true);
          return;
        }

        const isActive = await checkTenantSubscription(tenantId);
        setIsSubscriptionActive(isActive);

        if (!isActive) {
          router.push("/user-subscriptions");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setIsSubscriptionActive(false);
        router.push("/user-subscriptions");
      }
    };

    initialize();
  }, [tenantId, roleId]);

  useEffect(() => {
    if (sidebarRenderKey > 0) {
      router.push('/dashboard');
    }
  }, [sidebarRenderKey]);

  useEffect(() => {
    requestPermissionAndGenerateToken();
  }, [])

  return (
    <PaletteChangeProvider>
      <TourProvider>
        <MainWrapper className="mainwrapper">
          <NextTopLoader />
          <SubscriptionContext.Provider value={{ isSubscriptionActive, setIsSubscriptionActive }}>
          {/* Sidebar */}
          {isSubscriptionActive && (

            <Sidebar
              key={sidebarRenderKey}
              isSidebarOpen={isSidebarOpen}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onSidebarClose={() => setMobileSidebarOpen(false)}
            />
          )}
          {/* Main Content */}
          <PageWrapper className="page-wrapper">
            {/* Header */}
            <Header
              toggleMobileSidebar={() => setMobileSidebarOpen(true)}
              rerenderSidebar={rerenderSidebar}
            />
            {/* Page Content */}
            <Container
              sx={{
                paddingTop: { xs: "80px", sm: "85px", md: "90px" },
                paddingX: { xs: 1, sm: 2, md: 3, lg: 4 },
                maxWidth: "100% !important",
                minWidth: "100% !important",
                position: "relative",
                zIndex: 1, // Ensure content is above background
              }}
            >
              <Box
                sx={{
                  minHeight: { xs: "calc(100vh - 150px)", sm: "calc(100vh - 160px)", md: "calc(100vh - 170px)" },
                  mt: { xs: 0.5, sm: 1, md: 2 },
                  borderRadius: { xs: "8px", sm: "12px", md: "16px" },
                }}
              >
                {children}
              </Box>
              {/* Footer */}
              <Footer />
            </Container>
            <Toaster position={'top-right'} toastOptions={{ className: 'react-hot-toast' }} gutter={2} />
          </PageWrapper>
        </SubscriptionContext.Provider>
      </MainWrapper>
      </TourProvider>
    </PaletteChangeProvider>
  );
}

function getAuth() {
  throw new Error("Function not implemented.");
}
