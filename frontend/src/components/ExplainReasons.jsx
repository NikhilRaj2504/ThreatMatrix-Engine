import React from 'react';
import { AlertTriangle, ShieldCheck, Flame, AlertCircle } from 'lucide-react';

export default function ExplainReasons({ reasons = [], riskLevel = "LOW" }) {
  if (!reasons || reasons.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#2ED573]/10 border border-[#2ED573]/30 text-[#2ED573]">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#2ED573]" />
        <p className="text-xs font-semibold">Transaction matches verified legitimate baseline patterns.</p>
      </div>
    );
  }

  const getIcon = (code) => {
    if (code.includes("EXTREME") || code.includes("CRITICAL") || code.includes("VOICE")) {
      return <Flame className="w-4 h-4 text-[#FF4757] flex-shrink-0" />;
    }
    if (code.includes("MULE") || code.includes("FRAUD") || code.includes("SPIKE")) {
      return <AlertTriangle className="w-4 h-4 text-[#FFA502] flex-shrink-0" />;
    }
    return <AlertCircle className="w-4 h-4 text-[#00D2D3] flex-shrink-0" />;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
          Ranked Explainable Signals ({reasons.length})
        </h4>
        <span className="text-[11px] text-[#94A3B8] font-mono">Ranked by Contribution</span>
      </div>
      {reasons.map((r, idx) => {
        const weightPercent = Math.min(100, Math.max(15, (r.severity_weight || r.weight || 20) * 2.2));
        const isHigh = (r.severity_weight || r.weight) > 30;
        const isMed = (r.severity_weight || r.weight) > 15;

        return (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#0B101E] border border-[#262F43] transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5">{getIcon(r.code || "")}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                    #{r.rank_order || idx + 1} {r.code?.replace(/_/g, ' ')}
                  </span>
                  {(r.severity_weight !== undefined || r.weight !== undefined) && (
                    <span className="text-[11px] font-mono text-[#00D2D3] font-bold">
                      +{Math.round(r.severity_weight || r.weight)} pts
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  {r.message}
                </p>
                {/* Contribution bar */}
                <div className="w-full bg-[#151B2B] rounded-full h-1.5 mt-2 overflow-hidden border border-[#262F43]">
                  <div
                    className={`h-1.5 rounded-full ${
                      isHigh
                        ? "bg-[#FF4757]"
                        : isMed
                        ? "bg-[#FFA502]"
                        : "bg-[#00D2D3]"
                    }`}
                    style={{ width: `${weightPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
