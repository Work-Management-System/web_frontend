"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Grid,
  LinearProgress,
  InputAdornment,
  Tooltip,
  Fade,
  Zoom,
  Chip,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoIcon from "@mui/icons-material/Info";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import { motion } from "framer-motion";
import { uploadFilePublic } from "@/utils/UploadFilePublic";
import ModernBackgroundEffects from "@/app/components/ModernBackgroundEffects";

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const colors = {
  primary: "#0F766E",
  primaryLight: "#14B8A6",
  primaryDark: "#0D9488",
  dark: "#0F172A",
  gray: "#64748B",
  lightGray: "#F1F5F9",
  white: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

const urlRegex =
  /^(https?:\/\/)?(www\.)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}([\/\w\.-]*)*\/?$/;

const validationSchema = Yup.object().shape({
  tenant_name: Yup.string()
    .required("Company name is required")
    .min(3, "Company name must be at least 3 characters")
    .max(100, "Company name must be less than 100 characters"),
  subdomain: Yup.string()
    .required("Subdomain is required")
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .matches(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen."
    ),
  first_name: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  last_name: Yup.string().max(50, "Last name must be less than 50 characters"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required")
    .max(100, "Email must be less than 100 characters"),
  tenant_phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[0-9]+$/, "Phone number must contain only digits")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits"),
  tenant_email: Yup.string()
    .email("Invalid email format")
    .required("Company email is required")
    .max(100, "Email must be less than 100 characters"),
  website_url: Yup.string()
    .matches(urlRegex, "Enter a valid website URL")
    .optional(),
  welcome_note: Yup.string()
    .max(500, "Welcome note must be less than 500 characters")
    .optional(),
  reporting_email: Yup.string().email("Invalid email format").optional(),
});

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(
    null
  );
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [fieldAnimations, setFieldAnimations] = useState<
    Record<string, boolean>
  >({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(
    null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null
  );

  // Calculate form completion percentage
  const calculateProgress = useCallback((values: any) => {
    const fields = [
      "tenant_name",
      "subdomain",
      "first_name",
      "email",
      "tenant_phone",
      "tenant_email",
    ];
    const filledFields = fields.filter(
      (field) => values[field] && values[field].trim() !== ""
    ).length;
    const progress = (filledFields / fields.length) * 100;
    setFormProgress(progress);
  }, []);

  // Check subdomain availability with debounce
  const checkSubdomainAvailability = useCallback(
    debounce(async (subdomain: string) => {
      if (!subdomain || subdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }

      // Validate format first
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
        setSubdomainAvailable(false);
        return;
      }

      setSubdomainChecking(true);
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseURL) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
        }
        const response = await axios.get(
          `${baseURL}/tenants/get-by-subdomain/${subdomain}`,
          { timeout: 5000 }
        );
        // If we get a response, subdomain exists (not available)
        setSubdomainAvailable(false);
        toast.error("This subdomain is already taken");
      } catch (error: any) {
        // 404 means subdomain doesn't exist (available)
        if (error?.response?.status === 404) {
          setSubdomainAvailable(true);
          toast.success("Subdomain is available!", { duration: 2000 });
        } else {
          setSubdomainAvailable(null);
        }
      } finally {
        setSubdomainChecking(false);
      }
    }, 800),
    []
  );


  const formik = useFormik({
    initialValues: {
      tenant_name: "",
      subdomain: "",
      first_name: "",
      last_name: "",
      email: "",
      tenant_phone: "",
      tenant_email: "",
      address: "",
      website_url: "",
      welcome_note: "",
      reporting_email: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError(null);

      // Final subdomain availability check
      if (subdomainAvailable === false) {
        setSubmitError(
          "This subdomain is already taken. Please choose another one."
        );
        setIsSubmitting(false);
        return;
      }

      try {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseURL) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
        }

        // Upload logo and background image if provided
        let uploadedLogoUrl: string | undefined;
        let uploadedBackgroundUrl: string | undefined;

        if (logoFile) {
          try {
            uploadedLogoUrl = await uploadFilePublic(logoFile);
            toast.success("Logo uploaded successfully");
          } catch (error: any) {
            console.error("Logo upload error:", error);
            const errorMsg =
              error?.response?.data?.message || "Failed to upload logo";
            toast.error(errorMsg + ". Continuing without logo...");
          }
        }

        if (backgroundImageFile) {
          try {
            uploadedBackgroundUrl = await uploadFilePublic(backgroundImageFile);
            toast.success("Background image uploaded successfully");
          } catch (error: any) {
            console.error("Background image upload error:", error);
            const errorMsg =
              error?.response?.data?.message ||
              "Failed to upload background image";
            toast.error(errorMsg + ". Continuing without background image...");
          }
        }

        const payload = {
          tenant_name: values.tenant_name,
          subdomain: values.subdomain.toLowerCase().trim(),
          administrator_user: {
            first_name: values.first_name,
            last_name: values.last_name || "",
            email: values.email,
          },
          tenant_phone: values.tenant_phone,
          tenant_email: values.tenant_email,
          address: values.address || "",
          website_url: values.website_url || "",
          welcome_note: values.welcome_note || "",
          reporting_email: values.reporting_email || "",
          logo: uploadedLogoUrl || "",
          background_image: uploadedBackgroundUrl || "",
          login_process: "emailpassword",
          status: "active",
        };

        const response = await axios.post(
          `${baseURL}/tenants/add-tenant`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        if (response.data?.status === "success") {
          toast.success("Registration successful! Redirecting to login...");
          setTimeout(() => {
            router.push(
              `/login?subdomain=${values.subdomain.toLowerCase().trim()}`
            );
          }, 2000);
        } else {
          throw new Error(response.data?.message || "Registration failed");
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Registration failed. Please try again.";
        setSubmitError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Update progress when form values change
  useEffect(() => {
    calculateProgress(formik.values);
  }, [formik.values, calculateProgress]);

  // Check subdomain when it changes
  useEffect(() => {
    if (formik.values.subdomain && formik.values.subdomain.length >= 3) {
      checkSubdomainAvailability(formik.values.subdomain);
    } else {
      setSubdomainAvailable(null);
    }
  }, [formik.values.subdomain, checkSubdomainAvailability]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getFieldStatus = (fieldName: string) => {
    const isTouched = formik.touched[fieldName as keyof typeof formik.touched];
    const hasError = formik.errors[fieldName as keyof typeof formik.errors];
    const hasValue = formik.values[fieldName as keyof typeof formik.values];

    if (isTouched && hasError) return "error";
    if (isTouched && !hasError && hasValue) return "success";
    return "default";
  };

  const handleFieldFocus = (fieldName: string) => {
    setFieldFocus(fieldName);
    setFieldAnimations((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setFieldFocus(null);
  };

  return (
    <>
      <Toaster position="top-right" />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "rgba(255, 255, 255, 0.91)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ModernBackgroundEffects />

        {/* Header */}
        <AppBar
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            py: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <Container maxWidth="lg">
            <Toolbar
              sx={{
                justifyContent: "space-between",
                px: { xs: 1, sm: 2 },
                minHeight: "50px !important",
                py: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
                onClick={() => router.push("/")}
              >
                <Image
                  src="/images/logos/time-sheet-base-logo.png"
                  alt="Manazeit Logo"
                  width={60}
                  height={60}
                  style={{ objectFit: "contain" }}
                />
                {/* <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.primary,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Manazeit
                </Typography> */}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  variant="text"
                  onClick={() => router.push("/")}
                  sx={{
                  color: colors.gray,
                  textTransform: "none",
                  fontWeight: 500,
                  display: { xs: "none", sm: "flex" },
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: colors.primary,
                    bgcolor: "transparent",
                    transform: "translateX(-2px)",
                  },
                }}
              >
                <ArrowBackIcon sx={{ mr: 1, fontSize: 18 }} />
                Back to Home
              </Button>
              <Button
                variant="text"
                onClick={() => router.push("/login")}
                sx={{
                  color: colors.primary,
                  textTransform: "none",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: `${colors.primary}10`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Sign In
              </Button>
                <IconButton
                  onClick={handleDrawerToggle}
                  sx={{ display: { sm: "none" }, color: colors.dark }}
                >
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile Drawer */}
        <Box
          component="nav"
          sx={{
            display: { sm: "none" },
            position: "fixed",
            top: 0,
            left: mobileOpen ? 0 : "-100%",
            width: "80%",
            height: "100vh",
            bgcolor: colors.white,
            zIndex: 1300,
            transition: "left 0.3s ease",
            boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Image
                src="/images/logos/time-sheet-base-logo.png"
                alt="Manazeit Logo"
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
              <IconButton onClick={handleDrawerToggle}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  router.push("/");
                  setMobileOpen(false);
                }}
                sx={{ justifyContent: "flex-start", textTransform: "none" }}
              >
                Home
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  router.push("/login");
                  setMobileOpen(false);
                }}
                sx={{ justifyContent: "flex-start", textTransform: "none" }}
              >
                Sign In
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            pt: { xs: 1, md: 2 },
            pb: { xs: 4, md: 8 },
            minHeight: "60vh",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 3,
                bgcolor: colors.white,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.06)",
                position: "relative",
                overflow: "visible",
                backdropFilter: "blur(10px)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                  borderRadius: "3px 3px 0 0",
                },
                "&:hover": {
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                },
              }}
            >
              {/* Logo and Header */}
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                sx={{ textAlign: "center", mb: 4 }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Image
                    src="/images/logos/time-sheet-base-logo.png"
                    alt="Manazeit Logo"
                    width={80}
                    height={80}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
                <Typography
                  component={motion.h1}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: colors.primary,
                    mb: 1,
                    fontSize: { xs: "1.75rem", md: "2rem" },
                  }}
                >
                  Create Your Workspace
                </Typography>
                <Typography
                  component={motion.p}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  variant="body1"
                  sx={{
                    color: colors.gray,
                    fontSize: "1rem",
                  }}
                >
                  Get started with Manazeit in minutes
                </Typography>
              </Box>

              {/* Progress Bar */}
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                sx={{ mb: 4 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.gray,
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Form Progress
                  </Typography>
                  <Chip
                    label={`${Math.round(formProgress)}%`}
                    size="small"
                    sx={{
                      bgcolor:
                        formProgress === 100
                          ? colors.success
                          : formProgress > 0
                          ? colors.primary
                          : colors.gray,
                      color: colors.white,
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      height: 24,
                      minWidth: 50,
                      transition: "all 0.3s ease",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 10,
                    bgcolor: colors.lightGray,
                    borderRadius: 5,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <Box
                    component={motion.div}
                    initial={{ width: 0 }}
                    animate={{ width: `${formProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      background:
                        formProgress === 100
                          ? `linear-gradient(90deg, ${colors.success}, ${colors.primaryLight})`
                          : `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                      borderRadius: 5,
                      boxShadow:
                        formProgress > 0
                          ? `0 2px 8px ${colors.primary}40`
                          : "none",
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.gray,
                    fontSize: "0.75rem",
                    mt: 0.5,
                    display: "block",
                    textAlign: "right",
                  }}
                >
                  {Math.round(formProgress)}% Complete
                </Typography>
              </Box>

              {/* Error Alert */}
              {submitError && (
                <Fade in={!!submitError}>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      animation: "shake 0.5s ease-in-out",
                      "@keyframes shake": {
                        "0%, 100%": { transform: "translateX(0)" },
                        "25%": { transform: "translateX(-10px)" },
                        "75%": { transform: "translateX(10px)" },
                      },
                    }}
                    icon={<ErrorIcon />}
                  >
                    {submitError}
                  </Alert>
                </Fade>
              )}

              {/* Form */}
              <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <form
                  onSubmit={formik.handleSubmit}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.target as HTMLElement).tagName !== "TEXTAREA"
                    ) {
                      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                      if (target?.form && !target.matches("textarea")) {
                        e.preventDefault();
                        formik.handleSubmit();
                      }
                    }
                  }}
                >
                  <Stack spacing={3}>
                    {/* Company Name */}
                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Company Name"
                        name="tenant_name"
                        value={formik.values.tenant_name}
                        onChange={formik.handleChange}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          handleFieldBlur("tenant_name");
                        }}
                        onFocus={() => handleFieldFocus("tenant_name")}
                        error={
                          formik.touched.tenant_name &&
                          Boolean(formik.errors.tenant_name)
                        }
                        helperText={
                          formik.touched.tenant_name &&
                          formik.errors.tenant_name
                        }
                        placeholder="Enter your company name"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon
                                sx={{
                                  color:
                                    fieldFocus === "tenant_name"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: getFieldStatus("tenant_name") ===
                            "success" && (
                            <InputAdornment position="end">
                              <Zoom in={true}>
                                <CheckCircleIcon
                                  sx={{ color: colors.success, fontSize: 20 }}
                                />
                              </Zoom>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Subdomain */}
                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Subdomain"
                        name="subdomain"
                        value={formik.values.subdomain}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "");
                          formik.setFieldValue("subdomain", value);
                        }}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          handleFieldBlur("subdomain");
                        }}
                        onFocus={() => handleFieldFocus("subdomain")}
                        error={
                          (formik.touched.subdomain &&
                            Boolean(formik.errors.subdomain)) ||
                          subdomainAvailable === false
                        }
                        helperText={
                          subdomainChecking ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <CircularProgress size={12} />
                              <span>Checking availability...</span>
                            </Box>
                          ) : subdomainAvailable === false ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: colors.error,
                              }}
                            >
                              <ErrorIcon sx={{ fontSize: 16 }} />
                              <span>This subdomain is already taken</span>
                            </Box>
                          ) : subdomainAvailable === true ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: colors.success,
                              }}
                            >
                              <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                              <span>Subdomain is available!</span>
                            </Box>
                          ) : formik.touched.subdomain &&
                            formik.errors.subdomain ? (
                            formik.errors.subdomain
                          ) : (
                            "This will be your workspace URL: yoursubdomain.manazeit.com"
                          )
                        }
                        placeholder="yourcompany"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LanguageIcon
                                sx={{
                                  color:
                                    fieldFocus === "subdomain"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {subdomainChecking && (
                                  <CircularProgress size={16} />
                                )}
                                {subdomainAvailable === true && (
                                  <Zoom in={true}>
                                    <CheckCircleIcon
                                      sx={{
                                        color: colors.success,
                                        fontSize: 20,
                                      }}
                                    />
                                  </Zoom>
                                )}
                                {subdomainAvailable === false && (
                                  <Zoom in={true}>
                                    <ErrorIcon
                                      sx={{ color: colors.error, fontSize: 20 }}
                                    />
                                  </Zoom>
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.gray,
                                    fontWeight: 500,
                                  }}
                                >
                                  .manazeit.com
                                </Typography>
                              </Box>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor:
                                  subdomainAvailable === true
                                    ? colors.success
                                    : colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor:
                                  subdomainAvailable === true
                                    ? colors.success
                                    : subdomainAvailable === false
                                    ? colors.error
                                    : colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Administrator Details */}
                    <Box sx={{ mt: 3, mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: colors.dark,
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <PersonIcon
                          sx={{ fontSize: 20, color: colors.primary }}
                        />
                        Administrator Details
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Box className="form-field" sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="first_name"
                          value={formik.values.first_name}
                          onChange={formik.handleChange}
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            handleFieldBlur("first_name");
                          }}
                          onFocus={() => handleFieldFocus("first_name")}
                          error={
                            formik.touched.first_name &&
                            Boolean(formik.errors.first_name)
                          }
                          helperText={
                            formik.touched.first_name &&
                            formik.errors.first_name
                          }
                          placeholder="John"
                          required
                          InputProps={{
                            endAdornment: getFieldStatus("first_name") ===
                              "success" && (
                              <InputAdornment position="end">
                                <Zoom in={true}>
                                  <CheckCircleIcon
                                    sx={{ color: colors.success, fontSize: 20 }}
                                  />
                                </Zoom>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary,
                                },
                              },
                              "&.Mui-focused": {
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary,
                                  borderWidth: 2,
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                      <Box className="form-field" sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="last_name"
                          value={formik.values.last_name}
                          onChange={formik.handleChange}
                          onBlur={(e) => {
                            formik.handleBlur(e);
                            handleFieldBlur("last_name");
                          }}
                          onFocus={() => handleFieldFocus("last_name")}
                          error={
                            formik.touched.last_name &&
                            Boolean(formik.errors.last_name)
                          }
                          helperText={
                            formik.touched.last_name && formik.errors.last_name
                          }
                          placeholder="Doe"
                          InputProps={{
                            endAdornment: getFieldStatus("last_name") ===
                              "success" &&
                              formik.values.last_name && (
                                <InputAdornment position="end">
                                  <Zoom in={true}>
                                    <CheckCircleIcon
                                      sx={{
                                        color: colors.success,
                                        fontSize: 20,
                                      }}
                                    />
                                  </Zoom>
                                </InputAdornment>
                              ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary,
                                },
                              },
                              "&.Mui-focused": {
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary,
                                  borderWidth: 2,
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    </Stack>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          handleFieldBlur("email");
                        }}
                        onFocus={() => handleFieldFocus("email")}
                        error={
                          formik.touched.email && Boolean(formik.errors.email)
                        }
                        helperText={
                          formik.touched.email && formik.errors.email
                            ? formik.errors.email
                            : "This will be your administrator login email"
                        }
                        placeholder="admin@yourcompany.com"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon
                                sx={{
                                  color:
                                    fieldFocus === "email"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: getFieldStatus("email") ===
                            "success" && (
                            <InputAdornment position="end">
                              <Zoom in={true}>
                                <CheckCircleIcon
                                  sx={{ color: colors.success, fontSize: 20 }}
                                />
                              </Zoom>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Company Contact */}
                    <Box sx={{ mt: 3, mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: colors.dark,
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <BusinessIcon
                          sx={{ fontSize: 20, color: colors.primary }}
                        />
                        Company Contact
                      </Typography>
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Company Phone"
                        name="tenant_phone"
                        value={formik.values.tenant_phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          formik.setFieldValue("tenant_phone", value);
                        }}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          handleFieldBlur("tenant_phone");
                        }}
                        onFocus={() => handleFieldFocus("tenant_phone")}
                        error={
                          formik.touched.tenant_phone &&
                          Boolean(formik.errors.tenant_phone)
                        }
                        helperText={
                          formik.touched.tenant_phone &&
                          formik.errors.tenant_phone
                        }
                        placeholder="1234567890"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon
                                sx={{
                                  color:
                                    fieldFocus === "tenant_phone"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: getFieldStatus("tenant_phone") ===
                            "success" && (
                            <InputAdornment position="end">
                              <Zoom in={true}>
                                <CheckCircleIcon
                                  sx={{ color: colors.success, fontSize: 20 }}
                                />
                              </Zoom>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Company Email"
                        name="tenant_email"
                        type="email"
                        value={formik.values.tenant_email}
                        onChange={formik.handleChange}
                        onBlur={(e) => {
                          formik.handleBlur(e);
                          handleFieldBlur("tenant_email");
                        }}
                        onFocus={() => handleFieldFocus("tenant_email")}
                        error={
                          formik.touched.tenant_email &&
                          Boolean(formik.errors.tenant_email)
                        }
                        helperText={
                          formik.touched.tenant_email &&
                          formik.errors.tenant_email
                        }
                        placeholder="contact@yourcompany.com"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon
                                sx={{
                                  color:
                                    fieldFocus === "tenant_email"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: getFieldStatus("tenant_email") ===
                            "success" && (
                            <InputAdornment position="end">
                              <Zoom in={true}>
                                <CheckCircleIcon
                                  sx={{ color: colors.success, fontSize: 20 }}
                                />
                              </Zoom>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Address (Optional)"
                        name="address"
                        multiline
                        rows={2}
                        value={formik.values.address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Company address"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Website URL (Optional)"
                        name="website_url"
                        value={formik.values.website_url}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.website_url &&
                          Boolean(formik.errors.website_url)
                        }
                        helperText={
                          formik.touched.website_url &&
                          formik.errors.website_url
                        }
                        placeholder="https://yourcompany.com"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LanguageIcon
                                sx={{
                                  color:
                                    fieldFocus === "website_url"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Welcome Note (Optional)"
                        name="welcome_note"
                        multiline
                        rows={3}
                        value={formik.values.welcome_note}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.welcome_note &&
                          Boolean(formik.errors.welcome_note)
                        }
                        helperText={
                          formik.touched.welcome_note &&
                          formik.errors.welcome_note
                            ? formik.errors.welcome_note
                            : "This message will be displayed to users when they first log in"
                        }
                        placeholder="Welcome to our workspace! We're excited to have you here."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box className="form-field">
                      <TextField
                        fullWidth
                        label="Reporting Email (Optional)"
                        name="reporting_email"
                        type="email"
                        value={formik.values.reporting_email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.reporting_email &&
                          Boolean(formik.errors.reporting_email)
                        }
                        helperText={
                          formik.touched.reporting_email &&
                          formik.errors.reporting_email
                            ? formik.errors.reporting_email
                            : "Email address for receiving all status reports and notifications"
                        }
                        placeholder="reports@yourcompany.com"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon
                                sx={{
                                  color:
                                    fieldFocus === "reporting_email"
                                      ? colors.primary
                                      : colors.gray,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                              },
                            },
                            "&.Mui-focused": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.primary,
                                borderWidth: 2,
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Logo Upload */}
                    <Box className="form-field">
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: colors.dark,
                          fontSize: "0.875rem",
                        }}
                      >
                        Company Logo (Optional)
                      </Typography>
                      <Box
                        sx={{
                          border: `2px dashed ${
                            logoFile ? colors.success : "rgba(0,0,0,0.12)"
                          }`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: "center",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          bgcolor: logoFile
                            ? `${colors.success}10`
                            : colors.lightGray,
                          "&:hover": {
                            borderColor: colors.primary,
                            bgcolor: `${colors.primary}05`,
                          },
                        }}
                        onClick={() =>
                          document.getElementById("logo-upload")?.click()
                        }
                      >
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error(
                                  "File size must be less than 10 MB"
                                );
                                return;
                              }
                              setLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {logoPreview ? (
                          <Box>
                            <Image
                              src={logoPreview}
                              alt="Logo preview"
                              width={100}
                              height={100}
                              style={{ objectFit: "contain", borderRadius: 8 }}
                            />
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLogoFile(null);
                                setLogoPreview(null);
                              }}
                              sx={{ mt: 1, textTransform: "none" }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: colors.gray, mb: 1 }}
                            >
                              Click to upload logo
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: colors.gray }}
                            >
                              PNG, JPG up to 10MB
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Background Image Upload */}
                    <Box className="form-field">
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: colors.dark,
                          fontSize: "0.875rem",
                        }}
                      >
                        Background Image (Optional)
                      </Typography>
                      <Box
                        sx={{
                          border: `2px dashed ${
                            backgroundImageFile
                              ? colors.success
                              : "rgba(0,0,0,0.12)"
                          }`,
                          borderRadius: 2,
                          p: 2,
                          textAlign: "center",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          bgcolor: backgroundImageFile
                            ? `${colors.success}10`
                            : colors.lightGray,
                          "&:hover": {
                            borderColor: colors.primary,
                            bgcolor: `${colors.primary}05`,
                          },
                        }}
                        onClick={() =>
                          document.getElementById("background-upload")?.click()
                        }
                      >
                        <input
                          id="background-upload"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error(
                                  "File size must be less than 10 MB"
                                );
                                return;
                              }
                              setBackgroundImageFile(file);
                              setBackgroundPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {backgroundPreview ? (
                          <Box>
                            <Image
                              src={backgroundPreview}
                              alt="Background preview"
                              width={200}
                              height={100}
                              style={{ objectFit: "cover", borderRadius: 8 }}
                            />
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBackgroundImageFile(null);
                                setBackgroundPreview(null);
                              }}
                              sx={{ mt: 1, textTransform: "none" }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: colors.gray, mb: 1 }}
                            >
                              Click to upload background image
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: colors.gray }}
                            >
                              PNG, JPG up to 10MB
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={
                        isSubmitting ||
                        !formik.isValid ||
                        subdomainAvailable === false
                      }
                      fullWidth
                      sx={{
                        bgcolor: colors.primary,
                        color: colors.white,
                        py: 1.75,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1.1rem",
                        mt: 3,
                        boxShadow: `0 4px 16px ${colors.primary}40`,
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          bgcolor: colors.primaryDark,
                          transform: "translateY(-2px)",
                          boxShadow: `0 8px 24px ${colors.primaryDark}50`,
                        },
                        "&:disabled": {
                          bgcolor: colors.gray,
                          boxShadow: "none",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          transition: "left 0.5s ease",
                        },
                        "&:hover::before": {
                          left: "100%",
                        },
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Create Workspace"
                      )}
                    </Button>

                    {/* Login Link */}
                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: colors.gray }}
                      >
                        Already have a workspace?{" "}
                        <Button
                          variant="text"
                          onClick={() => router.push("/login")}
                          sx={{
                            color: colors.primary,
                            textTransform: "none",
                            fontWeight: 600,
                            p: 0,
                            minWidth: "auto",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "transparent",
                              textDecoration: "underline",
                              transform: "scale(1.05)",
                            },
                          }}
                        >
                          Sign in here
                        </Button>
                      </Typography>
                    </Box>
                  </Stack>
                </form>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          sx={{
            bgcolor: colors.dark,
            color: colors.white,
            py: { xs: 4, md: 5 },
            mt: "auto",
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Image
                    src="/images/logos/time-sheet-base-logo.png"
                    alt="Manazeit Logo"
                    width={95}
                    height={95}
                    style={{ objectFit: "contain" }}
                  />
                  {/* <Typography variant="h6" sx={{ fontWeight: 700, color: colors.white }}>
                    Manazeit
                  </Typography> */}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}
                >
                  The comprehensive work management platform designed to
                  streamline operations, boost productivity, and drive business
                  growth.
                </Typography>
              </Grid>
              {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Quick Links
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    "Features",
                    "Services",
                    "Process",
                    "Testimonials",
                    "Contact",
                  ].map((link) => (
                    <Button
                      key={link}
                      href={`/#${link.toLowerCase()}`}
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        justifyContent: "flex-start",
                        textTransform: "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: colors.primaryLight,
                          bgcolor: "transparent",
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      {link}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              {/* @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Contact Info
                </Typography>
                <Stack spacing={1.5}>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Email: info@manazeit.com
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Support: Available 24/7
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
            <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)" }}
              >
                © {new Date().getFullYear()} Manazeit. All rights reserved.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
}
