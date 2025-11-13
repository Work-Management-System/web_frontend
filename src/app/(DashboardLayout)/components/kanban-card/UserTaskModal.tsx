import React, { useMemo, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  IconButton,
} from "@mui/material";
import { ExpandMore, ArrowBackIos, ArrowForwardIos, Close } from "@mui/icons-material";

interface UserTaskModalProps {
  open: boolean;
  onClose: () => void;
  users: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
  reports: {
    id: string;
    title: string;
    ticket_no: string;
    status: string;
    priority: string;
    current_user: {
      id: string;
      first_name: string;
      last_name: string;
    };
    project_id: string;
    description: string;
    deadline_minutes: string;
  }[];
  columns: { id: string; title: string }[];
}

const UserTaskModal: React.FC<UserTaskModalProps> = ({ open, onClose, users, reports, columns }) => {
  // Group tasks by user and priority
  const userTasks = useMemo(() => {
    const taskMap: {
      [userId: string]: {
        p1: { count: number; tasks: typeof reports };
        p2: { count: number; tasks: typeof reports };
        p3: { count: number; tasks: typeof reports };
        total: number;
      };
    } = {};

    users.forEach((user) => {
      taskMap[user.id] = {
        p1: { count: 0, tasks: [] },
        p2: { count: 0, tasks: [] },
        p3: { count: 0, tasks: [] },
        total: 0,
      };
    });

    reports
      .filter((report) => ["pending", "in_progress", "on_hold"].includes(report.status))
      .forEach((report) => {
        const userId = report.current_user.id;
        if (taskMap[userId]) {
          const priority = report.priority.toLowerCase();
          if (["p1", "p2", "p3"].includes(priority)) {
            taskMap[userId][priority].count += 1;
            taskMap[userId][priority].tasks.push(report);
            taskMap[userId].total += 1;
          }
        }
      });

    return taskMap;
  }, [users, reports]);

  // Score-based color assignment
  const getUserColor = (p1Count: number, p2Count: number, p3Count: number) => {
    const score = p1Count * 3 + p2Count * 2 + p3Count * 1;
    if (score === 0) return "rgba(200, 200, 200, 0.3)"; // Gray: No tasks
    else if (score >= 1 && score <= 3) return "rgba(153, 255, 153, 0.3)"; // Green: Light work
    else if (score >= 4 && score <= 6) return "rgba(255, 255, 153, 0.3)"; // Yellow: Medium load
    else return "rgba(255, 102, 102, 0.3)"; // Red: Heavy load
  };

  // Carousel navigation refs
  const carouselRefs: { [key: string]: React.RefObject<HTMLDivElement> } = {};

  const scrollCarousel = (userId: string, priority: string, direction: "left" | "right") => {
    const refKey = `${userId}-${priority}`;
    const ref = carouselRefs[refKey];
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", sm: 800 },
          bgcolor: "#ffffff",
          borderRadius: 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          p: 0,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          "&:focus": { outline: "none" },
        }}
      >
        {/* Sticky Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            backgroundColor: "#ffffff",
            p: 3,
            // borderBottom: "1px solid #dfe1e6",
            borderRadius: "12px 12px 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: "bold", color: "#172b4d" }}>
            User Task Overview
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: "#172b4d",
              "&:hover": { backgroundColor: "#e6f0fa" },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Column Headers */}
        <Box
          sx={{
            backgroundColor: "#ffffff",
            px: 5,
            py: 1.5,
            borderBottom: "1px solid #dfe1e6",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: "bold", color: "#172b4d", flex: 2 }}>User</Typography>
            <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
              P1
            </Typography>
            <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
              P2
            </Typography>
            <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
              P3
            </Typography>
          </Box>
        </Box>

        {/* Scrollable User List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 2,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: 3,
            },
          }}
        >
          {users.length > 0 ? (
            users.map((user) => {
              const tasks = userTasks[user.id] || {
                p1: { count: 0, tasks: [] },
                p2: { count: 0, tasks: [] },
                p3: { count: 0, tasks: [] },
                total: 0,
              };
              const userColor = getUserColor(tasks.p1.count, tasks.p2.count, tasks.p3.count);
              return (
                <Accordion
                  key={user.id}
                  sx={{
                    mb: 1.7,
                    borderRadius: "12px",
                    transition: "border-radius 0.3s ease, box-shadow 0.3s ease",
                    "&:not(.Mui-expanded)": {
                      borderRadius: "50px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    },
                    "&.Mui-expanded": {
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    },
                    overflow: "hidden",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: "#172b4d" }} />}
                    sx={{
                      backgroundColor: userColor,
                      "&:hover": { filter: "brightness(95%)" },
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                        margin: "8px 0",
                        minHeight: "25px",
                      },
                      "& .MuiAccordionSummary-content.Mui-expanded": {
                        alignItems: "center",
                        margin: "8px 0",
                      },
                      transition: "border-radius 0.3s ease, min-height 0.3s ease",
                      "&:not(.Mui-expanded)": {
                        borderRadius: "50px",
                        minHeight: "40px",
                      },
                      "&.Mui-expanded": {
                        borderRadius: "12px 12px 0 0",
                        minHeight: "40px",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: "var(--primary-color-1)",
                          mr: 1,
                          fontSize: 12,
                        }}
                      >
                        {user.first_name?.[0] || ""}
                        {user.last_name?.[0] || ""}
                      </Avatar>
                      <Typography sx={{ flex: 2, color: "#172b4d", fontSize: "0.9rem" }}>
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography
                        sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                      >
                        {tasks.p1.count}
                      </Typography>
                      <Typography
                        sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                      >
                        {tasks.p2.count}
                      </Typography>
                      <Typography
                        sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                      >
                        {tasks.p3.count}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: "0 0 12px 12px" }}>
                    {["p1", "p2", "p3"].map((priority) => {
                      const priorityTasks = tasks[priority].tasks;
                      if (priorityTasks.length === 0) return null;
                      const refKey = `${user.id}-${priority}`;
                      carouselRefs[refKey] = React.createRef();
                      return (
                        <Box key={priority} sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              color: "#172b4d",
                              mb: 1,
                              textTransform: "uppercase",
                            }}
                          >
                            Priority {priority.toUpperCase()} ({priorityTasks.length})
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton
                              onClick={() => scrollCarousel(user.id, priority, "left")}
                              sx={{ visibility: priorityTasks.length > 2 ? "visible" : "hidden" }}
                            >
                              <ArrowBackIos />
                            </IconButton>
                            <Box
                              ref={carouselRefs[refKey]}
                              sx={{
                                display: "flex",
                                overflowX: "auto",
                                gap: 2,
                                p: 1,
                                scrollBehavior: "smooth",
                                "&::-webkit-scrollbar": { height: 6 },
                                "&::-webkit-scrollbar-thumb": {
                                  backgroundColor: "#888",
                                  borderRadius: 3,
                                },
                              }}
                            >
                              {priorityTasks.map((task) => (
                                <Box
                                  key={task.id}
                                  sx={{
                                    minWidth: 200,
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 1,
                                    p: 2,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    "&:hover": {
                                      backgroundColor: "#f1f3f5",
                                      transition: "background-color 0.2s",
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium", color: "#172b4d" }}
                                  >
                                    {task.ticket_no}: {task.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#5e6c84" }}>
                                    Status: {columns.find((col) => col.id === task.status)?.title || task.status}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                            <IconButton
                              onClick={() => scrollCarousel(user.id, priority, "right")}
                              sx={{ visibility: priorityTasks.length > 2 ? "visible" : "hidden" }}
                            >
                              <ArrowForwardIos />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })
          ) : (
            <Typography sx={{ color: "#5e6c84", textAlign: "center", py: 2 }}>
              No users with tasks
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default UserTaskModal;