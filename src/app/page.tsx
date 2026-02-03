"use client";

import React from "react";
import LandingPage from "./components/LandingPage";
import ModernBackgroundEffects from "./components/ModernBackgroundEffects";

const Page = () => {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
      <ModernBackgroundEffects />
      <LandingPage />
    </div>
  );
};

export default Page;
