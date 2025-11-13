import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { Box, Card, CardContent, Typography, Avatar, Tooltip } from "@mui/material";
import TaskDetailsModal from "./TaskDetailsModal";
import { HistoryItem, useTaskContext } from "@/contextapi/TaskContext";
import FolderIcon from '@mui/icons-material/Folder';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

interface Report {
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
  isPending?: boolean;
  history?: HistoryItem[];
  totalSubTasks?: number;
  completedSubTasks?: number;
  pendingSubTasks?: number;
  inprogressSubTasks?: number;
}

interface Project {
  id: string;
  title: string;
}

interface KanbanCardProps {
  report: Report;
  update: () => void;
  handleDeleteTask: (taskId: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ report, update, handleDeleteTask }) => {
  const { projects } = useTaskContext();
  const project = projects.find((p) => p.id === report.project_id);
  const projectName = project ? project.title : "Unknown Project";
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "report",
    item: { id: report.id, status: report.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !report.isPending,
  }));

  const [openModal, setOpenModal] = useState(false);

  const getTaskStyles = (isDragging: boolean) => ({
    opacity: isDragging ? 0.5 : 1,
    cursor: report.isPending ? "not-allowed" : "move",
  });

  React.useEffect(() => {
    if (isDragging) {
      console.log(`Dragging card: ${report.id} (Status: ${report.status})`);
    }
  }, [isDragging, report.id, report.status]);

  const getPriorityDetails = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "P1":
        return { label: "P1", color: "#ffffff", bg: "#d70000" };
      case "P2":
        return { label: "P2", color: "#ffffff", bg: "#f59e0b" };
      case "P3":
        return { label: "P3", color: "#ffffff", bg: "green" };
      default:
        return { label: priority, color: "#ffffff", bg: "#9e9e9e" };
    }
  };

  const getTicketColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f77c71";
      case "in_progress":
        return "#ffb347";
      case "on_hold":
        return "#7f7f7f";
      case "testable":
        return "#339aff";
      case "debugging":
        return "#5fb49c";
      case "completed":
        return "#81c784";
      default:
        return "#888b91";
    }
  };

  const stripHtmlTags = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const truncateHtml = (html: string, maxLength: number) => {
    const plainText = stripHtmlTags(html);
    if (plainText.length <= maxLength) {
      return html;
    }

    let result = "";
    let textLength = 0;
    let inTag = false;
    let tagBuffer = "";
    const stack: string[] = [];

    for (let i = 0; i < html.length && textLength < maxLength; i++) {
      const char = html[i];

      if (char === "<") {
        inTag = true;
        tagBuffer = char;
        continue;
      }

      if (inTag) {
        tagBuffer += char;
        if (char === ">") {
          inTag = false;
          const isClosingTag = tagBuffer.startsWith("</");
          const tagNameMatch = tagBuffer.match(/<\/?([a-zA-Z]+)/);
          const tagName = tagNameMatch ? tagNameMatch[1] : "";

          if (!isClosingTag && !tagBuffer.includes("/>")) {
            stack.push(tagName);
          } else if (isClosingTag) {
            stack.pop();
          }
          result += tagBuffer;
          tagBuffer = "";
        }
        continue;
      }

      result += char;
      textLength++;
    }

    // Append ellipsis
    result += "...";

    // Close any open tags
    while (stack.length > 0) {
      const tag = stack.pop();
      if (tag) {
        result += `</${tag}>`;
      }
    }

    return result;
  };

  const priorityInfo = getPriorityDetails(report.priority);
  const ticketColor = getTicketColor(report.status);

  const handleCardClick = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleUpdateModal = () => {
    update();
    setOpenModal(false);
  };

  const plainDescription = stripHtmlTags(report.description);
  const displayDescription = plainDescription.length > 30
    ? truncateHtml(report.description, 40)
    : report.description;

  return (
    <>
      <div
        ref={drag as unknown as React.RefObject<HTMLDivElement>}
        style={{ ...getTaskStyles(isDragging), marginBottom: "1rem" }}
        onClick={handleCardClick}
      >
        <Card
          sx={{
            height: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 2,
            backgroundColor: "#ffffff",
            transition: "box-shadow 0.2s ease-in-out",
            "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            cursor: report.isPending ? "not-allowed" : "pointer",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: 1.3,
              paddingBottom: "none",
              "&.MuiCardContent-root:last-child": {
                paddingBottom: "10.4px",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, pb: "none", alignItems: "center" }}>
              <div>
                <FolderIcon className="w-2 h-2 text-gray-300" />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: 12,
                    fontWeight: "bold",
                    px: 0.5,
                    py: 0.2,
                    borderRadius: "4px",
                    color: "grey",
                    textAlign: "center",
                    opacity: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 150, // adjust to fit your design
                  }}
                  title={projectName} // shows full name on hover
                >
                  {projectName.length > 20 ? `${projectName.slice(0, 20)}...` : projectName}
                </Typography>
              </div>
              <Box
                sx={{
                  fontSize: 10,
                  fontWeight: "semibold",
                  px: 0.8,
                  py: 0.5,
                  borderRadius: "4px",
                  color: priorityInfo.color,
                  backgroundColor: priorityInfo.bg,
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: "-50%",
                    left: "-100%",
                    width: "50%",
                    height: "200%",
                    background: "linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0))",
                    transform: "rotate(45deg)",
                    animation: "shine 3s infinite", // Added 'linear' for smooth motion
                  },
                  "@keyframes shine": {
                    "0%": { left: "-100%" },
                    // "50%": { left: "150%" }, // Extend past the container to ensure full sweep
                    "100%": { left: "150%" }, // Return to start for a complete loop
                  },
                }}
              >
                {priorityInfo.label}
              </Box>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: 12,
                color: "#172b4d",
                lineHeight: 1.4,
                mb: .4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {report.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                color: "#5e6c84",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
              dangerouslySetInnerHTML={{
                __html: displayDescription,
              }}
            />
            {report.current_user.first_name ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent:"space-between", gap: 1, mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }} >
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    backgroundColor: "var(--primary-color-1)",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1-hover)",
                    },
                    fontSize: 11,
                  }}
                >
                  {report?.current_user?.first_name?.length > 0 ? report?.current_user?.first_name[0] : ""}
                  {report?.current_user?.last_name?.length ? report?.current_user?.last_name[0] : ""}
                </Avatar>
                <Typography variant="body2" sx={{ fontSize: 13, color: "#5e6c84" }}>
                  {`${report.current_user.first_name} ${report.current_user.last_name}`}
                </Typography>
                </Box>
                {report.totalSubTasks>0 &&
                <Box>
                  <Tooltip
                      title={`${report.completedSubTasks} of ${report.totalSubTasks} subtasks completed`}
                    arrow
                  >
                    <Box>
                      <AccountTreeIcon
                        sx={{
                          fontSize: 15,
                          color: report.totalSubTasks - report.completedSubTasks>0 ? "error.main" : "#5e6c84", // highlight red if not all done
                          cursor: "pointer",
                            transform: "rotate(90deg) scaleY(-1)",
                        }}
                      />
                    </Box>
                  </Tooltip>
                  </Box>
}
              </Box>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 300,
                  fontSize: 12,
                  color: "#172b4d",
                  lineHeight: 1.4,
                  flexGrow: 1,
                  marginTop: 2,
                }}
              >
                Not Assigned Yet
              </Typography>
            )}
          </CardContent>
        </Card>
      </div>
      <TaskDetailsModal
        open={openModal}
        onClose={handleCloseModal}
        report={report}
        onUpdate={handleUpdateModal}
      // handleDeleteTask={handleDeleteTask}
      />
    </>
  );
};

export default KanbanCard;