type PermissionType = "create" | "read" | "update" | "delete";

interface PrivilegeModule {
  label: string;
  key: string;
  permissions: PermissionType[];
}

const privilegeModules: PrivilegeModule[] = [
  // Dashboard
  {
    label: "Dashboard",
    key: "dashboard",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Reports
  {
    label: "Add Work Report",
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
  
  // Tasks
  {
    label: "Tasks",
    key: "tasks",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Attendance
  {
    label: "Attendance",
    key: "attendance",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Leave Management",
    key: "leave-management",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Users
  {
    label: "Users",
    key: "users",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "User Profile",
    key: "profile",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Projects
  {
    label: "Project Listing",
    key: "project-listing",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Organization
  {
    label: "Organization",
    key: "organization",
    permissions: ["read", "create", "update", "delete"],
  },
  
  // Settings
  {
    label: "Settings",
    key: "settings",
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
  
  // Subscriptions
  {
    label: "User Subscriptions",
    key: "user-subscriptions",
    permissions: ["create", "read", "update", "delete"],
  },
  {
    label: "Subscriptions Listing",
    key: "subscriptions-listing",
    permissions: ["create", "read", "update", "delete"],
  },
  
  // Chat
  {
    label: "Chat",
    key: "chat",
    permissions: ["create", "read", "update", "delete"],
  },
];

export default privilegeModules;
