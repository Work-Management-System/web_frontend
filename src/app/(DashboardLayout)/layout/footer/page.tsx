'use client';
import React from "react";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <Box className="footer-making" sx={{ mt: '28px', textAlign: "center" }}>
      <Typography>
        © {currentYear} All rights reserved by{" "}
        <Link href="https://www.cybrain.co.in/" target="_blank">
          Cybrain Software Solutions Pvt Ltd
        </Link>{" "}
      </Typography>
    </Box>
  );
};

export default Footer;
