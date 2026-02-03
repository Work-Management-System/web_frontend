"use client";
import React, { useCallback, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { Visibility, VisibilityOff, ArrowForward } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import Link from "next/link";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import createAxiosInstance from "@/app/axiosInstance";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setAuthDetails } from "@/redux/features/authSlice";
import { setRoleDetails } from "@/redux/features/roleSlice";
import { setUser } from "@/redux/features/userSlice";
import { motion } from "framer-motion";

interface TenantDetails {
  welcomeNote?: string;
  backgroundImage?: string;
  tenantLogo?: string;
  tagline?: string;
  tenantName?: string;
}

interface LoginValues {
  email: string;
  password: string;
  subDomain?: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // >= 900px
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultTenantDetails: TenantDetails = {
    welcomeNote: "MAGIC IS IN THE DETAILS",
    backgroundImage: '/images/backgrounds/profileback.jpg',
    tenantLogo: '/images/logos/time-sheet-base-logo.png',
    tagline: "Please use your credentials to login.",
    tenantName: "",
  };

  const [tenantDetails, setTenantDetails] = useState<TenantDetails>(defaultTenantDetails);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    profile_image?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null>(null);
  const [cardColors, setCardColors] = useState<{
    primary: string;
    secondary: string;
  }>({
    primary: "#3b82f6",
    secondary: "#2563eb",
  });
  const [logoError, setLogoError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(defaultTenantDetails.tenantLogo);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(defaultTenantDetails.backgroundImage);

  const axiosInstance = createAxiosInstance();

  // Extract dominant colors from image
  const extractColorsFromImage = (imageUrl: string): Promise<{ primary: string; secondary: string }> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            resolve({ primary: "#3b82f6", secondary: "#2563eb" });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Sample colors from the image
          const colorMap = new Map<string, number>();
          const sampleSize = 100; // Sample every Nth pixel for performance
          
          for (let i = 0; i < pixels.length; i += sampleSize * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Convert to hex
            const hex = `#${[r, g, b].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            }).join("")}`;
            
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }

          // Get most common colors
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          if (sortedColors.length >= 2) {
            // Use the two most dominant colors
            resolve({
              primary: sortedColors[0][0],
              secondary: sortedColors[1][0],
            });
          } else if (sortedColors.length === 1) {
            // If only one color, create a darker variant for secondary
            const primary = sortedColors[0][0];
            const rgb = primary.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [59, 130, 246];
            const darker = rgb.map(c => Math.max(0, c - 30));
            const secondary = `#${darker.map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            }).join("")}`;
            resolve({ primary, secondary });
          } else {
            resolve({ primary: "#3b82f6", secondary: "#2563eb" });
          }
        } catch (error) {
          console.error("Error extracting colors:", error);
          resolve({ primary: "#3b82f6", secondary: "#2563eb" });
        }
      };

      img.onerror = () => {
        resolve({ primary: "#3b82f6", secondary: "#2563eb" });
      };

      img.src = imageUrl;
    });
  };

  // Extract colors from background image and logo
  const extractTenantColors = async () => {
    try {
      // Try to extract from background image first
      if (tenantDetails.backgroundImage) {
        const colors = await extractColorsFromImage(tenantDetails.backgroundImage);
        setCardColors(colors);
        return;
      }
      
      // Fallback to logo if background image is not available
      if (tenantDetails.tenantLogo) {
        const colors = await extractColorsFromImage(tenantDetails.tenantLogo);
        setCardColors(colors);
        return;
      }
    } catch (error) {
      console.error("Error extracting tenant colors:", error);
      // Keep default colors
    }
  };

  const getSubdomain = (): string => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      
      // Check if hostname is an IP address (e.g., 127.0.0.1, 192.168.1.1)
      const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipAddressRegex.test(hostname)) {
        return "";
      }
      
      const parts = hostname.split(".");
      
      // Handle localhost (e.g., subdomain.localhost:3000)
      if (parts.length >= 2 && parts[1] === "localhost") {
        return parts[0];
      }
      
      // Handle production domains
      // For subdomain.example.com, parts.length will be 3
      // For example.com, parts.length will be 2
      // Only return subdomain if we have at least 3 parts (subdomain.domain.tld)
      if (parts.length >= 3) {
        const subdomain = parts[0];
        // Exclude common prefixes that aren't subdomains
        if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
          return subdomain;
        }
      }
      
      // For 2-part domains (example.com) or other cases, return empty string
      return "";
    }
    return "";
  };

  // Normalize URL for localhost development
  const normalizeLocalhostUrl = (url: string): string => {
    try {
      // Check if URL contains 127.0.0.1 with subdomain (invalid format)
      const invalidLocalhostPattern = /^https?:\/\/([^.]+)\.127\.0\.0\.1(:\d+)?/;
      const match = url.match(invalidLocalhostPattern);
      
      if (match) {
        const subdomain = match[1];
        const pathAndQuery = url.replace(invalidLocalhostPattern, '');
        
        // Use current window's port (frontend port) instead of backend port
        const currentPort = typeof window !== "undefined" ? window.location.port : '';
        const port = currentPort ? `:${currentPort}` : '';
        
        // Convert to valid localhost format: subdomain.localhost:frontendPort
        const normalizedUrl = `http://${subdomain}.localhost${port}${pathAndQuery}`;
        return normalizedUrl;
      }
      
      // Also handle if URL already has subdomain.localhost but wrong port
      const localhostPattern = /^https?:\/\/([^.]+)\.localhost(:\d+)?/;
      const localhostMatch = url.match(localhostPattern);
      if (localhostMatch && typeof window !== "undefined") {
        const subdomain = localhostMatch[1];
        const pathAndQuery = url.replace(localhostPattern, '');
        const currentPort = window.location.port;
        const port = currentPort ? `:${currentPort}` : '';
        
        // Reconstruct with correct frontend port
        const normalizedUrl = `http://${subdomain}.localhost${port}${pathAndQuery}`;
        return normalizedUrl;
      }
      
      return url;
    } catch (error) {
      console.error("Error normalizing URL:", error);
      return url;
    }
  };

  const fetchTenantData = async () => {
    try {
      const tenant = getSubdomain();
      
      // Only fetch tenant data if we have a valid, non-empty subdomain
      if (!tenant || typeof tenant !== 'string' || tenant.trim() === '' || tenant === '127' || tenant === 'localhost') {
        setTenantDetails(defaultTenantDetails);
        return;
      }

      // Set tenant in cookie to ensure axios instance uses it
      if (tenant && typeof window !== "undefined") {
        Cookies.set('tenant', tenant, { expires: 7, path: '/' });
      }

      const response = await axiosInstance.get(`/tenants/get-by-subdomain/${encodeURIComponent(tenant)}`);
      if (response.status === 200 && response.data?.data) {
        const logo = response?.data?.data?.logo;
        const background_image = response?.data?.data?.background_image;
        const welcome_note = response?.data?.data?.welcome_note;
        const tenant_name = response?.data?.data?.tenant_name;

        // Validate URLs before using them
        const isValidUrl = (url: string): boolean => {
          if (!url || url.trim() === '') return false;
          try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
          } catch {
            return false;
          }
        };

        // Fallback to generic assets when tenant images are missing/empty or invalid
        const resolvedLogo =
          logo && logo.trim() !== '' && isValidUrl(logo) 
            ? logo 
            : defaultTenantDetails.tenantLogo;
        const resolvedBackground =
          background_image && background_image.trim() !== '' && isValidUrl(background_image)
            ? background_image
            : defaultTenantDetails.backgroundImage;
        
        const welcomeNote = welcome_note || defaultTenantDetails.welcomeNote;
        const tagline = `Welcome to ${tenant_name || 'our platform'}`;

        setTenantDetails({
          tenantLogo: resolvedLogo,
          backgroundImage: resolvedBackground,
          welcomeNote,
          tagline,
          tenantName: tenant_name,
        });
        
        // Store current URLs for error handling
        setCurrentLogoUrl(resolvedLogo);
        setCurrentBackgroundUrl(resolvedBackground);
      } else {
        setTenantDetails(defaultTenantDetails);
        // Ensure default URLs are set
        setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
        setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
      }
    } catch (error: any) {
      console.error("Error fetching tenant data:", error);
      setTenantDetails(defaultTenantDetails);
      // Ensure default URLs are set even on error
      setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
      setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const initialValues: LoginValues = {
    email: emailFromUrl || "",
    password: "",
  };

  const validationSchemaStep1 = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const validationSchemaStep2 = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const formik = useFormik<LoginValues>({
    initialValues,
    validationSchema: step === 1 ? validationSchemaStep1 : validationSchemaStep2,
    onSubmit: async (values: LoginValues, { resetForm }) => {
      if (step === 1) {
        try {
          setLoading(true);
          const tenant = getSubdomain();
          const params = new URLSearchParams({ email: values.email });
          if (tenant) {
            params.append('sub_domain', tenant);
          }

          const response = await axiosInstance.get(`/auth/tenant-subdomain?${params.toString()}`);
          // Check for successful response with loginUrl
          // Handle both possible response structures
          const responseData = response.data?.data || response.data;
          const loginUrl = responseData?.loginUrl || response.data?.loginUrl;
          const subdomain = responseData?.subdomain || response.data?.subdomain;
          const responseMessage = (response.data?.message || responseData?.message || '').toLowerCase();
          
          // CRITICAL VALIDATION: The backend returns a fallback loginUrl even when user doesn't exist
          // We need to check if the response indicates a real user or just a fallback
          const hasLoginUrl = loginUrl && typeof loginUrl === "string" && loginUrl.trim().length > 0;
          const hasSubdomain = subdomain && typeof subdomain === "string" && subdomain.trim().length > 0;
          const isFallbackResponse = responseMessage.includes('fallback');
          const currentSubdomain = getSubdomain();
          
          // Debug logging
          console.log('Email validation response:', {
            hasLoginUrl,
            hasSubdomain,
            subdomain,
            isFallbackResponse,
            responseMessage,
            currentSubdomain,
            status: response.status
          });
          
          // If no loginUrl at all, user doesn't exist
          if (!hasLoginUrl) {
            toast.error("No account found with this email address. Please check your email and try again.");
            setLoading(false);
            return;
          }
          
          // CRITICAL: If response says "Fallback to base domain" with no subdomain, 
          // it means the backend couldn't find the user in the database
          // The backend only returns fallback when getTenantSubdomainByEmail returns null
          // if (isFallbackResponse && !hasSubdomain) {
          //   console.log('Rejecting: Fallback response with no subdomain indicates user not found');
          //   toast.error("No account found with this email address. Please check your email and try again.");
          //   setLoading(false);
          //   return;
          // }
          
          // Additional check: If response status is not 200, user doesn't exist
          if (response.status !== 200) {
            toast.error("No account found with this email address. Please check your email and try again.");
            setLoading(false);
            return;
          }
          
          // If we have a subdomain from DB (not fallback), user exists - proceed
          // If we're on a subdomain and got a valid response, user exists - proceed
          // Only reject if it's a fallback with no subdomain
          
          // If we passed all validation checks, proceed with login
          if (hasLoginUrl) {
            const currentSubdomain = getSubdomain();

            // Check if we need to redirect to a different subdomain
            const needsRedirect = subdomain && subdomain !== currentSubdomain;
            const isOnBaseDomain = !currentSubdomain && subdomain;

            if (needsRedirect || isOnBaseDomain) {
              // Redirect to the tenant's subdomain
              try {
                // Normalize URL for localhost (fixes 127.0.0.1 subdomain issue)
                const normalizedUrl = normalizeLocalhostUrl(loginUrl);
                
                // Validate URL before redirecting
                if (normalizedUrl && (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://'))) {
                  // Additional validation: try to create a URL object to ensure it's valid
                  try {
                    new URL(normalizedUrl);
                    window.location.href = normalizedUrl;
                    return;
                  } catch (urlError) {
                    console.error("Invalid URL format after normalization:", normalizedUrl, urlError);
                    toast.error("Invalid redirect URL format. Please try again.");
                    setLoading(false);
                    return;
                  }
                } else {
                  console.error("Invalid loginUrl format:", normalizedUrl);
                  toast.error("Invalid redirect URL. Please try again.");
                  setLoading(false);
                  return;
                }
              } catch (redirectError) {
                console.error("Error during redirect:", redirectError);
                toast.error("Failed to redirect. Please try again.");
                setLoading(false);
                return;
              }
            }

            // We're on the correct subdomain (or no subdomain needed), proceed to step 2
            // Set user info with email (user details will be fetched after successful login)
            setUserInfo({
              profile_image: '',
              first_name: '',
              last_name: '',
              email: values.email,
            });

            // Move to step 2 on current domain
            setStep(2);
            setLoading(false);
          } else {
            // This should not happen due to earlier checks, but handle it anyway
            toast.error("No account found with this email address. Please check your email and try again.");
            setLoading(false);
          }
        } catch (error: any) {
          // Handle 404 and other errors
          const statusCode = error?.response?.status;
          const errorMessage = error?.response?.data?.message;
          
          if (statusCode === 404 || errorMessage?.toLowerCase().includes('not found') || errorMessage?.toLowerCase().includes('user')) {
            toast.error("No account found with this email address. Please check your email and try again.");
          } else {
            toast.error(errorMessage || "Failed to verify email. Please try again.");
          }
          setLoading(false);
        }
      } else {
        setLoading(true);
        try {
          const tenant = getSubdomain();

          const payload = {
            ...values,
            ...(tenant && { subDomain: tenant }),
          };

          const response = await axiosInstance.post(`/auth/password-login`, payload);
          if (response.status === 200) {
            // Check if password not set - redirect to set-password page with OTP flow
            if (response?.data?.data?.message === 'Password not set yet.' || 
                response?.data?.message === 'Password not set yet.' ||
                response?.data?.data?.url) {
              const redirectUrl = response?.data?.data?.url || 
                                 `/set-password?email=${encodeURIComponent(values.email)}`;
              console.log("Password not set, redirecting to:", redirectUrl);
              window.location.href = redirectUrl;
              setLoading(false);
              return;
            }

            // Get token from response
            const token = response.data.data;
            
            // Validate token exists
            if (!token || typeof token !== 'string') {
              console.error('Invalid token received:', token);
              toast.error("Login failed: Invalid token received");
              setLoading(false);
              return;
            }

            // Set token cookie with proper options
            Cookies.set("access_token", token, {
              expires: 7,
              path: "/",
              sameSite: "lax",
              secure: window.location.protocol === "https:"
            });

            // Handle login success (this sets tenant cookie and dispatches auth)
            try {
              await handleLoginSuccess(token);
              toast.success(response.data.message || "Login successful");
              resetForm();
              
              // Navigate to dashboard after a brief delay
              // Use relative URL to stay on current domain (localhost or production)
              setTimeout(() => {
                const currentHostname = window.location.hostname;
                const isLocalhost = currentHostname.includes('localhost') || currentHostname === '127.0.0.1';
                
                // Always use relative URL to preserve current domain
                window.location.href = "/dashboard";
              }, 300);
            } catch (loginError: any) {
              console.error("Error in handleLoginSuccess:", loginError);
              toast.error(loginError.message || "Login successful but session initialization failed");
              setLoading(false);
            }
          } else {
            toast.error(response.data.message?.message || response.data.message || "Login failed!");
            setLoading(false);
          }
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message?.[0]?.message ||
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong!";
          toast.error(errorMessage);
          setLoading(false);
        }
      }
    },
  });

  type DecodedToken = {
    user?: {
      id: number;
      email: string;
      phone: string;
    };
    tenant?: {
      id?: string | null;
      tenant_name?: string | null;
      schema_name?: string | null;
      subdomain?: string | null;
      background_image?: string | null;
      address?: string | null;
      welcome_note?: string | null;
      login_process?: string | null;
    } | null;
    role?: {
      id?: string | null;
      name?: string | null;
    } | null;
    timestamp?: string;
    iat?: number;
    exp?: number;
  };

  const handleLoginSuccess = useCallback(
    async (token: string) => {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Validate token has required fields
        if (!decoded?.user) {
          throw new Error("Invalid token: missing user details");
        }

        const hostname = window?.location?.hostname || "";
        const isLocalhost = hostname.includes("localhost") || hostname === "127.0.0.1";

        // Set tenant cookie with proper options
        if (decoded?.tenant?.subdomain) {
          Cookies.set("tenant", decoded.tenant.subdomain, {
            expires: 7,
            path: "/",
            sameSite: "lax",
            secure: window.location.protocol === "https:"
          });
          setTenantSubdomain(decoded.tenant.subdomain);
        } else {
          Cookies.remove("tenant");
          setTenantSubdomain(null);
        }

        const authData = {
          user: {
            id: decoded.user.id,
            email: decoded.user.email,
            phone: decoded.user.phone,
          },
          tenant: {
            id: decoded?.tenant?.id ?? null,
            tenant_name: decoded?.tenant?.tenant_name ?? null,
            schema_name: decoded?.tenant?.schema_name ?? null,
            subdomain: decoded?.tenant?.subdomain ?? null,
            background_image: decoded?.tenant?.background_image ?? null,
            address: decoded?.tenant?.address ?? null,
            welcome_note: decoded?.tenant?.welcome_note ?? null,
            login_process: decoded?.tenant?.login_process ?? null,
          },
          role: {
            id: decoded.role?.id ?? null,
            name: decoded.role?.name ?? null,
          },
          token,
          iat: decoded.iat ?? 0,
          exp: decoded.exp ?? 0,
        };

        // Fetch role details if role ID exists
        if (decoded.role?.id) {
          try {
            const res = await fetchRole(decoded.role.id);
            if (res?.name) {
              // Update role name in authData
              authData.role.name = res.name;
              
              // For Administrator and regular users, fetch user details
              if (res.name !== "SuperAdmin" && res.name !== "Developer") {
                try {
                  await fetchUser(decoded.user.id);
                } catch (userError: any) {
                  console.warn("Failed to fetch user details:", userError);
                  // Continue even if user fetch fails
                }
              }
            }
          } catch (roleError: any) {
            console.error("Error fetching role:", roleError);
            // If role fetch fails but we have role data from token, continue
            if (decoded.role?.name) {
              authData.role.name = decoded.role.name;
            }
            // Don't throw - allow login to continue
          }
        } else {
          console.warn("No role ID found in token. Role-based features may not work.");
        }

        // Dispatch auth details
        dispatch(setAuthDetails(authData));
      } catch (error: any) {
        console.error("Error in handleLoginSuccess:", error);
        throw error; // Re-throw to let caller handle it
      }
    },
    [dispatch]
  );

  const fetchRole = async (id: string) => {
    const res = await axiosInstance.get(`/role-management/get-one/${id}`);
    if (!res.data.status) throw new Error("Failed to fetch users");
    const data = await res.data;
    dispatch(setRoleDetails(data?.data));
    return data.data;
  };

  const fetchUser = async (id: any) => {
    const res = await axiosInstance.get(`/user/find-one/${id}`);
    if (!res.data.status) throw new Error("Failed to fetch users");
    const data = await res.data;
    dispatch(setUser(data?.data));
    return data.data;
  };

  useEffect(() => {
    fetchTenantData();
    const email = searchParams?.get("email");
    
    if (email) {
      const decodedEmail = decodeURIComponent(email);
      setEmailFromUrl(decodedEmail);
      formik.setFieldValue("email", decodedEmail);
      
      // Validate email from URL before proceeding to step 2
      const validateEmailFromUrl = async () => {
        try {
          setLoading(true);
          const tenant = getSubdomain();
          const params = new URLSearchParams({ email: decodedEmail });
          if (tenant) {
            params.append('sub_domain', tenant);
          }

          const response = await axiosInstance.get(`/auth/tenant-subdomain?${params.toString()}`);
          
          const responseData = response.data?.data || response.data;
          const loginUrl = responseData?.loginUrl || response.data?.loginUrl;
          const hasLoginUrl = loginUrl && typeof loginUrl === "string" && loginUrl.trim().length > 0;
          
          if (hasLoginUrl && response.status === 200) {
            // Email is valid, proceed to step 2
            setStep(2);
            setUserInfo({
              profile_image: '',
              first_name: '',
              last_name: '',
              email: decodedEmail,
            });
          } else {
            // Email doesn't exist, show error and stay on step 1
            toast.error("No account found with this email address. Please check your email and try again.");
            setStep(1);
          }
        } catch (error: any) {
          // Handle errors - user doesn't exist
          const statusCode = error?.response?.status;
          if (statusCode === 404 || statusCode === 400) {
            toast.error("No account found with this email address. Please check your email and try again.");
          } else {
            toast.error("Failed to verify email. Please try again.");
          }
          setStep(1);
        } finally {
          setLoading(false);
        }
      };
      
      validateEmailFromUrl();
    }
  }, [searchParams]);

  // Re-extract colors when tenant details change
  useEffect(() => {
    console.log("=== Tenant Details Changed ===");
    console.log("Current tenantLogo:", tenantDetails.tenantLogo);
    console.log("Current backgroundImage:", tenantDetails.backgroundImage);
    
    // Reset error states when tenant details change
    setLogoError(false);
    setBackgroundError(false);
    
    if (tenantDetails.backgroundImage || tenantDetails.tenantLogo) {
      extractTenantColors();
    }
  }, [tenantDetails.backgroundImage, tenantDetails.tenantLogo]);

  const backgroundImage = tenantDetails.backgroundImage;
  const tenantLogo = tenantDetails.tenantLogo;
  const welcomeNote = tenantDetails.welcomeNote;

  const handleAnimationComplete = () => {
    router.push("/");
  };

  if (showLoadingAnimation) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `var(--primary-bg-colors)`,
          position: "relative",
          overflow: "hidden",
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          style={{
            backgroundImage: backgroundError ? 'none' : `url(${backgroundImage})`,
            backgroundColor: backgroundError ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeIn" }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle, var(--primary-color-1) 10%, transparent 70%)`,
              opacity: 0.3,
              animation: "pulse 2s infinite",
            }}
          />
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--primary-1-text-color)" }}
          >
            Welcome Back!
          </h1>
          <motion.p
            className="mt-2 text-lg"
            style={{ color: "var(--secondary-color)" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.5;
            }
            100% {
              transform: scale(1);
              opacity: 0.3;
            }
          }
        `}</style>
      </motion.div>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          width: "100vw",
          backgroundColor: backgroundError ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
          padding: isMobile ? "20px 20px 180px 20px" : "40px 40px 200px 40px",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 1,
            pointerEvents: "none", // Allow clicks to pass through
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.05)",
            zIndex: 1,
            pointerEvents: "none", // Allow clicks to pass through
          },
        }}
      >
        {/* Background image as absolute positioned img element for better CORS handling */}
        {currentBackgroundUrl && (
          <Box
            component="img"
            src={currentBackgroundUrl}
            alt=""
            crossOrigin="anonymous"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              zIndex: 0,
              pointerEvents: "none", // Allow clicks to pass through
              display: backgroundError ? "none" : "block",
            }}
            onError={(e) => {
              console.warn("Background image failed to load:", currentBackgroundUrl);
              if (!backgroundError) {
                setBackgroundError(true);
                // Fallback to default if current URL is not already the default
                if (currentBackgroundUrl !== defaultTenantDetails.backgroundImage) {
                  setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
                  setBackgroundError(false); // Reset to try default
                }
              }
            }}
            onLoad={() => {
              if (backgroundError) {
                setBackgroundError(false);
              }
            }}
          />
        )}
        {/* Time and Date Display */}
        <Box
          sx={{
            position: "absolute",
            top: isMobile ? "20px" : "40px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: 600,
              color: "#ffffff",
              mb: 0.5,
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
          </Typography>
          <Typography
            sx={{
              fontSize: isMobile ? "0.875rem" : "1rem",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.95)",
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>

        {/* Welcome Text and Tagline */}
            <Box
              sx={{
                position: "fixed",
            bottom: isMobile ? "20px" : "40px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 2,
            maxWidth: "90%",
            width: "auto",
            pointerEvents: "none", // Allow clicks to pass through
          }}
        >
              <Typography
                sx={{
              fontSize: isMobile ? "1.25rem" : "1.75rem",
              fontWeight: 700,
              color: "#ffffff",
              mb: 1,
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            {tenantDetails.welcomeNote || "Welcome"}
              </Typography>
          {/* {tenantDetails.tagline && (
              <Typography
                sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.9)",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
              }}
            >
              {tenantDetails.tagline}
              </Typography>
          )} */}
            </Box>

        {/* Step 1: Email Entry */}
        {step === 1 && (
          <Card
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{
              width: isMobile ? "90%" : isTablet ? "420px" : "480px",
              maxWidth: "480px",
              background: `linear-gradient(135deg, ${cardColors.primary}40 0%, ${cardColors.secondary}35 100%)`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              padding: isMobile ? "40px 32px" : "48px 40px",
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15)`,
              position: "relative",
              zIndex: 2,
              mt: isMobile ? "80px" : "100px",
              mb: isMobile ? "160px" : "180px",
              transition: "background 0.5s ease, box-shadow 0.5s ease",
              minHeight: isMobile ? "auto" : "400px", // Prevent card from shrinking too much
            }}
          >
            <CardContent sx={{ padding: 0 }}>
              {/* Logo */}
              <Box sx={{ 
                mb: 4, 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                minHeight: isMobile ? "100px" : "120px",
                height: isMobile ? "100px" : "120px",
              }}>
                {currentLogoUrl ? (
                  <Box
                    component="img"
                    src={currentLogoUrl}
                    alt="logo"
                    crossOrigin="anonymous"
                    sx={{
                      objectFit: "contain",
                      maxHeight: isMobile ? "100px" : "120px",
                      maxWidth: isMobile ? "200px" : "240px",
                      width: "auto",
                      height: "auto",
                      display: "block",
                    }}
                    onError={() => {
                      if (!logoError && currentLogoUrl !== defaultTenantDetails.tenantLogo) {
                        setLogoError(true);
                        setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
                        setLogoError(false); // Reset to try default
                      } else {
                        setLogoError(true);
                      }
                    }}
                    onLoad={() => {
                      if (logoError) {
                        setLogoError(false);
                      }
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: isMobile ? "200px" : "240px",
                      height: isMobile ? "100px" : "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "white", opacity: 0.7 }}>
                      Logo
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                  variant="h4"
                sx={{
                    fontSize: isMobile ? "2.25rem" : "2.75rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    mb: 4,
                    letterSpacing: "-0.5px",
                    lineHeight: 1.2,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
              >
                Login
              </Typography>
              </Box>
              {/* Email Input and Next Button in Single Row */}
              <Box sx={{ 
                display: "flex", 
                flexDirection: "column",
                gap: 1,
              }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 0,
                  position: "relative"
                }}>
                <TextField
                  fullWidth
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      formik.handleSubmit();
                    }
                  }}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  variant="outlined"
                    placeholder="Enter your email"
                    sx={{
                      flex: 1,
                      pr: isMobile ? "25px" : "25px", // Add padding to prevent text overlap with button
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        height: isMobile ? "56px" : "60px",
                        fontSize: isMobile ? "16px" : "17px",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          borderWidth: "1px",
                        },
                        "&:hover": {
                          backgroundColor: "#ffffff",
                          "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.5)",
                          },
                        },
                        "&.Mui-focused": {
                          backgroundColor: "#ffffff",
                          "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.8)",
                            borderWidth: "1px",
                          },
                        },
                        "&.Mui-error fieldset": {
                          borderColor: "#ef4444",
                        },
                      },
                      "& .MuiInputBase-input": {
                        padding: isMobile ? "18px 20px" : "20px 22px",
                        color: "#1f2937",
                        "&::placeholder": {
                          color: "#6b7280",
                          opacity: 1,
                        },
                      },
                      "& .MuiFormHelperText-root": {
                        position: "absolute",
                        top: "100%",
                        marginTop: "4px",
                        marginLeft: 0,
                        color: "#ffffff",
                        textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  />
                  <IconButton
                    type="submit"
                    disabled={formik.isSubmitting || loading || !formik.values.email}
                    sx={{
                      width: isMobile ? "56px" : "60px",
                      height: isMobile ? "56px" : "60px",
                      backgroundColor: formik.values.email ? "#3b82f6" : "#e5e7eb",
                      color: formik.values.email ? "#ffffff" : "#9ca3af",
                      borderRadius: "50%",
                      boxShadow: formik.values.email ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                      flexShrink: 0,
                      ml: "-16px", // Increased negative margin to remove gap
                      transition: "all 0.3s ease",
                      "&:hover:not(:disabled)": {
                        backgroundColor: formik.values.email ? "#2563eb" : "#d1d5db",
                        transform: "scale(1.05)",
                      },
                      "&:disabled": {
                        backgroundColor: "#f3f4f6",
                        color: "#9ca3af",
                      },
                    }}
                  >
                    <ArrowForward sx={{ fontSize: isMobile ? "24px" : "26px" }} />
                  </IconButton>
              </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profile Card with Password */}
        {step === 2 && userInfo && (
          <Card
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{
              width: isMobile ? "90%" : isTablet ? "480px" : "540px",
              maxWidth: "540px",
              background: `linear-gradient(135deg, ${cardColors.primary}40 0%, ${cardColors.secondary}35 100%)`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "24px",
              padding: isMobile ? "48px 32px" : "56px 40px",
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15)`,
              position: "relative",
              zIndex: 1,
              mt: isMobile ? "80px" : "100px",
              mb: isMobile ? "160px" : "180px",
              transition: "background 0.5s ease, box-shadow 0.5s ease",
              minHeight: isMobile ? "auto" : "400px", // Prevent card from shrinking too much
            }}
          >
            <CardContent sx={{ padding: 0 }}>
              {/* Tenant Logo */}
              {currentLogoUrl && (
                <Box sx={{ 
                  mb: 3, 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  minHeight: isMobile ? "80px" : "100px",
                }}>
                  <Box
                    component="img"
                    src={currentLogoUrl}
                    alt="logo"
                    crossOrigin="anonymous"
                    sx={{
                      objectFit: "contain",
                      maxHeight: isMobile ? "80px" : "100px",
                      maxWidth: isMobile ? "160px" : "200px",
                      width: "auto",
                      height: "auto",
                      display: "block",
                    }}
                    onError={() => {
                      if (!logoError && currentLogoUrl !== defaultTenantDetails.tenantLogo) {
                        setLogoError(true);
                        setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
                        setLogoError(false); // Reset to try default
                      } else {
                        setLogoError(true);
                      }
                    }}
                    onLoad={() => {
                      if (logoError) {
                        setLogoError(false);
                      }
                    }}
                  />
                </Box>
              )}
              
              {/* Profile Picture - Only show if valid profile image exists */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                {userInfo.profile_image && 
                 userInfo.profile_image !== '/images/profile/defaultprofile.jpg' && 
                 userInfo.profile_image.trim() !== '' && (
                  <Avatar
                    src={userInfo.profile_image}
                    alt={userInfo.first_name || 'User'}
                    sx={{
                      width: isMobile ? 100 : 120,
                      height: isMobile ? 100 : 120,
                      border: "4px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                      mb: 2,
                    }}
                  />
                )}
                
                {/* User Name */}
                <Typography
                  sx={{
                    fontSize: isMobile ? "1.5rem" : "1.75rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    textAlign: "center",
                    mb: 0.5,
                  }}
                >
                  {userInfo.first_name && userInfo.last_name
                    ? `${userInfo.first_name} ${userInfo.last_name}`
                    : userInfo.first_name || userInfo.email?.split('@')[0] || 'User'}
                </Typography>
                
                {/* Email */}
                <Typography
                  sx={{
                    fontSize: isMobile ? "0.938rem" : "1rem",
                    fontWeight: 400,
                    color: "rgba(255, 255, 255, 0.95)",
                    textAlign: "center",
                  }}
                >
                  {userInfo.email || formik.values.email}
                </Typography>
              </Box>

              {/* Password Field with Action Button */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 0, // Remove gap between password field and arrow button
                  }}
                >
                    <TextField
                      fullWidth
                      name="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          formik.handleSubmit();
                        }
                      }}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={formik.touched.password && formik.errors.password}
                      variant="outlined"
                      type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePassword}
                            edge="end"
                            sx={{
                              color: "#6b7280",
                              "&:hover": {
                                backgroundColor: "rgba(107, 114, 128, 0.1)",
                              },
                            }}
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ fontSize: isMobile ? "20px" : "22px" }} />
                            ) : (
                              <Visibility sx={{ fontSize: isMobile ? "20px" : "22px" }} />
                            )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    sx={{
                      flex: 1,
                      pr: isMobile ? "72px" : "25px", // Add padding to prevent text overlap with arrow button
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        height: isMobile ? "56px" : "60px",
                        fontSize: isMobile ? "16px" : "17px",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          borderWidth: "1px",
                        },
                        "&:hover": {
                          backgroundColor: "#ffffff",
                          "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.5)",
                          },
                        },
                        "&.Mui-focused": {
                          backgroundColor: "#ffffff",
                          "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.8)",
                            borderWidth: "1px",
                          },
                        },
                        "&.Mui-error fieldset": {
                          borderColor: "#ef4444",
                        },
                      },
                      "& .MuiInputBase-input": {
                        padding: isMobile ? "18px 20px" : "20px 22px",
                        paddingRight: isMobile ? "50px" : "56px", // Space for eye icon
                        color: "#1f2937",
                        "&::placeholder": {
                          color: "#6b7280",
                          opacity: 1,
                        },
                      },
                      "& .MuiFormHelperText-root": {
                        position: "absolute",
                        top: "100%",
                        marginTop: "4px",
                        marginLeft: 0,
                        color: "#ffffff",
                        textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  />
                  
                  {/* Circular Submit Button - Positioned at End */}
                  <IconButton
                      type="submit"
                    disabled={formik.isSubmitting || loading || !formik.values.password}
                      sx={{
                      width: isMobile ? "56px" : "60px",
                      height: isMobile ? "56px" : "60px",
                      backgroundColor: formik.values.password ? "#3b82f6" : "#e5e7eb",
                      color: formik.values.password ? "#ffffff" : "#9ca3af",
                      borderRadius: "50%",
                      boxShadow: formik.values.password ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                      flexShrink: 0,
                      zIndex: 2,
                      ml: "-16px", // Increased negative margin to remove gap
                      transition: "all 0.3s ease",
                      "&:hover:not(:disabled)": {
                        backgroundColor: formik.values.password ? "#2563eb" : "#d1d5db",
                        transform: "scale(1.05)",
                      },
                      "&:active:not(:disabled)": {
                        transform: "scale(0.98)",
                      },
                      "&:disabled": {
                        backgroundColor: "#f3f4f6",
                        color: "#9ca3af",
                      },
                    }}
                  >
                    <ArrowForward sx={{ fontSize: isMobile ? "24px" : "26px", fontWeight: 600 }} />
                  </IconButton>
                  </Box>
              </Box>

              {/* Forgot Password Link - Only show on step 2 (password entry) */}
              {step === 2 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Link href={{ pathname: "/set-password", query: { email: formik.values.email } }}>
                    <Typography
                    sx={{
                        fontSize: isMobile ? "0.875rem" : "0.938rem",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontWeight: 400,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Forget Password?
                    </Typography>
                  </Link>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
      <Toaster position={"top-right"} toastOptions={{ className: "react-hot-toast" }} gutter={2} />
    </>
  );
};

export default LoginPage;