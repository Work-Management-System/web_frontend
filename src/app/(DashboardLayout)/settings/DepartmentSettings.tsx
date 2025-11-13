'use client'
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    styled
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import createAxiosInstance from '@/app/axiosInstance';
import toast from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import confirmAndDelete from '@/utils/delete-confirm';
import Spinner from '@/app/loading';

const GlassCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: theme.spacing(3),
}));
const StyledButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    borderRadius: '8px',
    padding: theme.spacing(1, 3),
    fontWeight: 600,
    background: 'linear-gradient(45deg, var(--primary-color-1) 30%, var(--primary-color-2) 90%)',
    color: '#fff',
}));
export interface Department {
    id?: string;
    name: string;
    is_active?: boolean;
    is_delete?: boolean;
}
const DepartmentSettings = () => {
    const [tabValue, setTabValue] = useState(0);
    const [openDeptDialog, setOpenDeptDialog] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const axiosInstance = createAxiosInstance();
    const [selectedDept, setSelectedDept] = useState<{ id?: string; name: string } | null>(null);
    const [newDept, setNewDept] = useState('');

    const DepartmentSchema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required("Department name is required")
            .max(100, "Department name too long"),
    });

    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/department/get-all");
            console.log("Fetch departments response:", res.data);
            if (res.data.status !== "success") throw new Error("Failed to fetch Departments");
            setDepartments(res.data.data || []);
            // toast.success(res.data.message || "Departments fetched successfully");
        } catch (error) {
            console.error("Error fetching departments:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Failed to fetch departments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivationToggle = async (id) => {
        try {
            const res = await axiosInstance.patch(`/department/toggle-activation/${id}`);
            if (res.data.status !== "success") throw new Error("Failed to update Department");
            toast.success(res.data.message || "Department updated successfully");

            fetchDepartments();
        } catch (error) {
            console.error("Submission error:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Operation failed");
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            console.log("Submitting department:", values);

            let res;
            if (values.id) {
                // EDIT (PATCH/PUT)
                res = await axiosInstance.patch(`/department/update-one/${values.id}`, { name: values.name });
                if (res.data.status !== "success") throw new Error("Failed to update Department");
                toast.success(res.data.message || "Department updated successfully");
            } else {
                // CREATE
                res = await axiosInstance.post("/department/create", values);
                if (res.data.status !== "success") throw new Error("Failed to create Department");
                toast.success(res.data.message || "Department created successfully");
            }

            fetchDepartments();
            resetForm();
            setOpenDeptDialog(false);
        } catch (error) {
            console.error("Submission error:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddDept = () => {
        setOpenDeptDialog(true);
    };
    const handleDeptDialogOpen = (dept?: { id?: string; name: string }) => {
        if (dept) {
            // Editing existing department
            setSelectedDept(dept);
            setNewDept(dept.name);
        } else {
            // Adding new department
            setSelectedDept(null);
            setNewDept('');
        }
        setOpenDeptDialog(true);
    };

    const handleDeptDialogClose = () => {
        setOpenDeptDialog(false);
        setSelectedDept(null);
        setNewDept('');
    };
    const handleDeleteDept = async (deptId: string) => {
        await confirmAndDelete({
            title: 'Delete Department?',
            confirmButtonText: 'Yes, delete!',
            successText: 'Department has been deleted.',
            apiEndpoint: `/department/delete-one/${deptId}`,
            text: 'Are you sure! This department may be associated with users.',
            onSuccess: async () => {
                fetchDepartments();
            },
        });
    }

    useEffect(() => {
        fetchDepartments();
    }, []);

  return (
      <GlassCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#172b4d', fontWeight: 600 }}>
                  Manage Departments
              </Typography>
              <StyledButton startIcon={<Add />} onClick={handleAddDept}>
                  Add Department
              </StyledButton>
          </Box>
          <TableContainer component={GlassCard} sx={{ maxHeight: 400 }}>
              <Table size="small">
                  <TableHead>
                      <TableRow>
                          <TableCell sx={{ color: '#172b4d', fontWeight: 600, fontSize: '0.85rem', py: 0.5 }}>
                              Department Name
                          </TableCell>
                          <TableCell sx={{ color: '#172b4d', fontWeight: 600, fontSize: '0.85rem', py: 0.5 }}>
                              Status
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#172b4d', fontWeight: 600, fontSize: '0.85rem', py: 0.5 }}>
                              Actions
                          </TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {isLoading ? (
                          <TableRow>
                              <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#172b4d', py: 0.5 }}>
                                  <Spinner />
                              </TableCell>
                          </TableRow>
                      ) : departments.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#172b4d', py: 0.5 }}>
                                  No departments found
                              </TableCell>
                          </TableRow>
                      ) : (
                          departments.map((dept) => (
                              <TableRow
                                  key={dept.id}
                                  sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}
                              >
                                  <TableCell sx={{ color: '#172b4d', fontSize: '0.85rem', py: 0.5 }}>
                                      {dept.name}
                                  </TableCell>
                                  <TableCell sx={{ py: 0.5 }}>
                                      <FormControlLabel
                                          control={
                                              <Switch
                                                  checked={dept.is_active}
                                                  onChange={() => handleActivationToggle(dept.id)}
                                                  size="small"
                                                  sx={{
                                                      '& .MuiSwitch-track': { backgroundColor: '#dfe1e6' },
                                                      '& .MuiSwitch-thumb': { backgroundColor: '#007bff' },
                                                  }}
                                              />
                                          }
                                          label={dept.is_active ? 'Active' : 'Inactive'}
                                          sx={{ color: '#172b4d', ml: 0, fontSize: '0.75rem' }}
                                      />
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 0.5 }}>
                                      <IconButton sx={{ color: '#007bff', p: 0.5 }} onClick={() => handleDeptDialogOpen(dept)}>
                                          <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton sx={{ color: '#ff4d4f', p: 0.5 }} onClick={() => handleDeleteDept(dept.id)}>
                                          <Delete fontSize="small" />
                                      </IconButton>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </TableContainer>
          <Dialog open={openDeptDialog} onClose={handleDeptDialogClose} maxWidth="sm" fullWidth>
              <DialogTitle
                  sx={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      fontWeight: 600,
                      fontSize: "1.25rem",
                      textAlign: "center",
                      py: 2,
                  }}
              >
                  {selectedDept ? 'Edit Department' : 'Add New Department'}
              </DialogTitle>
              <Formik
                  initialValues={selectedDept || { name: "" }}
                  enableReinitialize
                  validationSchema={DepartmentSchema}
                  onSubmit={(values, { resetForm }) => {
                      handleSubmit(values, { setSubmitting: () => { }, resetForm });
                  }}
              >
                  {({ values, handleChange, handleBlur, touched, errors, dirty }) => (
                      <Form>
                          <DialogContent
                              sx={{
                                  background: "rgba(255, 255, 255, 0.1)",
                                  backdropFilter: "blur(10px)",
                                  p: 3,
                              }}
                          >
                              <TextField
                                  autoFocus
                                  margin="dense"
                                  label="Department Name"
                                  placeholder="Enter department name..."
                                  name="name"
                                  fullWidth
                                  value={values.name}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={touched.name && Boolean(errors.name)}
                                  helperText={touched.name && errors.name}
                                  sx={{
                                      "& .MuiInputBase-root": {
                                          background: "rgba(255, 255, 255, 0.05)",
                                          borderRadius: "10px",
                                          height: "50px",
                                          fontSize: "1rem",
                                      },
                                      "& .MuiInputLabel-root": {
                                          color: "#5e6c84",
                                          fontSize: "0.95rem",
                                      },
                                      "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "rgba(255, 255, 255, 0.2)",
                                      },
                                  }}
                              />
                          </DialogContent>
                          <DialogActions
                              sx={{
                                  background: "rgba(255, 255, 255, 0.1)",
                                  backdropFilter: "blur(10px)",
                                  px: 3,
                                  py: 2,
                              }}
                          >
                              <Button
                                  onClick={handleDeptDialogClose}
                                  sx={{
                                      color: "#172b4d",
                                      textTransform: "none",
                                      fontWeight: 500,
                                  }}
                              >
                                  Cancel
                              </Button>
                              <Button
                                  type="submit"
                                  disabled={!dirty}
                                  sx={{
                                      px: 3,
                                      py: 1.2,
                                      fontWeight: 500,
                                      borderRadius: "10px",
                                      background: "var(--primary-color-1)",
                                      color: "white",
                                      "&:hover": { background: "var(--primary-color-2)" },
                                  }}
                              >
                                  {selectedDept ? 'Update' : 'Add'}
                              </Button>
                          </DialogActions>
                      </Form>
                  )}
              </Formik>
          </Dialog>
      </GlassCard>
  )
}

export default DepartmentSettings
