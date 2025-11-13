"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { SetPassword } from "../profile/page";

interface SetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (passwordDetails: SetPassword) => Promise<void>;
}

export default function SetPasswordDialog({
  open,
  onClose,
  onSubmit,
}: SetPasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password validation regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!oldPassword) {
        throw new Error("Please enter your current password.");
      }

      // if (!passwordRegex.test(newPassword)) {
      //   throw new Error(
      //     "New password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character."
      //   );
      // }

      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      await onSubmit({ oldPassword, newPassword, confirmNewPassword: confirmPassword });
    } catch (error: any) {
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          bgcolor: "white",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--text-color, #1f2937)",
            py: 2,
            borderBottom: "1px solid #e5e7eb",
            gap: 1,
          }}
        >
          <Lock sx={{ color: "var(--primary-color-2, #2563eb)", fontSize: "1.25rem" }} />
          Reset Password
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", mb: 2, color: "#6b7280", fontFamily: "'Roboto', sans-serif" }}
          >
            Use a strong password to keep your account secure.
          </Typography>

          {[
            {
              label: "Current Password",
              value: oldPassword,
              setValue: setOldPassword,
              show: showOldPassword,
              toggle: () => setShowOldPassword(!showOldPassword),
              autoFocus: true,
            },
            {
              label: "New Password",
              value: newPassword,
              setValue: setNewPassword,
              show: showNewPassword,
              toggle: () => setShowNewPassword(!showNewPassword),
            },
            {
              label: "Confirm New Password",
              value: confirmPassword,
              setValue: setConfirmPassword,
              show: showConfirmPassword,
              toggle: () => setShowConfirmPassword(!showConfirmPassword),
            },
          ].map((field, index) => (
            <TextField
              key={index}
              label={field.label}
              type={field.show ? "text" : "password"}
              value={field.value}
              onChange={(e) => field.setValue(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              autoFocus={field.autoFocus}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={field.toggle}
                      edge="end"
                      aria-label={`toggle ${ field.label.toLowerCase() } visibility`}
                      sx={{ color: "var(--primary-color-2, #6b7280)" }}
                    >
                      {field.show ? (
                        <VisibilityOff sx={{ color: "var(--primary-color-2, #2563eb)" }} />
                      ) : (
                        <Visibility sx={{ color: "var(--primary-color-2, #2563eb)" }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { bgcolor: "#fff", borderRadius: "8px" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "var(--primary-color-2, #2563eb)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--primary-color-1, #3b82f6)" },
                },
                "& .MuiInputLabel-root": { color: "#6b7280" },
                "& .MuiInputLabel-root.Mui-focused": { color: "var(--primary-color-1, #3b82f6)" },
                mb: 2,
              }}
            />
          ))}

          {error && (
            <Typography
              variant="body2"
              sx={{
                color: "#ef4444",
                textAlign: "center",
                mt: 2,
                fontFamily: "'Roboto', sans-serif",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{
              textTransform: "none",
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              color: "#6b7280",
              "&:hover": { bgcolor: "#f3f4f6" },
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              textTransform: "none",
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              bgcolor: "var(--primary-color-1, #3b82f6)",
              color: "#fff",
              "&:hover": { bgcolor: "var(--primary-color-2, #2563eb)" },
              "&.Mui-disabled": { bgcolor: "#d1d5db", color: "#fff" },
            }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Update Password
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
