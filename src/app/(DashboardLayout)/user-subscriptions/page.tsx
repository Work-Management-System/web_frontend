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
  employee_limit?: number | null; // null = unlimited
  is_trial_eligible?: boolean;
  features?: string[];
};

type TenantSubscription = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_trial?: boolean;
  is_paid?: boolean;
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

    // For paid plans, create Razorpay order
    if (selectedPlan.type === 'paid') {
      try {
        // Create Razorpay order
        const orderRes = await axiosInstance.post('/subscription/create-razorpay-order', {
          plan_id: id,
          tenant_id: tenantId,
          amount: parseFloat(selectedPlan.price),
          currency: 'INR',
        });

        if (orderRes.data.status === 'success') {
          const order = orderRes.data.data;
          
          // Load Razorpay script and initialize payment
          await loadRazorpayScript();
          
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Add to .env
            amount: order.amount,
            currency: order.currency,
            name: 'ManazeIT',
            description: `Subscription: ${selectedPlan.name}`,
            order_id: order.id,
            handler: async function (response: any) {
              try {
                // Verify payment
                const verifyRes = await axiosInstance.post('/subscription/verify-razorpay-payment', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: id,
                  tenant_id: tenantId,
                });

                if (verifyRes.data.status === 'success') {
                  setIsSubscriptionActive(true);
                  toast.success('Payment successful! Subscription activated.');
                  await loadData();
                } else {
                  toast.error('Payment verification failed');
                }
              } catch (error: any) {
                console.error('Payment verification error:', error);
                toast.error(error?.response?.data?.message || 'Payment verification failed');
              }
            },
            prefill: {
              name: authData.user?.email || '',
              email: authData.user?.email || '',
            },
            theme: {
              color: '#0798bd',
            },
            modal: {
              ondismiss: function() {
                toast.error('Payment cancelled');
              },
            },
          };

          const razorpay = (window as any).Razorpay;
          if (razorpay) {
            const razorpayInstance = new razorpay(options);
            razorpayInstance.open();
          } else {
            throw new Error('Razorpay SDK not loaded');
          }
        }
      } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        toast.error(error?.response?.data?.message || 'Failed to initialize payment');
      }
    } else {
      // For free plans (shouldn't happen for regular users, but handle it)
      toast.error('Free plans can only be assigned by SuperAdmin');
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
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

  const getDefaultFeatures = (plan: Plan) => {
    const employeeLimit = plan.employee_limit 
      ? `Up to ${plan.employee_limit} employees`
      : 'Unlimited employees';
    
    const baseFeatures = [
      employeeLimit,
      "Auto time tracking",
      "Transaction clearing",
      "24/7 Customer support",
      "All widget access",
    ];

    if (plan.name.toLowerCase().includes('professional')) {
      return [
        ...baseFeatures,
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
      ];
    }

    return baseFeatures;
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
              <strong>Status:</strong> {status} {tenantSubscription.is_trial && '(Free Trial)'}
            </Typography>
            {plan.employee_limit && (
              <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
                <strong>Employee Limit:</strong> Up to {plan.employee_limit} employees
              </Typography>
            )}
            {!plan.employee_limit && (
              <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
                <strong>Employee Limit:</strong> Unlimited
              </Typography>
            )}
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              <strong>Start Date:</strong> {new Date(start_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="var(--secondary-color)" /* #333333 */>
              <strong>End Date:</strong> {new Date(end_date).toLocaleDateString()}
            </Typography>
            <List sx={{ mt: 0, padding: 0 }}>
              {(plan.features || getDefaultFeatures(plan)).map((feature, index) => (
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
              fullWidth
              sx={{
                backgroundColor: "var(--primary-color-1)" /* #0798bd */,
                color: "var(--text-color-2) !important" /* White for dark background */,
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)" /* #0799bdc8 */,
                  color: "var(--text-color-2) !important",
                },
                "& .MuiButtonBase-root": {
                  color: "var(--text-color-2) !important",
                },
                "& .MuiButton-root": {
                  color: "var(--text-color-2) !important",
                },
                textTransform: "none",
                padding: "8px 16px",
                fontSize: "16px",
              }}
              component={Link}
              href="/subscriptions-listing"
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
                  {plan.employee_limit && (
                    <Typography
                      variant="body2"
                      sx={{ 
                        mb: 1, 
                        textAlign: "left",
                        fontWeight: "bold",
                        color: "var(--primary-color-1)" /* #0798bd */
                      }}
                    >
                      👥 Up to {plan.employee_limit} employees
                    </Typography>
                  )}
                  {!plan.employee_limit && plan.type === 'free' && (
                    <Typography
                      variant="body2"
                      sx={{ 
                        mb: 1, 
                        textAlign: "left",
                        fontWeight: "bold",
                        color: "var(--primary-color-1)" /* #0798bd */
                      }}
                    >
                      👥 Unlimited employees
                    </Typography>
                  )}
                  <List sx={{ mt: 0, padding: 0 }}>
                    {(plan.features || getDefaultFeatures(plan)).map((feature, index) => (
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

