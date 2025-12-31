"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Avatar,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  Tooltip,
  TextField,
} from "@mui/material";
import Grid from '@mui/material/Grid';

import LinkIcon from "@mui/icons-material/Link";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CloseIcon from "@mui/icons-material/Close";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import TablePagination from "@mui/material/TablePagination";
import { exportTenantsToExcel } from "@/utils/exports/ExportExcel";
import { exportTenantsToDocx } from "@/utils/exports/ExportDocx";
import { CustomPagination } from "@/app/(AuthLayout)/components/Pagination/CustomPagination";
import ExportFileDropdown from "@/utils/exports/ExportFilesDropDown";
import UserProfilePage from "../profile/page";
import { useAppselector } from "@/redux/store";
import { Toaster } from "react-hot-toast";
import { Business, Cancel, CheckCircle, Email, Person, Phone, Web } from "@mui/icons-material";
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Loader from "@/app/loading";
import SearchIcon from '@mui/icons-material/Search';
import AddTenant from "./add-new-tenant/page";


type Administrator = {
  email: string;
  first_name: string;
  last_name: string;
};

export type Tenant = {
  id: string;
  tenant_name: string;
  subdomain: string;
  logo: string;
  background_image?: string;
  address?: string;
  website_url?: string;
  is_active: boolean;
  status: string;
  administrator_user: Administrator;
  tenant_phone?: string;
  tenant_email?: string;
  reporting_email?: string;
  active_subscription?: {
    id: string;
    plan: {
      id: string;
      name: string;
      price: string;
      employee_limit?: number | null;
    };
    status: string;
    is_trial?: boolean;
  } | null;
};

// Helper functions for styling
const getStatusChipStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return { backgroundColor: "#E8F5E9", color: "#43A047" };
    case "inactive":
      return { backgroundColor: "#FFEBEE", color: "#D32F2F" };
    default:
      return { backgroundColor: "#E8ECEF", color: "#1A73E8" };
  }
};

const getSubdomainChipStyle = () => {
  return { backgroundColor: "#E3F2FD", color: "#1E88E5" };
};

const getEmailChipStyle = (email: string) => {
  return email && email !== "—"
    ? { backgroundColor: "#F3E5F5", color: "#8E24AA" }
    : { backgroundColor: "#E8ECEF", color: "#1A73E8" };
};

const getPhoneChipStyle = (phone: string) => {
  return phone && phone !== "—"
    ? { backgroundColor: "#E0F2F1", color: "#00695C" }
    : { backgroundColor: "#E8ECEF", color: "#1A73E8" };
};

const getWebsiteChipStyle = (website_url: string) => {
  return website_url && website_url !== "—"
    ? { backgroundColor: "#FFF3E0", color: "#EF6C00" }
    : { backgroundColor: "#E8ECEF", color: "#1A73E8" };
};

const getPortalChipStyle = (portal_url: string) => {
  return portal_url && portal_url !== "—"
    ? { backgroundColor: "#E8EAF6", color: "#3F51B5" } // Light indigo background, indigo text
    : { backgroundColor: "#E8ECEF", color: "#1A73E8" };
};

const getAddressColor = (address: string) => {
  return address === "—" ? "#B0BEC5" : "#4A4A4A";
};

// Function to get base domain
const getBaseDomain = () => {
  const isLocalhost = window.location.hostname === "localhost";
  return isLocalhost
    ? "localhost:3000"
    : window?.location?.hostname.replace(/^[a-zA-Z0-9-]+\./, "");
};

