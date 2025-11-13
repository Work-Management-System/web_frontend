// app/projects/[id]/page.tsx (or wherever your route is)
"use client";
import { TaskProvider } from "@/contextapi/TaskContext";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ProjectDetails = dynamic(() => import("./ProjectDetailsPage"), {
  ssr: false,
});

const Page = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TaskProvider>
        <ProjectDetails />
      </TaskProvider>
    </DndProvider>
  );
};

export default Page;
