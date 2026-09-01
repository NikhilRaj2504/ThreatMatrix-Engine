import React from 'react';

export default function RiskBadge({ level, score, size = "md" }) {
  const normalizedLevel = (level || 'LOW').toUpperCase();

  const config = {
    LOW: {
      bg: "bg-[#2ED573]/15 border-[#2ED573]/30 text-[#2ED573]",
      dot: "bg-[#2ED573]",
      label: "LOW RISK",
    },
    MEDIUM: {
      bg: "bg-[#FFA502]/15 border-[#FFA502]/30 text-[#FFA502]",
      dot: "bg-[#FFA502]",
      label: "MEDIUM RISK",
    },
    HIGH: {
      bg: "bg-[#FF4757]/15 border-[#FF4757]/30 text-[#FF4757]",
      dot: "bg-[#FF4757]",
      label: "HIGH RISK",
    },
    CRITICAL: {
      bg: "bg-[#FF4757]/20 border-[#FF4757]/50 text-[#FF4757]",
      dot: "bg-[#FF4757]",
      label: "CRITICAL RISK",
    }
  };

  const style = config[normalizedLevel] || config.LOW;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-semibold" : "px-3 py-1 text-xs font-bold";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-90">({Math.round(score)})</span>
      )}
    </span>
  );
}
