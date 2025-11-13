// KanbanColumn.tsx
import React from "react";
import { useDrop } from "react-dnd";
import { Box, Paper, Typography } from "@mui/material";
import KanbanCard from "../kanban-card/KanbanCard";
import { HistoryItem, useTaskContext } from "@/contextapi/TaskContext";

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
  history?: HistoryItem[];
  deadline_minutes: string; // Added property
}

interface Project {
  id: string;
  title: string;
}

const getTaskCountColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#f44336";
    case "in_progress":
      return "#ff9800";
    case "on_hold":
      return "#7f7f7f";
    case "testable":
      return "#007bff";
    case "debugging":
      return "#358f75";
    case "completed":
      return "#4caf50";
    default:
      return "#dfe1e6";
  }
};

interface KanbanColumnProps {
  column: { id: string; title: string };
  tasks: Report[];
  totalTaskCount: number;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  totalTaskCount,
}) => {
  const { projects, handleTaskDrop, handleDeleteTask, fetchTasks } = useTaskContext(); // Use context
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "report",
    drop: (item: { id: string; status: string }) => {
      if (item.status !== column.id) {
        console.log(
          `Dropping task ${item.id} into column ${column.id} (from ${item.status})`
        );
        handleTaskDrop(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  const TaskCountColor = getTaskCountColor(column.id);

  const handleUpdate = () => {
    fetchTasks();
  };

  React.useEffect(() => {
    const ids = tasks.map((t) => t.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.warn(`Duplicate task IDs found in column ${column.id}:`, ids);
    }
  }, [tasks, column.id]);

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
      }}
    >
      <Paper
        component="div"
        // elevation={0}
        ref={(node) => {
          if (node) drop(node);
        }}
        sx={{
          px: 0.5,
          backgroundColor: isOver ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          // border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 2,
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          position: "relative",
          "&::-webkit-scrollbar": { display: "none" },
          // boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            backgroundColor: "#ffffff",
            borderRadius: 2,
            // boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            zIndex: 1,
            padding: "10px 8px",
            width: "100%",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#172b4d",
              textTransform: "uppercase",
            }}
          >
            {column.title}
          </Typography>
          <Box
            sx={{
              backgroundColor: TaskCountColor,
              color: TaskCountColor ? "#ffffff" : "#172b4d",
              borderRadius: "999px",
              px: 1,
              py: 0.15,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {tasks.length}/{totalTaskCount}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mt: 2,
            minHeight: "100px",
            scrollbarWidth: "none",
          }}
        >
          {tasks?.map((report) => (
            // <KanbanCard
            //   key={report.id}
            //   report={report}
            //   projects={projects}
            //   update={handleUpdate}
            //   handleDeleteTask={handleDeleteTask} // Added prop
            // />
            <KanbanCard
              key={report.id}
              report={report}
              update={handleUpdate}
              handleDeleteTask={handleDeleteTask}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
export default KanbanColumn;