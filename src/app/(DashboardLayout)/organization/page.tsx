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
        sx={{ mb: 3 }}
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
