"use client";
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import OrganizationChart from "./OrganizationChart";
import EmployeeDocuments from "./EmployeeDocuments";
import PayrollDocuments from "./PayrollDocuments";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Employee Documents (default)

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            minHeight: 48,
            px: 3,
            color: "rgba(0, 0, 0, 0.6)",
            transition: "all 0.3s ease",
            "&:hover": {
              color: "var(--primary-color-1)",
              backgroundColor: "rgba(7, 152, 189, 0.04)",
              borderRadius: "8px 8px 0 0",
            },
          },
          "& .Mui-selected": {
            color: "var(--primary-color-1) !important",
            fontWeight: 700,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--primary-color-1)",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        <Tab label="Employee Documents" />
        <Tab label="Payroll Documents" />
        <Tab label="Organizational Tree" />
      </Tabs>

      {activeTab === 0 && <EmployeeDocuments />}
      {activeTab === 1 && <PayrollDocuments />}
      {activeTab === 2 && <OrganizationChart />}
    </Box>
  );
}
