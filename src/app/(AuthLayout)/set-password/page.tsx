"use client";
import React, { useEffect, useState } from "react";
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
import toast, { Toaster } from "react-hot-toast";
import { Visibility, VisibilityOff, ArrowForward } from "@mui/icons-material";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import createAxiosInstance from "@/app/axiosInstance";
import Cookies from "js-cookie";

interface SetPasswordValues {
  email: string;
  password: string;
  otp: string;
  confirmPassword: string;
}

interface TenantDetails {
  welcomeNote?: string;
  backgroundImage?: string;
  tenantLogo?: string;
  tenantName?: string;
  tagline?: string;
}

const SetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const searchParams = useSearchParams();
  const router = useRouter();
  const axiosInstance = createAxiosInstance();

  const defaultTenantDetails: TenantDetails = {
    welcomeNote: "PLEASE SET YOUR PASSWORD TO ACTIVATE YOUR ACCOUNT.",
    backgroundImage: '/images/backgrounds/profileback.jpg',
    tenantLogo: '/images/logos/time-sheet-base-logo.png',
    tenantName: "Our Portal",
    tagline: "Please set your password to continue.",
  };

  const [tenantDetails, setTenantDetails] = useState<TenantDetails>(defaultTenantDetails);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailDisabled, setIsEmailDisabled] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
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

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

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
          
          const colorMap = new Map<string, number>();
          const sampleSize = 100;
          
          for (let i = 0; i < pixels.length; i += sampleSize * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            if (a < 128) continue;
            
            const hex = `#${[r, g, b].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            }).join("")}`;
            
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }

          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          if (sortedColors.length >= 2) {
            resolve({
              primary: sortedColors[0][0],
              secondary: sortedColors[1][0],
            });
          } else if (sortedColors.length === 1) {
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

  const extractTenantColors = async () => {
    try {
      if (tenantDetails.backgroundImage) {
        const colors = await extractColorsFromImage(tenantDetails.backgroundImage);
        setCardColors(colors);
        return;
      }
      
      if (tenantDetails.tenantLogo) {
        const colors = await extractColorsFromImage(tenantDetails.tenantLogo);
        setCardColors(colors);
        return;
      }
    } catch (error) {
      console.error("Error extracting tenant colors:", error);
    }
  };

  const getSubdomain = (): string => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipAddressRegex.test(hostname)) {
        return "";
      }
      
      const parts = hostname.split(".");
      
      if (parts.length >= 2 && parts[1] === "localhost") {
        return parts[0];
      }
      
      if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
          return subdomain;
        }
      }
      
      return "";
    }
    return "";
  };

  const fetchTenantData = async () => {
    try {
      let tenant = getSubdomain();
      if (!tenant) {
        tenant = searchParams?.get("tenant") || Cookies.get("tenant") || "";
      }
      
      if (!tenant) {
        setTenantDetails(defaultTenantDetails);
        setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
        setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
        return;
      }
      
      const response = await axiosInstance.get(`/tenants/get-by-subdomain/${tenant}`);
      
      if (response.status === 200 && response.data?.data) {
        const logo = response?.data?.data?.logo;
        const background_image = response?.data?.data?.background_image || response?.data?.data?.backgroud_image;
        const welcome_note = response?.data?.data?.welcome_note;
        const tenant_name = response?.data?.data?.tenant_name;
        
        const isValidUrl = (url: string): boolean => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };
        
        const resolvedLogo = logo && logo.trim() !== '' && isValidUrl(logo) 
          ? logo 
          : defaultTenantDetails.tenantLogo;
        const resolvedBackground = background_image && background_image.trim() !== '' && isValidUrl(background_image)
          ? background_image
          : defaultTenantDetails.backgroundImage;
        const welcomeNote = welcome_note || defaultTenantDetails.welcomeNote;
        const resolvedTenantName = tenant_name || defaultTenantDetails.tenantName;
        const tagline = `Welcome to ${resolvedTenantName || 'our platform'}`;

        setTenantDetails({
          tenantLogo: resolvedLogo,
          backgroundImage: resolvedBackground,
          welcomeNote,
          tenantName: resolvedTenantName,
          tagline,
        });
        
        setCurrentLogoUrl(resolvedLogo);
        setCurrentBackgroundUrl(resolvedBackground);
      } else {
        setTenantDetails(defaultTenantDetails);
        setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
        setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
      }
    } catch (error: any) {
      console.error("Error fetching tenant data:", error);
      setTenantDetails(defaultTenantDetails);
      setCurrentLogoUrl(defaultTenantDetails.tenantLogo);
      setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
    }
  };

  const generateOtp = async () => {
    if (!formik.values.email) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const tenant = getSubdomain();
      const tenantFromQuery = searchParams?.get("tenant");
      const tenantFromCookie = Cookies.get("tenant");
      const finalTenant = tenant || tenantFromQuery || tenantFromCookie;
      
      if (finalTenant) {
        Cookies.set("tenant", finalTenant, { expires: 7 });
      }
      
      const response = await axiosInstance.post(`/auth/generate-otp`, {
        email: formik.values.email,
      });
      
      if (response.status === 200) {
        toast.success("OTP sent to your email");
        setOtpGenerated(true);
        setResendCooldown(60);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to generate OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    
    setResendLoading(true);
    try {
      const response = await axiosInstance.post(`/auth/generate-otp`, {
        email: formik.values.email,
      });
      
      if (response.status === 200) {
        toast.success("OTP resent to your email");
        setResendCooldown(60);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to resend OTP";
      const statusCode = error?.response?.status;
      
      if (statusCode === 429 || errorMessage.includes("Maximum resend attempts")) {
        setResendCooldown(600);
      }
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const getTenantUrl = (path: string): string => {
    const tenant = Cookies.get("tenant") || searchParams?.get("tenant");
    if (!tenant || !/^[a-zA-Z0-9-]+$/.test(tenant)) {
      return path;
    }
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const isLocalhost = window?.location?.hostname.includes("localhost");
    const baseDomain = isLocalhost
      ? "localhost:3000"
      : window?.location?.hostname.replace(/^[a-zA-Z0-9-]+\./, "");
    const port = isLocalhost ? `:${window?.location.port || "3000"}` : "";
    return `${protocol}://${tenant}.${baseDomain}${port}${path}`;
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    otp: Yup.string()
      .required("OTP is required")
      .matches(/^\d+$/, "OTP must be a number"),
    confirmPassword: Yup.string()
      .required("Confirm Password is required")
      .oneOf([Yup.ref("password")], "Passwords must match"),
  });

  const formik = useFormik<SetPasswordValues>({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const tenantFromQuery = searchParams?.get("tenant");
        const tenantFromSubdomain = getSubdomain();
        const tenantFromCookie = Cookies.get("tenant");
        const tenant = tenantFromQuery || tenantFromSubdomain || tenantFromCookie;
        
        if (tenant) {
          Cookies.set("tenant", tenant, { expires: 7 });
        }
        
        const response = await axiosInstance.post(`/auth/set-password`, values);
        if (response.status === 200) {
          toast.success(response.data.message || "Password set successfully!");
          resetForm();
          // Redirect to login with email as query parameter
          const baseLoginUrl = getTenantUrl("/login");
          const redirectUrl = `${baseLoginUrl}${baseLoginUrl.includes('?') ? '&' : '?'}email=${encodeURIComponent(values.email)}`;
          router.push(redirectUrl);
        } else {
          toast.error(response.data.message || "Failed to set password");
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong!";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendCooldown]);

  useEffect(() => {
    fetchTenantData();
    
    const tenantFromQuery = searchParams?.get("tenant");
    const tenantFromSubdomain = getSubdomain();
    const tenantFromCookie = Cookies.get("tenant");
    const tenant = tenantFromSubdomain || tenantFromQuery || tenantFromCookie;
    
    if (tenant) {
      Cookies.set("tenant", tenant, { expires: 7 });
    }
    
    const email = searchParams?.get("email");
    
    if (email) {
      formik.setFieldValue("email", email);
      setIsEmailDisabled(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setLogoError(false);
    setBackgroundError(false);
    
    if (tenantDetails.backgroundImage || tenantDetails.tenantLogo) {
      extractTenantColors();
    }
  }, [tenantDetails.backgroundImage, tenantDetails.tenantLogo]);

  const backgroundImage = tenantDetails.backgroundImage;
  const tenantLogo = tenantDetails.tenantLogo;
  const welcomeNote = tenantDetails.welcomeNote;

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
          padding: isMobile ? "20px 20px 220px 20px" : "40px 40px 240px 40px",
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
            pointerEvents: "none",
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
            pointerEvents: "none",
          },
        }}
      >
        {/* Background image */}
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
              pointerEvents: "none",
              display: backgroundError ? "none" : "block",
            }}
            onError={(e) => {
              console.warn("Background image failed to load:", currentBackgroundUrl);
              if (!backgroundError) {
                setBackgroundError(true);
                if (currentBackgroundUrl !== defaultTenantDetails.backgroundImage) {
                  setCurrentBackgroundUrl(defaultTenantDetails.backgroundImage);
                  setBackgroundError(false);
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
            bottom: isMobile ? "30px" : "50px",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 3,
            maxWidth: "90%",
            width: "auto",
            pointerEvents: "none",
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
          {tenantDetails.tagline && (
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
          )}
        </Box>

        {/* Main Card */}
        <Card
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{
            width: isMobile ? "90%" : isTablet ? "420px" : "480px",
            maxWidth: "480px",
            background: `linear-gradient(135deg, ${cardColors.primary} 0%, ${cardColors.secondary} 100%)`,
            borderRadius: "24px",
            padding: isMobile ? "40px 32px" : "48px 40px",
            boxShadow: `0 20px 60px ${cardColors.primary}40, 0 8px 24px ${cardColors.secondary}30`,
            position: "relative",
            zIndex: 2,
            mt: isMobile ? "80px" : "100px",
            mb: isMobile ? "200px" : "220px",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
            minHeight: isMobile ? "auto" : "400px",
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
                      setLogoError(false);
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
                Set Your Password
              </Typography>
            </Box>

            {/* Email Input */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                variant="outlined"
                placeholder="Enter your email"
                disabled={isEmailDisabled}
                sx={{
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
            </Box>

            {/* Generate OTP Button */}
            {!otpGenerated && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <IconButton
                  onClick={generateOtp}
                  disabled={loading || !formik.values.email}
                  sx={{
                    width: isMobile ? "56px" : "60px",
                    height: isMobile ? "56px" : "60px",
                    backgroundColor: formik.values.email ? "#3b82f6" : "#e5e7eb",
                    color: formik.values.email ? "#ffffff" : "#9ca3af",
                    borderRadius: "50%",
                    boxShadow: formik.values.email ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                    flexShrink: 0,
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
                  <ArrowForward sx={{ fontSize: isMobile ? "24px" : "26px", fontWeight: 600 }} />
                </IconButton>
              </Box>
            )}

            {/* Password Fields and OTP (shown after OTP is generated) */}
            {otpGenerated && (
              <>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    variant="outlined"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    sx={{
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
                        paddingRight: isMobile ? "50px" : "56px",
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
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    variant="outlined"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    sx={{
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
                        paddingRight: isMobile ? "50px" : "56px",
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
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    name="otp"
                    value={formik.values.otp}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.otp && Boolean(formik.errors.otp)}
                    helperText={formik.touched.otp && formik.errors.otp}
                    variant="outlined"
                    placeholder="Enter OTP"
                    sx={{
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
                        textAlign: "center",
                        letterSpacing: "0.5em",
                        "&::placeholder": {
                          color: "#6b7280",
                          opacity: 1,
                          letterSpacing: "normal",
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
                  <Box sx={{ 
                    mt: 1, 
                    display: "flex", 
                    justifyContent: "flex-end", 
                    alignItems: "center", 
                    gap: 1 
                  }}>
                    <Button
                      variant="text"
                      onClick={resendOtp}
                      disabled={resendLoading || resendCooldown > 0}
                      sx={{
                        color: resendCooldown > 0 ? "#ffffff" : "#ffffff",
                        textTransform: "none",
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                        minWidth: "auto",
                        padding: isMobile ? "2px 4px" : "4px 8px",
                        opacity: resendCooldown > 0 ? 0.6 : 1,
                        "&:hover": {
                          backgroundColor: "transparent",
                          textDecoration: "underline",
                        },
                        "&:disabled": {
                          color: "#ffffff",
                          opacity: 0.5,
                        },
                      }}
                    >
                      {resendLoading
                        ? "Resending..."
                        : resendCooldown > 0
                        ? `Resend OTP (${resendCooldown}s)`
                        : "Resend OTP"}
                    </Button>
                  </Box>
                </Box>

                {/* Set Password Button */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <IconButton
                    type="submit"
                    disabled={formik.isSubmitting || loading || !formik.values.password || !formik.values.otp}
                    sx={{
                      width: isMobile ? "56px" : "60px",
                      height: isMobile ? "56px" : "60px",
                      backgroundColor: (formik.values.password && formik.values.otp) ? "#3b82f6" : "#e5e7eb",
                      color: (formik.values.password && formik.values.otp) ? "#ffffff" : "#9ca3af",
                      borderRadius: "50%",
                      boxShadow: (formik.values.password && formik.values.otp) ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                      flexShrink: 0,
                      transition: "all 0.3s ease",
                      "&:hover:not(:disabled)": {
                        backgroundColor: (formik.values.password && formik.values.otp) ? "#2563eb" : "#d1d5db",
                        transform: "scale(1.05)",
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
              </>
            )}
          </CardContent>
        </Card>
      </Box>
      <Toaster position={"top-right"} toastOptions={{ className: "react-hot-toast" }} gutter={2} />
    </>
  );
};

export default SetPasswordPage;
