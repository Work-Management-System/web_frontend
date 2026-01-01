import { useEffect, useState } from "react";
import {
  useMediaQuery,
  Box,
  Drawer,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import Logo from "../shared/logo/Logo";
import SidebarItems from "./SidebarItems";
import SettingsIcon from '@mui/icons-material/Settings';
import { useAppselector } from "@/redux/store";
import PaletteIcon from '@mui/icons-material/Palette';
import { usePaletteChange } from "@/contextapi/PaletteChangeContext";


const Sidebar = ({
  isMobileSidebarOpen,
  onSidebarClose,
  isSidebarOpen,
}: any) => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const [collapsed, setCollapsed] = useState(true);
  const [open, setOpen] = useState(false);
  const authData = useAppselector(state => state.auth.value);
  const { notifyPaletteChange } = usePaletteChange();
  const colorPalettes = [
    {
      name: "Royal Navy",
      primaryBgColor: "#F8F9FB",
      primaryColor1: "#0A1A2F",
      primaryColor2: "#C9A227",
      bgColor: "#FFFFFF",
      textColor: "#1A1A1A",
      primaryTextColor: "#0A1A2F",
      primaryBackgroundImage: "url('images/themeImage/royal-navy.png')",

    },
    {
      name: "Emerald Elegance",
      primaryBgColor: "#F4F7F5",
      primaryColor1: "#014D40",
      primaryColor2: "#A68A64",
      bgColor: "#FFFFFF",
      textColor: "#102019",
      primaryTextColor: "#014D40",
      primaryBackgroundImage: "url('images/themeImage/emerald-elegance.png')",
    },
    {
      name: "Ivory Noir",
      primaryBgColor: "#FAFAFA",
      primaryColor1: "#1C1C1C",
      primaryColor2: "#A39081",
      bgColor: "#FFFFFF",
      textColor: "#262626",
      primaryTextColor: "#1C1C1C",
      primaryBackgroundImage: "url('images/themeImage/ivory-noir.png')",
    },
    {
      name: "Sapphire Mist",
      primaryBgColor: "#F5F7FA",
      primaryColor1: "#1E3A5F",
      primaryColor2: "#8BA6BF",
      bgColor: "#FFFFFF",
      textColor: "#1F2933",
      primaryTextColor: "#1E3A5F",
      primaryBackgroundImage: "url('images/themeImage/sapphire-mist.png')",
    },
    {
      name: "Carbon Luxe",
      primaryBgColor: "#F6F6F6",
      primaryColor1: "#2C2C2C",
      primaryColor2: "#8D7B68",
      bgColor: "#FFFFFF",
      textColor: "#1B1B1B",
      primaryTextColor: "#2C2C2C",
      primaryBackgroundImage: "url('images/themeImage/carbon-luxe.png')",
    },
  ];



  const [selectedColorPalette, setSelectedColorPalette] = useState(colorPalettes[0]);
  const backgroundSidebar = "var(--primary-color-1)";
  const sidebarWidth = 270;
  const collapsedWidth = 120

  const roleId = authData?.role?.id;
  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handlePaletteChange = (palette: typeof colorPalettes[0]) => {
    setSelectedColorPalette(palette);

    document.documentElement.style.setProperty("--primary-bg-colors", palette.primaryBgColor);
    document.documentElement.style.setProperty("--primary-color-1", palette.primaryColor1);
    document.documentElement.style.setProperty("--primary-color-2", palette.primaryColor2);
    document.documentElement.style.setProperty("--bg-color", palette.bgColor);
    document.documentElement.style.setProperty("--text-color", palette.textColor);
    document.documentElement.style.setProperty("--primary-1-text-color", palette.primaryTextColor);
    document.documentElement.style.setProperty("--primary-background-image", palette.primaryBackgroundImage || 'none');
    localStorage.setItem("selectedColorPalette", JSON.stringify(palette));
    notifyPaletteChange();
  };


  const drawerStyle = {
    width: collapsed ? collapsedWidth : sidebarWidth,
    backgroundColor: backgroundSidebar,
    boxSizing: "border-box",
    border: "0",
    borderRadius: "0px 30px 30px 0px",
    transition: "width 0.3s ease",
    overflowX: "hidden",
    overflowY: "auto",
    "&::-webkit-scrollbar": { display: "none" },
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    boxShadow: "2px 0px 8px rgba(0,0,0,0.05)",
  };

  useEffect(() => {
    const saved = localStorage.getItem("selectedColorPalette");
    const palette = saved ? JSON.parse(saved) : colorPalettes[0];
    handlePaletteChange(palette);
  }, []);

  if (lgUp) {
    return (
      <>
        <Box sx={{ width: collapsed ? collapsedWidth : sidebarWidth, flexShrink: 0 }} data-tour="sidebar">
          <Drawer
            anchor="left"
            open={isSidebarOpen}
            variant="permanent"
            PaperProps={{ sx: drawerStyle }}
          >
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box px={collapsed ? 1 : 2} pt={3}>
                <Logo collapsed={collapsed} />
              </Box>
              <Box sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",

              }}>
                <Box pt={2}>
                  <SidebarItems roleId={roleId} collapsed={collapsed} />
                </Box>
              </Box>
              <Box px={collapsed ? 0 : 2} py={2} display="flex" justifyContent="space-evenly" alignItems="center">
                {/* Left-hand side: Setting icon */}
                <IconButton onClick={toggleDrawer} size="small" sx={{ color: "#fff" }}>
                  <PaletteIcon sx={{ fontSize: 35 }} /> {/* Replace with your settings icon */}
                </IconButton>

                {/* Right-hand side: Tooltip button */}
                <Tooltip title={collapsed ? "Expand" : "Collapse"}>
                  <IconButton onClick={handleToggleCollapse} size="small" sx={{ color: "#fff" }}>
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                  </IconButton>
                </Tooltip>
              </Box>

            </Box>
          </Drawer>
        </Box>

        <Drawer
          anchor="right"
          open={open}
          onClose={toggleDrawer}
        >
          {/* Drawer content */}
          <div className="h-100vh bg-gray-50 flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-6xl">
              <h2 className="text-2xl sm:text-3xl font-light text-gray-800 text-center mb-12 tracking-wide">
                Choose Your Palette
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                {colorPalettes.map((palette, index) => (
                  <div
                    key={index}
                    className={`group bg-white rounded-lg p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 ${selectedColorPalette === palette ? 'border-gray-300' : 'border-transparent'
                      } hover:border-gray-200`}
                    onClick={() => handlePaletteChange(palette)}
                  >
                    <div className="flex justify-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-full border border-gray-100 group-hover:scale-105 transition-transform duration-200"
                        style={{ backgroundColor: palette.primaryBgColor }}
                      ></div>
                      <div
                        className="w-12 h-12 rounded-full border border-gray-100 group-hover:scale-105 transition-transform duration-200"
                        style={{ backgroundColor: palette.primaryColor1 }}
                      ></div>
                      <div
                        className="w-12 h-12 rounded-full border border-gray-100 group-hover:scale-105 transition-transform duration-200"
                        style={{ backgroundColor: palette.primaryColor2 }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span
                        className="text-lg font-medium"
                        style={{ color: palette.textColor }}
                      >
                        {palette.name}
                      </span>
                      <p
                        className={`mt-2 text-sm font-medium transition-colors duration-200 ${selectedColorPalette === palette ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        style={{ color: palette.primaryTextColor }}
                      >
                        {selectedColorPalette === palette ? 'Selected' : 'Select'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          backgroundColor: backgroundSidebar,
          borderRadius: "0px 30px 30px 0px",
        },
      }}
    >
      <Box>
        <Box px={2} pt={3}>
          <Logo />
        </Box>
        <Box pt={2}>
          <SidebarItems roleId={roleId} collapsed={collapsed} />
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
