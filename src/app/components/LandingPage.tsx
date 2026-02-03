"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
} from "@mui/material";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TaskIcon from "@mui/icons-material/Task";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ChatIcon from "@mui/icons-material/Chat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { useRouter } from "next/navigation";
import Image from "next/image";

const colors = {
  primary: "#0F766E",
  primaryLight: "#14B8A6",
  primaryDark: "#0D9488",
  dark: "#0F172A",
  gray: "#64748B",
  lightGray: "#F1F5F9",
  white: "#FFFFFF",
};

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
];

const featurePills = [
  { icon: <DashboardIcon sx={{ fontSize: 18 }} />, label: "Dashboard" },
  { icon: <TaskIcon sx={{ fontSize: 18 }} />, label: "Tasks" },
  { icon: <AssessmentIcon sx={{ fontSize: 18 }} />, label: "Reports" },
  { icon: <AccessTimeIcon sx={{ fontSize: 18 }} />, label: "Attendance" },
  { icon: <BeachAccessIcon sx={{ fontSize: 18 }} />, label: "Leave" },
  { icon: <AccountTreeIcon sx={{ fontSize: 18 }} />, label: "Projects" },
];

const featureTabsContent = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <DashboardIcon />,
    title: "Smart Dashboard",
    description: "Get a real-time overview of your team and projects. Track performance, attendance, leave balances, and key metrics in one place.",
    bullets: [
      "Real-time analytics and insights",
      "Project status and progress at a glance",
      "Team productivity and workload view",
      "Attendance summary and leave balances",
    ],
    image: "/images/landing/dashboard-overview.png",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: <TaskIcon />,
    title: "Task Management",
    description: "Organize work with Kanban boards. Assign tasks, set priorities, track status, and meet deadlines without the chaos.",
    bullets: [
      "Visual Kanban boards",
      "Assign tasks with deadlines and priorities",
      "Subtasks and full history",
      "Filter by project, user, or department",
    ],
    image: "/images/landing/tasks-kanban.png",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <AssessmentIcon />,
    title: "Work Reports",
    description: "Daily work logs and comprehensive reports. See what your team did, how time was spent, and export to Excel for payroll or clients.",
    bullets: [
      "Daily work reports and time tracking",
      "Project-wise task logging",
      "Manager remarks and review",
      "Export to Excel",
    ],
    image: "/images/landing/reports.png",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <AccessTimeIcon />,
    title: "Attendance & Time Tracking",
    description: "Digital clock in/out, break and lunch tracking, and automatic timesheets. Accurate records without manual sheets.",
    bullets: [
      "One-click clock in and clock out",
      "Break and lunch tracking",
      "Timesheets and monthly reports",
      "Overtime and regularization",
    ],
    image: "/images/landing/attendance.png",
  },
  {
    id: "leave",
    label: "Leave",
    icon: <BeachAccessIcon />,
    title: "Leave Management",
    description: "Apply for leave in a few clicks. Approvals, balance tracking, and policies—all in one place.",
    bullets: [
      "Leave requests and approvals",
      "Real-time leave balance",
      "Full-day, half-day, and short leave",
      "Leave calendar and policies",
    ],
    image: "/images/landing/leave.png",
  },
  {
    id: "projects",
    label: "Projects",
    icon: <AccountTreeIcon />,
    title: "Project Management",
    description: "Create projects, assign teams, track phases, and manage deliverables from start to finish.",
    bullets: [
      "Projects with timelines and milestones",
      "Team assignment and roles",
      "Client details and documents",
      "Project analytics and export",
    ],
    image: "/images/landing/project-details.png",
  },
];

const onboardingSteps = [
  {
    step: "1",
    title: "Sign up",
    description:
      "Create your account and set up your organization. Get started in under 2 minutes with no credit card required.",
    image: "/images/landing/create-workspace.png",
  },
  {
    step: "2",
    title: "Configure",
    description:
      "Add your team members, set roles and permissions, configure leave policies, and customize settings for your organization.",
    image: "/images/landing/role-list.png",
  },
  {
    step: "3",
    title: "Start working",
    description:
      "Manage projects, assign tasks, track attendance, and collaborate—all in one place. Your team can focus on getting things done.",
    image: "/images/landing/dashboard.png",
  },
];

