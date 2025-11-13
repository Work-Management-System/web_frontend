type PermissionType = "create" | "read" | "update" | "delete";

interface PrivilegeModule {
  label: string;
  key: string;
  permissions: PermissionType[];
}

const privilegeModules: PrivilegeModule[] = [
  {
    label: "Dashboard",
    key: "dashboard",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Add Status",
    key: "add-report",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Daily Work Reports",
    key: "my-reports",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "All Reports",
    key: "all-reports",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Users",
    key: "users",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "System Roles",
    key: "system-roles",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Tenant Settings",
    key: "tenant-settings",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Profile",
    key: "profile",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Project Listing",
    key: "project-listing",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "User Subscriptions",
    key: "user-subscriptions",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Subscriptions",
    key: "subscriptions-listing",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Tasks",
    key: "tasks",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Settings",
    key: "settings",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Attendance",
    key: "attendance",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Leave",
    key: "leave-management",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Organization",
    key: "organization",
    permissions: ["read"],
  },
];

export default privilegeModules;
