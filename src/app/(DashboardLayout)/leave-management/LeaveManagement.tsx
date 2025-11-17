"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import toast from "react-hot-toast";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import { DataGrid, GridColDef, GridValidRowModel } from "@mui/x-data-grid";

type LeaveType = {
  id: string;
  name: string;
  description?: string;
  is_paid: boolean;
  allow_half_day: boolean;
  color?: string | null;
  is_active: boolean;
  is_delete?: boolean;
};

type LeavePolicy = {
  id: string;
  leave_type: LeaveType;
  leave_type_id?: string;
  accrual_frequency: "MONTHLY" | "YEARLY" | "NONE";
  allowance_per_period: number;
  carry_forward_enabled: boolean;
  carry_forward_limit?: number | null;
  auto_approve: boolean;
  max_balance?: number | null;
  policy_file_url?: string | null;
  policy_file_name?: string | null;
  metadata?: {
    role_allowances?: { role_id: string; allowance: number }[];
  } | null;
};

type LeaveBalance = {
  id: string;
  year: number;
  balance: number | string;
  used: number | string;
  pending: number | string;
  leave_type: LeaveType;
};

type LeaveRequest = {
  id: string;
  start_date: string;
  end_date: string;
  duration_type: "FULL_DAY" | "HALF_DAY";
  half_day_session?: "FIRST_HALF" | "SECOND_HALF" | null;
  short_leave_minutes?: number | null;
  short_leave_time_period?: "EARLY" | "MIDDLE" | "LATE" | null;
  total_days: number | string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  leave_type: LeaveType;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  preferred_approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  inform_user_ids?: string[];
};

type ApplyLeaveFormState = {
  leave_type_id: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  duration_type: "FULL_DAY" | "HALF_DAY";
  reason: string;
  inform_user_ids: string[];
  halfDaySession: "FIRST_HALF" | "SECOND_HALF";
  shortLeaveMinutes: number;
  shortLeaveTimePeriod: "EARLY" | "MIDDLE" | "LATE";
};

type LeaveTypeFormState = {
  name: string;
  description: string;
  is_paid: boolean;
  allow_half_day: boolean;
  color: string;
};

type PolicyFormState = {
  leave_type_id: string;
  accrual_frequency: "MONTHLY" | "YEARLY" | "NONE";
  allowance_per_period: number;
  carry_forward_enabled: boolean;
  carry_forward_limit?: number | null;
  auto_approve: boolean;
  max_balance?: number | null;
  roleAllowances: Record<
    string,
    {
      allowance: string;
      carry_forward_limit: string;
      auto_approve: boolean;
    }
  >;
};

const POLICY_DEFAULTS = {
  accrual_frequency: "MONTHLY" as const,
  allowance_per_period: 1,
  carry_forward_enabled: false,
  carry_forward_limit: null as number | null,
  auto_approve: false,
  max_balance: null as number | null,
};

const createDefaultPolicyForm = (): PolicyFormState => ({
  leave_type_id: "",
  accrual_frequency: POLICY_DEFAULTS.accrual_frequency,
  allowance_per_period: POLICY_DEFAULTS.allowance_per_period,
  carry_forward_enabled: POLICY_DEFAULTS.carry_forward_enabled,
  carry_forward_limit: POLICY_DEFAULTS.carry_forward_limit,
  auto_approve: POLICY_DEFAULTS.auto_approve,
  max_balance: POLICY_DEFAULTS.max_balance,
  roleAllowances: {},
});

type UserOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type RoleOption = {
  id: string;
  name: string;
  priority: number;
};

type MyRequestRow = GridValidRowModel & {
  id: string;
  type: string;
  dateRange: string;
  durationLabel: string;
  status: LeaveRequest["status"];
  reason: string;
  informLabel: string;
};

type TeamRequestRow = GridValidRowModel & {
  id: string;
  employee: string;
  type: string;
  dateRange: string;
  durationLabel: string;
  status: LeaveRequest["status"];
  informLabel: string;
  canAct: boolean;
  reviewedAt: string | null;
};

