"use client";

import React from "react";
import { PaletteChangeProvider } from "@/contextapi/PaletteChangeContext";
import Dashboard from "./Dashboard";

type PageProps = {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

function DashboardPage(props: PageProps) {
  // Next.js 15: unwrap params/searchParams with React.use() to avoid "params are being enumerated" when ApexCharts or other code touches the tree
  const paramsPromise = props.params ?? Promise.resolve({});
  const searchParamsPromise = props.searchParams ?? Promise.resolve({});
  React.use(paramsPromise);
  React.use(searchParamsPromise);
  return (
    // <PaletteChangeProvider>
    <Dashboard />
    // </PaletteChangeProvider>
  );
}

export default DashboardPage;