const benefits = [
  {
    icon: <AccountTreeIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "Create projects and share with teammates",
    description:
      "Create as many projects as you need, organize them, and add teammates to collaborate. Invite clients or freelancers to specific projects when needed.",
    image: "/images/landing/project-details.png",
  },
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "Schedule tasks and track daily work",
    description:
      "Say goodbye to overwhelming to-do lists. Schedule tasks on specific days and log daily work reports so your team focuses on today’s priorities.",
    image: "/images/landing/tasks-kanban.png",
  },
  {
    icon: <BeachAccessIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "Leave management and approvals",
    description:
      "Streamlined leave requests, approvals, and balance tracking. Support full-day, half-day, and short leave with policies that fit your organization.",
    image: "/images/landing/leave.png",
  },
  {
    icon: <ChatIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "Real-time chat and collaboration",
    description:
      "Discuss work in context. Chat with teammates, share files, and keep task-related conversations in one place instead of scattered across tools.",
    image: "/images/landing/chat.png",
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "Attendance and time tracking",
    description:
      "Digital clock in/out, break tracking, and timesheets. Get accurate attendance records and insights without manual sheets.",
    image: "/images/landing/attendance.png",
  },
  {
    icon: <GroupWorkIcon sx={{ fontSize: 40, color: colors.primary }} />,
    title: "View all work at the team level",
    description:
      "See tasks and progress across projects in one view. Know who’s working on what and how the team is performing.",
    image: "/images/landing/employees.png",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};