const LeaveManagement: React.FC = () => {
  const axiosInstance = useMemo(() => createAxiosInstance(), []);
  const role = useAppselector((state) => state.role.value);
  const userInfo = useAppselector((state) => state.user.user);
  const rolePriority = role?.priority ?? 99;
  const isAdmin = rolePriority <= 2;

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<LeaveRequest | null>(
    null
  );
  const [centralizedPolicyFile, setCentralizedPolicyFile] = useState<{
    url: string;
    fileName: string;
    uploadedAt: string;
  } | null>(null);

  const tabs = useMemo(() => {
    const base = [{ key: "my", label: "My Leaves" }];
    if (isAdmin) {
      base.push({ key: "team", label: "Team Requests" });
    }
    if (isAdmin) {
      base.push({ key: "settings", label: "Settings" });
    }
    return base;
  }, [isAdmin]);
  const [leaveTypeForm, setLeaveTypeForm] = useState<LeaveTypeFormState>({
    name: "",
    description: "",
    is_paid: true,
    allow_half_day: true,
    color: "#0ea5e9",
  });
  const [policyForm, setPolicyForm] = useState<PolicyFormState>(
    createDefaultPolicyForm()
  );
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(
    null
  );
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const [applyForm, setApplyForm] = useState<ApplyLeaveFormState>({
    leave_type_id: "",
    startDate: dayjs(),
    endDate: dayjs(),
    duration_type: "FULL_DAY",
    reason: "",
    inform_user_ids: [],
    halfDaySession: "FIRST_HALF",
    shortLeaveMinutes: 30,
    shortLeaveTimePeriod: "MIDDLE",
  });

  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const fetchLeaveTypes = useCallback(async () => {
    const res = await axiosInstance.get("/leave-management/types");
    setTypes(res.data?.data || []);
  }, [axiosInstance]);

  const fetchPolicies = useCallback(async () => {
    const res = await axiosInstance.get("/leave-management/policies");
    const list: LeavePolicy[] = res.data?.data || [];
    setPolicies(list);
  }, [axiosInstance]);

  const fetchBalances = useCallback(async () => {
    const res = await axiosInstance.get("/leave-management/balances");
    setBalances(res.data?.data || []);
  }, [axiosInstance]);

  const fetchMyRequests = useCallback(
    async (scope: "my" | "team" | "all" = "my") => {
      const res = await axiosInstance.get(
        `/leave-management/requests?scope=${scope}`
      );
      if (scope === "my") {
        setMyRequests(res.data?.data || []);
      } else {
        setTeamRequests(res.data?.data || []);
      }
    },
    [axiosInstance]
  );

  const fetchUsersList = useCallback(async () => {
    const res = await axiosInstance.get("/user/list");
    const list: UserOption[] = (res.data?.data || []).map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    }));
    setAvailableUsers(list);
  }, [axiosInstance]);

  const fetchRolesList = useCallback(async () => {
    if (!isAdmin) return;
    const res = await axiosInstance.get("/role-management/get-all");
    const list: RoleOption[] = (res.data?.data || []).map((role: any) => ({
      id: role.id,
      name: role.name,
      priority: role.priority,
    }));
    setRoles(list);
  }, [axiosInstance, isAdmin]);

  const handleUploadPolicyFile = async (policyId: string, file: File) => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      await axiosInstance.post(
        `/leave-management/policies/${policyId}/upload-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Policy file uploaded successfully.");
      await fetchPolicies();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload policy file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePolicyFile = async (policyId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove the policy file? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/leave-management/policies/${policyId}/file`);
      toast.success("Policy file removed successfully.");
      await fetchPolicies();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove policy file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const fetchCentralizedPolicyFile = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/leave-management/policy-file");
      if (res.data.status === "success") {
        setCentralizedPolicyFile(res.data.data);
      } else {
        setCentralizedPolicyFile(null);
      }
    } catch (error: any) {
      setCentralizedPolicyFile(null);
    }
  }, [axiosInstance]);

  const handleUploadCentralizedPolicyFile = async (file: File) => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      await axiosInstance.post(
        `/leave-management/policy-file/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Centralized policy file uploaded successfully.");
      await fetchCentralizedPolicyFile();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload centralized policy file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCentralizedPolicyFile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove the centralized policy file? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/leave-management/policy-file`);
      toast.success("Centralized policy file removed successfully.");
      await fetchCentralizedPolicyFile();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove centralized policy file."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const tasks: Promise<any>[] = [
        fetchLeaveTypes(),
        fetchPolicies(),
        fetchBalances(),
        fetchMyRequests("my"),
        fetchUsersList(),
        fetchRolesList(),
        fetchCentralizedPolicyFile(),
      ];
      if (isAdmin) {
        tasks.push(fetchMyRequests("all"));
      }
      await Promise.all(tasks);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load leave management data.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    fetchLeaveTypes,
    fetchPolicies,
    fetchBalances,
    fetchMyRequests,
    fetchUsersList,
    fetchRolesList,
    fetchCentralizedPolicyFile,
    isAdmin,
  ]);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (!policyForm.leave_type_id || roles.length === 0) return;
    setPolicyForm((prev) => {
      let changed = false;
      const updated = { ...prev.roleAllowances };
      const roleIds = roles.map((role) => role.id);
      roles.forEach((role) => {
        if (!updated[role.id]) {
          updated[role.id] = {
            allowance: "",
            carry_forward_limit: "",
            auto_approve: false,
          };
          changed = true;
        }
      });
      Object.keys(updated).forEach((roleId) => {
        if (!roleIds.includes(roleId)) {
          delete updated[roleId];
          changed = true;
        }
      });
      return changed ? { ...prev, roleAllowances: updated } : prev;
    });
  }, [roles, policyForm.leave_type_id]);

  const handleOpenApplyDialog = () => {
    setApplyForm({
      leave_type_id: types.find((type) => type.is_active)?.id || "",
      startDate: dayjs(),
      endDate: dayjs(),
      duration_type: "FULL_DAY",
      reason: "",
      inform_user_ids: [],
      halfDaySession: "FIRST_HALF",
      shortLeaveMinutes: 30,
      shortLeaveTimePeriod: "MIDDLE",
    });
    setApplyDialogOpen(true);
  };

  const handleViewRequest = (requestId: string) => {
    const request =
      teamRequests.find((request) => request.id === requestId) ?? null;
    setDetailsRequest(request);
    setDetailsDialogOpen(Boolean(request));
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setDetailsRequest(null);
  };

  const handleApply = async () => {
    if (
      !applyForm.leave_type_id ||
      !applyForm.startDate ||
      !applyForm.endDate
    ) {
      toast.error("Please select leave type and dates.");
      return;
    }
    // Check if selected leave type is "Short Leave"
    const selectedLeaveType = types.find(
      (type) => type.id === applyForm.leave_type_id
    );
    // Validate past dates
    const today = dayjs().startOf("day");
    if (applyForm.startDate.isBefore(today, "day")) {
      toast.error("Cannot apply for leave in the past.");
      return;
    }
    if (applyForm.endDate.isBefore(today, "day")) {
      toast.error("Cannot apply for leave in the past.");
      return;
    }
    if (applyForm.startDate.isAfter(applyForm.endDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    if (
      applyForm.duration_type === "HALF_DAY" &&
      !applyForm.startDate.isSame(applyForm.endDate, "day")
    ) {
      toast.error("Half-day leave must start and end on the same day.");
      return;
    }
    if (applyForm.duration_type === "HALF_DAY" && !applyForm.halfDaySession) {
      toast.error("Please select the half-day session.");
      return;
    }
    if (selectedLeaveType?.name === "Short Leave") {
      if (!applyForm.startDate.isSame(applyForm.endDate, "day")) {
        toast.error("Short leave must be for a single day.");
        return;
      }
      if (!applyForm.shortLeaveMinutes || applyForm.shortLeaveMinutes < 15) {
        toast.error("Short leave must be at least 15 minutes.");
        return;
      }
      if (applyForm.shortLeaveMinutes > 240) {
        toast.error("Short leave cannot exceed 240 minutes (4 hours).");
        return;
      }
      if (!applyForm.shortLeaveTimePeriod) {
        toast.error("Please select the time period for short leave.");
        return;
      }
    }
    const payload = {
      leave_type_id: applyForm.leave_type_id,
      start_date: applyForm.startDate.format("YYYY-MM-DD"),
      end_date: applyForm.endDate.format("YYYY-MM-DD"),
      duration_type:
        selectedLeaveType?.name === "Short Leave"
          ? "FULL_DAY"
          : applyForm.duration_type,
      reason: applyForm.reason,
      inform_user_ids: applyForm.inform_user_ids,
      half_day_session:
        applyForm.duration_type === "HALF_DAY"
          ? applyForm.halfDaySession
          : undefined,
      short_leave_minutes:
        selectedLeaveType?.name === "Short Leave"
          ? applyForm.shortLeaveMinutes
          : undefined,
      short_leave_time_period:
        selectedLeaveType?.name === "Short Leave"
          ? applyForm.shortLeaveTimePeriod
          : undefined,
    };
    try {
      setActionLoading(true);
      await axiosInstance.post("/leave-management/requests", payload);
      toast.success("Leave request submitted.");
      setApplyDialogOpen(false);
      await Promise.all([fetchBalances(), fetchMyRequests("my")]);
      if (isAdmin) {
        await fetchMyRequests("all");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit leave request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/leave-management/requests/${id}`, {
        status: "CANCELLED",
      });
      toast.success("Leave request cancelled.");
      await Promise.all([fetchBalances(), fetchMyRequests("my")]);
      if (isAdmin) {
        await fetchMyRequests("all");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to cancel leave request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (
    id: string,
    action: "approve" | "reject",
    note?: string
  ) => {
    if (action === "reject") {
      const confirmed = window.confirm(
        "Are you sure you want to reject this leave request? This action cannot be undone."
      );
      if (!confirmed) return;
    }
    try {
      setActionLoading(true);
      const endpoint =
        action === "approve"
          ? `/leave-management/requests/${id}/approve`
          : `/leave-management/requests/${id}/reject`;
      await axiosInstance.post(endpoint, { reviewer_note: note });
      toast.success(
        action === "approve"
          ? "Leave request approved."
          : "Leave request rejected."
      );
      const refreshes = [fetchBalances(), fetchMyRequests("my")];
      if (isAdmin) {
        refreshes.push(fetchMyRequests("all"));
      }
      await Promise.all(refreshes);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${action} leave request.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const resetLeaveTypeForm = () => {
    setLeaveTypeForm({
      name: "",
      description: "",
      is_paid: true,
      allow_half_day: true,
      color: "#0ea5e9",
    });
    setEditingLeaveTypeId(null);
  };

  const handleSaveLeaveType = async () => {
    if (!leaveTypeForm.name.trim()) {
      toast.error("Leave type name is required.");
      return;
    }
    try {
      setActionLoading(true);
      const payload = {
        name: leaveTypeForm.name.trim(),
        description: leaveTypeForm.description.trim() || undefined,
        is_paid: leaveTypeForm.is_paid,
        allow_half_day: leaveTypeForm.allow_half_day,
        color: leaveTypeForm.color || undefined,
      };
      if (editingLeaveTypeId) {
        await axiosInstance.patch(
          `/leave-management/types/${editingLeaveTypeId}`,
          payload
        );
        toast.success("Leave type updated.");
      } else {
        await axiosInstance.post("/leave-management/types", payload);
        toast.success("Leave type created.");
      }
      resetLeaveTypeForm();
      await Promise.all([fetchLeaveTypes(), fetchBalances()]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${editingLeaveTypeId ? "update" : "create"} leave type.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLeaveType = (type: LeaveType) => {
    setEditingLeaveTypeId(type.id);
    setLeaveTypeForm({
      name: type.name,
      description: type.description || "",
      is_paid: type.is_paid,
      allow_half_day: type.allow_half_day,
      color: type.color || "#0ea5e9",
    });
  };

  const handleDeleteLeaveType = async (type: LeaveType) => {
    const isSystemType =
      type.name === "Unpaid Leave" || type.name === "Paid Leave";
    if (isSystemType) {
      toast.error("Default leave types cannot be deleted.");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete the leave type "${type.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/leave-management/types/${type.id}`);
      toast.success("Leave type deleted.");
      if (editingLeaveTypeId === type.id) {
        resetLeaveTypeForm();
      }
      await Promise.all([fetchLeaveTypes(), fetchBalances()]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete leave type."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePolicySave = async () => {
    if (!policyForm.leave_type_id) {
      toast.error("Please select a leave type.");
      return;
    }
    try {
      setActionLoading(true);
      const role_allowances = Object.entries(policyForm.roleAllowances)
        .map(([role_id, values]) => ({
          role_id,
          allowance:
            values.allowance === "" ? undefined : Number(values.allowance),
          carry_forward_limit:
            values.carry_forward_limit === ""
              ? undefined
              : Number(values.carry_forward_limit),
          auto_approve: values.auto_approve,
        }))
        .filter(
          (entry) =>
            entry.allowance !== undefined && !Number.isNaN(entry.allowance)
        );
      await axiosInstance.post("/leave-management/policies", {
        ...policyForm,
        role_allowances,
      });
      toast.success("Policy saved.");
      setEditingPolicyId(null);
      setPolicyForm(createDefaultPolicyForm());
      await Promise.all([
        fetchPolicies(),
        fetchLeaveTypes(),
        fetchBalances(),
        fetchMyRequests("my"),
      ]);
      if (isAdmin) {
        await fetchMyRequests("all");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save leave policy."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (
      !confirm(
        "Deleting this policy will remove custom allowances for this leave type. Continue?"
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`/leave-management/policies/${policyId}`);
      if (editingPolicyId === policyId) {
        setEditingPolicyId(null);
      }
      setPolicyForm(createDefaultPolicyForm());
      toast.success("Policy deleted.");
      await Promise.all([fetchPolicies(), fetchLeaveTypes(), fetchBalances()]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete leave policy."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const currentTabKey = tabs[activeTab]?.key ?? "my";

  const leaveTypeOptions = useMemo(
    () => types.filter((type) => type.is_active && !type.is_delete),
    [types]
  );

  const editingLeaveType = useMemo(
    () =>
      editingLeaveTypeId
        ? types.find((type) => type.id === editingLeaveTypeId) ?? null
        : null,
    [editingLeaveTypeId, types]
  );

  const isEditingUnpaid = editingLeaveType?.name === "Unpaid Leave";

  useEffect(() => {
    if (isEditingUnpaid) {
      setLeaveTypeForm((prev) => ({
        ...prev,
        is_paid: false,
      }));
    }
  }, [isEditingUnpaid]);

  const selectableUsers = useMemo(
    () =>
      availableUsers.filter((user) => {
        if (!userInfo?.id) return true;
        return user.id !== userInfo.id;
      }),
    [availableUsers, userInfo]
  );

  const userLookup = useMemo(() => {
    const map = new Map<string, UserOption>();
    availableUsers.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [availableUsers]);

  const statusColorMap: Record<
    LeaveRequest["status"],
    "default" | "success" | "error" | "warning" | "info"
  > = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "error",
    CANCELLED: "default",
  };

  const halfDayLabels: Record<string, string> = {
    FIRST_HALF: "First half",
    SECOND_HALF: "Second half",
  };

  const formatInformUsers = useCallback(
    (ids?: string[]) => {
      if (!ids || ids.length === 0) return "—";
      const names = ids
        .map((id) => userLookup.get(id))
        .filter((user): user is UserOption => Boolean(user))
        .map(
          (user) =>
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email ||
            "User"
        );
      if (names.length === 0) return `${ids.length} user(s)`;
      if (names.length <= 2) {
        return names.join(", ");
      }
      return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    },
    [userLookup]
  );

  const summaryCards = balances.map((balance) => {
    const isPaid = balance.leave_type.is_paid;
    const availableNumeric =
      toNumber(balance.balance) - toNumber(balance.pending);
    const formattedAvailable = isPaid
      ? Math.max(availableNumeric, 0).toFixed(2)
      : "∞";
    return {
      title: balance.leave_type.name,
      available: formattedAvailable,
      used: isPaid ? toNumber(balance.used).toFixed(2) : "—",
      pending: isPaid ? toNumber(balance.pending).toFixed(2) : "—",
      color: balance.leave_type.color || "var(--primary-color-1)",
      isPaid,
    };
  });

  const formatDateRange = useCallback((start?: string, end?: string) => {
    if (!start || !end) return "-";
    return `${dayjs(start).format("DD MMM")} - ${dayjs(end).format(
      "DD MMM YYYY"
    )}`;
  }, []);

  // Calculate preview days for leave application
  const previewDays = useMemo(() => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    const selectedLeaveType = types.find(
      (type) => type.id === applyForm.leave_type_id
    );

    if (selectedLeaveType?.name === "Short Leave") {
      return applyForm.shortLeaveMinutes
        ? applyForm.shortLeaveMinutes / 480
        : 0;
    }

    if (applyForm.duration_type === "HALF_DAY") {
      return 0.5;
    }

    const diff = applyForm.endDate.diff(applyForm.startDate, "day") + 1;
    // Simple weekend exclusion (can be enhanced later)
    let workingDays = 0;
    for (let i = 0; i < diff; i++) {
      const currentDate = applyForm.startDate.add(i, "day");
      const dayOfWeek = currentDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }
    return workingDays;
  }, [
    applyForm.startDate,
    applyForm.endDate,
    applyForm.duration_type,
    applyForm.leave_type_id,
    applyForm.shortLeaveMinutes,
    types,
  ]);

  // Get available balance for selected leave type
  const availableBalance = useMemo(() => {
    if (!applyForm.leave_type_id) return null;
    const balance = balances.find(
      (b) => b.leave_type.id === applyForm.leave_type_id
    );
    if (!balance) return null;
    const availableNumeric =
      toNumber(balance.balance) - toNumber(balance.pending);
    return balance.leave_type.is_paid
      ? Math.max(availableNumeric, 0)
      : Infinity;
  }, [balances, applyForm.leave_type_id]);

  const myRows = useMemo<MyRequestRow[]>(
    () =>
      myRequests.map((req) => ({
        id: req.id,
        type: req.leave_type?.name ?? "-",
        dateRange: formatDateRange(req.start_date, req.end_date),
        durationLabel: (() => {
          const total = toNumber(req.total_days);
          // Check if it's a Short Leave type
          if (req.leave_type?.name === "Short Leave") {
            const minutes = req.short_leave_minutes || 0;
            const periodLabels: Record<string, string> = {
              EARLY: "Early (9 AM - 12 PM)",
              MIDDLE: "Middle (12 PM - 3 PM)",
              LATE: "Late (3 PM - 7 PM)",
            };
            const periodLabel =
              periodLabels[req.short_leave_time_period || "MIDDLE"] || "";
            return `${minutes} min${periodLabel ? ` • ${periodLabel}` : ""}`;
          }
          if (req.duration_type === "HALF_DAY") {
            const label =
              halfDayLabels[req.half_day_session || "FIRST_HALF"] || "Half day";
            return `${total} day • ${label}`;
          }
          return `${total} day${total === 1 ? "" : "s"}`;
        })(),
        status: req.status,
        reason: req.reason ?? "—",
        informLabel: formatInformUsers(req.inform_user_ids),
      })),
    [myRequests, formatInformUsers, formatDateRange]
  );

  const teamRows = useMemo<TeamRequestRow[]>(
    () =>
      teamRequests.map((req) => {
        const userLabel =
          `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim() ||
          req.user?.email ||
          "-";
        const canAct = isAdmin;
        return {
          id: req.id,
          employee: userLabel,
          type: req.leave_type?.name ?? "-",
          dateRange: formatDateRange(req.start_date, req.end_date),
          durationLabel: (() => {
            const total = toNumber(req.total_days);
            // Check if it's a Short Leave type
            if (req.leave_type?.name === "Short Leave") {
              const minutes = req.short_leave_minutes || 0;
              const periodLabels: Record<string, string> = {
                EARLY: "Early (9 AM - 12 PM)",
                MIDDLE: "Middle (12 PM - 3 PM)",
                LATE: "Late (3 PM - 7 PM)",
              };
              const periodLabel =
                periodLabels[req.short_leave_time_period || "MIDDLE"] || "";
              return `${minutes} min${periodLabel ? ` • ${periodLabel}` : ""}`;
            }
            if (req.duration_type === "HALF_DAY") {
              const label =
                halfDayLabels[req.half_day_session || "FIRST_HALF"] ||
                "Half day";
              return `${total} day • ${label}`;
            }
            return `${total} day${total === 1 ? "" : "s"}`;
          })(),
          status: req.status,
          informLabel: formatInformUsers(req.inform_user_ids),
          canAct,
          reviewedAt: req.reviewed_at ?? null,
        };
      }),
    [teamRequests, isAdmin, formatInformUsers, formatDateRange]
  );

  const pendingTeamRows = useMemo(
    () => teamRows.filter((row) => row.status === "PENDING"),
    [teamRows]
  );

  const reviewedTeamRows = useMemo(
    () => teamRows.filter((row) => row.status !== "PENDING"),
    [teamRows]
  );

  const myColumns: GridColDef<MyRequestRow>[] = [
    { field: "type", headerName: "Type", flex: 1 },
    { field: "dateRange", headerName: "Dates", flex: 1.1 },
    { field: "durationLabel", headerName: "Duration", width: 140 },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            statusColorMap[params.value as LeaveRequest["status"]] || "default"
          }
          size="small"
        />
      ),
    },
    { field: "reason", headerName: "Reason", flex: 1.2 },
    { field: "informLabel", headerName: "Inform", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.status !== "PENDING") {
          return null;
        }
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleCancelRequest(row.id)}
            sx={{
              borderColor: "var(--primary-color-1)",
              color: "var(--primary-color-1)",
              textTransform: "none",
              fontSize: "0.75rem",
              "&:hover": {
                borderColor: "var(--primary-color-2)",
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              },
            }}
          >
            Cancel
          </Button>
        );
      },
    },
  ];

  const reviewedColumns: GridColDef<TeamRequestRow>[] = [
    { field: "employee", headerName: "Employee", flex: 1.2 },
    { field: "type", headerName: "Type", width: 160 },
    { field: "dateRange", headerName: "Dates", flex: 1.1 },
    { field: "durationLabel", headerName: "Duration", width: 140 },
    { field: "informLabel", headerName: "Inform", width: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            statusColorMap[params.value as LeaveRequest["status"]] || "default"
          }
          size="small"
        />
      ),
    },
    {
      field: "reviewedAt",
      headerName: "Reviewed",
      width: 180,
      renderCell: ({ row }) =>
        row.reviewedAt
          ? dayjs(row.reviewedAt).format("DD MMM YYYY, HH:mm")
          : "—",
    },
  ];

  const approvalsColumns: GridColDef<TeamRequestRow>[] = [
    { field: "employee", headerName: "Employee", flex: 1.2 },
    { field: "type", headerName: "Type", width: 160 },
    { field: "dateRange", headerName: "Dates", flex: 1.1 },
    { field: "durationLabel", headerName: "Duration", width: 140 },
    { field: "informLabel", headerName: "Inform", width: 200 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: ({ row }) => {
        const renderActionButtons = () => {
        if (row.status !== "PENDING") {
            return (
              <Chip
                label="Completed"
                size="small"
                color="default"
                sx={{ fontWeight: 600 }}
              />
            );
        }
        if (!row.canAct) {
          return (
              <Chip
                label="Awaiting approver"
                size="small"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
          );
        }
        return (
            <>
            <Tooltip title="Approve">
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={actionLoading}
                  onClick={() => handleDecision(row.id, "approve")}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reject">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={actionLoading}
                  onClick={() => handleDecision(row.id, "reject")}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            </>
          );
        };

        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="View details">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleViewRequest(row.id)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {renderActionButtons()}
          </Stack>
        );
      },
    },
  ];

  const gridHeaderStyles = {
    borderBottom: "none",
    fontWeight: 700,
    fontSize: "0.9rem",
  };

  const dataGridBaseStyles = {
    border: "none",
    borderRadius: 2,
    fontSize: "0.92rem",
    "--DataGrid-cellHeight": "56px",
    "& .MuiDataGrid-columnHeaders": gridHeaderStyles,
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 700,
    },
    "& .MuiDataGrid-row": {
      borderRadius: 2,
      transition: "background-color 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(15, 23, 42, 0.03)",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
      },
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "none",
    },
    "& .MuiDataGrid-virtualScroller": {
      backgroundColor: "transparent",
    },
  } as const;

  const myGridStyles = {
    ...dataGridBaseStyles,
    "& .MuiDataGrid-columnHeaders": {
      ...gridHeaderStyles,
      backgroundColor: "rgba(15, 23, 42, 0.04)",
    },
    "& .MuiDataGrid-row:nth-of-type(2n)": {
      backgroundColor: "rgba(15, 23, 42, 0.015)",
    },
  };

  const pendingGridStyles = {
    ...dataGridBaseStyles,
    "& .MuiDataGrid-columnHeaders": {
      ...gridHeaderStyles,
      backgroundColor: "rgba(7, 152, 189, 0.08)",
    },
    "& .MuiDataGrid-row:nth-of-type(2n)": {
      backgroundColor: "rgba(7, 152, 189, 0.04)",
    },
  };

  const reviewedGridStyles = {
    ...dataGridBaseStyles,
    "& .MuiDataGrid-columnHeaders": {
      ...gridHeaderStyles,
      backgroundColor: "rgba(15, 23, 42, 0.06)",
    },
    "& .MuiDataGrid-row:nth-of-type(2n)": {
      backgroundColor: "rgba(15, 23, 42, 0.02)",
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            mb: 4,
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
            borderRadius: 2,
            background: "var(--card-bg-color)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2.5,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: "var(--primary-color-1)",
              }}
            >
              Leave Management
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<BeachAccessIcon />}
              onClick={handleOpenApplyDialog}
              disabled={!leaveTypeOptions.length}
              sx={{
                backgroundColor: "var(--primary-color-1)",
                color: "white",
                borderRadius: 1,
                px: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)",
                },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(0, 0, 0, 0.12)",
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              Apply for Leave
            </Button>
          </Stack>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{
            mb: 4,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              minHeight: 48,
              px: 3,
              color: "rgba(0, 0, 0, 0.6)",
              transition: "all 0.3s ease",
              "&:hover": {
                color: "var(--primary-color-1)",
                backgroundColor: "rgba(7, 152, 189, 0.04)",
                borderRadius: "8px 8px 0 0",
              },
            },
            "& .Mui-selected": {
              color: "var(--primary-color-1) !important",
              fontWeight: 700,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--primary-color-1)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>

        {currentTabKey === "my" && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {summaryCards.map((card) => (
                // @ts-expect-error - MUI v7 Grid type definitions don't include item prop, but it works at runtime
                <Grid item xs={12} sm={6} md={4} key={card.title}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "var(--card-bg-color)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {card.title} {card.isPaid ? "(Paid)" : "(Unpaid)"}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {card.isPaid ? `${card.available} d` : "Unlimited"}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Chip
                            label={`Used: ${card.used}`}
                            size="small"
                            color="default"
                          />
                          <Chip
                            label={`Pending: ${card.pending}`}
                            size="small"
                            color={card.isPaid ? "warning" : "default"}
                          />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {!summaryCards.length && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        No leave balances available yet. Administrators can
                        configure allowances from the Settings tab.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "var(--card-bg-color)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={3}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ fontSize: "1.1rem" }}
                  >
                    My Leave Requests
                  </Typography>
                  <Chip
                    icon={<HourglassEmptyIcon />}
                    label={`${
                      myRequests.filter((r) => r.status === "PENDING").length
                    } pending`}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
                <div style={{ width: "100%" }}>
                  <DataGrid
                    autoHeight
                    rows={myRows}
                    getRowId={(row) => row.id}
                    columns={myColumns}
                    hideFooter
                    disableRowSelectionOnClick
                    loading={loading}
                    disableColumnMenu
                    density="comfortable"
                    rowHeight={60}
                    headerHeight={56}
                    sx={myGridStyles}
                  />
                </div>
              </CardContent>
            </Card>
          </Stack>
        )}

        {currentTabKey === "team" && (
          <Stack spacing={3}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(7, 152, 189, 0.08)",
                border: "1px solid rgba(7, 152, 189, 0.12)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                  spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                  mb={3}
              >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Team Leave Oversight
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      Monitor every pending request and keep an eye on recently
                      reviewed decisions.
                  </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<HourglassEmptyIcon />}
                    onClick={() => fetchMyRequests("all")}
                  disabled={actionLoading}
                  sx={{
                      background: "var(--primary-color-1)",
                    textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                    "&:hover": {
                        background: "var(--primary-color-1-hover)",
                    },
                  }}
                >
                    Refresh Data
                </Button>
              </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, rgba(7,152,189,0.12), rgba(7,152,189,0.04))",
                        border: "1px solid rgba(7, 152, 189, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          backgroundColor: "rgba(7, 152, 189, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <HourglassEmptyIcon
                          sx={{ color: "var(--primary-color-1)" }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Pending approvals
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {pendingTeamRows.length}
                        </Typography>
                        <Chip
                          label="Awaiting action"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 600, mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, rgba(0,194,146,0.12), rgba(0,194,146,0.04))",
                        border: "1px solid rgba(0, 194, 146, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          backgroundColor: "rgba(0, 194, 146, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircleIcon sx={{ color: "#00C292" }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Reviewed this month
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {reviewedTeamRows.length}
                        </Typography>
                        <Chip
                          label="Completed"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600, mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid rgba(7,152,189,0.12)",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  background:
                    "linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  rowGap: 1,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Pending Approvals
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Take action on requests waiting for a decision.
                  </Typography>
                </Box>
                <Chip
                  label={`${pendingTeamRows.length} awaiting`}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              </Box>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
              <div style={{ width: "100%" }}>
                <DataGrid
                  autoHeight
                      rows={pendingTeamRows}
                  getRowId={(row) => row.id}
                  columns={approvalsColumns}
                  hideFooter
                  disableRowSelectionOnClick
                  loading={loading}
                      disableColumnMenu
                      density="comfortable"
                      rowHeight={60}
                      headerHeight={56}
                      sx={pendingGridStyles}
                  localeText={{
                    noRowsLabel: "No pending requests.",
                  }}
                />
              </div>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 8px 26px rgba(15,23,42,0.06)",
                border: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  borderBottom: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(15,23,42,0.02)",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                Recently Reviewed
              </Typography>
                <Typography variant="body2" color="text.secondary">
                  A log of approvals and rejections completed in this cycle.
                </Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
              <div style={{ width: "100%" }}>
                <DataGrid
                  autoHeight
                      rows={reviewedTeamRows}
                  getRowId={(row) => row.id}
                  columns={reviewedColumns}
                  hideFooter
                  disableRowSelectionOnClick
                  loading={loading}
                      disableColumnMenu
                      density="comfortable"
                      rowHeight={60}
                      headerHeight={56}
                      sx={reviewedGridStyles}
                  localeText={{
                    noRowsLabel: "No reviewed requests yet.",
                  }}
                />
              </div>
                </Box>
            </CardContent>
          </Card>
          </Stack>
        )}

        {currentTabKey === "settings" && (
          <Stack spacing={4}>
            {/* Leave Types Section */}
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "var(--card-bg-color)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-1-hover) 100%)`,
                  p: 3,
                  color: "white",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BeachAccessIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Leave Types
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Manage different types of leave available in your
                      organization
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={5}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background: "rgba(7, 152, 189, 0.04)",
                        border: "1px solid rgba(7, 152, 189, 0.1)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        mb={2}
                        sx={{ color: "var(--primary-color-1)" }}
                      >
                        {editingLeaveTypeId
                          ? "Edit Leave Type"
                          : "Create New Leave Type"}
                      </Typography>
                      <Stack spacing={2.5}>
                        <TextField
                          label="Leave Type Name"
                          value={leaveTypeForm.name}
                          onChange={(e) =>
                            setLeaveTypeForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          fullWidth
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                            },
                          }}
                        />
                        <TextField
                          label="Description"
                          value={leaveTypeForm.description}
                          onChange={(e) =>
                            setLeaveTypeForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          multiline
                          minRows={3}
                          fullWidth
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                            },
                          }}
                        />
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            background: "white",
                            border: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  Paid Leave
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Employee receives salary during this leave
                                </Typography>
                              </Box>
                              <Switch
                                checked={leaveTypeForm.is_paid}
                                disabled={isEditingUnpaid}
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                                onChange={(_, checked) =>
                                  setLeaveTypeForm((prev) => ({
                                    ...prev,
                                    is_paid: checked,
                                  }))
                                }
                              />
                            </Stack>
                            <Divider />
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  Allow Half-Day
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Employees can take half-day leaves
                                </Typography>
                              </Box>
                              <Switch
                                checked={leaveTypeForm.allow_half_day}
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                                onChange={(_, checked) =>
                                  setLeaveTypeForm((prev) => ({
                                    ...prev,
                                    allow_half_day: checked,
                                  }))
                                }
                              />
                            </Stack>
                          </Stack>
                        </Box>
                        <Box>
                          <TextField
                            label="Color"
                            value={leaveTypeForm.color}
                            disabled={isEditingUnpaid}
                            onChange={(e) =>
                              setLeaveTypeForm((prev) => ({
                                ...prev,
                                color: e.target.value,
                              }))
                            }
                            fullWidth
                            helperText="HEX color used in leave summaries"
                            InputProps={{
                              startAdornment: (
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "4px",
                                    backgroundColor: leaveTypeForm.color,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                    mr: 1,
                                  }}
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 1,
                              },
                            }}
                          />
                        </Box>
                        <Stack direction="row" spacing={1.5} pt={1}>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleSaveLeaveType}
                            disabled={actionLoading}
                            sx={{
                              backgroundColor: "var(--primary-color-1)",
                              color: "white",
                              textTransform: "none",
                              px: 3,
                              py: 1.2,
                              borderRadius: 1,
                              "&:hover": {
                                backgroundColor: "var(--primary-color-1-hover)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(7, 152, 189, 0.3)",
                              },
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(0, 0, 0, 0.12)",
                                color: "rgba(0, 0, 0, 0.26)",
                              },
                            }}
                          >
                            {editingLeaveTypeId
                              ? "Update Leave Type"
                              : "Add Leave Type"}
                          </Button>
                          {editingLeaveTypeId && (
                            <Button
                              variant="outlined"
                              onClick={resetLeaveTypeForm}
                              sx={{
                                borderColor: "var(--primary-color-1)",
                                color: "var(--primary-color-1)",
                                textTransform: "none",
                                px: 3,
                                py: 1.2,
                                borderRadius: 1,
                                "&:hover": {
                                  borderColor: "var(--primary-color-2)",
                                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                                },
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  </Grid>
                  <Grid item xs={12} lg={7}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      mb={2}
                      sx={{ color: "var(--primary-color-1)" }}
                    >
                      Existing Leave Types ({types.length})
                    </Typography>
                    <Stack spacing={2}>
                      {types.map((type) => {
                        const isSystemType =
                          type.name === "Unpaid Leave" ||
                          type.name === "Paid Leave";
                        return (
                          <Card
                            key={type.id}
                            sx={{
                              borderRadius: 2,
                              border: "1px solid rgba(0,0,0,0.08)",
                              background: "white",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                borderColor: "var(--primary-color-1)",
                              },
                            }}
                          >
                            <CardContent>
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="space-between"
                                spacing={2}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        backgroundColor:
                                          type.color || "#0798bd",
                                      }}
                                    />
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={600}
                                    >
                                      {type.name}
                                    </Typography>
                                    {!type.is_active && (
                                      <Chip
                                        label="Archived"
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.65rem",
                                          backgroundColor: "#fec90f",
                                          color: "white",
                                        }}
                                      />
                                    )}
                                    {isSystemType && (
                                      <Chip
                                        label="System"
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.65rem",
                                          backgroundColor:
                                            "var(--primary-color-1)",
                                          color: "white",
                                        }}
                                      />
                                    )}
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1.5}
                                  >
                                    {type.description ||
                                      "No description provided"}
                                  </Typography>
                                  <Stack direction="row" spacing={1}>
                                    <Chip
                                      label={type.is_paid ? "Paid" : "Unpaid"}
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: "0.7rem",
                                        backgroundColor: type.is_paid
                                          ? "rgba(7, 152, 189, 0.1)"
                                          : "rgba(0,0,0,0.08)",
                                        color: type.is_paid
                                          ? "var(--primary-color-1)"
                                          : "rgba(0,0,0,0.6)",
                                        fontWeight: 600,
                                      }}
                                    />
                                    <Chip
                                      label={
                                        type.allow_half_day
                                          ? "Half-day allowed"
                                          : "Full-day only"
                                      }
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: "0.7rem",
                                        backgroundColor: type.allow_half_day
                                          ? "rgba(0, 194, 146, 0.1)"
                                          : "rgba(0,0,0,0.08)",
                                        color: type.allow_half_day
                                          ? "#00c292"
                                          : "rgba(0,0,0,0.6)",
                                        fontWeight: 600,
                                      }}
                                    />
                                  </Stack>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleEditLeaveType(type)}
                                    disabled={type.name === "Unpaid Leave"}
                                    sx={{
                                      borderColor: "var(--primary-color-1)",
                                      color: "var(--primary-color-1)",
                                      textTransform: "none",
                                      fontSize: "0.75rem",
                                      minWidth: 70,
                                      "&:hover": {
                                        borderColor: "var(--primary-color-2)",
                                        backgroundColor:
                                          "rgba(7, 152, 189, 0.08)",
                                      },
                                      "&.Mui-disabled": {
                                        borderColor: "rgba(0, 0, 0, 0.26)",
                                        color: "rgba(0, 0, 0, 0.26)",
                                      },
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleDeleteLeaveType(type)}
                                    sx={{
                                      borderColor: "#e46a76",
                                      color: "#e46a76",
                                      textTransform: "none",
                                      fontSize: "0.75rem",
                                      minWidth: 70,
                                      "&:hover": {
                                        borderColor: "#e45a68",
                                        backgroundColor:
                                          "rgba(228, 106, 118, 0.08)",
                                      },
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {!types.length && (
                        <Card
                          sx={{
                            p: 4,
                            textAlign: "center",
                            border: "2px dashed rgba(0,0,0,0.12)",
                            background: "rgba(0,0,0,0.02)",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No leave types defined yet. Create your first leave
                            type to get started.
                          </Typography>
                        </Card>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "var(--card-bg-color)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, var(--primary-color-2) 0%, #e07b00 100%)`,
                  p: 3,
                  color: "white",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 28, fontWeight: 700 }}>
                      📋
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Leave Policies
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Configure leave allowances, accrual rules, and approval
                      settings
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "rgba(255, 135, 0, 0.04)",
                    border: "1px solid rgba(255, 135, 0, 0.1)",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    mb={2.5}
                    sx={{ color: "var(--primary-color-2)" }}
                  >
                    {editingPolicyId ? "Edit Policy" : "Create New Policy"}
                  </Typography>

                  {/* Step 1: Select Leave Type */}
                  <Box mb={3}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      mb={1.5}
                      sx={{ color: "var(--primary-color-2)" }}
                    >
                      Step 1: Select Leave Type
                    </Typography>
                    <TextField
                      select
                      label="Leave Type"
                      value={policyForm.leave_type_id}
                      disabled={!!editingPolicyId}
                      onChange={(e) => {
                        const value = e.target.value;
                        const existing = policies.find(
                          (policy) => policy.leave_type?.id === value
                        );
                        const baseRoleAllowances: PolicyFormState["roleAllowances"] =
                          roles.reduce((acc, role) => {
                            acc[role.id] = {
                              allowance: "",
                              carry_forward_limit: "",
                              auto_approve: false,
                            };
                            return acc;
                          }, {} as PolicyFormState["roleAllowances"]);
                        const roleAllowancesFromPolicy =
                          existing?.metadata?.role_allowances || [];
                        roleAllowancesFromPolicy.forEach((entry: any) => {
                          if (
                            entry?.role_id &&
                            baseRoleAllowances[entry.role_id]
                          ) {
                            baseRoleAllowances[entry.role_id] = {
                              allowance:
                                entry.allowance !== undefined
                                  ? String(entry.allowance)
                                  : "",
                              carry_forward_limit:
                                entry.carry_forward_limit !== undefined &&
                                entry.carry_forward_limit !== null
                                  ? String(entry.carry_forward_limit)
                                  : "",
                              auto_approve: Boolean(entry.auto_approve),
                            };
                          }
                        });
                        setEditingPolicyId(existing?.id ?? null);
                        setPolicyForm({
                          leave_type_id: value,
                          accrual_frequency:
                            existing?.accrual_frequency ??
                            POLICY_DEFAULTS.accrual_frequency,
                          allowance_per_period:
                            existing?.allowance_per_period ??
                            POLICY_DEFAULTS.allowance_per_period,
                          carry_forward_enabled:
                            existing?.carry_forward_enabled ??
                            POLICY_DEFAULTS.carry_forward_enabled,
                          carry_forward_limit:
                            existing?.carry_forward_limit ??
                            POLICY_DEFAULTS.carry_forward_limit,
                          auto_approve:
                            existing?.auto_approve ??
                            POLICY_DEFAULTS.auto_approve,
                          max_balance:
                            existing?.max_balance ??
                            POLICY_DEFAULTS.max_balance,
                          roleAllowances: baseRoleAllowances,
                        });
                      }}
                      fullWidth
                      helperText="Choose the leave type to configure a policy for"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Select leave type</em>
                      </MenuItem>
                      {types
                        .filter((type) => type.is_active)
                        .map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Box>

                  {policyForm.leave_type_id && (
                    <>
                      {/* Step 2: General Policy Settings */}
                      <Box mb={3}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          mb={1.5}
                          sx={{ color: "var(--primary-color-2)" }}
                        >
                          Step 2: General Policy Settings
                        </Typography>
                        <Grid container spacing={2.5}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              select
                              label="Accrual Frequency"
                              value={policyForm.accrual_frequency}
                              onChange={(e) =>
                                setPolicyForm((prev) => ({
                                  ...prev,
                                  accrual_frequency: e.target
                                    .value as PolicyFormState["accrual_frequency"],
                                }))
                              }
                              fullWidth
                              helperText="How often leave is accrued"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                },
                              }}
                            >
                              <MenuItem value="MONTHLY">Monthly</MenuItem>
                              <MenuItem value="YEARLY">Yearly</MenuItem>
                              <MenuItem value="NONE">
                                Manual (No automatic accrual)
                              </MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              type="number"
                              label="Allowance per Period (days)"
                              value={policyForm.allowance_per_period}
                              onChange={(e) =>
                                setPolicyForm((prev) => ({
                                  ...prev,
                                  allowance_per_period:
                                    Number(e.target.value) || 0,
                                }))
                              }
                              fullWidth
                              inputProps={{ min: 0, step: 0.5 }}
                              helperText="Days earned per accrual period"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                background: "white",
                                border: "1px solid rgba(0,0,0,0.08)",
                                height: "100%",
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={policyForm.carry_forward_enabled ? 2 : 0}
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    Carry Forward
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Allow unused leave to carry to next period
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={policyForm.carry_forward_enabled}
                                  sx={{
                                    "& .MuiSwitch-switchBase.Mui-checked": {
                                      color: "var(--primary-color-2)",
                                    },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                      {
                                        backgroundColor:
                                          "var(--primary-color-2)",
                                      },
                                  }}
                                  onChange={(_, checked) =>
                                    setPolicyForm((prev) => ({
                                      ...prev,
                                      carry_forward_enabled: checked,
                                    }))
                                  }
                                />
                              </Stack>
                              {policyForm.carry_forward_enabled && (
                                <TextField
                                  type="number"
                                  label="Carry Forward Limit (days)"
                                  value={policyForm.carry_forward_limit ?? ""}
                                  onChange={(e) =>
                                    setPolicyForm((prev) => ({
                                      ...prev,
                                      carry_forward_limit: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    }))
                                  }
                                  fullWidth
                                  size="small"
                                  inputProps={{ min: 0 }}
                                  helperText="Maximum days that can be carried forward"
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 1,
                                    },
                                  }}
                                />
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                background: "white",
                                border: "1px solid rgba(0,0,0,0.08)",
                                height: "100%",
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    Auto Approve
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Automatically approve leave requests
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={policyForm.auto_approve}
                                  sx={{
                                    "& .MuiSwitch-switchBase.Mui-checked": {
                                      color: "var(--primary-color-2)",
                                    },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                      {
                                        backgroundColor:
                                          "var(--primary-color-2)",
                                      },
                                  }}
                                  onChange={(_, checked) =>
                                    setPolicyForm((prev) => ({
                                      ...prev,
                                      auto_approve: checked,
                                    }))
                                  }
                                />
                              </Stack>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                background: "white",
                                border: "1px solid rgba(0,0,0,0.08)",
                                height: "100%",
                              }}
                            >
                              <Stack spacing={1.5}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      Maximum Balance
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Cap on total leave balance
                                    </Typography>
                                  </Box>
                                  <Switch
                                    checked={
                                      policyForm.max_balance === null ||
                                      policyForm.max_balance === undefined
                                    }
                                    sx={{
                                      "& .MuiSwitch-switchBase.Mui-checked": {
                                        color: "var(--primary-color-2)",
                                      },
                                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                        {
                                          backgroundColor:
                                            "var(--primary-color-2)",
                                        },
                                    }}
                                    onChange={(_, checked) =>
                                      setPolicyForm((prev) => ({
                                        ...prev,
                                        max_balance: checked ? null : 0,
                                      }))
                                    }
                                  />
                                </Stack>
                                {policyForm.max_balance !== null &&
                                  policyForm.max_balance !== undefined && (
                                    <TextField
                                      type="number"
                                      label="Max Balance (days)"
                                      value={policyForm.max_balance ?? ""}
                                      onChange={(e) =>
                                        setPolicyForm((prev) => ({
                                          ...prev,
                                          max_balance: e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        }))
                                      }
                                      fullWidth
                                      size="small"
                                      inputProps={{ min: 0 }}
                                      helperText="Leave blank or toggle above for unlimited"
                                      sx={{
                                        "& .MuiOutlinedInput-root": {
                                          borderRadius: 1,
                                        },
                                      }}
                                    />
                                  )}
                                {policyForm.max_balance === null ||
                                policyForm.max_balance === undefined ? (
                                  <Typography
                                    variant="caption"
                                    color="success.main"
                                    fontWeight={600}
                                  >
                                    ✓ Unlimited balance
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      {/* Step 3: Role-Specific Allowances (Optional) */}
                      {isAdmin && roles.length > 0 && (
                        <Box mb={3}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            mb={1.5}
                            sx={{ color: "var(--primary-color-2)" }}
                          >
                            Step 3: Role-Specific Allowances (Optional)
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            mb={2}
                            display="block"
                          >
                            Override general settings for specific roles. Leave
                            empty to use general policy settings.
                          </Typography>
                          <Grid container spacing={2.5}>
                            {roles.map((role) => {
                              const roleValues =
                                policyForm.roleAllowances[role.id];
                              return (
                                <Grid item xs={12} sm={6} md={4} key={role.id}>
                                  <Card
                                    sx={{
                                      borderRadius: 2,
                                      border: "1px solid rgba(0,0,0,0.08)",
                                      background: "white",
                                      transition: "all 0.3s ease",
                                      "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow:
                                          "0 4px 12px rgba(0,0,0,0.12)",
                                        borderColor: "var(--primary-color-2)",
                                      },
                                      height: "100%",
                                    }}
                                  >
                                    <CardContent>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        mb={2}
                                        sx={{ color: "var(--primary-color-1)" }}
                                      >
                                        {role.name}
                                      </Typography>
                                      <Stack spacing={2}>
                                        <TextField
                                          type="number"
                                          label="Allowance (days/month)"
                                          value={roleValues?.allowance ?? ""}
                                          onChange={(e) =>
                                            setPolicyForm((prev) => ({
                                              ...prev,
                                              roleAllowances: {
                                                ...prev.roleAllowances,
                                                [role.id]: {
                                                  ...prev.roleAllowances[
                                                    role.id
                                                  ],
                                                  allowance: e.target.value,
                                                },
                                              },
                                            }))
                                          }
                                          fullWidth
                                          size="small"
                                          inputProps={{ min: 0, step: 0.5 }}
                                          helperText="Leave empty to use general policy"
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              borderRadius: 1,
                                            },
                                          }}
                                        />
                                        <TextField
                                          type="number"
                                          label="Carry Forward Limit (days)"
                                          value={
                                            roleValues?.carry_forward_limit ??
                                            ""
                                          }
                                          onChange={(e) =>
                                            setPolicyForm((prev) => ({
                                              ...prev,
                                              roleAllowances: {
                                                ...prev.roleAllowances,
                                                [role.id]: {
                                                  ...prev.roleAllowances[
                                                    role.id
                                                  ],
                                                  carry_forward_limit:
                                                    e.target.value,
                                                },
                                              },
                                            }))
                                          }
                                          fullWidth
                                          size="small"
                                          inputProps={{ min: 0 }}
                                          helperText="Leave empty to use general policy"
                                          sx={{
                                            "& .MuiOutlinedInput-root": {
                                              borderRadius: 1,
                                            },
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            p: 1.5,
                                            borderRadius: 1,
                                            background: "rgba(0,0,0,0.02)",
                                          }}
                                        >
                                          <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                          >
                                            <Box>
                                              <Typography
                                                variant="caption"
                                                fontWeight={600}
                                              >
                                                Auto Approve
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                              >
                                                Override general setting
                                              </Typography>
                                            </Box>
                                            <Switch
                                              size="small"
                                              checked={
                                                roleValues?.auto_approve ??
                                                false
                                              }
                                              sx={{
                                                "& .MuiSwitch-switchBase.Mui-checked":
                                                  {
                                                    color: "#00c292",
                                                  },
                                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                                  {
                                                    backgroundColor: "#00c292",
                                                  },
                                              }}
                                              onChange={(_, checked) =>
                                                setPolicyForm((prev) => ({
                                                  ...prev,
                                                  roleAllowances: {
                                                    ...prev.roleAllowances,
                                                    [role.id]: {
                                                      ...prev.roleAllowances[
                                                        role.id
                                                      ],
                                                      auto_approve: checked,
                                                    },
                                                  },
                                                }))
                                              }
                                            />
                                          </Stack>
                                        </Box>
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}

                      {/* Save Button */}
                      <Box>
                        <Stack direction="row" spacing={1.5} pt={1}>
                          <Button
                            variant="contained"
                            onClick={handlePolicySave}
                            disabled={
                              actionLoading || !policyForm.leave_type_id
                            }
                            sx={{
                              backgroundColor: "var(--primary-color-2)",
                              color: "white",
                              textTransform: "none",
                              px: 3,
                              py: 1.2,
                              borderRadius: 1,
                              "&:hover": {
                                backgroundColor: "#e07b00",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(255, 135, 0, 0.3)",
                              },
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(0, 0, 0, 0.12)",
                                color: "rgba(0, 0, 0, 0.26)",
                              },
                            }}
                          >
                            {editingPolicyId
                              ? "Update Policy"
                              : "Create Policy"}
                          </Button>
                          {editingPolicyId && (
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setEditingPolicyId(null);
                                setPolicyForm(createDefaultPolicyForm());
                              }}
                              sx={{
                                borderColor: "var(--primary-color-2)",
                                color: "var(--primary-color-2)",
                                textTransform: "none",
                                px: 3,
                                py: 1.2,
                                borderRadius: 1,
                                "&:hover": {
                                  borderColor: "#e07b00",
                                  backgroundColor: "rgba(255, 135, 0, 0.08)",
                                },
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Centralized Policy File Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "rgba(7, 152, 189, 0.04)",
                    border: "1px solid rgba(7, 152, 189, 0.1)",
                    mb: 3,
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        mb={0.5}
                        sx={{ color: "var(--primary-color-1)" }}
                      >
                        Leave Policy Document
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload a centralized policy document that covers all
                        leave policies. This document will be visible to all
                        employees.
                      </Typography>
                    </Box>
                    {centralizedPolicyFile ? (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          background: "white",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{ flex: 1 }}
                          >
                            <AttachFileIcon
                              sx={{ color: "var(--primary-color-1)" }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {centralizedPolicyFile.fileName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Uploaded on{" "}
                                {new Date(
                                  centralizedPolicyFile.uploadedAt
                                ).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View File">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  window.open(
                                    centralizedPolicyFile.url,
                                    "_blank"
                                  )
                                }
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Remove File">
                                <IconButton
                                  size="small"
                                  onClick={handleRemoveCentralizedPolicyFile}
                                  color="error"
                                  disabled={actionLoading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          background: "white",
                          border: "2px dashed rgba(0,0,0,0.12)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={2}
                        >
                          No policy document uploaded yet
                        </Typography>
                        {isAdmin && (
                          <label>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadCentralizedPolicyFile(file);
                                }
                                e.target.value = "";
                              }}
                            />
                            <Button
                              variant="outlined"
                              startIcon={<UploadFileIcon />}
                              component="span"
                              disabled={actionLoading}
                              sx={{
                                borderColor: "var(--primary-color-1)",
                                color: "var(--primary-color-1)",
                                textTransform: "none",
                                "&:hover": {
                                  borderColor: "var(--primary-color-2)",
                                  backgroundColor: "rgba(7, 152, 189, 0.08)",
                                },
                              }}
                            >
                              Upload Policy Document
                            </Button>
                          </label>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    mb={0.5}
                    sx={{ color: "var(--primary-color-2)" }}
                  >
                    Existing Policies ({policies.length})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage and edit existing leave policies
                  </Typography>
                </Box>
                <Grid container spacing={2.5}>
                  {policies.map((policy) => (
                    <Grid item xs={12} md={6} key={policy.id}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: "1px solid rgba(0,0,0,0.08)",
                          background: "white",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                            borderColor: "var(--primary-color-2)",
                          },
                        }}
                      >
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                            mb={2}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                mb={1}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor:
                                      policy.leave_type?.color || "#FF8700",
                                  }}
                                />
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={600}
                                >
                                  {policy.leave_type?.name}
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: "var(--primary-color-1)",
                                  color: "var(--primary-color-1)",
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  minWidth: 70,
                                  "&:hover": {
                                    borderColor: "var(--primary-color-2)",
                                    backgroundColor: "rgba(7, 152, 189, 0.08)",
                                  },
                                }}
                                onClick={() => {
                                  const baseRoleAllowances: PolicyFormState["roleAllowances"] =
                                    roles.reduce((acc, role) => {
                                      acc[role.id] = {
                                        allowance: "",
                                        carry_forward_limit: "",
                                        auto_approve: false,
                                      };
                                      return acc;
                                    }, {} as PolicyFormState["roleAllowances"]);
                                  (
                                    policy.metadata?.role_allowances || []
                                  ).forEach((entry: any) => {
                                    if (
                                      entry?.role_id &&
                                      baseRoleAllowances[entry.role_id]
                                    ) {
                                      baseRoleAllowances[entry.role_id] = {
                                        allowance:
                                          entry.allowance !== undefined
                                            ? String(entry.allowance)
                                            : "",
                                        carry_forward_limit:
                                          entry.carry_forward_limit !==
                                            undefined &&
                                          entry.carry_forward_limit !== null
                                            ? String(entry.carry_forward_limit)
                                            : "",
                                        auto_approve: Boolean(
                                          entry.auto_approve
                                        ),
                                      };
                                    }
                                  });
                                  setEditingPolicyId(policy.id);
                                  setPolicyForm({
                                    leave_type_id: policy.leave_type?.id || "",
                                    accrual_frequency: policy.accrual_frequency,
                                    allowance_per_period:
                                      policy.allowance_per_period,
                                    carry_forward_enabled:
                                      policy.carry_forward_enabled,
                                    carry_forward_limit:
                                      policy.carry_forward_limit ?? null,
                                    auto_approve: policy.auto_approve,
                                    max_balance: policy.max_balance ?? null,
                                    roleAllowances: baseRoleAllowances,
                                  });
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: "#e46a76",
                                  color: "#e46a76",
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  minWidth: 70,
                                  "&:hover": {
                                    borderColor: "#e45a68",
                                    backgroundColor:
                                      "rgba(228, 106, 118, 0.08)",
                                  },
                                }}
                                onClick={() => handleDeletePolicy(policy.id)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Stack>
                          <Grid
                            container
                            spacing={1.5}
                            mt={2}
                            sx={{ width: "100%" }}
                          >
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  background: "rgba(7, 152, 189, 0.06)",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Accrual
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: "var(--primary-color-1)" }}
                                >
                                  {policy.accrual_frequency}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  background: "rgba(255, 135, 0, 0.06)",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Allowance
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: "var(--primary-color-2)" }}
                                >
                                  {policy.allowance_per_period} days
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  background: policy.carry_forward_enabled
                                    ? "rgba(0, 194, 146, 0.06)"
                                    : "rgba(0,0,0,0.04)",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Carry Forward
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    color: policy.carry_forward_enabled
                                      ? "#00c292"
                                      : "rgba(0,0,0,0.6)",
                                  }}
                                >
                                  {policy.carry_forward_enabled
                                    ? `Yes${
                                        policy.carry_forward_limit
                                          ? ` (max ${policy.carry_forward_limit})`
                                          : ""
                                      }`
                                    : "No"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  background: policy.auto_approve
                                    ? "rgba(0, 194, 146, 0.06)"
                                    : "rgba(0,0,0,0.04)",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Auto Approve
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    color: policy.auto_approve
                                      ? "#00c292"
                                      : "rgba(0,0,0,0.6)",
                                  }}
                                >
                                  {policy.auto_approve ? "Yes" : "No"}
                                </Typography>
                              </Box>
                            </Grid>
                            {policy.max_balance && (
                              <Grid item xs={12}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    background: "rgba(0,0,0,0.04)",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    Max Balance
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {policy.max_balance} days
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                          {policy.metadata?.role_allowances &&
                            policy.metadata.role_allowances.length > 0 && (
                              <Stack spacing={0.5} mt={1}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                >
                                  Role overrides
                                </Typography>
                                {policy.metadata.role_allowances.map(
                                  (entry: any) => {
                                    const roleLabel =
                                      roles.find(
                                        (role) => role.id === entry.role_id
                                      )?.name || "Role";
                                    return (
                                      <Typography
                                        key={`${policy.id}-${entry.role_id}`}
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {roleLabel}: {entry.allowance ?? "—"}{" "}
                                        d/mo • Carry limit:{" "}
                                        {entry.carry_forward_limit ?? "—"} •
                                        Auto approve:{" "}
                                        {entry.auto_approve ? "Yes" : "No"}
                                      </Typography>
                                    );
                                  }
                                )}
                              </Stack>
                            )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {!policies.length && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        No policies defined yet.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

          </Stack>
        )}
      </Box>

      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: "0 15px 45px rgba(15,23,42,0.15)",
          },
              }}
            >
        <DialogTitle
                sx={{
                      display: "flex",
                      alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
            pb: 1,
          }}
        >
          Leave Request Details
          <IconButton onClick={handleCloseDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent
                    sx={{
            pt: 3,
            pb: 1,
                    }}
        >
          {detailsRequest && (
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                          sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "var(--primary-color-1)",
                    fontWeight: 700,
                          }}
                        >
                  {`${detailsRequest.user.first_name?.[0] ?? ""}${
                    detailsRequest.user.last_name?.[0] ?? ""
                  }` || detailsRequest.user.email?.[0] || "?"}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {`${detailsRequest.user.first_name ?? ""} ${
                      detailsRequest.user.last_name ?? ""
                    }`.trim() || detailsRequest.user.email}
                                </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detailsRequest.user.email}
                                </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                                  <Chip
                      label={detailsRequest.status}
                      color={
                        statusColorMap[
                          detailsRequest.status
                        ] as "default" | "success" | "error" | "warning" | "info"
                      }
                                    size="small"
                      sx={{ fontWeight: 600 }}
                                  />
                    {detailsRequest.leave_type?.name && (
                      <Chip
                        label={detailsRequest.leave_type.name}
                        variant="outlined"
                        size="small"
                      />
                    )}
                              </Stack>
                      </Box>
                  </Stack>

              <Grid container spacing={2} justifyContent="space-between">
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Date Range
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDateRange(
                      detailsRequest.start_date,
                      detailsRequest.end_date
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {detailsRequest.duration_type === "HALF_DAY"
                      ? `Half Day • ${
                          halfDayLabels[
                            detailsRequest.half_day_session || "FIRST_HALF"
                          ]
                        }`
                      : `${detailsRequest.total_days} day(s)`}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Inform
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatInformUsers(detailsRequest.inform_user_ids)}
                </Typography>
              </Box>

              {detailsRequest.reason && (
                <Box
                              sx={{
                    backgroundColor: "rgba(15,23,42,0.02)",
                                borderRadius: 2,
                    p: 2,
                    border: "1px solid rgba(15,23,42,0.04)",
                              }}
                            >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
                                    >
                    Reason
                                    </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {detailsRequest.reason}
                  }</Typography>
                                  </Box>
              )}
          </Stack>
        )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            sx={{
              backgroundColor: "var(--primary-color-1)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          Apply for Leave
          <IconButton
            onClick={() => setApplyDialogOpen(false)}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            px: 3,
            mt: 2,
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(0,0,0,0.05)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.3)",
              },
            },
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              select
              label="Leave Type"
              value={applyForm.leave_type_id}
              onChange={(e) => {
                const selectedType = types.find(
                  (type) => type.id === e.target.value
                );
                setApplyForm((prev) => ({
                  ...prev,
                  leave_type_id: e.target.value,
                  // Auto-set duration_type to FULL_DAY for Short Leave
                  duration_type:
                    selectedType?.name === "Short Leave"
                      ? "FULL_DAY"
                      : prev.duration_type,
                }));
              }}
              fullWidth
            >
              <MenuItem value="">
                <em>Select leave type</em>
              </MenuItem>
              {leaveTypeOptions.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <DatePicker
                label="Start date"
                value={applyForm.startDate}
                onChange={(value) => {
                  const selectedLeaveType = types.find(
                    (type) => type.id === applyForm.leave_type_id
                  );
                  setApplyForm((prev) => ({
                    ...prev,
                    startDate: value,
                    endDate:
                      prev.duration_type === "HALF_DAY" ||
                      selectedLeaveType?.name === "Short Leave"
                        ? value ?? prev.endDate
                        : prev.endDate,
                  }));
                }}
                shouldDisableDate={(date) => {
                  const day = date.day();
                  return day === 0 || day === 6; // Disable weekends (0 = Sunday, 6 = Saturday)
                }}
                minDate={dayjs()}
                sx={{ width: "100%" }}
              />
              <DatePicker
                label="End date"
                value={applyForm.endDate}
                onChange={(value) =>
                  setApplyForm((prev) => ({
                    ...prev,
                    endDate: value,
                  }))
                }
                disabled={
                  applyForm.duration_type === "HALF_DAY" ||
                  types.find((type) => type.id === applyForm.leave_type_id)
                    ?.name === "Short Leave"
                }
                shouldDisableDate={(date) => {
                  const day = date.day();
                  return day === 0 || day === 6; // Disable weekends
                }}
                minDate={applyForm.startDate || dayjs()}
                sx={{ width: "100%" }}
              />
            </Stack>
            {(() => {
              const selectedLeaveType = types.find(
                (type) => type.id === applyForm.leave_type_id
              );
              const isShortLeave = selectedLeaveType?.name === "Short Leave";

              return (
                <>
                  {!isShortLeave && (
                    <TextField
                      select
                      label="Duration"
                      value={applyForm.duration_type}
                      onChange={(e) =>
                        setApplyForm((prev) => ({
                          ...prev,
                          duration_type: e.target.value as
                            | "FULL_DAY"
                            | "HALF_DAY",
                          endDate:
                            e.target.value === "HALF_DAY"
                              ? prev.startDate
                              : prev.endDate,
                          halfDaySession:
                            e.target.value === "HALF_DAY"
                              ? prev.halfDaySession || "FIRST_HALF"
                              : "FIRST_HALF",
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="FULL_DAY">Full day(s)</MenuItem>
                      <MenuItem value="HALF_DAY">Half day</MenuItem>
                    </TextField>
                  )}
                  {applyForm.duration_type === "HALF_DAY" && !isShortLeave && (
                    <TextField
                      select
                      label="Half-day session"
                      value={applyForm.halfDaySession}
                      onChange={(e) =>
                        setApplyForm((prev) => ({
                          ...prev,
                          halfDaySession: e.target.value as
                            | "FIRST_HALF"
                            | "SECOND_HALF",
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="FIRST_HALF">First half (AM)</MenuItem>
                      <MenuItem value="SECOND_HALF">Second half (PM)</MenuItem>
                    </TextField>
                  )}
                  {isShortLeave && (
                    <Stack spacing={2}>
                      <TextField
                        type="number"
                        label="Duration (minutes)"
                        value={applyForm.shortLeaveMinutes}
                        onChange={(e) =>
                          setApplyForm((prev) => ({
                            ...prev,
                            shortLeaveMinutes: Number(e.target.value) || 30,
                          }))
                        }
                        inputProps={{ min: 15, max: 240, step: 15 }}
                        helperText="Minimum 15 minutes, maximum 240 minutes (4 hours)"
                        fullWidth
                      />
                      <TextField
                        select
                        label="Time Period"
                        value={applyForm.shortLeaveTimePeriod}
                        onChange={(e) =>
                          setApplyForm((prev) => ({
                            ...prev,
                            shortLeaveTimePeriod: e.target.value as
                              | "EARLY"
                              | "MIDDLE"
                              | "LATE",
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="EARLY">Early (9 AM - 12 PM)</MenuItem>
                        <MenuItem value="MIDDLE">
                          Middle (12 PM - 3 PM)
                        </MenuItem>
                        <MenuItem value="LATE">Late (3 PM - 7 PM)</MenuItem>
                      </TextField>
                    </Stack>
                  )}
                </>
              );
            })()}
            {applyForm.leave_type_id &&
              applyForm.startDate &&
              applyForm.endDate && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "rgba(7, 152, 189, 0.08)",
                    border: "1px solid rgba(7, 152, 189, 0.2)",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Leave Balance Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This request will use:{" "}
                      <strong>{previewDays.toFixed(2)} day(s)</strong>
                    </Typography>
                    {availableBalance !== null &&
                      availableBalance !== Infinity && (
                        <Typography
                          variant="body2"
                          color={
                            availableBalance >= previewDays
                              ? "success.main"
                              : "error.main"
                          }
                          fontWeight={600}
                        >
                          Available balance: {availableBalance.toFixed(2)}{" "}
                          day(s)
                          {availableBalance < previewDays && (
                            <span> (Insufficient balance)</span>
                          )}
                        </Typography>
                      )}
                    {availableBalance === Infinity && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight={600}
                      >
                        Unlimited leave (unpaid)
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            <TextField
              label="Reason (optional)"
              multiline
              minRows={3}
              value={applyForm.reason}
              onChange={(e) =>
                setApplyForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              fullWidth
            />
            <Autocomplete
              multiple
              options={selectableUsers}
              getOptionLabel={(option) =>
                `${option.first_name || ""} ${option.last_name || ""}`.trim() ||
                option.email ||
                ""
              }
              value={selectableUsers.filter((user) =>
                applyForm.inform_user_ids.includes(user.id)
              )}
              onChange={(_, value) =>
                setApplyForm((prev) => ({
                  ...prev,
                  inform_user_ids: value.map((user) => user.id),
                }))
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={
                      `${option.first_name || ""} ${
                        option.last_name || ""
                      }`.trim() || option.email
                    }
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Inform (optional)"
                  placeholder="Notify colleagues"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid rgba(0,0,0,0.08)",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={() => setApplyDialogOpen(false)}
            sx={{
              color: "var(--primary-color-1)",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={actionLoading}
            sx={{
              backgroundColor: "var(--primary-color-1)",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "var(--primary-color-1-hover)",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(0, 0, 0, 0.12)",
                color: "rgba(0, 0, 0, 0.26)",
              },
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default LeaveManagement;
