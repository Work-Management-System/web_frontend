"use client";

import { PaletteChangeProvider } from "@/contextapi/PaletteChangeContext";
import Attendance from "./Attendance";

function AttendancePage() {
  return (
    <PaletteChangeProvider>
      <Attendance />
    </PaletteChangeProvider>
  );
}

export default AttendancePage;
