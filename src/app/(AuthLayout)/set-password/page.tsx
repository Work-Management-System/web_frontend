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
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import createAxiosInstance from "@/app/axiosInstance";
import Cookies from "js-cookie";
import { uploadFile } from '@/utils/UploadFile';
import { useDispatch } from "react-redux";
import { color } from "framer-motion";

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
}

const SetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const searchParams = useSearchParams();
  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  const Mobile = useMediaQuery(theme.breakpoints.down("sm"));

  const defaultTenantDetails: TenantDetails = {
    welcomeNote: "PLEASE SET YOUR PASSWORD TO ACTIVATE YOUR ACCOUNT.",
    backgroundImage: '/images/backgrounds/profileback.jpg',
    tenantLogo: '/images/logos/time-sheet-base-logo.png',
    tenantName: "Our Portal",
  };

  const [tenantDetails, setTenantDetails] = useState<TenantDetails>(defaultTenantDetails);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailDisabled, setIsEmailDisabled] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const getSubdomain = (): string => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
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

  const fetchTenantData = async () => {
    try {
      // Priority: subdomain from URL > query param > cookie
      let tenant = getSubdomain();
      if (!tenant) {
        tenant = searchParams?.get("tenant") || Cookies.get("tenant") || "";
      }
      
      if (!tenant) {
        // No tenant found, use defaults
        setTenantDetails(defaultTenantDetails);
        return;
      }
      
      console.log("Fetching tenant data for:", tenant);
      const response = await axiosInstance.get(`/tenants/get-by-subdomain/${tenant}`);
      console.log("API Response:", response.data);
      
      if (response.status === 200 && response.data?.data) {
        const logo = response?.data?.data?.logo;
        const background_image = response?.data?.data?.background_image || response?.data?.data?.backgroud_image; // Handle typo in API
        const welcome_note = response?.data?.data?.welcome_note;
        const tenant_name = response?.data?.data?.tenant_name;
        
        // Fallback to generic assets when tenant images are missing/empty
        const resolvedLogo =
          logo && logo.trim() !== '' ? logo : defaultTenantDetails.tenantLogo;
        const resolvedBackground =
          background_image && background_image.trim() !== ''
            ? background_image
            : defaultTenantDetails.backgroundImage;
        const welcomeNote = welcome_note || defaultTenantDetails.welcomeNote;
        const resolvedTenantName = tenant_name || defaultTenantDetails.tenantName;

        setTenantDetails({
          tenantLogo: resolvedLogo,
          backgroundImage: resolvedBackground,
          welcomeNote,
          tenantName: resolvedTenantName,
        });
      } else {
        setTenantDetails(defaultTenantDetails);
      }
    } catch (error: any) {
      console.error("Error fetching tenant data:", error);
      // Use defaults on error instead of showing error toast
      setTenantDetails(defaultTenantDetails);
    }
  };

  const generateOtp = async () => {
    if (!formik.values.email) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(`/auth/generate-otp`, {
        email: formik.values.email,
      });
      if (response.status === 200 || response.status === 201) {
        setOtpGenerated(true);
        setResendCooldown(60); // 60 seconds cooldown
        toast.success(response.data.message || "OTP sent successfully!");
      } else {
        toast.error(response.data.message || "Failed to generate OTP");
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
  };

  const resendOtp = async () => {
    if (!formik.values.email) {
      toast.error("Please enter a valid email");
      return;
    }
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending OTP`);
      return;
    }
    setResendLoading(true);
    try {
      const response = await axiosInstance.post(`/auth/resend-otp`, {
        email: formik.values.email,
      });
      if (response.status === 200 || response.status === 201) {
        setResendCooldown(60); // Reset cooldown to 60 seconds
        toast.success(response.data.message || "OTP resent successfully!");
      } else {
        toast.error(response.data.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong!";
      toast.error(errorMessage);
      
      // If rate limited, set a longer cooldown
      if (error?.response?.status === 429 || errorMessage.includes("Maximum resend attempts")) {
        setResendCooldown(600); // 10 minutes
      }
    } finally {
      setResendLoading(false);
    }
  };

  const getTenantUrl = (path: string): string => {
    const tenant = Cookies.get("tenant") || searchParams?.get("tenant");
    if (!tenant || !/^[a-zA-Z0-9-]+$/.test(tenant)) {
      return path;
    }
    const protocol = process.env.NODE_ENV === "production" ? "https" : "https";
    const isLocalhost =  window?.location?.hostname.includes("localhost");
    const baseDomain = isLocalhost
      ? "localhost:3000"
      : window?.location?.hostname.replace(/^[a-zA-Z0-9-]+\./, "");
    const port = isLocalhost ? `:${window?.location.port || "3000"}` : "";
    return `${protocol}://${tenant}.${baseDomain}${path}`;
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
        // Ensure tenant is set before making the request
        const tenantFromQuery = searchParams?.get("tenant");
        const tenantFromSubdomain = getSubdomain();
        const tenantFromCookie = Cookies.get("tenant");
        const tenant = tenantFromQuery || tenantFromSubdomain || tenantFromCookie;
        
        if (tenant) {
          Cookies.set("tenant", tenant, { expires: 7 });
          console.log("Tenant ensured before API call:", tenant);
        } else {
          console.warn("No tenant found - request may fail");
        }
        
        const response = await axiosInstance.post(`/auth/set-password`, values);
        if (response.status === 200) {
          toast.success(response.data.message || "Password set successfully!");
          resetForm();          
          const redirectUrl = getTenantUrl("/login");
          console.log(`Redirecting to: ${redirectUrl}`);
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



  // Countdown timer for resend OTP
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
    // Fetch tenant data first
    fetchTenantData();
    
    // Priority: query param > subdomain from URL > cookie
    const tenantFromQuery = searchParams?.get("tenant");
    const tenantFromSubdomain = getSubdomain();
    const tenantFromCookie = Cookies.get("tenant");
    
    // Determine which tenant to use
    const tenant = tenantFromSubdomain || tenantFromQuery || tenantFromCookie;
    
    // Always set tenant in cookie if we have one
    if (tenant) {
      Cookies.set("tenant", tenant, { expires: 7 }); // Expires in 7 days
      console.log("Tenant set in cookie:", tenant);
    }
    
    const email = searchParams?.get("email");
    
    if (email) {
      formik.setFieldValue("email", email);
      setIsEmailDisabled(true);
    }
  }, [searchParams]);

return (
  <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          width: "100vw",
          background: `var(--primary-bg-colors)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${tenantDetails.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            zIndex: 0,
            width: "100%",
            height: "100%",
          }}
        />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "60%",
          maxWidth: "1200px",
          height: "75vh",
          minHeight: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          overflow: "hidden",
          zIndex: 1,
          ...(Mobile && {
            flexDirection: "column",
            width: "90%",
            height: "auto",
            minHeight: "auto",
            margin: "20px",
          }),
        }}
      >
        {/* Left Info Panel */}
        <Box
          sx={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            backgroundImage: `url(${tenantDetails.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
            ...(Mobile && {
              height: "auto",
              minHeight: "300px",
              alignItems: "center",
              textAlign: "center",
            }),
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 1,
              width: "100%",
              height: "100%",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2, padding: "40px" }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#fff",
                mb: 2,
                ...(Mobile && { fontSize: "1.5rem" }),
              }}
            >
              Welcome to {tenantDetails.tenantName}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#fff",
                ...(Mobile && { fontSize: "0.9rem" }),
              }}
            >
              {tenantDetails.welcomeNote}
            </Typography>
          </Box>
        </Box>

        {/* Right Form Panel */}
        <Card
          component="form"
          onSubmit={formik.handleSubmit}
          autoComplete="off"
          sx={{
            flex: 1,
            height: "100%",
            background: "#fff",
            boxShadow: "none",
            padding: 3,
            textAlign: "center",
            ...(Mobile && {
              padding: 2,
              width: "100%",
              height: "auto",
            }),
            borderRadius: "0 16px 16px 0",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
              minHeight: "400px",
              ...(Mobile && { minHeight: "auto" }),
            }}
          >
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
              <Image
                src={tenantDetails.tenantLogo || defaultTenantDetails.tenantLogo}
                alt="logo"
                height={140}
                width={140}
                priority
                unoptimized
                style={{ objectFit: "contain" }}
                onError={() => {
                  console.log("Failed to load logo image, using default");
                  setTenantDetails(prev => ({ ...prev, tenantLogo: defaultTenantDetails.tenantLogo }));
                }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#000",
                mb: 3,
                ...(Mobile && { fontSize: "1.2rem" }),
              }}
            >
              Set Your New Password
            </Typography>

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
                placeholder="E-MAIL"
                disabled={isEmailDisabled}
                 InputProps={{
                    sx: {
                      borderRadius: "8px",
                      height: "45px",
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px white inset',
                        WebkitTextFillColor: '#000', // Optional: text color
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },       }}                       />
            </Box>
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
                placeholder="PASSWORD"
               InputProps={{
                     sx: {
                       borderRadius: "8px",
                       height: "45px",
                       '& input:-webkit-autofill': {
                         WebkitBoxShadow: '0 0 0 1000px white inset',
                         WebkitTextFillColor: '#000', // Optional: text color
                         transition: 'background-color 5000s ease-in-out 0s',
                       },
                     },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff sx={{color:'var(--primary-color-2)'}}/> : <Visibility sx={{color:'var(--primary-color-2)'}}/>}
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
                    placeholder="CONFIRM PASSWORD"
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        height: "45px",
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px white inset',
                          WebkitTextFillColor: '#000',
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end">
                            {showPassword ? <VisibilityOff sx={{ color: 'var(--primary-color-2)' }} /> : <Visibility sx={{ color: 'var(--primary-color-2)' }} />}
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
                  placeholder="OTP"
                  InputProps={{ sx: { borderRadius: "8px", height: "45px" } }}
                />
                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                  <Button
                    variant="text"
                    onClick={resendOtp}
                    disabled={resendLoading || resendCooldown > 0}
                    sx={{
                      color: resendCooldown > 0 ? "#999" : "var(--primary-color-1)",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      minWidth: "auto",
                      padding: "4px 8px",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                      "&:disabled": {
                        color: "#999",
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
              </>
            )}

            <Box sx={{  display: "flex", justifyContent: "flex-end" }}>
              {!otpGenerated ? (
                <Button
                  variant="contained"
                  onClick={generateOtp}
                  disabled={loading || formik.isSubmitting}
                  sx={{
                    backgroundColor: "var(--primary-color-1)",
                    color: "#fff",
                    padding: "10px 30px",
                    borderRadius: "30px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1-hover)",
                    },
                    ...(Mobile && { fontSize: "0.9rem", padding: "8px 20px" }),
                  }}
                >
                  {loading ? "Generating OTP..." : "Generate OTP"}
                </Button>
              ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column", 
                      alignItems: "center",    
                      gap: 2,  
                      marginRight: "35px",          
                    }}
                  >
                    <Typography textAlign="center">
                      Otp sent to your registered email
                    </Typography>

                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading || formik.isSubmitting}
                      sx={{
                        backgroundColor: "var(--primary-color-1)",
                        color: "#fff",
                        padding: "10px 30px",
                        borderRadius: "30px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        "&:hover": {
                          backgroundColor: "var(--primary-color-1-hover)",
                        },
                        ...(Mobile && { fontSize: "0.9rem", padding: "8px 20px" }),
                      }}
                    >
                      {loading ? "Setting Password..." : "Set Password"}
                    </Button>
                  </Box>

              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
    <Toaster position="top-right" toastOptions={{ className: "react-hot-toast" }} />
  </>
);

};

export default SetPasswordPage;