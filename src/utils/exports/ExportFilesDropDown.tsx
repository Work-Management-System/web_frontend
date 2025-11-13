import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";

type ExportDropdownProps<T> = {
  data: T;
  exportToExcel: (data: T) => void;
  exportToDocx: (data: T) => void;
  label?: string;
};

function ExportFileDropdown<T>({
  data,
  exportToExcel,
  exportToDocx,
  label = "Download",
}: ExportDropdownProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Button
        variant="outlined"
        onClick={handleClick}
        sx={{
          ml: 2,
          color: "var(--primary-1-text-color)",
          textTransform: "none",
          borderColor: "var(--primary-1-text-color)",
          "&:hover": {
            backgroundColor: "var(--bg-color)",
          },
        }}
      >
        {label}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            exportToDocx(data);
            handleClose();
          }}
          sx={{ fontSize: '0.700rem','&:hover': {
        backgroundColor: 'var(--primary-bg-colors)', 
      }, }}
          
        >
          Export as DOCX
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportToExcel(data);
            handleClose();
          }}
          sx={{ fontSize: '0.700rem','&:hover': {
        backgroundColor: 'var(--primary-bg-colors)',}
 }}
        >
          Export as Excel
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default ExportFileDropdown;
