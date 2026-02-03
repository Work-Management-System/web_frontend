"use client";

import React from "react";

const styles = `
  @keyframes float-orb-1 {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
    33% { transform: translate(30px, -20px) scale(1.05); opacity: 0.5; }
    66% { transform: translate(-20px, 15px) scale(0.98); opacity: 0.35; }
  }
  @keyframes float-orb-2 {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
    50% { transform: translate(-25px, -30px) scale(1.08); opacity: 0.45; }
  }
  @keyframes float-orb-3 {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
    50% { transform: translate(20px, 25px) scale(1.06); opacity: 0.4; }
  }
  @keyframes float-orb-4 {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.25; }
    50% { transform: translate(calc(-50% + 15px), calc(-50% - 10px)) scale(1.1); opacity: 0.35; }
  }
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes shine-sweep {
    0% { transform: translateX(-100%) skewX(-12deg); opacity: 0; }
    10% { opacity: 0.03; }
    50% { transform: translateX(100%) skewX(-12deg); opacity: 0.06; }
    90% { opacity: 0.02; }
    100% { transform: translateX(200%) skewX(-12deg); opacity: 0; }
  }
  @keyframes grid-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.9; }
  }
  @keyframes particle-drift-1 {
    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
    50% { transform: translate(8px, -12px); opacity: 1; }
  }
  @keyframes particle-drift-2 {
    0%, 100% { transform: translate(0, 0); opacity: 0.5; }
    50% { transform: translate(-10px, 6px); opacity: 0.9; }
  }
  @keyframes particle-drift-3 {
    0%, 100% { transform: translate(0, 0); opacity: 0.7; }
    33% { transform: translate(6px, 8px); opacity: 1; }
    66% { transform: translate(-4px, -6px); opacity: 0.8; }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes line-flow {
    0% { opacity: 0.25; }
    50% { opacity: 0.7; }
    100% { opacity: 0.25; }
  }
  @keyframes line-slide {
    0% { transform: translateX(0); opacity: 0.3; }
    50% { transform: translateX(6px); opacity: 0.8; }
    100% { transform: translateX(0); opacity: 0.3; }
  }
`;

// Deterministic "random" positions/delays from index (no SSR mismatch)
function particleStyle(i: number) {
  const seed = (i * 17 + 31) % 100;
  const x = 5 + (seed * 0.9);
  const y = 5 + ((i * 13 + 7) % 90);
  const size = 2 + (i % 3);
  const duration = 4 + (i % 5);
  const delay = (i % 8) * 0.5;
  const anim = ["particle-drift-1", "particle-drift-2", "particle-drift-3"][i % 3];
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    animation: `${anim} ${duration}s ease-in-out ${delay}s infinite`,
  };
}

const PARTICLE_COUNT = 56;

export default function ModernBackgroundEffects() {
  return (
    <>
      <style>{styles}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Visible moving particles – tiny tech dots */}
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              borderRadius: "50%",
              background: i % 4 === 0 ? "rgba(15, 118, 110, 0.7)" : "rgba(20, 184, 166, 0.6)",
              ...particleStyle(i),
            }}
          />
        ))}

        {/* Twinkling “stars” – smaller, brighter dots */}
        {Array.from({ length: 24 }, (_, i) => {
          const sx = 3 + ((i * 19) % 94);
          const sy = 2 + ((i * 11 + 13) % 96);
          return (
            <div
              key={`star-${i}`}
              style={{
                position: "absolute",
                left: `${sx}%`,
                top: `${sy}%`,
                width: 2,
                height: 2,
                borderRadius: "50%",
                background: "#0F766E",
                boxShadow: "0 0 6px rgba(15, 118, 110, 0.8)",
                animation: `twinkle ${2.5 + (i % 3)}s ease-in-out ${(i % 5) * 0.3}s infinite`,
              }}
            />
          );
        })}

        {/* Tiny tech lines – short moving segments */}
        {[
          { left: "12%", top: "18%", w: 24, h: 1, rot: 0, d: 0 },
          { left: "78%", top: "22%", w: 18, h: 1, rot: 12, d: 0.5 },
          { left: "8%", top: "55%", w: 20, h: 1, rot: -8, d: 1 },
          { left: "85%", top: "62%", w: 22, h: 1, rot: 5, d: 0.3 },
          { left: "25%", top: "82%", w: 26, h: 1, rot: 3, d: 0.7 },
          { left: "70%", top: "12%", w: 16, h: 1, rot: -5, d: 0.2 },
        ].map((line, i) => (
          <div
            key={`line-${i}`}
            style={{
              position: "absolute",
              left: line.left,
              top: line.top,
              width: line.w,
              height: line.h,
              background: "linear-gradient(90deg, transparent, rgba(15, 118, 110, 0.5), transparent)",
              borderRadius: 1,
              transform: `rotate(${line.rot}deg)`,
              animation: `line-flow ${3 + (i % 2)}s ease-in-out ${line.d}s infinite`,
            }}
          />
        ))}

        {/* Subtle dot grid – more visible */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(15, 118, 110, 0.15) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
            animation: "grid-pulse 6s ease-in-out infinite",
          }}
        />

        {/* Soft gradient orbs */}
        <div
          style={{
            position: "absolute",
            width: "min(80vw, 600px)",
            height: "min(80vw, 600px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 40%, transparent 70%)",
            top: "-10%",
            left: "-5%",
            animation: "float-orb-1 22s ease-in-out infinite",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "min(70vw, 500px)",
            height: "min(70vw, 500px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(15, 118, 110, 0.12) 0%, rgba(15, 118, 110, 0.03) 50%, transparent 70%)",
            bottom: "-15%",
            right: "-8%",
            animation: "float-orb-2 26s ease-in-out infinite",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "min(60vw, 400px)",
            height: "min(60vw, 400px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "float-orb-3 24s ease-in-out infinite",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "min(50vw, 350px)",
            height: "min(50vw, 350px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 65%)",
            top: "60%",
            left: "20%",
            animation: "float-orb-4 20s ease-in-out infinite",
            filter: "blur(45px)",
          }}
        />
        {/* Soft shine sweep – subtle left-to-right pass */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 100%)",
            backgroundSize: "60% 100%",
            animation: "shine-sweep 12s ease-in-out infinite",
          }}
        />
        {/* Mesh-style gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(241, 245, 249, 0.5) 0%, transparent 50%, rgba(240, 253, 250, 0.3) 100%)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 15s ease infinite",
          }}
        />
      </div>
    </>
  );
}
