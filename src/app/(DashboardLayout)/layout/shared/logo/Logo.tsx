'use client';
import Link from "next/link";
import { Box, styled, Typography } from "@mui/material";
import Image from "next/image";
import { useAppselector } from "@/redux/store";
import createAxiosInstance from "@/app/axiosInstance";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LinkStyled = styled(Link)(() => ({
  overflow: "hidden",
  display: "block",
  textAlign: "center",
}));

// Default logos
const DEFAULT_SMALL_LOGO = "/images/logos/time-sheet-base-logo.png";
const DEFAULT_FULL_LOGO = "/images/logos/manazeit_logo.png";

const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector((state) => state.auth.value);
  const tenantId = authData?.tenant?.id;
  const [tenantLogo, setTenantLogo] = useState<string>(DEFAULT_SMALL_LOGO);
  const [tenantFullLogo, setTenantFullLogo] = useState<string>(DEFAULT_FULL_LOGO);
  const router = useRouter();

  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    const fetchTenantLogo = async () => {
      try {
        const response = await axiosInstance.get(`/tenants/get-one/${tenantId}`);
        const logoUrl = response?.data?.data?.logo;
        // Only set if logoUrl is a valid non-empty string
        if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '') {
          setTenantLogo(logoUrl);
          setTenantFullLogo(logoUrl);
        }
      } catch (error) {
        console.error("Error fetching tenant logo:", error);
      }
    };

    if (tenantId) {
      fetchTenantLogo();
    }
  }, [tenantId]);

  // Get the logo src with fallback to defaults
  const getLogoSrc = () => {
    const logo = collapsed ? tenantLogo : tenantFullLogo;
    // Return default if empty or invalid
    if (!logo || logo.trim() === '') {
      return collapsed ? DEFAULT_SMALL_LOGO : DEFAULT_FULL_LOGO;
    }
    return logo;
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-start",
        alignItems: "center",
        cursor: "pointer",
        px: collapsed ? 0 : 2,
        py: 1,
      }}
      onClick={handleLogoClick}
    >
      <Image
        src={getLogoSrc()}
        alt="logo"
        height={collapsed ? 60 : 72}
        width={collapsed ? 60 : 160}
        priority
        unoptimized
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
};

export default Logo;
