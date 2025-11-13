"use client";
import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import createAxiosInstance from "@/app/axiosInstance";
import Link from "next/link";
import { useAppselector } from "@/redux/store";
import { toast } from "react-hot-toast";
import { SubscriptionContext } from "@/app/(DashboardLayout)/layout";
import Loader from "@/app/loading";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: string;
  duration_in_days: number;
  type: string;
  is_active: boolean;
  features?: string[];
};

type TenantSubscription = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  plan: Plan;
};

export default function SubscriptionPlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenantSubscription, setTenantSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector((state) => state.auth.value);
  const tenantId = authData.tenant.id;
  const { setIsSubscriptionActive } = useContext(SubscriptionContext);

  const fetchPlans = async () => {
    const res = await axiosInstance.get("/subscription/list");
    if (!res.data.status) throw new Error("Failed to fetch plans");
    return res.data.data;
  };

  const fetchTenantSubscription = async () => {
    try {
      const res = await axiosInstance.get(`/subscription/tenant-plans/${tenantId}`);
      if (res.data.status === "success" && res.data.data.length > 0) {
        return res.data.data[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching tenant subscription:", error);
      return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    const subscription = await fetchTenantSubscription();
    if (subscription) {
      setTenantSubscription(subscription);
      setIsSubscriptionActive(true);
    } else {
      const planData = await fetchPlans();
      const sortedPlans = planData.sort(
        (a: { price: string }, b: { price: string }) => parseFloat(a.price) - parseFloat(b.price)
      );
      setPlans(sortedPlans);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleSelectPlan = async (id: string) => {
    const selectedPlan = plans.find((plan) => plan.id === id);
    if (!selectedPlan) {
      console.error("Selected plan not found");
      toast.error("Selected plan not found");
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + selectedPlan.duration_in_days);

    const payload = {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      plan_id: id,
      tenant_id: tenantId,
    };

    try {
      const res = await axiosInstance.post(`/subscription/buy-subscription`, payload);
      if (res.data.status === "success") {
        setIsSubscriptionActive(true); 
        toast.success("Subscription activated successfully!");
        await loadData();
      } else {
        setIsSubscriptionActive(false); 
        toast.error("Failed to activate subscription");
      }
    } catch (error) {
      setIsSubscriptionActive(false);
      console.error("Error selecting plan:", error);
      toast.error("Error activating subscription");
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  const getPriceLabel = (price: string, duration_in_days: number) => {
    const priceValue = parseFloat(price);
    if (duration_in_days >= 300) {
      return `$${price}/yr`;
    } else if (duration_in_days >= 30) {
      const months = Math.floor(duration_in_days / 30);
      const remainingDays = duration_in_days % 30;
      if (remainingDays === 0) {
        return `$${price}/mth (${months} month${  months > 1 ? "s" : ""})`;
      } else {
        return `$${price} (${duration_in_days} days)`;
      }
    } else {
      return `$${price} (${duration_in_days} days)`;
    }
  };

  const getDefaultFeatures = (name: string) => {
    switch (name.toLowerCase()) {
      case "ultra pro":
        return [
          "Basic auto tracking",
          "Standard transaction clearing",
          "Email support",
          "Limited widget access",
        ];
      case "enterprise":
        return [
          "Basic auto tracking",
          "Standard transaction clearing",
          "Email support",
          "Limited widget access",
        ];
      default:
        return [
          "2 auto tracking",
          "7 Day transaction clearing",
          "24/7 Customer support",
          "All widget access",
        ];
    }
  };

  if (tenantSubscription) {
    const { plan, start_date, end_date, status } = tenantSubscription;
    return (
      <Box
        p={4}
        sx={{
          maxWidth: "1200px",
          margin: "0 auto",
          // backgroundColor: "var(--primary-bg-colors)" /* #EDEEF0 */,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ mb: 4, fontWeight: "bold", color: "var(--primary-bg-text)" /* #002A60 */ }}
        >
          Your Current Subscription
        </Typography>
        <Card
          sx={{
            maxWidth: 400,
            margin: "0 auto",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            background: "var(--bg-color)" /* #fff */,
            borderTop: "4px solid var(--primary-color-1)" /* #0798bd */,
          }}
        >
          <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography
              variant="h6"
              sx={{ color: "var(--primary-1-text-color)" /* #002A60 */, fontWeight: "medium" }}
            >
              {plan.name}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "var(--primary-bg-text)" /* #002A60 */ }}
            >
              {getPriceLabel(plan.price, plan.duration_in_days)}
            </Typography>
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              {plan.description || "No description available"}
            </Typography>
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              <strong>Status:</strong> {status}
            </Typography>
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              <strong>Start Date:</strong> {new Date(start_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              <strong>End Date:</strong> {new Date(end_date).toLocaleDateString()}
            </Typography>
            <List sx={{ mt: 0, padding: 0 }}>
              {(plan.features || getDefaultFeatures(plan.name)).map((feature, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30, color: "var(--primary-color-1)" /* #0798bd */ }}>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={feature}
                    primaryTypographyProps={{ fontSize: "14px", color: "var(--secondary-color)" /* #333333 */ }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                backgroundColor: "var(--primary-color-1)" /* #0798bd */,
                color: "var(--text-color)" /* #ffffff */,
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)" /* #0799bdc8 */,
                },
                textTransform: "none",
                padding: "8px 16px",
                fontSize: "16px",
              }}
              component={Link}
              href="/manage-subscription"
            >
              Manage Subscription
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      sx={{
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "var(--primary-bg-colors)" /* #EDEEF0 */,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ mb: 4, fontWeight: "bold", color: "var(--primary-bg-text)" /* #002A60 */ }}
      >
        Find the perfect plan for your project
      </Typography>
      <Typography
        variant="body2"
        align="center"
        color="var(--secondary-color)" /* #333333 */
        mb={6}
      >
        We believe TimeSheet should be accessible to all startups and companies, no matter the size.
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {plans
          .filter((plan) => plan.type === "paid")
          .map((plan) => (
            <Card
              key={plan.id}
              sx={{
                width: 300,
                minHeight: 400,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "center",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                background: "var(--bg-color)" /* #fff */,
                borderTop: "4px solid var(--primary-color-1)" /* #0798bd */,
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "var(--primary-1-text-color)" /* #002A60 */, fontWeight: "medium" }}
                  >
                    {plan.name}
                  </Typography>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ fontWeight: "bold", color: "var(--primary-bg-text)" /* #002A60 */ }}
                  >
                    {getPriceLabel(plan.price, plan.duration_in_days)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    minHeight: "150px",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="var(--secondary-color)" /* #333333 */
                    sx={{ mb: 2, textAlign: "left" }}
                  >
                    {plan.description || "No description available"}
                  </Typography>
                  <List sx={{ mt: 0, padding: 0 }}>
                    {(plan.features || getDefaultFeatures(plan.name)).map((feature, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                        <ListItemIcon
                          sx={{ minWidth: 30, color: "var(--primary-color-1)" /* #0798bd */ }}
                        >
                          <CheckIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            fontSize: "14px",
                            color: "var(--secondary-color)" /* #333333 */,
                          }}
                        />
                      </ListItem>
                    ))}
               </List>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{
                    backgroundColor:
                      plan.name.toLowerCase() === "free plan"
                        ? "#e0e0e0"
                        : "var(--primary-color-1)" /* #0798bd */,
                    color:
                      plan.name.toLowerCase() === "free plan"
                        ? "#000"
                        : "var(--text-color)" /* #ffffff */,
                    "&:hover": {
                      backgroundColor:
                        plan.name.toLowerCase() === "free plan"
                          ? "#d0d0d0"
                          : "var(--primary-color-1-hover)" /* #0799bdc8 */,
                    },
                    textTransform: "none",
                    padding: "8px 16px",
                    fontSize: "16px",
                  }}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Select Plan
                </Button>
                {plan.name?.toLowerCase().includes("enterprise") && (
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    sx={{
                      backgroundColor: "var(--primary-color-2)" /* #FF8700 */,
                      color: "var(--text-color)" /* #ffffff */,
                      "&:hover": {
                        backgroundColor: "#e07b00",
                      },
                      textTransform: "none",
                      padding: "8px 16px",
                      fontSize: "16px",
                    }}
                  >
                    Chat to sales
                  </Button>
                )}
              </Box>
            </Card>
          ))}
      </Box>
    </Box>
  );
}

