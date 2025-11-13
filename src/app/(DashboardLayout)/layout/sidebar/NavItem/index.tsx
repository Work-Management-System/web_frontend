import React from "react";
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme,
  ListItemButton,
  Typography,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import roundedImage from "@/assets/logos/Vector 1.png";
import { useAppselector } from "@/redux/store";
import { usePathname } from "next/navigation";

type NavGroup = {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: any;
  onClick?: React.MouseEvent<HTMLButtonElement, MouseEvent>;
};

interface ItemType {
  item: NavGroup;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  hideMenu?: any;
  level?: number | any;
  pathDirect: string;
  collapsed?: boolean;
}

const NavItem = ({ item, level, pathDirect, onClick, collapsed }: ItemType) => {
  const Icon = item.icon;
  const theme = useTheme();
  const pathname = usePathname();
  const itemIcon = <Icon stroke={1.5} size="1.3rem" />;
  const selectedColor = 'var(--primary-bg-colors)'
  const selectedText = 'var(--primary-bg-text)'
  const menuBackground = 'var(--primary-color-1)'

  const ListItemStyled = styled(ListItem)(() => ({
    padding: 0,
    ".MuiButtonBase-root": {
      whiteSpace: "nowrap",
      marginBottom: "8px",
      padding: "8px 10px 8px 14px",
      borderRadius: "30px 0px 0px 30px",
      backgroundColor: menuBackground,
      color: selectedColor,
      transition: '.5s',
      "&:hover": {
        backgroundColor: menuBackground,
        color: selectedColor,
        transition: '.5s',
      },
      "&.Mui-selected": {
        color: selectedText,
        backgroundColor: selectedColor,
        "&:hover": {
          color: selectedText,
          backgroundColor: selectedColor,
        },
      },
    },
  }));

  const normalizePath = (path: string) => path.replace(/\/+$/, "");
  const isSelected = normalizePath(pathname).startsWith(normalizePath(item.href));

  return (
    <List component="div" disablePadding key={item.id}>
      <ListItemStyled>
        <div className={`list-rounded ${isSelected ? 'selected-list-main' : ''}`} style={{ width: '100%', position: 'relative' }}>
        <ListItemButton
  component={Link}
  href={item.href}
  disabled={item.disabled}
  selected={isSelected}
  target={item.external ? "_blank" : ""}
  sx={{
    paddingLeft: collapsed ? "0px" : "5px",
    display: "flex",
    flexDirection: collapsed ? "column" : "row",
    alignItems: "center",
    textAlign: "center",
    gap: 0,
    minHeight: collapsed ? 48 : 56,
    py: collapsed ? 0.5 : 1,
  }}
>
  <ListItemIcon
    sx={{
      minWidth: "auto",
      color: "inherit",
      pr: collapsed ? "0px" : "10px",
      justifyContent: "center",
      height: collapsed ? 24 : "auto", 
      display: "flex",
      alignItems: "center",
    }}
  >
    {itemIcon}
  </ListItemIcon>

  <ListItemText
    primary={
      <Typography
        variant="body2"
        sx={{
          whiteSpace: "nowrap",
          fontSize: collapsed ? 11 : 15,
          lineHeight: collapsed ? "1.2" : "1.5",
        }}
      >
        {item.title}
      </Typography>
    }
    sx={{
      textAlign: collapsed ? "center" : "left",
      minHeight: "auto",
      padding: 0,
      margin: collapsed ? "2px 0 0" : "0",
    }}
  />
</ListItemButton>

        </div>
      </ListItemStyled>
    </List>
  );
};

export default NavItem;
