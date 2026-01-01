"use client";
import ProtectedRoute from '@/configs/withAuth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  InputLabel,
} from '@mui/material';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import toast, { Toaster } from 'react-hot-toast';
import { setIn, useFormik } from 'formik';
import * as Yup from 'yup';
import createAxiosInstance from '@/app/axiosInstance';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppselector } from '@/redux/store';
import { uploadFile } from '@/utils/UploadFile';
import { usePathname } from 'next/navigation';
import { LoadingButton } from '@mui/lab';
import RequiredLabel from '../../layout/shared/logo/RequiredLabel';
import Loader from '@/app/loading';

const borderFocus = 'var(--border-focus-color)';
const buttonColor = 'var(--primary-color-2)';
const bgColor = 'var(--bg-color)';
const blueText = 'var(--primary-1-text-color)';
const orangeText = 'var(--primary-2-text-color)';

enum LoginProcess {
  MOBILE_PASSWORD = 'mobilepassword',
  EMAIL_PASSWORD = 'emailpassword',
}
interface AddTenantProps {
  tenantId?: string; // optional
  onClose?: () => void;
}
function AddTenant({ tenantId: propTenantId, onClose }: AddTenantProps) {
  const [logo1, setLogo1] = useState<any>(null);
  const [background_image1, setbackground_image1] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // For form fetching
  const [submitLoading, setSubmitLoading] = useState(false); // For submit button
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const userPriority = useAppselector((state) => state.role.value.priority);
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const id = propTenantId || searchParams?.get("id");
  const isEditMode = id ? true : false;

  const axiosInstance = createAxiosInstance();

  const fileInputRef: any = useRef(null);

  const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}([\/\w\.-]*)*\/?$/;
  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required('Administrator First Name is required'),
    email: Yup.string().email('Invalid email format').required('Administrator email is required'),
    tenant_name: Yup.string()
      .required('Tenant name is required')
      .min(3, 'Tenant name must be at least 3 characters long'),
    subdomain: Yup.string()
      .required('Subdomain is required')
      .min(3, 'Subdomain must be at least 3 characters long'),
    logo: Yup.mixed().optional(),
    background_image: Yup.mixed().optional(),
    address: Yup.string().optional(),
    welcome_note: Yup.string().optional(),
    login_process: Yup.mixed<LoginProcess>()
      .oneOf([LoginProcess.MOBILE_PASSWORD, LoginProcess.EMAIL_PASSWORD])
      .required('Login process is required'),
    website_url: Yup.string().matches(urlRegex, 'Enter a valid website URL').optional(),
    tenant_phone: Yup.string()
      .required('Tenant phone number is required')
      .matches(/^[0-9]+$/, 'Phone number must be digits only')
      .min(10, 'Phone number must be at least 10 digits long'),
    tenant_email: Yup.string().email('Invalid email format').required('Tenant email is required'),
    reporting_email: Yup.string().email('Invalid email format'),
  });
  const initialEmptyValues = {
    first_name: '',
    last_name: '',
    email: '',
    tenant_name: '',
    welcome_note: '',
    background_image: '',
    logo: '',
    login_process: 'emailpassword',
    subdomain: '',
    website_url: '',
    address: '',
    tenant_phone: '',
    tenant_email: '',
    reporting_email: '',
  };  
  const [initialValues, setInitialValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    tenant_name: '',
    welcome_note: '',
    background_image: '',
    logo: '',
    login_process: 'emailpassword',
    subdomain: '',
    website_url: '',
    address: '',
    tenant_phone: '',
    tenant_email: '',
    reporting_email: '',
  });

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitLoading(true);
      let uploadedLogoUrl: any;
      let uploadedBackgroundUrl: any;
      if (logo1) {
        uploadedLogoUrl = await uploadFile(logo1);
      }
      if (background_image1) {
        uploadedBackgroundUrl = await uploadFile(background_image1);
      }

      values.background_image = uploadedBackgroundUrl || values.background_image;
      values.logo = uploadedLogoUrl || values.logo;

      const payload = {
        administrator_user: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
        },
        tenant_name: values.tenant_name,
        address: values.address,
        welcome_note: values.welcome_note,
        logo: values.logo,
        background_image: values.background_image,
        login_process: values.login_process,
        subdomain: values.subdomain,
        website_url: values.website_url,
        tenant_phone: values.tenant_phone,
        tenant_email: values.tenant_email,
        reporting_email: values.reporting_email,
        status: 'active',
      };

      try {
        let response;
        if (isEditMode) {
          response = await axiosInstance.patch(`/tenants/update/${id}`, payload);
          toast.success('Tenant updated successfully.');
        } else {
          response = await axiosInstance.post(`/tenants/add-tenant`, payload);
          toast.success('Tenant added successfully.');
        }

        if (response?.data?.data) {
          const tenantId = response?.data?.data?.id || id;
          
          // Handle subscription plan assignment if selected
          if (selectedPlanId && tenantId) {
            try {
              const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
              
              if (selectedPlan) {
                // Check if it's a free plan (SuperAdmin only)
                if (selectedPlan.type === 'free') {
                  // Use assign-free-plan endpoint
                  await axiosInstance.post('/subscription/assign-free-plan', {
                    tenant_id: tenantId,
                    plan_id: selectedPlanId,
                  });
                  toast.success('Free plan assigned successfully.');
                } else {
                  // For paid plans, create subscription (without payment for admin assignment)
                  const startDate = new Date();
                  const endDate = new Date();
                  endDate.setDate(startDate.getDate() + selectedPlan.duration_in_days);
                  
                  await axiosInstance.post('/subscription/buy-subscription', {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    plan_id: selectedPlanId,
                    tenant_id: tenantId,
                    is_trial: false,
                    is_paid: false, // Admin assignment, no payment required
                  });
                  toast.success('Subscription plan assigned successfully.');
                }
              }
            } catch (subError: any) {
              console.error('Error assigning subscription:', subError);
              const subMessage = subError?.response?.data?.message || 'Failed to assign subscription plan.';
              toast.error(subMessage);
            }
          }
          
          resetForm({ values: initialEmptyValues });
          if (userPriority !== 2) {
            router.push('/tenant-settings');
          }else{
            onClose();
          }
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Something went wrong.';
        toast.error(message);
        console.error('Tenant submission error:', error);
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get("/subscription/list");
        if (res.data.status) {
          setSubscriptionPlans(res.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      }
    };
    fetchPlans();
  }, []);

  // Fetch current subscription for tenant (in edit mode)
  useEffect(() => {
    if (isEditMode && id) {
      const fetchCurrentSubscription = async () => {
        try {
          const res = await axiosInstance.get(`/subscription/tenant-plans/${id}`);
          if (res.data.status && res.data.data.length > 0) {
            const activeSub = res.data.data.find((sub: any) => sub.status === "active");
            if (activeSub) {
              setCurrentSubscription(activeSub);
              setSelectedPlanId(activeSub.plan.id);
            }
          }
        } catch (error) {
          console.error("Error fetching current subscription:", error);
        }
      };
      fetchCurrentSubscription();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      axiosInstance
        .get(`/tenants/get-one/${id}`)
        .then((res) => {
          const data = res.data?.data;
          setInitialValues({
            first_name: data?.administrator_user?.first_name || '',
            last_name: data?.administrator_user?.last_name || '',
            email: data?.administrator_user?.email || '',
            tenant_name: data?.tenant_name || '',
            welcome_note: data?.welcome_note || '',
            background_image: data?.background_image || '',
            logo: data?.logo || '',
            login_process: data?.login_process || 'emailpassword',
            subdomain: data?.subdomain || '',
            website_url: data?.website_url || '',
            address: data?.address || '',
            tenant_phone: data?.tenant_phone || '',
            tenant_email: data?.tenant_email || '',
            reporting_email: data?.reporting_email || '',
          });
          setLogoPreview(data?.logo || null);
          setBackgroundPreview(data?.background_image || null);
        })
        .catch((err) => {
          toast.error('Failed to fetch tenant data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleFileChangeBackground = (event: any) => {
    const file = event.target.files[0];

    if (file) {
      const fileSizeInMB = file.size / (1024 * 1024);

      if (fileSizeInMB > 10) {
        toast.error('File size must be less than 10 MB.');
        event.target.value = null;
        return;
      }

      setbackground_image1(file);
      setBackgroundPreview(URL.createObjectURL(file));
      formik.setFieldValue('background_image', file.name);
    } else {
      setbackground_image1(null);
      setBackgroundPreview(null);
      formik.setFieldValue('background_image', '');
    }
  };

  const handleFileChangeLogo = (event: any) => {
    const file = event.target.files[0];

    if (file) {
      const fileSizeInMB = file.size / (1024 * 1024);

      if (fileSizeInMB > 10) {
        toast.error('File size must be less than 10 MB.');
        event.target.value = null;
        return;
      }

      setLogo1(file);
      setLogoPreview(URL.createObjectURL(file));
      formik.setFieldValue('logo', file.name);
    } else {
      setLogo1(null);
      setLogoPreview(null);
      formik.setFieldValue('logo', '');
    }
  };

  const handleDiscard = () => {
    router.push('/tenant-settings');
  };

  const Mobile = useMediaQuery('(min-width: 320px) and (max-width: 767px)');
  const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 575px)');
  const biggerMobile = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  return (
    <>
      <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)', background: '#fff' }}>
        <CardContent sx={{ padding: '15px 20px !important' }}>
          <Breadcrumb pageName={isEditMode ? 'tenant-settings/Edit-Tenant' : pathName} />
        </CardContent>
      </Card>

      <Card sx={{ mt: '25px' }}>
        <CardContent sx={{ padding: '20px 20px !important' }}>
          {loading ? (
              <Loader />
          ) : (
            <form onSubmit={formik.handleSubmit}>
              <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
                <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Basic Details:</Typography>
                <Box sx={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', padding: '20px' }}>
                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                    <label>Welcome Text</label>
                    <TextField
                      fullWidth
                      placeholder="Enter welcome text"
                      name="welcome_note"
                      value={formik.values.welcome_note}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.welcome_note && Boolean(formik.errors.welcome_note)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.welcome_note && typeof formik.errors.welcome_note === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.welcome_note}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                  <InputLabel><RequiredLabel label="Tenant Name" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter Tenant Name"
                      name="tenant_name"
                      value={formik.values.tenant_name}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.tenant_name && Boolean(formik.errors.tenant_name)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.tenant_name && typeof formik.errors.tenant_name === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.tenant_name}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                    <label>Address</label>
                    <TextField
                      fullWidth
                      placeholder="Enter Address"
                      name="address"
                      value={formik.values.address}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.address && Boolean(formik.errors.address)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.address && typeof formik.errors.address === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.address}
                      </Typography>
                    )}
                  </Box>
                    <Box
                      sx={{
                        width: '49%',
                        ...smallMobile && { width: '100%' },
                        ...biggerMobile && { width: '48%' },
                        ...tablet && { width: '48%' },
                      }}
                    >
                      <FormControl fullWidth sx={{ width: '100%', mb: '10px' }}>
                  <InputLabel><RequiredLabel label="Login Process" /></InputLabel>
                        <Select
                          name="login_process"
                          value={formik.values.login_process}
                          onChange={formik.handleChange}
                          fullWidth
                          disabled
                          sx={{
                            width: '100%',
                            marginBottom: '0px',
                            backgroundColor: bgColor,
                            height: '44px',
                            '& select': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                            '& select .Mui-focused': { border: borderFocus },
                            '& label': { fontSize: '14px', top: '-5px' },
                            '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                            '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                            '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                              borderRadius: '7px',
                            },
                          }}
                        >
                          <MenuItem value={'emailpassword'}>Email Password</MenuItem>
                        </Select>
                      </FormControl>
                      {formik.touched.login_process && typeof formik.errors.login_process === 'string' && (
                        <Typography variant="body2" color="error" sx={{ my: 1 }}>
                          {formik.errors.login_process}
                        </Typography>
                      )}
                    </Box>
                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                    <label>Background Image</label>
                    <TextField
                      type="file"
                      InputLabelProps={{ shrink: true }}
                      name="background_image"
                      onChange={handleFileChangeBackground}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: '#fff',
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {backgroundPreview && (
                      <img
                        src={backgroundPreview}
                        alt="Background Preview"
                        style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: '4px',
                          objectFit: 'contain',
                          ...(Mobile && { height: '76px' }),
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                    <label>Logo</label>
                    <TextField
                      type="file"
                      InputLabelProps={{ shrink: true }}
                      name="logo"
                      onChange={handleFileChangeLogo}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: '#fff',
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: '4px',
                          objectFit: 'contain',
                          ...(Mobile && { height: '76px' }),
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                  <InputLabel><RequiredLabel label="Subdomain" /></InputLabel>
                    <TextField
                      fullWidth
                      placeholder="Enter assigned subdomain URL"
                      name="subdomain"
                      value={formik.values.subdomain}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.subdomain && Boolean(formik.errors.subdomain)}
                      disabled={userPriority == 2}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.subdomain && typeof formik.errors.subdomain === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.subdomain}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                    <label>Website URL</label>
                    <TextField
                      fullWidth
                      placeholder="Enter assigned website URL"
                      name="website_url"
                      value={formik.values.website_url}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.website_url && Boolean(formik.errors.website_url)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.website_url && typeof formik.errors.website_url === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.website_url}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                  <InputLabel><RequiredLabel label="Tenant Phone" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter Tenant Phone"
                      name="tenant_phone"
                      value={formik.values.tenant_phone}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.tenant_phone && Boolean(formik.errors.tenant_phone)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.tenant_phone && typeof formik.errors.tenant_phone === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.tenant_phone}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                  <InputLabel><RequiredLabel label="Tenant Email" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter Tenant Email"
                      name="tenant_email"
                      value={formik.values.tenant_email}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.tenant_email && Boolean(formik.errors.tenant_email)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.tenant_email && typeof formik.errors.tenant_email === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.tenant_email}
                      </Typography>
                    )}
                  </Box>
                    <Box
                      sx={{
                        width: '49%',
                        ...smallMobile && { width: '100%' },
                        ...biggerMobile && { width: '48%' },
                        ...tablet && { width: '48%' },
                      }}
                    >
                      <label>Primary Reporting Email ID</label>
                      <TextField
                        fullWidth
                        placeholder="Enter mail id for recieving all status reports"
                        name="reporting_email"
                        value={formik.values.reporting_email}
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        error={formik.touched.reporting_email && Boolean(formik.errors.reporting_email)}
                        sx={{
                          width: '100%',
                          marginBottom: '0px',
                          backgroundColor: bgColor,
                          '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                          '& input .Mui-focused': { border: borderFocus },
                          '& label': { fontSize: '14px', top: '-5px' },
                          '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                          '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                          '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: borderFocus,
                            borderRadius: '7px',
                          },
                        }}
                      />
                      {formik.touched.reporting_email && typeof formik.errors.reporting_email === 'string' && (
                        <Typography variant="body2" color="error" sx={{ my: 1 }}>
                          {formik.errors.reporting_email}
                        </Typography>
                      )}
                    </Box>
                </Box>
              </Box>

              <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
                <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Administrator Details:</Typography>
                <Box sx={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', padding: '20px' }}>
                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                  <InputLabel><RequiredLabel label="First Name" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter Admin's First Name"
                      name="first_name"
                      value={formik.values.first_name}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.first_name && typeof formik.errors.first_name === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.first_name}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                <InputLabel><RequiredLabel label="Last Name" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter last name"
                      name="last_name"
                      value={formik.values.last_name}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.last_name && typeof formik.errors.last_name === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.last_name}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      width: '49%',
                      ...smallMobile && { width: '100%' },
                      ...biggerMobile && { width: '48%' },
                      ...tablet && { width: '48%' },
                    }}
                  >
                <InputLabel><RequiredLabel label="Email" /></InputLabel>
                  <TextField
                      fullWidth
                      placeholder="Enter email"
                      name="email"
                      value={formik.values.email}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.email && typeof formik.errors.email === 'string' && (
                      <Typography variant="body2" color="error" sx={{ my: 1 }}>
                        {formik.errors.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Subscription Plan Section */}
              {isEditMode && (
                <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
                  <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>
                    Subscription Plan:
                  </Typography>
                  <Box sx={{ padding: '20px' }}>
                    {currentSubscription && (
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Current Subscription:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Plan: {currentSubscription.plan.name}
                          {currentSubscription.is_trial && ' (Free Trial)'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '12px' }}>
                          Status: {currentSubscription.status}
                        </Typography>
                      </Box>
                    )}
                    <FormControl fullWidth>
                      <InputLabel 
                        id="subscription-plan-label"
                        sx={{
                          backgroundColor: bgColor,
                          px: 0.5,
                          '&.Mui-focused': {
                            color: buttonColor,
                          },
                        }}
                      >
                        Change Subscription Plan
                      </InputLabel>
                      <Select
                        labelId="subscription-plan-label"
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        label="Change Subscription Plan"
                        displayEmpty
                        sx={{
                          backgroundColor: bgColor,
                          '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                          '& .MuiSelect-select': {
                            padding: '10px 14px',
                            fontSize: '14px',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: borderFocus,
                            borderRadius: '7px',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em style={{ fontStyle: 'normal', color: '#999' }}>Select a plan (optional)</em>
                        </MenuItem>
                        {subscriptionPlans.map((plan) => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {plan.name} - ₹{plan.price}/month
                            {plan.employee_limit && ` (Up to ${plan.employee_limit} employees)`}
                            {!plan.employee_limit && ' (Unlimited employees)'}
                            {plan.type === 'free' && ' - Free Plan'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                      {selectedPlanId && selectedPlanId !== currentSubscription?.plan?.id
                        ? 'Selected plan will be assigned after saving tenant details.'
                        : 'Leave empty to keep current subscription.'}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'right' }}>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={submitLoading}
                    loadingPosition='start'
                    disabled={!formik.isValid || submitLoading}
                    sx={{
                      backgroundColor: blueText,
                      borderRadius: '50px',
                      '&:hover': {
                        backgroundColor: blueText,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#d1d5db',
                        color: '#6b7280',
                      },
                    }}
                  >
                    Submit
                  </LoadingButton>

                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: orangeText,
                    borderRadius: '50px',
                    '&:hover': {
                      backgroundColor: orangeText,
                    },
                  }}
                  onClick={handleDiscard}
                >
                  Discard
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default AddTenant;