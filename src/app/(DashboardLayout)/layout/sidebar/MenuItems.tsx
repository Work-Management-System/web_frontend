import DashboardIcon from "@mui/icons-material/Dashboard";
import { uniqueId } from "lodash";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PeopleIcon from "@mui/icons-material/People";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { Settings, Task } from "@mui/icons-material";
import SummarizeIcon from "@mui/icons-material/Summarize";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import ChatIcon from "@mui/icons-material/Chat";

const MenuItems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    key: "dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
    group: "Dashboard",
  },
  {
    id: uniqueId(),
    title: "Add Work Report",
    key: "add-report",
    icon: ChecklistIcon,
    href: "/add-report",
    group: "Reports",
  },
  {
    id: uniqueId(),
    title: "Daily Work Reports",
    key: "my-reports",
    icon: ListAltIcon,
    href: "/my-reports",
    group: "Reports",
  },
  {
    id: uniqueId(),
    title: "Reports",
    key: "all-reports",
    icon: SummarizeIcon,
    href: "/all-reports",
    group: "Reports",
  },
  {
    id: uniqueId(),
    title: "Tasks",
    key: "tasks",
    icon: Task,
    href: "/tasks",
    group: "Tasks",
  },
  {
    id: uniqueId(),
    title: "Attendance",
    key: "attendance",
    icon: AccessTimeIcon,
    href: "/attendance",
    group: "Attendance",
  },
  {
    id: uniqueId(),
    title: "Leave",
    key: "leave-management",
    icon: BeachAccessIcon,
    href: "/leave-management",
    group: "Attendance",
  },
  {
    id: uniqueId(),
    title: "Users",
    key: "users",
    icon: PeopleIcon,
    href: "/users",
    group: "Users",
  },
  {
    id: uniqueId(),
    title: "Organization",
    key: "organization",
    icon: CorporateFareIcon,
    href: "/organization",
    group: "Organization",
  },
  {
    id: uniqueId(),
    title: "Project Listing",
    key: "project-listing",
    icon: AccountTreeIcon,
    href: "/project-listing",
    group: "Projects",
  },
  {
    id: uniqueId(),
    title: "System Roles",
    key: "system-roles",
    icon: AdminPanelSettingsIcon,
    href: "/system-roles",
    group: "Settings",
  },
  {
    id: uniqueId(),
    title: "Tenant Settings",
    key: "tenant-settings",
    icon: EngineeringIcon,
    href: "/tenant-settings",
    group: "Settings",
  },
  {
    id: uniqueId(),
    title: "Settings",
    key: "settings",
    icon: Settings,
    href: "/settings",
    group: "Settings",
  },
  {
    id: uniqueId(),
    title: "User Subscriptions",
    key: "user-subscriptions",
    icon: SubscriptionsIcon,
    href: "/user-subscriptions",
    group: "Subscriptions",
  },
  {
    id: uniqueId(),
    title: "Subscriptions",
    key: "subscriptions-listing",
    icon: SubscriptionsIcon,
    href: "/subscriptions-listing",
    group: "Subscriptions",
  },
  {
    id: uniqueId(),
    title: "Chat",
    key: "chat",
    icon: ChatIcon,
    href: "/chat",
    group: "Communication",
  },
];

export default MenuItems;
