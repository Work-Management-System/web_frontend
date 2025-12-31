"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Avatar,
  Card,
  CardContent,
  Button,
  Checkbox,
} from "@mui/material";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Loader from "@/app/loading";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: string;
  duration_in_days: number;
  type: string;
  is_active: boolean;
  employee_limit?: number | null;
  is_trial_eligible?: boolean;
};

// Helper function to determine color for price (green palette)
const getPriceColor = (price: string) => {
  const priceValue = parseFloat(price);
  if (priceValue < 50) return { backgroundColor: "#C8E6C9", color: "#2E7D32" };
  if (priceValue < 100) return { backgroundColor: "#A5D6A7", color: "#1B5E20" }; 
  return { backgroundColor: "#81C784", color: "#0D3C13" }; 
};

// Helper function to determine color for duration (blue palette)
const getDurationColor = (duration: number) => {
  if (duration < 30) return { backgroundColor: "#BBDEFB", color: "#1565C0" }; 
  if (duration < 90) return { backgroundColor: "#90CAF9", color: "#0D47A1" }; 
  return { backgroundColor: "#64B5F6", color: "#073182" }; 
};

// Helper function to determine chip color for type (purple palette)
const getTypeChipStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "paid":
      return { backgroundColor: "#E1BEE7", color: "#7B1FA2" };
    case "free":
      return { backgroundColor: "#CE93D8", color: "#4A148C" };
    default:
      return { backgroundColor: "#BA68C8", color: "#38006B" }; 
  }
};

// Helper function for description text color
const getDescriptionColor = (description: string) => {
  return description === "—" ? "#B0BEC5" : "#4A4A4A";
};

export default function SubscriptionPlanList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const pathName = usePathname();
  const axiosInstance = createAxiosInstance();

  const fetchPlans = async () => {
    const res = await axiosInstance.get("/subscription/list");
    if (!res.data.status) throw new Error("Failed to fetch plans");
    return res.data.data;
  };

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
        <Loader />
    );
  }

  return (
    <>
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 2 }}>
        <CardContent sx={{ padding: "15px 20px !important" }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>

      <Card sx={{ mt: "25px" }}>
        <CardContent sx={{ padding: "20px 20px !important" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4">Plan List</Typography>
            <Link href="/subscriptions-listing/add-subscription-plan" passHref>
              <Button variant="contained" sx={{backgroundColor: "var(--primary-color-1)" /* #0798bd */,
                color: "var(--text-color-2)" /* #ffffff */,
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)" /* #0799bdc8 */,
                }}}>
                Add New Plan
              </Button>
            </Link>
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "none" }}>
            <Table sx={{ borderCollapse: "separate", borderSpacing: "0" }}>
              <TableHead>
  <TableRow sx={{ bgcolor: 'var(--primary-color-1)' }}>
    {[
      'Name',
      'Price',
      'Duration In Days',
      'Employee Limit',
      'Type',
      'Trial Eligible',
      'Description',
    ].map((heading) => (
      <TableCell
        key={heading}
        sx={{
          fontWeight: 'bold',
          color: 'white',
          borderBottom: '1px solid #E0E0E0',
          py: 2,
        }}
      >
        {heading}
      </TableCell>
    ))}
  </TableRow>
</TableHead>
              <TableBody>
                {plans.filter((plan)=>plan.type === 'paid').map((plan, index) => (
                  <TableRow
                    key={plan.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F7F8FA",
                      "&:last-child td": { borderBottom: "none" },
                      "&:hover": {
                        backgroundColor: "#F1F3F4",
                        cursor: "pointer",
                      },
                      transition: "background-color 0.3s",
                    }}
                  >
                    <TableCell sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
{/*                       
                      <Avatar
                        src={""} // Add a placeholder or fetch from plan if available
                        sx={{ width: 32, height: 32 }}
                      /> */}
                      <Typography variant="body2" color="#4A4A4A">
                        {plan.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getPriceColor(plan.price),
                          width: "60px",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                        }}
                      >
                        {plan.price}$
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getDurationColor(plan.duration_in_days),
                          width: "60px",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                        }}
                      >
                        {plan.duration_in_days}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: "#4A4A4A" }}>
                        {plan.employee_limit ? `Up to ${plan.employee_limit}` : 'Unlimited'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          ...getTypeChipStyle(plan.type),
                          width: "60px",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                        }}
                      >
                        {plan.type}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Box
                        sx={{
                          backgroundColor: plan.is_trial_eligible ? "#C8E6C9" : "#FFCDD2",
                          color: plan.is_trial_eligible ? "#2E7D32" : "#C62828",
                          width: "60px",
                          height: "24px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "medium",
                        }}
                      >
                        {plan.is_trial_eligible ? "Yes" : "No"}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #E0E0E0", py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: getDescriptionColor(plan.description || "—") }}>
                        {plan.description || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
}