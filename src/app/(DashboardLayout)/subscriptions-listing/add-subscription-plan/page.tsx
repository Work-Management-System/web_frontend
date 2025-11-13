"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast, { Toaster } from "react-hot-toast";
import createAxiosInstance from "@/app/axiosInstance";
import { usePathname, useRouter } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";

// Define CSS variables matching AddTenant
const borderFocus = "var(--border-focus-color)";
const buttonColor = "var(--primary-color-2)";
const bgColor = "var(--bg-color)";

const CreateSubscription = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathName = usePathname();
  const axiosInstance = createAxiosInstance();

  // Responsive breakpoints matching AddTenant
  const Mobile = useMediaQuery("(min-width: 320px) and (max-width: 767px)");
  const smallMobile = useMediaQuery("(min-width: 320px) and (max-width: 575px)");
  const biggerMobile = useMediaQuery("(min-width: 576px) and (max-width: 767px)");
  const tablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("Plan name is required")
      .min(3, "Plan name must be at least 3 characters long"),
    price: Yup.number()
      .required("Price is required")
      .positive("Price must be a positive number"),
    duration_in_days: Yup.number()
      .required("Duration is required")
      .positive("Duration must be a positive number")
      .integer("Duration must be an integer"),
    type: Yup.string().required("Type is required"),
    description: Yup.string().optional(),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      price: "",
      duration_in_days: "",
      type: "",
      description: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        name: values.name,
        description: values.description,
        price: Number(values.price),
        duration_in_days: Number(values.duration_in_days),
        type: values.type,
      };

      try {
        const response = await axiosInstance.post("/subscription/create", payload);
        toast.success("Subscription plan created successfully.");

        if (response?.data?.data) {
          resetForm();
          console.log("Subscription created:", response.data.data);
          router.push("/subscriptions-listing"); 
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || "Something went wrong.";
        toast.error(message);
        console.error("Subscription creation error:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <>
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 2 }}>
        <CardContent sx={{ padding: "15px 20px !important" }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>

      <Card sx={{ mt: "25px" }}>
        <CardContent sx={{ padding: "20px 20px !important" }}>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ border: "1px solid #ddd", mb: "20px" }}>
              <Typography sx={{ background: "#ddd", padding: "10px 20px" }}>
                Subscription Plan Details
              </Typography>

              <Box sx={{ display: "flex", gap: "15px", alignItems: "flex-start", flexWrap: "wrap", padding: "20px" }}>
                {/* Plan Name */}
                <Box
                  sx={{
                    width: "49%",
                    ...smallMobile && { width: "100%" },
                    ...biggerMobile && { width: "48%" },
                    ...tablet && { width: "48%" },
                    minHeight: "90px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label>Plan Name</label>
                  <TextField
                    fullWidth
                    placeholder="Enter plan name"
                    name="name"
                    value={formik.values.name}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    sx={{
                      width: "100%",
                      marginBottom: "0px",
                      backgroundColor: bgColor,
                      "& input": {
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        borderRadius: "7px",
                        height: "auto",
                      },
                      "& input .Mui-focused": { border: borderFocus },
                      "& label": { fontSize: "14px", top: "-5px" },
                      "& label.Mui-focused": { fontSize: "16px", top: "0px", color: buttonColor },
                      "& fieldset": { border: "1px solid #ddd", borderRadius: "7px" },
                      "& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: borderFocus,
                        borderRadius: "7px",
                      },
                    }}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: "12px" }}>
                      {formik.errors.name}
                    </Typography>
                  )}
                </Box>

                {/* Price */}
                <Box
                  sx={{
                    width: "49%",
                    ...smallMobile && { width: "100%" },
                    ...biggerMobile && { width: "48%" },
                    ...tablet && { width: "48%" },
                    minHeight: "90px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label>Price</label>
                  <TextField
                    fullWidth
                    placeholder="Enter price"
                    name="price"
                    type="number"
                    value={formik.values.price}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.price && Boolean(formik.errors.price)}
                    sx={{
                      width: "100%",
                      marginBottom: "0px",
                      backgroundColor: bgColor,
                      "& input": {
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        borderRadius: "7px",
                        height: "auto",
                      },
                      "& input .Mui-focused": { border: borderFocus },
                      "& label": { fontSize: "14px", top: "-5px" },
                      "& label.Mui-focused": { fontSize: "16px", top: "0px", color: buttonColor },
                      "& fieldset": { border: "1px solid #ddd", borderRadius: "7px" },
                      "& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: borderFocus,
                        borderRadius: "7px",
                      },
                    }}
                  />
                  {formik.touched.price && formik.errors.price && (
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: "12px" }}>
                      {formik.errors.price}
                    </Typography>
                  )}
                </Box>

                {/* Duration */}
                <Box
                  sx={{
                    width: "49%",
                    ...smallMobile && { width: "100%" },
                    ...biggerMobile && { width: "48%" },
                    ...tablet && { width: "48%" },
                    minHeight: "90px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label>Duration (in days)</label>
                  <TextField
                    fullWidth
                    placeholder="Enter duration in days"
                    name="duration_in_days"
                    type="number"
                    value={formik.values.duration_in_days}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.duration_in_days && Boolean(formik.errors.duration_in_days)}
                    sx={{
                      width: "100%",
                      marginBottom: "0px",
                      backgroundColor: bgColor,
                      "& input": {
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        borderRadius: "7px",
                        height: "auto",
                      },
                      "& input .Mui-focused": { border: borderFocus },
                      "& label": { fontSize: "14px", top: "-5px" },
                      "& label.Mui-focused": { fontSize: "16px", top: "0px", color: buttonColor },
                      "& fieldset": { border: "1px solid #ddd", borderRadius: "7px" },
                      "& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: borderFocus,
                        borderRadius: "7px",
                      },
                    }}
                  />
                  {formik.touched.duration_in_days && formik.errors.duration_in_days && (
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: "12px" }}>
                      {formik.errors.duration_in_days}
                    </Typography>
                  )}
                </Box>

                {/* Type */}
                <Box
                  sx={{
                    width: "49%",
                    ...smallMobile && { width: "100%" },
                    ...biggerMobile && { width: "48%" },
                    ...tablet && { width: "48%" },
                    minHeight: "90px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <FormControl fullWidth sx={{ width: "100%", mb: "10px" }}>
                    <label>Type</label>
                    <Select
                      name="type"
                      value={formik.values.type}
                      onChange={formik.handleChange}
                      error={formik.touched.type && Boolean(formik.errors.type)}
                      fullWidth
                      displayEmpty
                      sx={{
                        width: "100%",
                        marginBottom: "0px",
                        backgroundColor: bgColor,
                        height: "44px",
                        "& select": {
                          padding: "10px",
                          border: "1px solid #ddd",
                          fontSize: "14px",
                          borderRadius: "7px",
                          height: "auto",
                        },
                        "& select .Mui-focused": { border: borderFocus },
                        "& label": { fontSize: "14px", top: "-5px" },
                        "& label.Mui-focused": { fontSize: "16px", top: "0px", color: buttonColor },
                        "& fieldset": { border: "1px solid #ddd", borderRadius: "7px" },
                        "& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          border: borderFocus,
                          borderRadius: "7px",
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Type
                      </MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                    </Select>
                  </FormControl>
                  {formik.touched.type && formik.errors.type && (
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: "12px" }}>
                      {formik.errors.type}
                    </Typography>
                  )}
                </Box>

                {/* Description */}
                <Box
                  sx={{
                    width: "100%",
                    minHeight: "150px", // Reserve space for multiline field
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label>Description</label>
                  <TextField
                    fullWidth
                    placeholder="Enter description"
                    name="description"
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    sx={{
                      width: "100%",
                      marginBottom: "0px",
                      backgroundColor: bgColor,
                      "& textarea": {
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        borderRadius: "7px",
                        height: "auto",
                      },
                      "& textarea .Mui-focused": { border: borderFocus },
                      "& label": { fontSize: "14px", top: "-5px" },
                      "& label.Mui-focused": { fontSize: "16px", top: "0px", color: buttonColor },
                      "& fieldset": { border: "1px solid #ddd", borderRadius: "7px" },
                      "& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: borderFocus,
                        borderRadius: "7px",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: "10px", justifyContent: "right" }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: "var(--primary-1-text-color)",
                  borderRadius: "50px",
                  "&:hover": {
                    backgroundColor: "var(--primary-1-text-color)",
                  },
                }}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="contained"
                sx={{
                  backgroundColor: "var(--primary-2-text-color)",
                  borderRadius: "50px",
                  "&:hover": {
                    backgroundColor: "var(--primary-2-text-color)",
                  },
                }}
                onClick={() => formik.resetForm()}
              >
                Reset
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Toaster position="top-right" toastOptions={{ className: "react-hot-toast" }} />
    </>
  );
};

export default CreateSubscription;



























