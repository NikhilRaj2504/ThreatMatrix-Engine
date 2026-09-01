import React from 'react';

export default function RiskGauge({ score = 0, size = 180 }) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * (circumference * 0.75);

  let color = "#2ED573"; // Solid Mint Green
  if (clampedScore > 80) {
    color = "#FF4757"; // Solid Threat Crimson
  } else if (clampedScore > 60) {
    color = "#FF4757"; // High
  } else if (clampedScore > 30) {
    color = "#FFA502"; // Solid Alert Orange
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-[#151B2B] border border-[#262F43]">
      <svg width={size} height={size} viewBox="0 0 180 180" className="transform -rotate-135">
        {/* Background track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#262F43"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
        {/* Filled progress */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-extrabold font-mono tracking-tight" style={{ color }}>
          {clampedScore}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold mt-0.5">
          Risk Index / 100
        </span>
      </div>
    </div>
  );
}
