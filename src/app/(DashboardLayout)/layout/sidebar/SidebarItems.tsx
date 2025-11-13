"use client"
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, List } from "@mui/material";
import generateMenuItems from "./MenuItems";
import NavItem from "./NavItem";
import createAxiosInstance from "@/app/axiosInstance";
import { redirect } from 'next/navigation';
import { debug } from "console";
import { useAppselector } from "@/redux/store";
import MenuItems from "./MenuItems";

const SidebarItems = ({ collapsed, roleId }: any) => {
  const pathname = usePathname();
  const [filteredMenu, setFilteredMenu] = useState([]);
  const axiosInstance = createAxiosInstance();
  const tenantId = useAppselector((state) => state.auth.value?.tenant?.id); 

  async function getRoleById(roleId: string) {
    const response = await axiosInstance.get(`/role-management/get-one/${roleId}`);
    return response.data.data;
  }

  function filterMenuByPermissions(menuItems: any, modules: any) {
    const allowedKeys = modules
      .filter((mod: any) => mod.permissions?.read)
      .map((mod: any) => mod.key);
    return menuItems.filter((item: any) => allowedKeys.includes(item.key));
  }

  function restrictRouteByPermissions(routeKey: string, modules: any): boolean {
    const normalizedRouteKey = routeKey.replace(/\/+$/, '');

    const allowedKeys = modules.filter((mod: any) => {
      const normalizedModKey = mod.key.replace(/\/+$/, '');
      return normalizedModKey === normalizedRouteKey;
    });

    return allowedKeys.length > 0;
  }

  function checkRouteAccess(modules: any): boolean {
    const routeKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const baseRoute = routeKey.split('/')[0];
    if (restrictRouteByPermissions(baseRoute, modules)) {
      return true;
    } else {
      redirect('/404');
      return false;
    }
  }

  useEffect(() => {
    async function load() {
      const role = await getRoleById(roleId);
      const allowedMenu = filterMenuByPermissions(MenuItems, role.modules);
      setFilteredMenu(allowedMenu);
      checkRouteAccess(allowedMenu);
    }
    load();
  }, [roleId]);

  return (
    <Box sx={{ pl: collapsed ? 0 : 3 }}>
      <List sx={{ pt: 0, maxHeight:"75vh", overflow:'scroll', scrollbarWidth:'none' }} className="sidebarNav" component="div">
        {filteredMenu?.map((item: any) => (
          <NavItem
            key={item?.id}
            item={item}
            pathDirect={pathname}
            onClick={collapsed}
            collapsed={collapsed}
          />
        ))}
      </List>
    </Box>
  );
};

export default SidebarItems;
