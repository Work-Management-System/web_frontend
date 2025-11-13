"use client";

import { PaletteChangeProvider } from "@/contextapi/PaletteChangeContext";
import Dashboard from "./Dashboard";

function DashboardPage() {
  return (
    // <PaletteChangeProvider>
      <Dashboard />
    // </PaletteChangeProvider>
  );
}

export default DashboardPage;
