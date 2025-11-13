'use client'
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
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
    Tooltip
} from '@mui/material';
import createAxiosInstance from '@/app/axiosInstance';
import toast from 'react-hot-toast';
import Spinner from '@/app/loading';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';

const GlassCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: theme.spacing(3),
}));
export interface Functionality {
    id: string;
    key: string;
    description: string;
    is_enabled: boolean;
}
const FunctionalitySettings = () => {
    const [Functionalities, setFunctionalities] = useState<Functionality[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const axiosInstance = createAxiosInstance();

    const fetchFunctionalities = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/functionality/get-all");
            console.log("Fetch Functionalities response:", res.data);
            if (res.data.status !== "success") throw new Error("Failed to fetch Functionalities");
            setFunctionalities(res.data.data || []);
        } catch (error) {
            console.error("Error fetching Functionalities:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Failed to fetch Functionalities");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableToggle = async (id) => {
        try {
            const res = await axiosInstance.patch(`/functionality/toggle-activation/${id}`);
            if (res.data.status !== "success") throw new Error("Failed to update Functionality");
            toast.success(res.data.message || "Functionality updated successfully");

            fetchFunctionalities();
        } catch (error) {
            console.error("Submission error:", error.response?.data, error.message);
            toast.error(error?.response?.data?.message || "Operation failed");
        }
    };
    useEffect(() => {
        fetchFunctionalities();
    }, []);

  return (
      <GlassCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#172b4d', fontWeight: 600 }}>
                  Manage Functionalities
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
                          <TableCell sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 1 }}>Functionality Name</TableCell>
                          <TableCell  sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 1 }}>Status</TableCell>
                          <TableCell  sx={{ color: '#172b4d', fontWeight: 700, fontSize: '1rem', py: 1 }}>Info</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {isLoading ? (
                          <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                                  <Spinner />
                              </TableCell>
                          </TableRow>
                      ) : Functionalities?.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                                  No Functionalities found
                              </TableCell>
                          </TableRow>
                      ) : (
                          Functionalities.map((func) => (
                              <TableRow
                                  key={func.id}
                                  sx={{ '&:hover': { background: 'rgba(0, 123, 255, 0.05)', transition: 'background 0.2s' }, minHeight: 48 }}
                              >
                                  <TableCell  sx={{ color: '#172b4d', fontSize: '0.95rem', py: 1, fontWeight: 500 }}>
                                      {func.key}
                                  </TableCell>
                                  <TableCell sx={{ py: 1 }}>
                                      <FormControlLabel
                                          control={
                                              <Switch
                                                  checked={func.is_enabled}
                                                  onChange={() => handleEnableToggle(func.id)}
                                                  size="small"
                                                  sx={{
                                                      '& .MuiSwitch-track': { backgroundColor: func.is_enabled ? '#93f9b9' : '#dfe1e6' },
                                                      '& .MuiSwitch-thumb': { backgroundColor: func.is_enabled ? '#00c853' : '#007bff' }
                                                  }}
                                              />
                                          }
                                          label={
                                              <Typography sx={{ ml: 1, fontSize: '0.88rem', fontWeight: 500, color: func.is_enabled ? '#00c853' : '#78909c' }}>
                                                  {func.is_enabled ? 'Yes' : 'No'}
                                              </Typography>
                                          }
                                          sx={{ marginLeft: 0 }}
                                      />
                                  </TableCell>
                                  <TableCell  sx={{ py: 1 }}>
                                      <Tooltip title={func.description || "No description available"} arrow>
                                          <InfoOutlineIcon fontSize="small" sx={{ color: '#1976d2',cursor:'pointer' }} />
                                      </Tooltip>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </TableContainer>
      </GlassCard>
  )
}

export default FunctionalitySettings;
