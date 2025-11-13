
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { RootState, useAppselector } from "@/redux/store";
import { setCurrentStatus, setUser } from "@/redux/features/userSlice";
import createAxiosInstance from "@/app/axiosInstance";
import toast from "react-hot-toast";

const reasonOptions = [
  "Lunch Break",
  "Short Leave",
  "Internet Issue",
  "Power Outage",
  "Team Meeting",
  "Client Meeting",
  "Town Hall",
];

const OnlineToggle = () => {
  const dispatch = useDispatch();
  const axiosInstance = createAxiosInstance();
  const user = useAppselector((state) => state.user.user);
  const tenantId = useAppselector((state) => state.user.tenantId); // Assuming tenantId is stored in Redux

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isOnline) {
      setDialogOpen(true);
    } else {
      setLoading(true);
      try {
        const response = await axiosInstance.patch(`/user/toggle-status/${user.id}`,
          {
            reason: null,
          }
        );
        if (response?.status === 200) {
          setIsOnline(true);
        } else {
          toast.error(response.data.message || "Failed to toggle status");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "An error occurred while toggling status");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReasonSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.patch(
        `/user/toggle-status/${user.id}`,
        {
          reason: reason,
        }
      );
      if (response?.status === 200) {
        // dispatch(setUser({ ...user, currentStatus: response.data.data.newStatus, offlineReason: reason }));
        // dispatch(setCurrentStatus(response.data.data.newStatus));
        setIsOnline(false);
        setDialogOpen(false);
        setReason("");
      } else {
        toast.error(response.data.message || "Failed to toggle status");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred while toggling status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsOnline(user?.current_status === "online" ? true : false);
  }, []);

  return (
    <>
      <ButtonBase
        onClick={handleToggle}
        disabled={loading}
        sx={{
          width: 60,
          height: 22,
          borderRadius: 10,
          backgroundColor: isOnline ? "var(--primary-color-1)" : "var(--primary-color-2)",
          color: "white",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: isOnline ? "flex-start" : "flex-end",
          transition: "all 0.3s ease",
          boxShadow: 2,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            left: isOnline ? 8 : "auto",
            right: isOnline ? "auto" : 8,
            fontSize: 9.1,
            fontWeight: "bold",
          }}
        >
          {isOnline ? "online" : "offline"}
        </Typography>
        <Box
          sx={{
            width: 16.8,
            height: 16.8,
            borderRadius: "50%",
            backgroundColor: "white",
            position: "absolute",
            right: isOnline ? 3.2 : "auto",
            left: isOnline ? "auto" : 3.2,
            transition: "all 0.3s ease",
          }}
        />
      </ButtonBase>

      {/* Dialog for offline reason */}
<Dialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  maxWidth="sm"
  fullWidth
  BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}
>
  <DialogTitle
    sx={{
      bgcolor: 'primary.main',
      color: 'white',
      mb: 2,
      textAlign: 'center',
      background: 'linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))',
      fontSize: '1.5rem', // Matches typography size
      fontWeight: 'bold',
      padding: '16px 24px', // Consistent padding
    }}
  >
    REASON FOR GOING OFFLINE
  </DialogTitle>
<DialogContent sx={{ padding: '16px 24px' }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Reason</InputLabel>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              label="Select Reason"
              disabled={loading}
            >
              {reasonOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && (
            <Typography color="error" sx={{ mt: 2, fontSize: '0.875rem' }}>
              {error}
            </Typography>
          )}
        </DialogContent>
  <DialogActions
    sx={{
      padding: '8px 24px', // Consistent padding
      justifyContent: 'space-between', // Matches button spacing
    }}
  >
    <Button
      onClick={() => setDialogOpen(false)}
      disabled={loading}
      sx={{
        color: 'var(--primary-color-1)', // Matches Cancel button color
        textTransform: 'none', // Consistent typography
        fontSize: '0.875rem', // Matches button font size
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)', // Subtle hover effect
        },
        '&.Mui-disabled': {
          color: 'rgba(0, 0, 0, 0.26)', // Disabled state
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleReasonSubmit}
      disabled={!reason.trim() || loading}
      sx={{
        bgcolor: 'var(--primary-color-1)', // Matches Assign button background
        color: 'white', // White text for contrast
        textTransform: 'none', // Consistent typography
        fontSize: '0.875rem', // Matches button font size
        padding: '6px 16px', // Consistent padding
        borderRadius: '4px', // Consistent border radius
        '&:hover': {
          bgcolor: 'var(--primary-color-1-hover)', // Hover effect
        },
        '&.Mui-disabled': {
          bgcolor: 'rgba(0, 0, 0, 0.12)', // Disabled state
          color: 'rgba(0, 0, 0, 0.26)',
        },
      }}
    >
      {loading ? 'Submitting...' : 'Submit'}
    </Button>
  </DialogActions>
</Dialog>
    </>
  );

};

export default OnlineToggle;