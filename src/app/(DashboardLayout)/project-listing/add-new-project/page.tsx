"use client";
import ProtectedRoute from '@/configs/withAuth';
import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import toast, { Toaster } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import createAxiosInstance from '@/app/axiosInstance';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import RequiredLabel from '../../layout/shared/logo/RequiredLabel';
import { useDebouncedCallback } from 'use-debounce';
import { LoadingButton } from '@mui/lab';

const borderFocus = 'var(--border-focus-color)';
const buttonColor = 'var(--primary-color-2)';
const bgColor = 'var(--bg-color)';
const blueText = 'var(--primary-1-text-color)';
const orangeText = 'var(--primary-2-text-color)';

enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  ON_HOLD = 'ON_HOLD',
  CLOSED = 'CLOSED',
  COMPLETED = 'COMPLETED',
}
interface Project {
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  description?: string;
  current_phase?: string;
  client_details?: Array<{ name?: string; email?: string; contact?: string }>;
  project_timeline?: Array<{ title?: string; time?: string }>;
}
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}
function AddProject({ params }: any) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const id: any = searchParams.get('id');
  const isEditMode = id ? true : false;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [project, setProject] = useState<Project>({});
  const [empUserLists, setEmpUserLists] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); 


  const axiosInstance = createAxiosInstance();

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required('Project title is required')
      .min(3, 'Project title must be at least 3 characters long'),
    start_date: Yup.date()
      .required('Start date is required')
      .typeError('Invalid date format'),
    status: Yup.mixed()
      .oneOf([
        ProjectStatus.ACTIVE,
        ProjectStatus.MAINTENANCE,
        ProjectStatus.ON_HOLD,
        ProjectStatus.CLOSED,
        ProjectStatus.COMPLETED,
      ])
      .required('Project status is required'),
    description: Yup.string().optional(),
    current_phase: Yup.string().required('Current phase is required'),
    client_name: Yup.string().optional(),
    client_email: Yup.string()
      .email('Invalid email format')
      .optional(),
    client_contact: Yup.string()
      .optional()
      .matches(/^[0-9]+$/, 'Contact number must be digits only')
      .min(10, 'Contact number must be at least 10 digits long'),
    timeline_title: Yup.string().optional(),
    timeline_time: Yup.date().optional().typeError('Invalid date format'),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: project?.title || '',
      start_date: project?.start_date ? project.start_date.split('T')[0] : '',
      end_date: project?.end_date ? project.end_date.split('T')[0] : '',
      status: project?.status || '',
      description: project?.description || '',
      current_phase: project?.current_phase || '',
      client_name: project?.client_details?.[0]?.name || '',
      client_email: project?.client_details?.[0]?.email || '',
      client_contact: project?.client_details?.[0]?.contact || '',
      timeline_title: project?.project_timeline?.[0]?.title || '',
      timeline_time: project?.project_timeline?.[0]?.time ? project.project_timeline[0].time.split('T')[0] : '',
      deadLine: project?.end_date ? project.end_date.split('T')[0] : '',
      team_members: selectedUsers || [], // Initialize with selectedUsers or project team_members
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        title: values.title,
        start_date: new Date(values.start_date).toISOString(),
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
        status: values.status,
        description: values.description || undefined,
        current_phase: values.current_phase || undefined,
        client_details: [
          {
            name: values.client_name,
            email: values.client_email,
            contact: values.client_contact,
          },
        ],
        project_timeline: values.timeline_title
          ? [
            {
              title: values.timeline_title,
              time: values.timeline_time ? new Date(values.timeline_time).toISOString() : undefined,
            },
          ]
          : [],
        deadLine: values.deadLine ? new Date(values.deadLine).toISOString() : null,
        team_members: values.team_members,
      };

      try {
        let response;
        setLoading(true);
        if (isEditMode) {
          response = await axiosInstance.patch(`/project-management/update/${id}`, payload);
          toast.success('Project updated successfully.');
        } else {
          response = await axiosInstance.post(`/project-management/create-project`, payload);
          toast.success('Project added successfully.');
        }
        setLoading(false);
        if (response?.data?.data) {
          resetForm();
          router.push('/project-listing');
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Something went wrong.';
        toast.error(message);
        console.error('Project submission error:', error);
      }
    },
  });

  useEffect(() => {
    if (isEditMode) {
      axiosInstance
        .get(`/project-management/find-one/${id}`)
        .then((res) => {
          setProject(res.data?.data);
          setLoading(false);
        })
        .catch((err) => {
          toast.error('Failed to fetch project data.');
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]); 

  useEffect(() => {
    fetchUsers();
  }, []);
  const handleDiscard = () => {
    router.push('/project-listing');
  };

  const [fetchSuggestions] = useDebouncedCallback(async (value: string) => {
    if (!value) return setSuggestions([]);

    try {
      const res = await axiosInstance.get(`/project-management/list?title=${value}`);
      const matchingTitles = res.data?.data?.map((project) => project.title);
      setSuggestions(matchingTitles || []);
    } catch (err) {
      console.error('Error fetching suggestions', err);
      setSuggestions([]);
    }
  }, 500);
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/user/list");
      setEmpUserLists(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setEmpUserLists([]);
    }
  };
  

  const Mobile = useMediaQuery('(min-width: 320px) and (max-width: 767px)');
  const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 575px)');
  const biggerMobile = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  return (
    <>
      <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)', background: '#fff' }}>
        <CardContent sx={{ padding: '15px 20px !important' }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>

      <Card sx={{ mt: '25px' }}>
        <CardContent sx={{ padding: '20px 20px !important' }}>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
              <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Project Details:</Typography>
              <Box sx={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap', padding: '20px' }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <InputLabel><RequiredLabel label="Title" /></InputLabel>
                  <TextField
                    fullWidth
                    placeholder="Enter project title"
                    name="title"
                    value={formik.values.title}
                    onBlur={formik.handleBlur}
                    onChange={(e) => {
                      formik.handleChange(e);
                      fetchSuggestions(e.target.value);
                    }}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.title && formik.errors.title && (
                      <Typography variant="body2" color="error">
                        {formik.errors.title}
                      </Typography>
                    )}
                  </Box>
                  {/* Suggestions Dropdown Popover */}
                  {suggestions.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        background: 'linear-gradient(135deg, #ffffff, #f9fafb)',
                        border: '1px solid #e0e0e0',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px', 
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)', 
                        padding: '12px',
                        // mt: '6px',
                        maxHeight: '200px', 
                        overflowY: 'auto', 
                        transition: 'all 0.3s ease-in-out', 
                        '&::-webkit-scrollbar': {
                          width: '6px', 
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#b0b0b0',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600, 
                          fontSize: '0.9rem',
                          color: '#4b5eAA',
                          letterSpacing: '0.02em',
                        }}
                      >
                        Similar Existing Projects:
                      </Typography>
                      {suggestions.map((title, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            pl: 1.5,
                            py: 0.75, 
                            color: '#1a1a1a', 
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          • {title}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <InputLabel><RequiredLabel label="Start Date" /></InputLabel>
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    placeholder="Select start date"
                    name="start_date"
                    value={formik.values.start_date}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.start_date && Boolean(formik.errors.start_date)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.start_date && formik.errors.start_date && (
                      <Typography variant="body2" color="error">
                        {formik.errors.start_date}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>End Date</label>
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    placeholder="Select end date"
                    name="end_date"
                    value={formik.values.end_date}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.end_date && Boolean(formik.errors.end_date)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.end_date && formik.errors.end_date && (
                      <Typography variant="body2" color="error">
                        {formik.errors.end_date}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <FormControl fullWidth sx={{ width: '100%', mb: '0px' }}>
                    <label>                  <RequiredLabel label="Select Status" />
</label>
                    <Select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      fullWidth
                      displayEmpty
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        height: '44px',
                        '& select': {
                          padding: '10px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          borderRadius: '7px',
                          height: 'auto',
                        },
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
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                      <MenuItem value="ON_HOLD">ON_HOLD</MenuItem>
                      <MenuItem value="CLOSED">CLOSED</MenuItem>
                      <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.status && formik.errors.status && (
                      <Typography variant="body2" color="error">
                        {formik.errors.status}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Description</label>
                  <TextField
                    fullWidth
                    placeholder="Enter project description"
                    name="description"
                    value={formik.values.description}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.description && formik.errors.description && (
                      <Typography variant="body2" color="error">
                        {formik.errors.description}
                      </Typography>
                    )}
                  </Box>
                </Box>

    <Box
  sx={{
    width: '49%',
    ...smallMobile && { width: '100%' },
    ...biggerMobile && { width: '48%' },
    ...tablet && { width: '48%' },
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
  }}
>
  <InputLabel><RequiredLabel label="Current Phase" /></InputLabel>
  <Select
    fullWidth
    name="current_phase"
    value={formik.values.current_phase}
    onBlur={formik.handleBlur}
    onChange={formik.handleChange}
    error={formik.touched.current_phase && Boolean(formik.errors.current_phase)}
    displayEmpty
    sx={{
      height: '45px',
      width: '100%',
      backgroundColor: bgColor,
      fontSize: '14px',
      borderRadius: '7px',
      '& .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #ddd',
        borderRadius: '7px',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: borderFocus,
      },
    }}
  >
    <MenuItem value="" disabled>Select current phase</MenuItem>
    <MenuItem value="Planning">Planning</MenuItem>
    <MenuItem value="Requirement Analysis">Requirement Analysis</MenuItem>
    <MenuItem value="Design">Design</MenuItem>
    <MenuItem value="Development">Development</MenuItem>
    <MenuItem value="Testing">Testing</MenuItem>
    <MenuItem value="Deployment">Deployment</MenuItem>
    <MenuItem value="Maintenance">Maintenance</MenuItem>
  </Select>

  <Box sx={{ minHeight: '20px', mt: 1 }}>
    {formik.touched.current_phase && formik.errors.current_phase && (
      <Typography variant="body2" color="error">
        {formik.errors.current_phase}
      </Typography>
    )}
  </Box>
</Box>


                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Dead Line</label>
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    placeholder="Select dead line"
                    name="deadLine"
                    value={formik.values.deadLine}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.deadLine && Boolean(formik.errors.deadLine)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.deadLine && formik.errors.deadLine && (
                      <Typography variant="body2" color="error">
                        {formik.errors.deadLine}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            {!isEditMode &&
            <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
              <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Assign Team Members</Typography>
              <Box sx={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap', padding: '30px 20px 5px 20px' }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <Autocomplete
                      multiple
                      id="reporting-users"
                      options={empUserLists.filter((user) => !formik.values.team_members.includes(user.id))} // Exclude selected users from options
                      getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
                      value={formik.values.team_members.map((id) => empUserLists.find((user) => user.id === id) || { id, first_name: '', last_name: '', email: '' })}
                      onChange={(event, newValue) => {
                        formik.setFieldValue('team_members', newValue.map((user) => user.id));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder={formik.values.team_members.length === 0 ? "Search users..." : ""}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              backgroundColor: "#FFFFFF",
                              "& fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                              "&:hover fieldset": {
                                borderColor: "var(--primary-color-2)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                            },
                            "& .MuiInputBase-input": {
                              fontFamily: "'Roboto', sans-serif",
                              color: "var(--text-color)",
                            },
                          }}
                          error={formik.touched.team_members && Boolean(formik.errors.team_members)}
                          helperText={
                            formik.touched.team_members && typeof formik.errors.team_members === 'string'
                              ? formik.errors.team_members
                              : undefined
                          }
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((user, index) => {
                          const { key, ...otherProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={user.id}
                              label={`${user.first_name} ${user.last_name}`}
                              {...otherProps}
                              sx={{
                                borderRadius: "8px",
                                backgroundColor: "var(--primary-bg-colors)",
                                color: "var(--primary-1-text-color)",
                                "& .MuiChip-deleteIcon": {
                                  color: "var(--primary-color-2)",
                                  "&:hover": {
                                    color: "#B0004A",
                                  },
                                },
                              }}
                            />
                          );
                        })
                      }
                      renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props;
                        return (
                          <li
                            key={option.id}
                            {...otherProps}
                            style={{ fontFamily: "'Roboto', sans-serif", color: "var(--text-color)" }}
                          >
                            {`${option.first_name} ${option.last_name} (${option.email})`}
                          </li>
                        );
                      }}
                      sx={{
                        "& .MuiAutocomplete-popupIndicator": {
                          color: "var(--primary-color-1)",
                        },
                        "& .MuiAutocomplete-clearIndicator": {
                          color: "var(--primary-color-2)",
                        },
                      }}
                    />
                  </FormControl>
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.team_members && typeof formik.errors.team_members === 'string' && (
                      <Typography variant="body2" color="error">
                        {formik.errors.team_members}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
}
            <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
              <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Client Details:</Typography>

              <Box sx={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap', padding: '20px' }}>
                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Client Name</label>
                  <TextField
                    fullWidth
                    placeholder="Enter client name"
                    name="client_name"
                    value={formik.values.client_name}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.client_name && Boolean(formik.errors.client_name)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.client_name && formik.errors.client_name && (
                      <Typography variant="body2" color="error">
                        {formik.errors.client_name}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Client Email</label>
                  <TextField
                    fullWidth
                    placeholder="Enter client email"
                    name="client_email"
                    value={formik.values.client_email}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.client_email && Boolean(formik.errors.client_email)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.client_email && formik.errors.client_email && (
                      <Typography variant="body2" color="error">
                        {formik.errors.client_email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Client Contact</label>
                  <TextField
                    fullWidth
                    placeholder="Enter client contact number"
                    name="client_contact"
                    value={formik.values.client_contact}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.client_contact && Boolean(formik.errors.client_contact)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.client_contact && formik.errors.client_contact && (
                      <Typography variant="body2" color="error">
                        {formik.errors.client_contact}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ border: '1px solid #ddd', mb: '20px' }}>
              <Typography sx={{ background: '#ddd', padding: '10px 20px' }}>Timeline Details:</Typography>

              <Box sx={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap', padding: '20px' }}>
                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Timeline Title</label>
                  <TextField
                    fullWidth
                    placeholder="Enter timeline title"
                    name="timeline_title"
                    value={formik.values.timeline_title}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.timeline_title && Boolean(formik.errors.timeline_title)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.timeline_title && formik.errors.timeline_title && (
                      <Typography variant="body2" color="error">
                        {formik.errors.timeline_title}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: '49%',
                    ...smallMobile && { width: '100%' },
                    ...biggerMobile && { width: '48%' },
                    ...tablet && { width: '48%' },
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <label>Timeline Date</label>
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    placeholder="Select timeline date"
                    name="timeline_time"
                    value={formik.values.timeline_time}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    error={formik.touched.timeline_time && Boolean(formik.errors.timeline_time)}
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      '& input': {
                        padding: '10px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        borderRadius: '7px',
                        height: 'auto',
                      },
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
                  <Box sx={{ minHeight: '20px', mt: 1 }}>
                    {formik.touched.timeline_time && formik.errors.timeline_time && (
                      <Typography variant="body2" color="error">
                        {formik.errors.timeline_time}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'right' }}>
              <LoadingButton
                type="submit"
                variant="contained"
                disabled={!formik.dirty}
                loading={loading}
                loadingPosition='start'
                sx={{
                  backgroundColor: blueText,
                  borderRadius: '50px',
                  '&:hover': {
                    backgroundColor: blueText,
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
        </CardContent>
      </Card>

      <Toaster position={'top-right'} toastOptions={{ className: 'react-hot-toast' }} gutter={2} />
    </>
  );
}

export default AddProject;