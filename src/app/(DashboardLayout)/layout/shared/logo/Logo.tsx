'use client';
import Link from "next/link";
import { Box, styled, Typography } from "@mui/material";
import Image from "next/image";
import { useAppselector } from "@/redux/store";
import createAxiosInstance from "@/app/axiosInstance";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LinkStyled = styled(Link)(() => ({
  overflow: "hidden",
  display: "block",
  textAlign: "center",
}));

const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector((state) => state.auth.value);
  const tenantId = authData?.tenant?.id;
  const logo = "images/logos/time-sheet-base-logo.png";
  const fullLogo = "images/logos/manazeit_logo.png";
  const [tenantLogo, setTenantLogo] = useState<any | null>(logo);
  const [tenantFullLogo, setTenantFullLogo] = useState<any | null>(fullLogo);
  const router=useRouter();

    const handleLogoClick = () => {
      router.push('/dashboard');
  };

  useEffect(() => {
    const fetchTenantLogo = async () => {
      try {
        const response = await axiosInstance.get(`/tenants/get-one/${tenantId}`);
        const logoUrl = response?.data?.data?.logo;
        setTenantLogo(logoUrl);
        setTenantFullLogo(logoUrl);
      } catch (error) {
        console.error("Error fetching tenant logo:", error);
      }
    };

    if (tenantId) {
      fetchTenantLogo();
    }
  }, [tenantId]);
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
        src={collapsed ? tenantLogo : tenantFullLogo}
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