// Modal Component
const TenantDetailsModal = ({
  open,
  onClose,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}) => {
  if (!open || !tenant) return null;

  const baseDomain = getBaseDomain();
  const portalUrl = `http://${tenant.subdomain}.${baseDomain}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px",
          boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#F7F8FA",
          py: 2,
        }}
      >
        <Typography variant="subtitle1" component="div" color="#4A4A4A" fontWeight="bold">
          Tenant Details
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

     <DialogContent sx={{ py: 3 }}>
      <div className="flex flex-col gap-4">
        {/* Centered Avatar and Title */}
        <div className="flex flex-col items-center">
          <Avatar
            src={tenant?.logo || ""}
            alt={tenant?.tenant_name || ""}
            sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}
          />
          <Typography variant="h5" component="h1" color="#4A4A4A">
            {tenant?.tenant_name || "N/A"}
          </Typography>
        </div>

        {/* Subdomain and Status (Two Columns on sm+) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <Typography variant="body2" component="p" color="textSecondary">
              Subdomain
            </Typography>
            <Box
              sx={{
                ...getSubdomainChipStyle(),
                mt: 1,
                px: 2,
                py: 0.5,
                borderRadius: "12px",
              }}
            >
              {tenant?.subdomain || "—"}
            </Box>
          </div>

          <div className="w-full sm:w-1/2">
            <Typography variant="body2" component="p" color="textSecondary">
              Status
            </Typography>
            <Box
              sx={{
                ...getStatusChipStyle(tenant?.status),
                mt: 1,
                px: 2,
                py: 0.5,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: tenant?.status?.toLowerCase() === "active" ? "#43A047" : "#D32F2F",
                  marginRight: "8px",
                }}
              />
              {tenant?.status === "active" ? "Active" : "Inactive"}
            </Box>
          </div>
        </div>

        {/* Administrator */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Administrator
          </Typography>
          <Typography variant="body1" component="p" color="#4A4A4A">
            {tenant?.administrator_user?.first_name || ""} {tenant?.administrator_user?.last_name || ""}
          </Typography>
        </div>

        {/* Email */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Email
          </Typography>
          <Box
            sx={{
              ...getEmailChipStyle(tenant?.tenant_email || "—"),
              mt: 1,
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <EmailIcon sx={{ fontSize: "14px", mr: 1 }} />
            <a
              href={tenant?.tenant_email ? `mailto:${tenant.tenant_email}` : "#"}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {tenant?.tenant_email || "—"}
            </a>
          </Box>
        </div>

        {/* Phone */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Phone
          </Typography>
          <Box
            sx={{
              ...getPhoneChipStyle(tenant?.tenant_phone || "—"),
              mt: 1,
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <PhoneIcon sx={{ fontSize: "14px", mr: 1 }} />
            <a
              href={tenant?.tenant_phone ? `tel:${tenant.tenant_phone}` : "#"}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {tenant?.tenant_phone || "—"}
            </a>
          </Box>
        </div>

        {/* Address */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Address
          </Typography>
          <Typography variant="body1" component="p" sx={{ color: getAddressColor(tenant?.address || "—") }}>
            {tenant?.address || "—"}
          </Typography>
        </div>

        {/* Website */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Website
          </Typography>
          <Box
            sx={{
              ...getWebsiteChipStyle(tenant?.website_url || "—"),
              mt: 1,
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <LinkIcon sx={{ fontSize: "14px", mr: 1 }} />
            <a
              href={tenant?.website_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {tenant?.website_url || "—"}
            </a>
          </Box>
        </div>

        {/* Tenant Portal */}
        <div className="w-full">
          <Typography variant="body2" component="p" color="textSecondary">
            Tenant Portal
          </Typography>
          <Box
            sx={{
              ...getPortalChipStyle(portalUrl),
              mt: 1,
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <LinkIcon sx={{ fontSize: "14px", mr: 1 }} />
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {portalUrl}
            </a>
          </Box>
        </div>
      </div>
    </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#F7F8FA" }}>
        <Button onClick={onClose} variant="contained" sx={{backgroundColor: "var(--primary-color-2)" /* #0798bd */,
                "&:hover": {
                  backgroundColor: "var(--primary-color-2-hover)" /* #0799bdc8 */,
                },}}>
          Close
        </Button>
      </DialogActions>
    </Dialog>

  );
};

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const pathName = usePathname();
  const axiosInstance = createAxiosInstance();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const userPriyority = useAppselector((state) => state.role.value.priority);
  const tenantId = useAppselector((state) => state.auth.value?.tenant?.id); 
  const [searchQuery, setSearchQuery] = useState("");
  const router=useRouter();
  
  const fetchTenants = async (searchQuery = '') => {
    const res = await axiosInstance.get("/tenants/list", {
      params: searchQuery ? { tenant_name: searchQuery } : {},
    });
    if (!res.data.status) throw new Error("Failed to fetch tenants");
    const tenants = res.data.data;
    
    // Fetch subscription for each tenant
    const tenantsWithSubscriptions = await Promise.all(
      tenants.map(async (tenant: Tenant) => {
        try {
          const subRes = await axiosInstance.get(`/subscription/tenant-plans/${tenant.id}`);
          if (subRes.data.status === "success" && subRes.data.data.length > 0) {
            // Find active subscription
            const activeSub = subRes.data.data.find(
              (sub: any) => sub.status === "active"
            );
            return {
              ...tenant,
              active_subscription: activeSub || null,
            };
          }
          return { ...tenant, active_subscription: null };
        } catch (error) {
          console.error(`Error fetching subscription for tenant ${tenant.id}:`, error);
          return { ...tenant, active_subscription: null };
        }
      })
    );
    
    return tenantsWithSubscriptions;
  };

  const handleRowClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTenant(null);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
    fetchTenants(searchQuery)
      .then(setTenants)
      .catch(console.error)
      .finally(() => setLoading(false));
    }, 500); 
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const tenant = tenants.find((t) => t.id === tenantId);

  const isMobile = useMediaQuery('(min-width: 320px) and (max-width: 767px)');

  if (loading) {
    return (
        <Loader/>
    );
  }
  else if(userPriyority !==1){
    return (
      <>
        <Card
          sx={{
            maxWidth: 1200,
            mx: 'auto',
            mt: 3,
            boxShadow: `0 4px 20px 0 var(--primary-color-2)33`,
            // background: `var(--primary-background-image, linear-gradient(135deg, var(--primary-bg-colors), #e3f2fd))`,
            borderRadius: '16px',
            animation: 'fadeIn 0.5s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(20px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: 'var(--primary-1-text-color)',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-geist-mono)',
                  mr: 1, // spacing between text and icon
                }}
              >
                Tenant Details
              </Typography>
              <Tooltip title="Edit Tenant">
                <IconButton
                  onClick={() => setOpen(true)}
                  sx={{
                    color: 'var(--text-color)',
                    background: '#f2f5f9',
                    '&:hover': { background: '#e2e8f0' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogContent>
                  <AddTenant tenantId={tenantId} onClose={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Tenant Information */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  boxShadow: `0 2px 10px var(--primary-color-2)22`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.04)' },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: 'white',
                    fontFamily: "'Roboto', 'Comic Sans MS', sans-serif",
                    background: `linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))`,
                    p: 1,
                    borderRadius: '8px',
                  }}
                >
                  Basic Information
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Tenant Name:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.tenant_name}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Web sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Subdomain:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.subdomain}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tenant.is_active ? (
                        <CheckCircle sx={{ color: 'var(--primary-color-2)' }} />
                      ) : (
                        <Cancel sx={{ color: 'var(--primary-color-2)' }} />
                      )}
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Status:
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: tenant.is_active ? 'var(--text-color)' : 'var(--primary-color-2)' }}
                    >
                      {tenant.status} ({tenant.is_active ? 'Active' : 'Inactive'})
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Website URL:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.website_url || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Phone:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.tenant_phone || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Tenant Email:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.tenant_email || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Address:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.address || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MailOutlineIcon sx={{ color: 'var(--primary-color-2)' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Primary Reporting Email:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.reporting_email || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Images */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  boxShadow: `0 2px 10px var(--primary-bg-colors)22`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.04)' },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: 'white',
                    fontFamily: "'Roboto', 'Comic Sans MS', sans-serif",
                    background: `linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))`,
                    p: 1,
                    borderRadius: '8px',
                  }}
                >
                  Images
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ImageIcon sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Logo:
                      </Typography>
                    </Box>
                    {tenant.logo ? (
                      <img
                        src={tenant.logo}
                        alt="Tenant Logo"
                        style={{
                          width: '100%',
                          maxHeight: '120px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          boxShadow: `0 2px 8px var(--primary-color-2)33`,
                          transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                        No logo provided
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ImageIcon sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Background Image:
                      </Typography>
                    </Box>
                    {tenant.background_image ? (
                      <img
                        src={tenant.background_image}
                        alt="Background Image"
                        style={{
                          width: '100%',
                          maxHeight: '120px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          boxShadow: `0 2px 8px var(--primary-color-2)33`,
                          transition: 'transform 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                        No background image provided
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Administrator Details */}
              <Box
                sx={{
                  border: `2px solid var(--primary-bg-colors)`,
                  p: 3,
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  boxShadow: `0 2px 10px var(--primary-bg-colors)22`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.04)' },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: 'white',
                    fontFamily: "'Roboto', 'Comic Sans MS', sans-serif",
                    background: `linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))`,
                    p: 1,
                    borderRadius: '8px',
                  }}
                >
                  Administrator Details
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        First Name:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.administrator_user.first_name || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: isMobile ? '100%' : '1 1 45%', minWidth: isMobile ? 'auto' : 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: 'var(--primary-color-2)' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Last Name:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.administrator_user.last_name || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{
                        color: 'var(--primary-color-2)'}} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'var(--text-color)' }}>
                        Email:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                      {tenant.administrator_user.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Toaster
          position="top-right"
          toastOptions={{ className: 'react-hot-toast', style: { background: 'var(--primary-color-2)', color: 'white' } }}
        />
      </>
  )}
  return (
    <>
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 2 }}>
        <CardContent sx={{ padding: "15px 20px !important" }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>

      <Card sx={{ mt: "25px" }}>
        <CardContent sx={{ padding: "20px 20px !important" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Tenants List
            </Typography>
           <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                            size="small"
                            // label="Search Projects"
                            variant="outlined"
                            fullWidth
                            placeholder="Search by User Name..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            InputProps={{
                              startAdornment: (
                                <SearchIcon sx={{ color: "var(--primary-color-1)", mr: 1 }} />
                              ),
                            }}
                            sx={{
                              width: "250px",
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                  borderColor: "var(--primary-color-1)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "var(--primary-color-2)",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "var(--primary-color-2)",
                                },
                              },
                              backgroundColor: "#FFF", // Ensure visibility
                              borderRadius: "4px",
                            }}
                          />
      <ExportFileDropdown
              data={tenants}
              exportToExcel={exportTenantsToExcel}
              exportToDocx={exportTenantsToDocx}
              label="Export Tenants"
            />
       <Link href="/tenant-settings/add-new-tenant" passHref>
              <Button variant="contained" sx={{backgroundColor: "var(--primary-color-2)", color: "var(--text-color-2)", textTransform: "none",fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "var(--primary-color-2-hover)" /* #0799bdc8 */,
                },}}>
                Add New Tenant
              </Button>
            </Link>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "none" }}>
            <Table sx={{ borderCollapse: "separate", borderSpacing: "0" }}>
