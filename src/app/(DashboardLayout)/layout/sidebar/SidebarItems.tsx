"use client"
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, List } from "@mui/material";
import NavItem from "./NavItem";
import createAxiosInstance from "@/app/axiosInstance";
import { redirect } from 'next/navigation';
import { useAppselector } from "@/redux/store";
import MenuItems from "./MenuItems";

const SidebarItems = ({ collapsed, roleId }: any) => {
  const pathname = usePathname();
  const [filteredMenu, setFilteredMenu] = useState([]);
  const axiosInstance = createAxiosInstance();
  const tenantId = useAppselector((state) => state.auth.value?.tenant?.id);
  const roleFromRedux = useAppselector((state) => state.role.value); // Get role from Redux 

  async function getRoleById(roleId: string) {
    try {
      if (!roleId || roleId === 'null' || roleId === 'undefined') {
        return null;
      }
      const response = await axiosInstance.get(`/role-management/get-one/${roleId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  }

  function filterMenuByPermissions(menuItems: any, modules: any) {
    // If modules is null/undefined or not an array, return empty (no permissions)
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return []; // No modules = no menu items
    }
    
    // Filter by modules with read permission
    const allowedKeys = modules
      .filter((mod: any) => mod?.permissions?.read === true)
      .map((mod: any) => mod?.key)
      .filter(Boolean); // Remove any undefined/null keys
    
    return menuItems.filter((item: any) => allowedKeys.includes(item.key));
  }

  function checkRouteAccess(menuItems: any): boolean {
    // If no menu items or empty, allow access (for fresh accounts)
    if (!menuItems || menuItems.length === 0) {
      return true;
    }
    
    const routeKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const baseRoute = routeKey.split('/')[0];
    
    // Check if the route exists in menu items
    const hasRoute = menuItems.some((item: any) => {
      const itemKey = item.key?.replace(/\/+$/, '');
      return itemKey === baseRoute;
    });
    
    if (hasRoute) {
      return true;
    } else {
      // Only redirect if we have menu items and route doesn't exist
      redirect('/404');
      return false;
    }
  }

  useEffect(() => {
    async function load() {
      if (!roleId) {
        // If no roleId, show empty menu (no role assigned)
        setFilteredMenu([]);
        return;
      }
      
      // First try to use role from Redux (faster, already loaded)
      let role = null;
      if (roleFromRedux && roleFromRedux.id === roleId) {
        role = roleFromRedux;
      } else {
        // Fallback to API if Redux doesn't have it
        role = await getRoleById(roleId);
      }
      
      // If role is null (doesn't exist), show empty menu
      if (!role) {
        setFilteredMenu([]);
        return;
      }
      
      // Parse modules if it's a string (JSON)
      let modules = role.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch (e) {
          console.error('Failed to parse modules JSON:', e);
          modules = [];
        }
      }
      
      // Debug logging to help identify the issue
      console.log('Role filtering:', {
        roleId: role.id,
        roleName: role.name,
        hasModules: !!modules,
        modulesType: typeof modules,
        isArray: Array.isArray(modules),
        modulesLength: Array.isArray(modules) ? modules.length : 'N/A',
        modules: modules
      });
      
      // Always filter by modules - if modules is null/undefined/empty, show empty menu
      // This ensures SuperAdmin and all roles only see what's assigned to them
      // NOTE: If SuperAdmin role has no modules assigned, they will see no menus.
      // The role needs to have modules assigned in the database for menus to appear.
      const allowedMenu = filterMenuByPermissions(MenuItems, modules);
      
      console.log('Menu filtering result:', {
        totalMenuItems: MenuItems.length,
        allowedMenuItems: allowedMenu.length,
        allowedKeys: allowedMenu.map((item: any) => item.key)
      });
      
      setFilteredMenu(allowedMenu);
      checkRouteAccess(allowedMenu);
    }
    load();
  }, [roleId, roleFromRedux]);

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
