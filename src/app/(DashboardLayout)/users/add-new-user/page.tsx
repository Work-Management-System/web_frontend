'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Avatar, Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Select,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  CardContent,
  Card,
  FormControlLabel,
  Checkbox,
  InputLabel,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { useAppselector } from '@/redux/store';
import { Toaster, toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import GooglePlacesAutocomplete, { geocodeByAddress } from 'react-google-places-autocomplete';
import createAxiosInstance from '@/app/axiosInstance';
import { useDispatch } from 'react-redux';
import { FaEdit } from "react-icons/fa";
import { PaymentPlatform } from '@/app/constatnts';
import { getSubdomain } from '@/utils/getSubDomain';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import LoadingButton from '@mui/lab/LoadingButton';
import { uploadFile } from '@/utils/UploadFile';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import ProtectedRoute from '@/configs/withAuth';
import { AxiosError } from 'axios';
import { format } from 'path';
import RequiredLabel from '../../layout/shared/logo/RequiredLabel';
import { Department } from '../../settings/DepartmentSettings';
import { Designation } from '../../settings/DesignationSettings';


interface Role {
  id: string;
  name: string;
}
type User = {
  id: string;
  first_name: string;
  last_name: string;
  employeeCode: string;
};
const bgColor = 'var(--bg-color)';
const borderFocus = 'var(--border-focus-color)';
const buttonColor = 'var(--primary-color-2)';
const blueText = 'var(--primary-1-text-color)';
const orangeText = 'var(--primary-2-text-color)';


function AddNewUser() {
  const [profileImage, setprofileImage] = useState<any>(null);
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  

  const searchParams = useSearchParams();
  // Extract value immediately to avoid enumeration warning
  const id: any = useMemo(() => searchParams?.get("id") || null, [searchParams]);
  const isEditMode = id ? true : false;
  const pathName = usePathname();
  const router = useRouter();
  const userDetails = useAppselector(
    (state: any) => state.user.value
  );

  const [addressValue, setaddressValue] = useState<string>('');
  const subdomain = getSubdomain();
  const dispatch = useDispatch();
  const axiosInstance = createAxiosInstance();
  const profileInputRef: any = useRef(null);
  const coverInputRef: any = useRef(null);

  const handleIconClick = (e: any) => {
    e.preventDefault();
    profileInputRef.current.click();
    coverInputRef.current.click();
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };
  const blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const handleProfileFileInputChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setprofileImage(URL.createObjectURL(selectedFile));
    setProfileImageFile(selectedFile);
    formik.setFieldValue('profile_image', selectedFile.name);
  }

  const validationSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().optional(),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().optional(),
    address: Yup.string().optional(),
    designation: Yup.string().optional(),
    department: Yup.string().optional(),
    joiningDate: Yup.string().optional().nullable(),
    employeeCode: Yup.string().optional(),
    role_id: Yup.string().required(),
    tenant_id: Yup.string().optional(),
    profile_image: Yup.string().optional(),
    emergency_contact: Yup.string().optional(),
    blood_group: Yup.string().optional(),
    gender: Yup.string().optional(),
    dob: Yup.string().optional().nullable(),
    reporting_manager: Yup.string().optional(),
  });

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
      profile_image: '',
      address: '',
      email: '',
      role_id: '',
      designation: '',
      department: '',
      joiningDate: '',
      employeeCode: '',
      emergency_contact: '',
      blood_group: '',
      gender: '',
      dob: '',
      reporting_manager: '',
      tenant_id: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true)
      let uploadedProfileImageFile: any = [];
      let profileImageResult: any;
      try {
        if (profileImageFile) {
          const profileImageResult = await Promise.all([
            profileImageFile ? uploadFile(profileImageFile) : Promise.resolve(null),
          ]);
          uploadedProfileImageFile = profileImageResult;
        }
        values.profile_image = uploadedProfileImageFile.length > 0 ? uploadedProfileImageFile[0] : values?.profile_image;
        console.log("Uploaded Profile Image URL:", values.profile_image);
        const payload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          ...(values.phone && { phone: values.phone.trim() }),
          ...(values.profile_image && { profile_image: values.profile_image }),
          ...(values.address && { address: values.address }),
          ...(values.designation && { designation: values.designation }),
          ...(values.department && { department: values.department }),
          ...(values.joiningDate && /^\d{4}-\d{2}-\d{2}$/.test(values.joiningDate) && { joiningDate: values.joiningDate }),
          ...(values.employeeCode && { employeeCode: values.employeeCode }),
          ...(values.emergency_contact && { emergency_contact: values.emergency_contact.trim() }),
          ...(values.blood_group && { blood_group: values.blood_group }),
          ...(values.gender && { gender: values.gender }),
          ...(values.dob && /^\d{4}-\d{2}-\d{2}$/.test(values.dob) && { dob: values.dob }),
          reporting_manager: values.reporting_manager ? values.reporting_manager : null,
          tenant_id: values.tenant_id,
          role_id: values.role_id
        };
        console.log("Payload:", payload);
        let result;
        if (isEditMode) {
          result = await axiosInstance.patch(`/user/update/${id}`, payload);
          toast.success(result?.data?.message || 'User updated successfully');
        } else {
          result = await axiosInstance.post(`/user/create`, payload);
          toast.success(result?.data?.message || 'User added successfully');
        }

        if (result?.data) {
          resetForm();
          router.push(`/users`);
        }
      } catch (err) {
        const error = err as AxiosError<any>;
        console.error('Error saving user:', error);
        toast.error(error?.response?.data?.message || 'An error occurred while saving user details.');
      } finally {
        setLoading(false);
      }
    }
  });
    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/department/get-all-active" );
            console.log("Fetch departments response:", res.data);
            if (res.data.status !== "success") throw new Error("Failed to fetch Departments");
            setDepartments(res.data.data || []);
            // toast.success(res.data.message || "Departments fetched successfully");
        } catch (error) {
            console.error("Error fetching departments:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Failed to fetch departments");
        } finally {
            setLoading(false);
        }
    };
    const fetchDesignations = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get("/designation/get-all-active" );
            console.log("Fetch Designation response:", res.data);
            if (res.data.status !== "success") throw new Error("Failed to fetch Designations");
            setDesignations(res.data.data || []);
            // toast.success(res.data.message || "Departments fetched successfully");
        } catch (error) {
            console.error("Error fetching designations:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Failed to fetch designations");
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      axiosInstance.get(`/user/find-one/${id}`)
        .then((res) => {
          const user = res?.data?.data;

          formik.setValues({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone: user?.phone || '',
            profile_image: user?.profile_image || '',
            address: user?.address || '',
            email: user?.email || '',
            role_id: user?.role_id || '',
            designation: user?.designation || '',
            department: user?.department || '',
            joiningDate: user?.joiningDate || '',
            employeeCode: user?.employeeCode || '',
            emergency_contact: user?.emergency_contact || '',
            blood_group: user?.blood_group || '',
            gender: user?.gender || '',
            dob: user?.dob || '',
            reporting_manager: user?.reporting_manager || '',
            tenant_id: user?.tenant_id || ''
          });
        })
        .catch((err) => {
          console.error('Failed to fetch user for edit:', err);
          toast.error('Failed to load user details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handlePhoneChange = (value: string, country: any) => {
    const dialCode = country?.dialCode || '91';
    const formatted = `+${dialCode} ${value.slice(dialCode.length)}`;
    formik.setFieldValue('phone', formatted);
  };

  const handleemergency_contact = (value: string, country: any) => {
    const dialCode = country?.dialCode || '91';
    const formatted = `+${dialCode} ${value.slice(dialCode.length)}`;
    formik.setFieldValue('emergency_contact', formatted);
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axiosInstance.get('/role-management/get-all');
        if (response.status === 200) {
          setRoles(response.data.data); 
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
    fetchDepartments();
    fetchDesignations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/user/list') // your existing API
        setUserList(response.data.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, []);


  const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 575px)');
  const biggerMobile = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 991px)');

  return (
    <ProtectedRoute requiredAbilities={[['create', 'users/add-new-user']]}>
      <>
        <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)', mb: 2 }}>
          <CardContent sx={{ padding: '15px 20px !important' }}>
            <Breadcrumb pageName={pathName} />
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)' }}>
          <CardContent sx={{ padding: '20px 20px !important' }}>
            <Box>
              <form onSubmit={formik.handleSubmit}>
                <Box sx={{ height: '190px' }} >

                  {/* Cover Image */}

                  <Box
                    className="cover-box"
                    sx={{
                      width: '100%',
                      height: '100px',
                      background: '',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      mx: 'auto',
                      position: 'relative',
                      borderRadius: '12px',
                      backgroundColor: '#ddd'
                    }}
                  >
                  </Box>

                  {/* Profile Image */}

                  <Box
                    sx={{
                      width: '160px',
                      height: '160px',
                      background: '#ddd',
                      mx: 'auto',
                      borderRadius: '50%',
                      position: 'relative',
                      top: '-100px',
                      zIndex: 1,
                      border: '5px solid white',
                    }}
                    mt={4}
                  >
                    <label htmlFor="profile-image-input">
                      <input
                        id="profile-image-input"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleProfileFileInputChange}
                      />
                      <Avatar
                        className="editProfile"
                        src={profileImage || ''}
                        sx={{
                          mx: 'auto',
                          width: '100%',
                          height: '100%',
                          border: '5px solid #f1f1f1',
                          boxShadow: '0px 0px 5px -2px',
                          alignItems: 'center',
                          '&:hover': {
                            filter: 'brightness(50%)',
                          },
                        }}
                      />
                    </label>
                  </Box>

                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'left', marginTop: '15px', gap: '6px 27px', paddingTop: '25px' }}>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="First Name" />
                    </label>
                    <TextField
                      type='text'
                      placeholder='Enter Your First Name'
                      name='first_name'
                      value={formik.values.first_name}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.first_name && formik.errors.first_name && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.first_name}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="Last Name" /></label>
                    <TextField
                      type='text'
                      placeholder='Enter Your Last Name'
                      name='last_name'
                      value={formik.values.last_name}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.last_name && formik.errors.last_name && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.last_name}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Phone Number</label>
                    <PhoneInput
                      country={'in'}
                      value={formik.values.phone}
                      onChange={(value, country) => handlePhoneChange(value, country)}
                      inputStyle={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '7px',
                        border: '1px solid #ddd',
                        paddingLeft: '48px',
                        fontSize: '14px',
                      }}
                      dropdownStyle={{ borderRadius: '7px' }}
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.phone}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="Email" /></label>
                    <TextField
                      type='email'
                      placeholder='Enter Your Email Address'
                      name='email'
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.email}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Address</label>
                    <TextField
                      type='text'
                      placeholder='Enter Your Address'
                      name='address'
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.address && formik.errors.address && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.address}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                      position: 'relative',
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="dob"
                    >
                      Date Of Birth
                    </label>

                    <TextField
                      type="date"
                      id="dob"
                      name="dob"
                      value={formik.values.dob || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      fullWidth
                      sx={{
                        width: '100%',
                        backgroundColor: bgColor,
                        '& input': {
                          padding: '10px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          borderRadius: '7px',
                          height: 'auto',
                        },
                        '& fieldset': {
                          border: '1px solid #ddd',
                          borderRadius: '7px',
                        },
                      }}
                    />

                    {formik.touched.dob && formik.errors.dob && (
                      <Typography variant="body2" color="error" sx={{ mt: '4px' }}>
                        {formik.errors.dob}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }} htmlFor="role"><RequiredLabel label="Role" /></label>
                    <FormControl fullWidth>
                      <Select
                        id="role-select"
                        name="role_id"
                        value={formik.values.role_id}
                        onChange={formik.handleChange}
                        MenuProps={MenuProps}
                        displayEmpty
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
                          '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                        }}
                      >
                        <MenuItem value={''} disabled>Select a Role</MenuItem>
                        {loading ? (
                          <MenuItem disabled>
                            <CircularProgress size={24} />
                          </MenuItem>
                        ) : (
                          // roles.map((role) => (
                          //   <MenuItem key={role.id} value={role.id}>
                          //     {role.name} {/* Display the role name */}
                          //   </MenuItem>
                          // ))

                          roles
                            ?.filter((role) => role.name !== 'Developer' && role.name !== 'SuperAdmin')
                            .map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                {role.name}
                              </MenuItem>
                            ))

                        )}
                      </Select>
                    </FormControl>
                    {formik.touched.role_id && formik.errors.role_id && (
                      <Typography variant="body2" color="error" sx={{ mb: "0px" }}>
                        {formik.errors.role_id}
                      </Typography>
                    )}
                  </Box>
                  {/* {isEditMode && ( */}
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="reporting_manager"
                    >
                      Reporting Manager
                    </label>
                    <Autocomplete
                      id="reporting_manager"
                      options={userList}
                      loading={loading}
                      getOptionLabel={(option) =>
                        `${option.first_name} ${option.last_name}${option.employeeCode ? ` (${option.employeeCode})` : ''}`
                      }
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={
                        userList.find((user) => user.id === formik.values.reporting_manager) || null
                      }
                      onChange={(_, value) =>
                        formik.setFieldValue('reporting_manager', value ? value.id : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Reporting Manager"
                          fullWidth
                          sx={{
                            backgroundColor: bgColor,
                            fontSize: '13px',
                            '& .MuiOutlinedInput-root': {
                              height: '41px',
                              borderRadius: '7px',
                              fontSize: '13px',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                            },
                            '& input': {
                              padding: '10px',
                            },
                          }}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loading ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          error={formik.touched.reporting_manager && Boolean(formik.errors.reporting_manager)}
                          helperText={formik.touched.reporting_manager && formik.errors.reporting_manager}
                        />
                      )}
                    />
                  </Box>

                   {/* )} */}
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="designation"
                    >
                      <RequiredLabel label="Designation" />
                    </label>
                    <Autocomplete
                      id="designation"
                      options={designations}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={
                        designations.find((desg) => desg.name === formik.values.designation) || null
                      }
                      onChange={(_, value) =>
                        formik.setFieldValue('designation', value ? value.name : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Designation"
                          fullWidth
                          sx={{
                            backgroundColor: bgColor,
                            fontSize: '13px',
                            '& .MuiOutlinedInput-root': {
                              height: '41px',
                              borderRadius: '7px',
                              fontSize: '13px',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                            },
                            '& input': {
                              padding: '10px',
                            },
                          }}
                          error={formik.touched.designation && Boolean(formik.errors.designation)}
                          helperText={formik.touched.designation && formik.errors.designation}
                          onBlur={formik.handleBlur}
                        />
                      )}
                    />
                  </Box>

                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="department"
                    >
                      <RequiredLabel label="Department" />
                    </label>
                    <Autocomplete
                      id="department"
                      options={departments}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={
                        departments.find((dept) => dept.name === formik.values.department) || null
                      }
                      onChange={(_, value) =>
                        formik.setFieldValue('department', value ? value.name : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Department"
                          fullWidth
                          sx={{
                            backgroundColor: bgColor,
                            fontSize: '13px',
                            '& .MuiOutlinedInput-root': {
                              height: '41px',
                              borderRadius: '7px',
                              fontSize: '13px',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                            },
                            '& input': {
                              padding: '10px',
                            },
                          }}
                          error={formik.touched.department && Boolean(formik.errors.department)}
                          helperText={formik.touched.department && formik.errors.department}
                          onBlur={formik.handleBlur}
                        />
                      )}
                    />
                  </Box>


                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Joining Date</label>
                    <TextField
                      type='date'
                      name='joiningDate'
                      value={formik.values.joiningDate}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.joiningDate && formik.errors.joiningDate && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.joiningDate}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Employee Code</label>
                    <TextField
                      type='text'
                      placeholder='Enter Employee Code'
                      name='employeeCode'
                      value={formik.values.employeeCode}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': { padding: '10px', border: '1px solid #ddd', fontSize: '14px', borderRadius: '7px', height: 'auto' },
                        '& input .Mui-focused': { border: borderFocus, },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: borderFocus, borderRadius: '7px' },
                      }}
                    />
                    {formik.touched.employeeCode && formik.errors.employeeCode && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.employeeCode}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'left', width: '31%', ...smallMobile && { width: '100%' }, ...biggerMobile && { width: '47%' }, ...tablet && { width: '30%' } }}>
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Emergency Contact</label>
                    <PhoneInput
                      country={'in'}
                      value={formik.values.emergency_contact}
                      onChange={(value, country) => handleemergency_contact(value, country)}
                      inputStyle={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '7px',
                        border: '1px solid #ddd',
                        paddingLeft: '48px',
                        fontSize: '14px',
                      }}
                      dropdownStyle={{ borderRadius: '7px' }}
                    />
                    {formik.touched.emergency_contact && formik.errors.emergency_contact && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: "0px" }}
                      >
                        {formik.errors.emergency_contact}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Blood Group</label>
                    <FormControl fullWidth>
                      <Select
                        name="blood_group"
                        value={formik.values.blood_group || ''}
                        onChange={formik.handleChange}
                        displayEmpty
                        sx={{
                          width: '100%',
                          marginBottom: '0px',
                          backgroundColor: bgColor,
                          height: '44px',
                          '& .MuiSelect-select': {
                            padding: '10px',
                            fontSize: '14px',
                            borderRadius: '7px',
                          },
                          '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                          '&.Mui-focused fieldset': { border: borderFocus },
                        }}
                      >
                        <MenuItem value="" disabled>Select Your Blood Group</MenuItem>
                        {blood_groups.map((group) => (
                          <MenuItem key={group} value={group}>
                            {group}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {formik.touched.blood_group && formik.errors.blood_group && (
                      <Typography variant="body2" color="error" sx={{ mb: "0px" }}>
                        {formik.errors.blood_group}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Gender</label>
                    <FormControl fullWidth>
                      <Select
                        name="gender"
                        value={formik.values.gender || ''}
                        onChange={formik.handleChange}
                        displayEmpty
                        sx={{
                          width: '100%',
                          marginBottom: '0px',
                          backgroundColor: bgColor,
                          height: '44px',
                          '& .MuiSelect-select': {
                            padding: '10px',
                            fontSize: '14px',
                            borderRadius: '7px',
                          },
                          '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                          '&.Mui-focused fieldset': { border: borderFocus },
                        }}
                      >
                        <MenuItem value="" disabled>Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>

                    {formik.touched.gender && formik.errors.gender && (
                      <Typography variant="body2" color="error" sx={{ mb: "0px" }}>
                        {formik.errors.gender}
                      </Typography>
                    )}
                  </Box>


                </Box>

                <Box sx={{ width: '100%', textAlign: 'center', marginTop: '30px' }}>
                  <LoadingButton
                    type='submit'
                    variant="contained"
                    color="primary"
                    loading={loading}
                    loadingPosition="start"
                    disabled={!formik.dirty}
                    sx={{
                      backgroundColor: "#FF8700",
                      color: "fff",
                      borderRadius: '35px',
                      padding: '10px 50px',
                      margin: '0 auto',
                      '&:hover': { backgroundColor: "#002A60", color: "fff" }
                    }}>
                    {id ? 'Update' : 'Submit'}
                  </LoadingButton>
                </Box>
              </form >
              <Toaster position={'top-right'} toastOptions={{ className: 'react-hot-toast' }} gutter={2} />
            </Box>
          </CardContent>
        </Card>
      </>
    </ProtectedRoute>
  )
}

export default AddNewUser;