<TableHead>
  <TableRow sx={{ bgcolor: 'var(--primary-color-1)' }}>
    {[
      'Logo',
      'Tenant Name',
      'Subdomain',
      'Admin',
      'Email',
      'Phone',
      'Status',
      'Subscription Plan',
      'Address',
      'Website',
    ].map((heading) => (
      <TableCell
        key={heading}
        sx={{
          fontWeight: 'bold',
          color: 'white',
          borderBottom: '1px solid #E0E0E0',
          py: 1.2, // slightly reduced padding
          fontSize: 13, // optional: make text more compact
        }}
      >
        {heading}
      </TableCell>
    ))}
  </TableRow>
</TableHead>

              <TableBody>
                {tenants.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tenant, index) => (
                  <TableRow
                    key={tenant.id}
                    onClick={() => handleRowClick(tenant)}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F7F8FA",
                      "&:last-child td": { borderBottom: "none" },
                      "&:hover": {
                        backgroundColor: "#F1F3F4",
                        cursor: "pointer",
                      },
                      transition: "background-color 0.3s",
                    }}
                  >
                    <TableCell
                      sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5, verticalAlign: "middle" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/tenant-settings/add-new-tenant?id=${tenant?.id}`}>
                        <Avatar
                          src={tenant.logo || ""}
                          sx={{ width: 32, height: 32, cursor: "pointer" }}
                        />
                      </Link>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Typography variant="body2" color="#4A4A4A">
                        {tenant.tenant_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getSubdomainChipStyle(),
                          width: "fit-content",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                          px: 2,
                        }}
                      >
                        {tenant.subdomain}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Typography variant="body2" color="#4A4A4A">
                        {tenant.administrator_user.first_name} {tenant.administrator_user.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getEmailChipStyle(tenant.tenant_email || "—"),
                          width: "fit-content",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                          px: 2,
                          "&:hover": {
                            opacity: 0.8,
                          },
                          transition: "opacity 0.3s",
                        }}
                      >
                        <a
                          href={tenant.tenant_email ? `mailto:${tenant.tenant_email}` : "#"}
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <EmailIcon sx={{ fontSize: "14px" }} />
                          {tenant.tenant_email || "—"}
                        </a>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getPhoneChipStyle(tenant.tenant_phone || "—"),
                          width: "fit-content",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                          px: 2,
                          "&:hover": {
                            opacity: 0.8,
                          },
                          transition: "opacity 0.3s",
                        }}
                      >
                        <a
                          href={tenant.tenant_phone ? `tel:${tenant.tenant_phone}` : "#"}
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: "14px" }} />
                          {tenant.tenant_phone || "—"}
                        </a>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getStatusChipStyle(tenant.status),
                          width: "fit-content",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                          px: 2,
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                              tenant.status.toLowerCase() === "active" ? "#43A047" : "#D32F2F",
                            marginRight: "8px",
                          }}
                        />
                        {tenant.status === "active" ? "Active" : "Inactive"}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      {tenant.active_subscription ? (
                        <Box
                          sx={{
                            backgroundColor: tenant.active_subscription.is_trial ? "#FFF3E0" : "#E8F5E9",
                            color: tenant.active_subscription.is_trial ? "#EF6C00" : "#43A047",
                            width: "fit-content",
                            height: "24px",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "12px",
                            fontWeight: "medium",
                            px: 2,
                            gap: 0.5,
                          }}
                        >
                          {tenant.active_subscription.plan.name}
                          {tenant.active_subscription.is_trial && " (Trial)"}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: "#B0BEC5" }}>
                          No Plan
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: getAddressColor(tenant.address || "—") }}>
                        {tenant.address || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getWebsiteChipStyle(tenant.website_url || "—"),
                          width: "fit-content",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                          px: 2,
                          "&:hover": {
                            opacity: 0.8,
                          },
                          transition: "opacity 0.3s",
                        }}
                      >
                        <a
                          href={tenant.website_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <LinkIcon sx={{ fontSize: "14px" }} />
                          {tenant.website_url || "—"}
                        </a>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* <TablePagination
            component="div"
            count={tenants.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          /> */}
          <CustomPagination
            page={page + 1} // convert 0-based page to 1-based
            rowsPerPage={rowsPerPage}
            totalCount={tenants.length}
            onPageChange={(_, newPage) => setPage(newPage - 1)} // convert 1-based to 0-based
          />

        </CardContent>
      </Card>

      <TenantDetailsModal open={modalOpen} onClose={handleCloseModal} tenant={selectedTenant} />
    </>
  );
}