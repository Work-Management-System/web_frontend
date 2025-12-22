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
import { Visibility, VisibilityOff } from "@mui/icons-material";
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
}

interface LoginValues {
  email: string;
  password: string;
  subDomain?: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const Mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultTenantDetails: TenantDetails = {
    welcomeNote: "MAGIC IS IN THE DETAILS",
    backgroundImage: '/images/backgrounds/profileback.jpg',
    tenantLogo: '/images/logos/time-sheet-base-logo.png',
  };

  const [tenantDetails, setTenantDetails] = useState<TenantDetails>(defaultTenantDetails);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);

  const axiosInstance = createAxiosInstance();

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
      const tenant = getSubdomain();
      console.log("Fetching tenant data for:", tenant);
      const response = await axiosInstance.get(`/tenants/get-by-subdomain/${tenant}`);
      console.log("API Response:", response.data);
      if (response.status === 200 && response.data?.data) {
        const logo = response?.data?.data?.logo;
        const background_image = response?.data?.data?.background_image;
        const welcome_note = response?.data?.data?.welcome_note;

        // Fallback to generic assets when tenant images are missing/empty
        const resolvedLogo =
          logo && logo.trim() !== '' ? logo : defaultTenantDetails.tenantLogo;
        const resolvedBackground =
          background_image && background_image.trim() !== ''
            ? background_image
            : defaultTenantDetails.backgroundImage;
        const welcomeNote = welcome_note || defaultTenantDetails.welcomeNote;

        setTenantDetails({
          tenantLogo: resolvedLogo,
          backgroundImage: resolvedBackground,
          welcomeNote,
        });
      } else {
        setTenantDetails(defaultTenantDetails);
      }
    } catch (error: any) {
      setTenantDetails(defaultTenantDetails);
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
          console.log("Step 1: Email submitted:", values.email);
          const tenant = getSubdomain();
          const params = new URLSearchParams({ email: values.email });
          if (tenant) {
            params.append('sub_domain', tenant);
          }

          const response = await axiosInstance.get(`/auth/tenant-subdomain?${params.toString()}`);

          console.log("API Response:", response.data);

          if (response.status === 200 && response.data?.data?.loginUrl) {
            if (typeof window !== 'undefined') {
              window.location.href = response.data.data.loginUrl;
            }
          } else {
            toast.error("Failed to fetch subdomain. Please try again.");
          }
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message || "Failed to fetch subdomain. Please try again.";
          toast.error(errorMessage);
        } finally {
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
            // Check if password not set
            if (response?.data?.data?.message === 'Password not set yet.') {
              window.location.href = response?.data?.data?.url;
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
              setTimeout(() => {
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
    const email = searchParams.get("email");
    if (email) {
      setEmailFromUrl(decodeURIComponent(email));
      setStep(2);
      formik.setFieldValue("email", decodeURIComponent(email));
    }
  }, [searchParams]);

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
            backgroundImage: `url(${backgroundImage})`,
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
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          width: "100vw",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
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
          <Box
            sx={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              backgroundImage: `url(${backgroundImage})`,
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
                {welcomeNote}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "#fff",
                  ...(Mobile && { fontSize: "0.9rem" }),
                }}
              >
                PLEASE USE YOUR CREDENTIALS TO LOGIN. <br />
                IF YOU ARE NOT A MEMBER, PLEASE REGISTER.
              </Typography>
            </Box>
          </Box>
          <Card
            component="form"
            onSubmit={formik.handleSubmit}
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
                justifyContent: "space-between",
                height: "100%",
                minHeight: "400px",
                ...(Mobile && { minHeight: "auto" }),
              }}
            >
              <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
                <Image
                  src={tenantLogo}
                  alt="logo"
                  height={140}
                  width={140}
                  priority
                  unoptimized
                  style={{ objectFit: "contain" }}
                  onError={() => console.log("Failed to load logo image")}
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
                Login
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
                  disabled={step === 2}
                  InputProps={{
                    sx: { borderRadius: "8px", height: "45px" },
                  }}
                />
              </Box>
              {step === 2 && (
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
                        sx: { borderRadius: "8px", height: "45px" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleTogglePassword} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                      ...(Mobile && { flexDirection: "row", justifyContent: "space-between" }),
                    }}
                  >
                    <Link href={{ pathname: "/set-password", query: { email: formik.values.email } }}>                      <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#000",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                        ...(Mobile && { fontSize: "0.8rem" }),
                      }}
                    >
                      Forgot password?
                    </Typography>
                    </Link>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={formik.isSubmitting || loading}
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
                      {formik.isSubmitting || loading ? "Logging in..." : "Login"}
                    </Button>
                  </Box>
                </>
              )}
              {step === 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={formik.isSubmitting || loading || !formik.values.email}
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
                    {loading ? "Processing..." : "Next"}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Toaster position={"top-right"} toastOptions={{ className: "react-hot-toast" }} gutter={2} />
    </>
  );
};

export default LoginPage;