const stagger = (delay = 0.1) => ({ animate: { transition: { staggerChildren: delay } } });
const sectionInView = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featureTab, setFeatureTab] = useState(0);
  const router = useRouter();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ width: 280, pt: 2, pb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary }}>
          Manazeit
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navLinks.map(({ label, href }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton component="a" href={href} onClick={handleDrawerToggle}>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={() => { router.push("/login"); handleDrawerToggle(); }}>
            <ListItemText primary="Log in" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mt: 1, px: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => { router.push("/register"); handleDrawerToggle(); }}
            sx={{
              bgcolor: colors.primary,
              color: colors.white,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: colors.primaryDark },
            }}
          >
            Try for free
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "rgba(255, 255, 255, 0.91)", minHeight: "100vh" }}>
      {/* Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: colors.white,
          color: colors.dark,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", minHeight: { xs: 56, md: 64 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Image
                src="/images/logos/time-sheet-base-logo.png"
                alt="Manazeit"
                width={44}
                height={44}
                style={{ objectFit: "contain" }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.dark,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Manazeit
              </Typography>
            </Box>

            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
              {navLinks.map(({ label, href }) => (
                <Button
                  key={label}
                  href={href}
                  sx={{
                    color: colors.gray,
                    fontWeight: 500,
                    textTransform: "none",
                    "&:hover": { color: colors.dark, bgcolor: "transparent" },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
              <Button
                onClick={() => router.push("/login")}
                sx={{
                  color: colors.dark,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { bgcolor: colors.lightGray },
                }}
              >
                Log in
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push("/register")}
                sx={{
                  bgcolor: colors.primary,
                  color: colors.white,
                  px: 2.5,
                  py: 1.25,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { bgcolor: colors.primaryDark },
                }}
              >
                Try for free
              </Button>
            </Stack>

            <IconButton onClick={handleDrawerToggle} sx={{ display: { md: "none" }, color: colors.dark }}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle}>
        {drawer}
      </Drawer>

      {/* Hero */}
      <Box
        component={motion.div}
        initial="initial"
        animate="animate"
        variants={stagger(0.08)}
        sx={{
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Typography
            component={motion.h1}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            variant="h2"
            sx={{
              fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" },
              fontWeight: 700,
              lineHeight: 1.2,
              color: colors.dark,
              textAlign: "center",
              mb: 2,
            }}
          >
            Work management platform for result-driven teams
          </Typography>
          <Typography
            component={motion.p}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              fontSize: { xs: "1.05rem", md: "1.2rem" },
              color: colors.gray,
              textAlign: "center",
              maxWidth: 560,
              mx: "auto",
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Manazeit helps teams plan work, track progress, and get things done—projects, tasks, attendance, leave, and reports in one place.
          </Typography>
          <Stack
            component={motion.div}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push("/register")}
              sx={{
                bgcolor: colors.primary,
                color: colors.white,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": { bgcolor: colors.primaryDark },
              }}
            >
              Try Manazeit for free
            </Button>
          </Stack>
          <Typography
            component={motion.p}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            variant="body2"
            sx={{ color: colors.gray, textAlign: "center", mt: 2 }}
          >
            No credit card required.
          </Typography>
          <Box
            component={motion.div}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              mt: 6,
              mx: "auto",
              maxWidth: 900,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
              aspectRatio: "16/8",
              width: "100%",
            }}
          >
            <Image
              src="/images/landing/dashboard.png"
              alt="Manazeit dashboard overview"
              fill
              style={{ objectFit: "contain", objectPosition: "top center" }}
              sizes="(max-width: 768px) 100vw, 900px"
              priority
            />
          </Box>
        </Container>
      </Box>

      {/* Explore features – larger, modern showcase */}
      <Box
        id="features"
        component={motion.div}
        {...sectionInView}
        sx={{
          py: { xs: 8, md: 14 },
          px: { xs: 0, md: 2 },
          background: `linear-gradient(180deg, ${colors.lightGray} 0%, rgba(241, 245, 249, 0.6) 50%, ${colors.lightGray} 100%)`,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            component={motion.h2}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            variant="h3"
            sx={{
              fontWeight: 800,
              color: colors.dark,
              textAlign: "center",
              mb: 1.5,
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Explore features
          </Typography>
          <Typography
            component={motion.p}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              color: colors.gray,
              textAlign: "center",
              mb: 5,
              maxWidth: 560,
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            Click a tab to see what each module offers.
          </Typography>

          <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mb: 5 }}>
            <Box
              sx={{
                display: "inline-flex",
                p: 1,
                borderRadius: 20,
                bgcolor: colors.white,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Tabs
                value={featureTab}
                onChange={(_, v) => setFeatureTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  "& .MuiTabs-flexContainer": { justifyContent: "center", gap: 0.5 },
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTabs-scroller": { overflow: "auto !important" },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    minHeight: 48,
                    borderRadius: 14,
                    px: 2.5,
                    py: 1.5,
                    minWidth: "auto",
                    fontSize: "0.9375rem",
                    color: colors.gray,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      color: colors.dark,
                      bgcolor: "rgba(15, 118, 110, 0.08)",
                    },
                  },
                  "& .Mui-selected": {
                    color: `${colors.white} !important`,
                    bgcolor: colors.primary,
                    boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)",
                    "&:hover": {
                      bgcolor: colors.primaryDark,
                      color: `${colors.white} !important`,
                      boxShadow: "0 4px 18px rgba(15, 118, 110, 0.45)",
                    },
                    "& .MuiTab-iconWrapper": { color: `${colors.white} !important` },
                  },
                }}
              >
                {featureTabsContent.map((tab, index) => (
                  <Tab
                    key={tab.id}
                    icon={tab.icon}
                    iconPosition="start"
                    label={tab.label}
                    id={`feature-tab-${index}`}
                    aria-controls={`feature-tabpanel-${index}`}
                    sx={{
                      "& .MuiTab-iconWrapper": { color: "inherit" },
                      "&.Mui-selected": { color: colors.white },
                      "&.Mui-selected .MuiTab-iconWrapper": { color: colors.white },
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          </Box>

          {featureTabsContent.map((tab, index) => (
            <Box
              key={tab.id}
              role="tabpanel"
              hidden={featureTab !== index}
              id={`feature-tabpanel-${index}`}
              aria-labelledby={`feature-tab-${index}`}
              sx={{ pt: 0, alignSelf: "stretch", width: "100%" }}
            >
              {featureTab === index && (
                <Box
                  component={motion.div}
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    alignItems: "stretch",
                    gap: 0,
                    bgcolor: colors.white,
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.06)",
                    minHeight: { xs: "auto", lg: 520 },
                  }}
                >
                  <Box
                    sx={{
                      flex: { lg: "0 0 42%" },
                      p: { xs: 4, sm: 5, md: 6, lg: 7 },
                      order: { lg: 1 },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderRight: { lg: "1px solid" },
                      borderColor: { lg: "divider" },
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: colors.dark,
                        mb: 2,
                        fontSize: { xs: "1.5rem", sm: "1.625rem", md: "1.75rem" },
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {tab.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: colors.gray,
                        lineHeight: 1.75,
                        mb: 3,
                        fontSize: { xs: "0.9375rem", md: "1rem" },
                      }}
                    >
                      {tab.description}
                    </Typography>
                    <Stack component="ul" sx={{ pl: 2.5, m: 0 }}>
                      {tab.bullets.map((bullet) => (
                        <Typography
                          key={bullet}
                          component="li"
                          sx={{
                            color: colors.dark,
                            mb: 1.25,
                            lineHeight: 1.6,
                            fontSize: "0.9375rem",
                          }}
                        >
                          {bullet}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      flex: { lg: "1 1 58%" },
                      order: { lg: 2 },
                      width: "100%",
                      minHeight: { xs: 320, sm: 380, md: 420, lg: "100%" },
                      aspectRatio: { xs: "16/10", lg: "auto" },
                      position: "relative",
                      bgcolor: "rgba(248, 250, 252, 0.8)",
                      overflow: "hidden",
                      p: { xs: 2, sm: 3, lg: 4 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minHeight: { xs: 280, sm: 340, md: 380, lg: 460 },
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Image
                        src={tab.image}
                        alt={tab.title}
                        fill
                        style={{ objectFit: "contain", objectPosition: "top center" }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 900px"
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Container>
      </Box>

      {/* How it works (Onboarding) */}
      <Box
        id="how-it-works"
        component={motion.div}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ initial: {}, whileInView: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
        sx={{
          py: { xs: 10, md: 14 },
          px: 2,
          background: `linear-gradient(180deg, ${colors.lightGray} 0%, rgba(241, 245, 249, 0.7) 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component={motion.h2}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            variant="h4"
            sx={{
              fontWeight: 800,
              color: colors.dark,
              textAlign: "center",
              mb: 1.5,
              fontSize: { xs: "1.75rem", md: "2rem" },
              letterSpacing: "-0.02em",
            }}
          >
            How it works
          </Typography>
          <Typography
            component={motion.p}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              color: colors.gray,
              textAlign: "center",
              mb: { xs: 6, md: 8 },
              maxWidth: 540,
              mx: "auto",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
            }}
          >
            Get your team up and running in three simple steps.
          </Typography>
          <Stack
            component={motion.div}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ initial: {}, animate: { transition: { staggerChildren: 0.15 } } }}
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 4, md: 4 }}
            justifyContent="center"
            alignItems="stretch"
            sx={{ maxWidth: 1100, mx: "auto" }}
          >
            {onboardingSteps.map(({ step, title, description, image }) => (
              <Box
                key={step}
                component={motion.div}
                variants={fadeInUp}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                sx={{
                  flex: { md: 1 },
                  display: "flex",
                  flexDirection: "column",
                  textAlign: { xs: "center", md: "left" },
                  p: { xs: 3, md: 3.5 },
                  borderRadius: 3,
                  bgcolor: colors.white,
                  border: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                  maxWidth: { xs: "100%", md: 360 },
                  minHeight: { md: 420 },
                  transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
                    borderColor: "rgba(15, 118, 110, 0.2)",
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16/10",
                    minHeight: 168,
                    borderRadius: 2,
                    mb: 2.5,
                    overflow: "hidden",
                    bgcolor: colors.lightGray,
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.06)",
                  }}
                >
                  <Image src={image} alt={title} fill style={{ objectFit: "contain", objectPosition: "center center" }} sizes="360px" />
                </Box>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    bgcolor: colors.primary,
                    color: colors.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.375rem",
                    mb: 2,
                    mx: { xs: "auto", md: 0 },
                    boxShadow: "0 4px 14px rgba(15, 118, 110, 0.35)",
                  }}
                >
                  {step}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.dark,
                    mb: 1.5,
                    fontSize: "1.25rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.gray,
                    lineHeight: 1.7,
                    fontSize: "0.9375rem",
                  }}
                >
                  {description}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Box sx={{ textAlign: "center", mt: { xs: 6, md: 8 } }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push("/register")}
              sx={{
                bgcolor: colors.primary,
                color: colors.white,
                px: 4,
                py: 1.75,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  bgcolor: colors.primaryDark,
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(15, 118, 110, 0.45)",
                },
              }}
            >
              Start with step 1
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Benefits */}
      <Box
        id="benefits"
        component={motion.div}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ initial: {}, whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
        sx={{ py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <Typography
            component={motion.h2}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.dark,
              textAlign: "center",
              mb: 1,
            }}
          >
            Everything your team needs
          </Typography>
          <Typography
            component={motion.p}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              color: colors.gray,
              textAlign: "center",
              mb: 6,
              maxWidth: 520,
              mx: "auto",
            }}
          >
            One platform for projects, tasks, attendance, leave, and collaboration.
          </Typography>

          <Stack spacing={{ xs: 6, md: 8 }}>
            {benefits.map((item, index) => (
              <Box
                key={item.title}
                component={motion.div}
                variants={{
                  initial: {
                    opacity: 0,
                    x: index % 2 === 0 ? -24 : 24,
                  },
                  whileInView: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    md: index % 2 === 0 ? "row" : "row-reverse",
                  },
                  alignItems: "center",
                  gap: { xs: 3, md: 6 },
                }}
              >
                <Box
                  sx={{
                    flex: { md: "1 1 50%" },
                    textAlign: { xs: "center", md: index % 2 === 0 ? "left" : "right" },
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 72,
                      height: 72,
                      borderRadius: 2,
                      bgcolor: `${colors.primary}12`,
                      mb: 2,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: colors.dark, mb: 1.5 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: colors.gray, lineHeight: 1.7 }}>
                    {item.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: { md: "1 1 50%" },
                    aspectRatio: "16/10",
                    minHeight: { xs: 220, md: 260 },
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: colors.lightGray,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    style={{ objectFit: "contain", objectPosition: "center center" }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          py: { xs: 10, md: 14 },
          px: 2,
          background: `linear-gradient(180deg, ${colors.dark} 0%, #0c1222 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: colors.white,
              textAlign: "center",
              mb: 2,
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            Transform the way your team works
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              mb: { xs: 5, md: 6 },
              fontSize: { xs: "1rem", md: "1.125rem" },
              maxWidth: 560,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Start managing projects, tasks, and people in one place. Your team will thank you.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 3, md: 4 }}
            justifyContent="center"
            alignItems="stretch"
            sx={{ mb: { xs: 5, md: 6 } }}
          >
            <Box
              component="a"
              href="#"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push("/register"); }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textDecoration: "none",
                color: "inherit",
                borderRadius: 3,
                overflow: "hidden",
                width: { xs: "100%", sm: 280 },
                maxWidth: 320,
                mx: "auto",
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                cursor: "pointer",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(255,255,255,0.28)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.32), 0 0 0 1px rgba(20,184,166,0.2)",
                },
              }}
            >
              <Typography
                sx={{
                  py: 3,
                  px: 3,
                  color: "rgba(255,255,255,0.95)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textAlign: "center",
                }}
              >
                New? Create your workspace
              </Typography>
            </Box>
            <Box
              component="a"
              href="#"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); router.push("/login"); }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textDecoration: "none",
                color: "inherit",
                borderRadius: 3,
                overflow: "hidden",
                width: { xs: "100%", sm: 280 },
                maxWidth: 320,
                mx: "auto",
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                cursor: "pointer",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(255,255,255,0.28)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.32), 0 0 0 1px rgba(20,184,166,0.2)",
                },
              }}
            >
              <Typography
                sx={{
                  py: 3,
                  px: 3,
                  color: "rgba(255,255,255,0.95)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textAlign: "center",
                }}
              >
                Existing user? Log in
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ flexWrap: "wrap", gap: 2 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/register")}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: colors.primaryLight,
                color: colors.white,
                px: 4,
                py: 1.75,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(20,184,166,0.4)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  bgcolor: colors.primary,
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 20px rgba(20,184,166,0.45)",
                },
              }}
            >
              Try Manazeit for free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/login")}
              sx={{
                borderColor: "rgba(255,255,255,0.4)",
                color: colors.white,
                px: 4,
                py: 1.75,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                transition: "border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  borderColor: colors.white,
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Log in
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" sx={{ color: colors.gray }}>
              © {new Date().getFullYear()} Manazeit. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                component="a"
                href="#features"
                sx={{ color: colors.gray, textTransform: "none", fontWeight: 500 }}
              >
                Features
              </Button>
              <Button
                component="a"
                href="#how-it-works"
                sx={{ color: colors.gray, textTransform: "none", fontWeight: 500 }}
              >
                How it works
              </Button>
              <Button
                onClick={() => router.push("/login")}
                sx={{ color: colors.gray, textTransform: "none", fontWeight: 500 }}
              >
                Log in
              </Button>
              <Button
                onClick={() => router.push("/register")}
                sx={{ color: colors.primary, textTransform: "none", fontWeight: 600 }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
