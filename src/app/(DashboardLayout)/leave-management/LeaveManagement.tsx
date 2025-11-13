"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Autocomplete,
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
  Grid,
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
  approver_id: string;
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
  approverLabel: string;
  informLabel: string;
};

type TeamRequestRow = GridValidRowModel & {
  id: string;
  employee: string;
  type: string;
  dateRange: string;
  durationLabel: string;
  status: LeaveRequest["status"];
  approverLabel: string;
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
  const isManager = rolePriority <= 3;

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
  const [leaveApprovers, setLeaveApprovers] = useState<UserOption[]>([]);
  const [allUsersForApprover, setAllUsersForApprover] = useState<
    (UserOption & {
      can_approve_leaves?: boolean;
      designation?: string;
      department?: string;
    })[]
  >([]);

  const isCurrentUserLeaveApprover = useMemo(() => {
    if (!userInfo?.id) return false;
    return leaveApprovers.some((user) => user.id === userInfo.id);
  }, [leaveApprovers, userInfo?.id]);

  const tabs = useMemo(() => {
    const base = [{ key: "my", label: "My Leaves" }];
    if (isManager || isCurrentUserLeaveApprover) {
      base.push({ key: "team", label: "Team Requests" });
    }
    if (isAdmin) {
      base.push({ key: "settings", label: "Settings" });
    }
    return base;
  }, [isAdmin, isManager, isCurrentUserLeaveApprover]);
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
    approver_id: "",
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

  const fetchLeaveApprovers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axiosInstance.get("/leave-management/approvers");
      const list: UserOption[] = (res.data?.data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));
      setLeaveApprovers(list);
    } catch (error: any) {
      console.error("Failed to fetch leave approvers:", error);
    }
  }, [axiosInstance, isAdmin]);

  const fetchAllUsersForApprover = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axiosInstance.get("/leave-management/approvers/users");
      const list = (res.data?.data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        can_approve_leaves: user.can_approve_leaves || false,
        designation: user.designation,
        department: user.department,
      }));
      setAllUsersForApprover(list);
    } catch (error: any) {
      console.error("Failed to fetch users for approver management:", error);
    }
  }, [axiosInstance, isAdmin]);

  const handleToggleLeaveApprover = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/leave-management/approvers/${userId}`, {
        can_approve_leaves: !currentStatus,
      });
      toast.success(
        !currentStatus
          ? "User granted leave approval power."
          : "User's leave approval power removed."
      );
      await Promise.all([fetchLeaveApprovers(), fetchAllUsersForApprover()]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update leave approver status."
      );
    } finally {
      setActionLoading(false);
    }
  };

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

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLeaveTypes(),
        fetchPolicies(),
        fetchBalances(),
        fetchMyRequests("my"),
        fetchUsersList(),
        fetchRolesList(),
        ...(isAdmin ? [fetchLeaveApprovers(), fetchAllUsersForApprover()] : []),
      ]);

      // Fetch team requests after initial data is loaded
      if (isManager) {
        await fetchMyRequests(isAdmin ? "all" : "team");
      }
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
    fetchLeaveApprovers,
    fetchAllUsersForApprover,
    isManager,
    isAdmin,
  ]);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Fetch team requests when user becomes a leave approver (only for non-managers, non-admins)
  useEffect(() => {
    if (
      isCurrentUserLeaveApprover &&
      !isManager &&
      !isAdmin &&
      !loading &&
      leaveApprovers.length > 0
    ) {
      fetchMyRequests("team");
    }
  }, [
    isCurrentUserLeaveApprover,
    isManager,
    isAdmin,
    loading,
    leaveApprovers.length,
    fetchMyRequests,
  ]);

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
      approver_id: "",
      inform_user_ids: [],
      halfDaySession: "FIRST_HALF",
      shortLeaveMinutes: 30,
      shortLeaveTimePeriod: "MIDDLE",
    });
    setApplyDialogOpen(true);
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
      approver_id: applyForm.approver_id || undefined,
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
      if (isManager) {
        await fetchMyRequests(isAdmin ? "all" : "team");
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
      if (isManager) {
        await fetchMyRequests(isAdmin ? "all" : "team");
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
      await Promise.all([
        fetchBalances(),
        fetchMyRequests("my"),
        fetchMyRequests(isAdmin ? "all" : "team"),
      ]);
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
      if (isManager) {
        await fetchMyRequests(isAdmin ? "all" : "team");
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
        approverLabel: req.preferred_approver
          ? `${req.preferred_approver.first_name || ""} ${
              req.preferred_approver.last_name || ""
            }`.trim() ||
            req.preferred_approver.email ||
            "Administrator"
          : "Administrator",
        informLabel: formatInformUsers(req.inform_user_ids),
      })),
    [myRequests, formatInformUsers, formatDateRange]
  );

  const teamRows = useMemo<TeamRequestRow[]>(
    () =>
      teamRequests.map((req) => {
        const approverLabel = req.preferred_approver
          ? `${req.preferred_approver.first_name || ""} ${
              req.preferred_approver.last_name || ""
            }`.trim() ||
            req.preferred_approver.email ||
            "Administrator"
          : "Administrator";
        const userLabel =
          `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim() ||
          req.user?.email ||
          "-";
        const approverId = req.preferred_approver?.id ?? null;
        const currentUserId = userInfo?.id;
        const requesterIsLeaveApprover = allUsersForApprover.some(
          (user) => user.id === req.user?.id && user.can_approve_leaves
        );
        // Can act if:
        // 1. User is admin, OR
        // 2. User is leave approver AND requester is NOT a leave approver AND not their own request, OR
        // 3. User is the preferred approver
        const canAct =
          isAdmin ||
          (isCurrentUserLeaveApprover &&
            !requesterIsLeaveApprover &&
            req.user?.id !== currentUserId) ||
          (!!approverId && currentUserId && approverId === currentUserId);
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
          approverLabel,
          informLabel: formatInformUsers(req.inform_user_ids),
          canAct,
          reviewedAt: req.reviewed_at ?? null,
        };
      }),
    [
      teamRequests,
      userInfo?.id,
      isAdmin,
      isCurrentUserLeaveApprover,
      allUsersForApprover,
      formatInformUsers,
      formatDateRange,
    ]
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
    { field: "approverLabel", headerName: "Approver", width: 180 },
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
            color="error"
            onClick={() => handleCancelRequest(row.id)}
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
    { field: "approverLabel", headerName: "Approver", width: 200 },
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
    { field: "approverLabel", headerName: "Approver", width: 200 },
    { field: "informLabel", headerName: "Inform", width: 200 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.status !== "PENDING") {
          return null;
        }
        if (!row.canAct) {
          return (
            <Typography variant="caption" color="text.secondary">
              Awaiting approver
            </Typography>
          );
        }
        return (
          <Stack direction="row" spacing={1}>
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
          </Stack>
        );
      },
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            mb: 4,
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.02) 100%)",
            border: "1px solid rgba(14,165,233,0.12)",
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
                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Leave
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<BeachAccessIcon />}
              onClick={handleOpenApplyDialog}
              disabled={!leaveTypeOptions.length}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(14,165,233,0.4)",
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
            },
            "& .Mui-selected": {
              color: "var(--primary-color-1)",
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
                <Grid item xs={12} sm={6} md={4} key={card.title}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      border: `1px solid ${card.color}30`,
                      background: `linear-gradient(145deg, ${card.color}08, rgba(255,255,255,0.95))`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
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
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
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
                    sx={{
                      "& .MuiDataGrid-columnHeaders": {
                        borderRadius: 1,
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </Stack>
        )}

        {currentTabKey === "team" && (
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
                spacing={2}
                mb={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Pending Approvals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isCurrentUserLeaveApprover
                      ? "Review and approve leave requests. Leave approvers' requests are only visible to administrators."
                      : "Review and approve leave requests submitted by your team."}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => fetchMyRequests(isAdmin ? "all" : "team")}
                  disabled={actionLoading}
                >
                  Refresh
                </Button>
              </Stack>
              <div style={{ width: "100%" }}>
                <DataGrid
                  autoHeight
                  rows={teamRows.filter((row) => row.status === "PENDING")}
                  getRowId={(row) => row.id}
                  columns={approvalsColumns}
                  hideFooter
                  disableRowSelectionOnClick
                  loading={loading}
                  localeText={{
                    noRowsLabel: "No pending requests.",
                  }}
                />
              </div>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Recently Reviewed
              </Typography>
              <div style={{ width: "100%" }}>
                <DataGrid
                  autoHeight
                  rows={teamRows.filter((row) => row.status !== "PENDING")}
                  getRowId={(row) => row.id}
                  columns={reviewedColumns}
                  hideFooter
                  disableRowSelectionOnClick
                  loading={loading}
                  localeText={{
                    noRowsLabel: "No reviewed requests yet.",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentTabKey === "settings" && (
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Leave Types
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
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
                      />
                      <Stack direction="row" spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">Paid</Typography>
                          <Switch
                            checked={leaveTypeForm.is_paid}
                            disabled={isEditingUnpaid}
                            onChange={(_, checked) =>
                              setLeaveTypeForm((prev) => ({
                                ...prev,
                                is_paid: checked,
                              }))
                            }
                          />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">Half-day</Typography>
                          <Switch
                            checked={leaveTypeForm.allow_half_day}
                            onChange={(_, checked) =>
                              setLeaveTypeForm((prev) => ({
                                ...prev,
                                allow_half_day: checked,
                              }))
                            }
                          />
                        </Stack>
                      </Stack>
                      <TextField
                        label="Colour"
                        value={leaveTypeForm.color}
                        disabled={isEditingUnpaid}
                        onChange={(e) =>
                          setLeaveTypeForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        helperText="HEX colour used in summaries"
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleSaveLeaveType}
                          disabled={actionLoading}
                        >
                          {editingLeaveTypeId
                            ? "Update Leave Type"
                            : "Add Leave Type"}
                        </Button>
                        {editingLeaveTypeId && (
                          <Button variant="text" onClick={resetLeaveTypeForm}>
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5}>
                      {types.map((type) => {
                        const isSystemType =
                          type.name === "Unpaid Leave" ||
                          type.name === "Paid Leave";
                        return (
                          <Card key={type.id} variant="outlined">
                            <CardContent>
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="space-between"
                                spacing={2}
                              >
                                <Box>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
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
                                        color="warning"
                                      />
                                    )}
                                    {isSystemType && (
                                      <Chip
                                        label="Default"
                                        size="small"
                                        color="info"
                                      />
                                    )}
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {type.description || "—"}
                                  </Typography>
                                  <Stack direction="row" spacing={1} mt={1}>
                                    <Chip
                                      label={type.is_paid ? "Paid" : "Unpaid"}
                                      size="small"
                                      color={
                                        type.is_paid ? "primary" : "default"
                                      }
                                    />
                                    <Chip
                                      label={
                                        type.allow_half_day
                                          ? "Half-day allowed"
                                          : "Full-day only"
                                      }
                                      size="small"
                                      color={
                                        type.allow_half_day
                                          ? "success"
                                          : "default"
                                      }
                                    />
                                  </Stack>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleEditLeaveType(type)}
                                    disabled={type.name === "Unpaid Leave"}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleDeleteLeaveType(type)}
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
                        <Typography variant="body2" color="text.secondary">
                          No leave types defined yet.
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Leave Policies
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
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
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      label="Accrual"
                      value={policyForm.accrual_frequency}
                      onChange={(e) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          accrual_frequency: e.target
                            .value as PolicyFormState["accrual_frequency"],
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="MONTHLY">Monthly</MenuItem>
                      <MenuItem value="YEARLY">Yearly</MenuItem>
                      <MenuItem value="NONE">Manual</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      type="number"
                      label="Allowance per period"
                      value={policyForm.allowance_per_period}
                      onChange={(e) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          allowance_per_period: Number(e.target.value),
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">Carry forward</Typography>
                      <Switch
                        checked={policyForm.carry_forward_enabled}
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
                        label="Carry forward limit"
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
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">Auto approve</Typography>
                      <Switch
                        checked={policyForm.auto_approve}
                        onChange={(_, checked) =>
                          setPolicyForm((prev) => ({
                            ...prev,
                            auto_approve: checked,
                          }))
                        }
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      type="number"
                      label="Max balance"
                      value={policyForm.max_balance ?? ""}
                      onChange={(e) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          max_balance: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                  {isAdmin && roles.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={600} mb={1}>
                        Monthly paid leave allowance by role
                      </Typography>
                      <Grid container spacing={2}>
                        {roles.map((role) => {
                          const roleValues = policyForm.roleAllowances[role.id];
                          return (
                            <Grid item xs={12} sm={6} md={4} key={role.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    mb={1}
                                  >
                                    {role.name}
                                  </Typography>
                                  <Stack spacing={1.5}>
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
                                              ...prev.roleAllowances[role.id],
                                              allowance: e.target.value,
                                            },
                                          },
                                        }))
                                      }
                                      fullWidth
                                    />
                                    <TextField
                                      type="number"
                                      label="Carry forward limit"
                                      value={
                                        roleValues?.carry_forward_limit ?? ""
                                      }
                                      onChange={(e) =>
                                        setPolicyForm((prev) => ({
                                          ...prev,
                                          roleAllowances: {
                                            ...prev.roleAllowances,
                                            [role.id]: {
                                              ...prev.roleAllowances[role.id],
                                              carry_forward_limit:
                                                e.target.value,
                                            },
                                          },
                                        }))
                                      }
                                      fullWidth
                                    />
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Auto approve
                                      </Typography>
                                      <Switch
                                        size="small"
                                        checked={
                                          roleValues?.auto_approve ?? false
                                        }
                                        onChange={(_, checked) =>
                                          setPolicyForm((prev) => ({
                                            ...prev,
                                            roleAllowances: {
                                              ...prev.roleAllowances,
                                              [role.id]: {
                                                ...prev.roleAllowances[role.id],
                                                auto_approve: checked,
                                              },
                                            },
                                          }))
                                        }
                                      />
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={handlePolicySave}
                        disabled={actionLoading || !policyForm.leave_type_id}
                      >
                        Save Policy
                      </Button>
                      {editingPolicyId && (
                        <Button
                          variant="text"
                          onClick={() => {
                            setEditingPolicyId(null);
                            setPolicyForm(createDefaultPolicyForm());
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Existing Policies
                </Typography>
                <Grid container spacing={2}>
                  {policies.map((policy) => (
                    <Grid item xs={12} md={6} key={policy.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {policy.leave_type?.name}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
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
                                color="error"
                                onClick={() => handleDeletePolicy(policy.id)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Stack>
                          <Stack spacing={1} mt={1.5}>
                            <Typography variant="body2" color="text.secondary">
                              Accrual: {policy.accrual_frequency}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Base allowance: {policy.allowance_per_period} days
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Carry forward:{" "}
                              {policy.carry_forward_enabled
                                ? `Yes${
                                    policy.carry_forward_limit
                                      ? ` (max ${policy.carry_forward_limit})`
                                      : ""
                                  }`
                                : "No"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Auto approve: {policy.auto_approve ? "Yes" : "No"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Max balance: {policy.max_balance ?? "Unlimited"}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                Policy File:
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                {policy.policy_file_url ? (
                                  <>
                                    <Tooltip title="View File">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          window.open(
                                            policy.policy_file_url!,
                                            "_blank"
                                          )
                                        }
                                        color="primary"
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove File">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleRemovePolicyFile(policy.id)
                                        }
                                        color="error"
                                        disabled={actionLoading}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Tooltip title="Upload File">
                                    <label>
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleUploadPolicyFile(
                                              policy.id,
                                              file
                                            );
                                          }
                                          e.target.value = "";
                                        }}
                                      />
                                      <IconButton
                                        size="small"
                                        component="span"
                                        color="primary"
                                        disabled={actionLoading}
                                      >
                                        <UploadFileIcon fontSize="small" />
                                      </IconButton>
                                    </label>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Stack>
                            {policy.policy_file_name && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <AttachFileIcon fontSize="inherit" />
                                {policy.policy_file_name}
                              </Typography>
                            )}
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
                          </Stack>
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

            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Leave Approvers
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Grant users the ability to approve leave requests for other
                  users. Leave approvers' own requests can only be approved by
                  administrators.
                </Typography>
                <Stack spacing={2}>
                  {allUsersForApprover.map((user) => (
                    <Card
                      key={user.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {`${user.first_name || ""} ${
                                user.last_name || ""
                              }`.trim() || user.email}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.85rem", mt: 0.5 }}
                            >
                              {user.email}
                              {user.designation && ` • ${user.designation}`}
                              {user.department && ` • ${user.department}`}
                            </Typography>
                          </Box>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            {user.can_approve_leaves && (
                              <Chip
                                label="Leave Approver"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            <Switch
                              checked={user.can_approve_leaves || false}
                              onChange={() =>
                                handleToggleLeaveApprover(
                                  user.id,
                                  user.can_approve_leaves || false
                                )
                              }
                              disabled={actionLoading}
                              color="success"
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  {allUsersForApprover.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No users found.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
        <DialogContent sx={{ pt: 3, px: 3, mt: 2 }}>
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
              options={selectableUsers}
              getOptionLabel={(option) =>
                `${option.first_name || ""} ${option.last_name || ""}`.trim() ||
                option.email ||
                ""
              }
              value={
                selectableUsers.find(
                  (user) => user.id === applyForm.approver_id
                ) || null
              }
              onChange={(_, value) =>
                setApplyForm((prev) => ({
                  ...prev,
                  approver_id: value?.id || "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Approver (optional)"
                  placeholder="Select an approver"
                />
              )}
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
          }}
        >
          <Button
            onClick={() => setApplyDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={actionLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(14,165,233,0.4)",
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
