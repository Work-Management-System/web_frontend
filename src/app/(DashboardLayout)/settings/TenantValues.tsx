'use client'
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    FormControlLabel,
    styled,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';
import createAxiosInstance from '@/app/axiosInstance';
import toast from 'react-hot-toast';
import Spinner from '@/app/loading';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import EditIcon from '@mui/icons-material/Edit';

const GlassCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: theme.spacing(3),
}));

interface TenantValue {
    id: string;
    key: string;
    value: any;
    type: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    is_delete: boolean;
}

const TenantValues = () => {
    const [tenantValues, setTenantValues] = useState<TenantValue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<TenantValue | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [initialForm, setInitialForm] = useState<any>({});
    const axiosInstance = createAxiosInstance();

    const fetchTenantValues = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/tenant-values/get-all");
            if (res.data.status !== "success") throw new Error("Failed to fetch Tenant Values");
            setTenantValues(res.data.data);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch Tenant Values");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditOpen = (tenant: TenantValue) => {
        const initialValue = typeof tenant.value === 'object' ? { ...tenant.value } : { value: tenant.value };
        setSelectedTenant(tenant);
        setEditForm(initialValue);
        setInitialForm(initialValue); // Store initial form state
        setOpenEditDialog(true);
    };

    const handleEditClose = () => {
        setOpenEditDialog(false);
        setSelectedTenant(null);
        setEditForm({});
        setInitialForm({}); // Reset initial form state
    };

    const handleEditSubmit = async () => {
        if (!selectedTenant) return;
        try {
            const updatedValue = typeof selectedTenant.value === 'object' ? editForm : editForm.value;
            const res = await axiosInstance.patch(`/tenant-values/update-one/${selectedTenant.id}`, { value: updatedValue });
            if (res.data.status !== "success") throw new Error("Failed to update Tenant Value");
            toast.success(res.data.message || "Tenant Value updated successfully");
            fetchTenantValues();
            handleEditClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update Tenant Value");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleTimeChange = (field: string, newValue: any) => {
        setEditForm((prev: any) => ({
            ...prev,
            [field]: newValue && dayjs(newValue).isValid() ? newValue.format('HH:mm') : ''
        }));
    };

    // Determine if the form is dirty by comparing editForm with initialForm
    const isFormDirty = useMemo(() => {
        return JSON.stringify(editForm) !== JSON.stringify(initialForm);
    }, [editForm, initialForm]);

    useEffect(() => {
        fetchTenantValues();
    }, []);

    const formatValue = (value: any) => {
        if (typeof value === 'object' && value !== null) {
            if (value.from && value.to) {
                return `${value.from} - ${value.to}`;
            }
            return JSON.stringify(value);
        }
        return value.toString();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <GlassCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ color: '#172b4d', fontWeight: 600 }}>
                        Manage Tenant Values
                    </Typography>
                </Box>
                <TableContainer component={GlassCard} sx={{ maxHeight: 400, px: 0 }}>
                    <Table size="small" sx={{
                        minWidth: 500,
                        '& .MuiTableCell-root': { border: 'none' },
                        '& .MuiTableRow-root': { borderBottom: '1px solid #ebedf0' }
                    }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f7f9fb' }}>
                                <TableCell sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 1 }}>Key</TableCell>
                                <TableCell sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 2 }}>Value</TableCell>
                                <TableCell sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 1 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                                        <Spinner />
                                    </TableCell>
                                </TableRow>
                            ) : tenantValues?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                                        No Tenant Values found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenantValues.map((tenant) => (
                                    <TableRow
                                        key={tenant.id}
                                        sx={{ '&:hover': { background: 'rgba(0, 123, 255, 0.05)', transition: 'background 0.2s' }, minHeight: 48 }}
                                    >
                                        <TableCell sx={{ color: '#172b4d', fontSize: '0.95rem', py: 1, fontWeight: 500 }}>
                                            {tenant.key}
                                        </TableCell>
                                        <TableCell sx={{ color: '#172b4d', fontSize: '0.95rem', py: 1, fontWeight: 500 }}>
                                            {formatValue(tenant.value)}
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Tooltip title="Edit Tenant Value" arrow>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleEditOpen(tenant)}
                                                    sx={{ minWidth: 0, p: 0.5 }}
                                                >
                                                    <EditIcon fontSize="small" sx={{ color: '#1976d2' }} />
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Dialog
                    open={openEditDialog}
                    onClose={handleEditClose}
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            border: '1px solid var(--primary-color-1)',
                            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                            backgroundColor: 'var(--primary-color-2)',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            color: 'var(--primary-color-1)',
                            fontWeight: 600,
                        }}
                    >
                        {selectedTenant?.key}
                    </DialogTitle>
                    <DialogContent>
                        {selectedTenant && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                {selectedTenant.type === 'timeobject' && typeof selectedTenant.value === 'object' ? (
                                    <>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500, color: 'var(--primary-color-1)' }}
                                            >
                                                From Time
                                            </Typography>
                                            <MobileTimePicker
                                                value={editForm.from ? dayjs(editForm.from, 'HH:mm') : null}
                                                onChange={(newValue) => handleTimeChange('from', newValue)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        size: 'small',
                                                        sx: {
                                                            '& .MuiInputBase-root': {
                                                                color: 'var(--primary-color-1)',
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'var(--primary-color-1)',
                                                            },
                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'var(--primary-color-2)',
                                                            },
                                                            '& .MuiInputLabel-root': {
                                                                color: 'var(--primary-color-2)',
                                                            },
                                                        },
                                                    },
                                                }}
                                                ampm={false}
                                                minutesStep={5}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500, color: 'var(--primary-color-1)' }}
                                            >
                                                To Time
                                            </Typography>
                                            <MobileTimePicker
                                                value={editForm.to ? dayjs(editForm.to, 'HH:mm') : null}
                                                onChange={(newValue) => handleTimeChange('to', newValue)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        size: 'small',
                                                        sx: {
                                                            '& .MuiInputBase-root': {
                                                                color: 'var(--primary-color-1)',
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'var(--primary-color-1)',
                                                            },
                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: 'var(--primary-color-2)',
                                                            },
                                                            '& .MuiInputLabel-root': {
                                                                color: 'var(--primary-color-2)',
                                                            },
                                                        },
                                                    },
                                                }}
                                                ampm={false}
                                                minutesStep={5}
                                            />
                                        </Box>
                                    </>
                                ) : typeof selectedTenant.value === 'object' ? (
                                    Object.keys(selectedTenant.value).map((key) => (
                                        <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500, color: 'var(--primary-color-1)' }}
                                            >
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Typography>
                                            <TextField
                                                name={key}
                                                value={editForm[key] || ''}
                                                onChange={handleInputChange}
                                                fullWidth
                                                size="small"
                                                placeholder={`Enter ${key}`}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        color: 'var(--primary-color-1)',
                                                        '& fieldset': {
                                                            borderColor: 'var(--primary-color-1)',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: 'var(--primary-color-2)',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500, color: 'var(--primary-color-1)' }}
                                        >
                                            Value
                                        </Typography>
                                        <TextField
                                            name="value"
                                            value={editForm.value || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: 'var(--primary-color-1)',
                                                    '& fieldset': {
                                                        borderColor: 'var(--primary-color-1)',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'var(--primary-color-2)',
                                                    },
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: 'var(--primary-color-2)',
                                                },
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditClose} sx={{ color: 'var(--primary-color-2)' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            variant="contained"
                            sx={{
                                backgroundColor: 'var(--primary-color-1)',
                                color: '#fff',
                            }}
                            disabled={!isFormDirty} // Disable Save button if form is not dirty
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </GlassCard>
        </LocalizationProvider>
    );
};

export default TenantValues;