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

export interface Designation {
    id?: string;
    name: string;
    is_active?: boolean;
    is_delete?: boolean;
}

const DesignationSettings = () => {
    const [openDesigDialog, setOpenDesigDialog] = useState(false);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const axiosInstance = createAxiosInstance();
    const [selectedDesig, setSelectedDesig] = useState<{ id?: string; name: string } | null>(null);
    const [newDesig, setNewDesig] = useState('');

    const DesignationSchema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required("Designation name is required")
            .max(100, "Designation name too long"),
    });

    const fetchDesignations = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/designation/get-all");
            console.log("Fetch designations response:", res.data);
            if (res.data.status !== "success") throw new Error("Failed to fetch Designations");
            setDesignations(res.data.data || []);
            // toast.success(res.data.message || "Designations fetched successfully");
        } catch (error) {
            console.error("Error fetching designations:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Failed to fetch designations");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivationToggle = async (id: string) => {
        try {
            const res = await axiosInstance.patch(`/designation/toggle-activation/${id}`);
            if (res.data.status !== "success") throw new Error("Failed to update Designation");
            toast.success(res.data.message || "Designation updated successfully");
            fetchDesignations();
        } catch (error) {
            console.error("Submission error:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Operation failed");
        }
    };

    const handleSubmit = async (values: { id?: string; name: string }, { setSubmitting, resetForm }) => {
        try {
            console.log("Submitting designation:", values);

            let res;
            if (values.id) {
                // EDIT (PATCH)
                res = await axiosInstance.patch(`/designation/update-one/${values.id}`, { name: values.name });
                if (res.data.status !== "success") throw new Error("Failed to update Designation");
                toast.success(res.data.message || "Designation updated successfully");
            } else {
                // CREATE
                res = await axiosInstance.post("/designation/create", values);
                if (res.data.status !== "success") throw new Error("Failed to create Designation");
                toast.success(res.data.message || "Designation created successfully");
            }

            fetchDesignations();
            resetForm();
            setOpenDesigDialog(false);
        } catch (error) {
            console.error("Submission error:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddDesig = () => {
        setOpenDesigDialog(true);
    };

    const handleDesigDialogOpen = (desig?: { id?: string; name: string }) => {
        if (desig) {
            // Editing existing designation
            setSelectedDesig(desig);
            setNewDesig(desig.name);
        } else {
            // Adding new designation
            setSelectedDesig(null);
            setNewDesig('');
        }
        setOpenDesigDialog(true);
    };

    const handleDesigDialogClose = () => {
        setOpenDesigDialog(false);
        setSelectedDesig(null);
        setNewDesig('');
    };

    const handleDeleteDesig = async (desigId: string) => {
        await confirmAndDelete({
            title: 'Delete Designation?',
            confirmButtonText: 'Yes, delete!',
            successText: 'Designation has been deleted.',
            apiEndpoint: `/designation/delete-one/${desigId}`,
            text: 'Are you sure! This designation may be associated with users.',
            onSuccess: async () => {
                fetchDesignations();
            },
        });
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    return (
        <GlassCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#172b4d', fontWeight: 600 }}>
                    Manage Designations
                </Typography>
                <StyledButton startIcon={<Add />} onClick={handleAddDesig}>
                    Add Designation
                </StyledButton>
            </Box>
            <TableContainer component={GlassCard} sx={{ maxHeight: 400 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#172b4d', fontWeight: 600, fontSize: '0.85rem', py: 0.5 }}>
                                Designation Name
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
                                    <Spinner/>
                                </TableCell>
                            </TableRow>
                        ) : designations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#172b4d', py: 0.5 }}>
                                    No designations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            designations.map((desig) => (
                                <TableRow
                                    key={desig.id}
                                    sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.05)' } }}
                                >
                                    <TableCell sx={{ color: '#172b4d', fontSize: '0.85rem', py: 0.5 }}>
                                        {desig.name}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={desig.is_active}
                                                    onChange={() => handleActivationToggle(desig.id)}
                                                    size="small"
                                                    sx={{
                                                        '& .MuiSwitch-track': { backgroundColor: '#dfe1e6' },
                                                        '& .MuiSwitch-thumb': { backgroundColor: '#007bff' },
                                                    }}
                                                />
                                            }
                                            label={desig.is_active ? "Active" : "Inactive"}
                                            sx={{ color: '#172b4d', ml: 0, fontSize: '0.75rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 0.5 }}>
                                        <IconButton sx={{ color: '#007bff', p: 0.5 }} onClick={() => handleDesigDialogOpen(desig)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton sx={{ color: '#ff4d4f', p: 0.5 }} onClick={() => handleDeleteDesig(desig.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={openDesigDialog} onClose={handleDesigDialogClose} maxWidth="sm" fullWidth>
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
                    {selectedDesig ? 'Edit Designation' : 'Add New Designation'}
                </DialogTitle>
                <Formik
                    initialValues={selectedDesig || { name: "" }}
                    enableReinitialize
                    validationSchema={DesignationSchema}
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
                                    label="Designation Name"
                                    placeholder="Enter designation name..."
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
                                    onClick={handleDesigDialogClose}
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
                                    {selectedDesig ? 'Update' : 'Add'}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </GlassCard>
    );
};

export default DesignationSettings;