import React from 'react';
import { ShieldAlert, User, Cpu } from 'lucide-react';

export default function Navbar({ onOpenSimulator }) {
  return (
    <header className="h-16 bg-[#151B2B] border-b border-[#262F43] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand logo & status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#00D2D3] flex items-center justify-center text-black">
          <ShieldAlert className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-[#F8FAFC] text-base">
              FRAUD SHIELD
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              SOC ENGINE v1.0
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] hidden sm:block">
            Explainable Real-Time UPI & Voice Phishing Defense
          </p>
        </div>
      </div>

      {/* System Status Indicators & Actions */}
      <div className="flex items-center gap-4">
        {/* Real-time Health Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101E] border border-[#262F43] text-xs">
          <span className="h-2 w-2 rounded-full bg-[#2ED573]" />
          <span className="text-[#94A3B8] font-medium">Inference Engine:</span>
          <span className="text-[#1E90FF] font-mono font-semibold">ONLINE (14ms)</span>
        </div>

        {/* Simulator Launch Button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00D2D3] hover:bg-[#00b8b9] text-black font-extrabold text-xs transition-colors"
        >
          <Cpu className="w-4 h-4 text-black" />
          <span>Simulate Attack</span>
        </button>

        {/* Analyst Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#262F43]">
          <div className="w-8 h-8 rounded-lg bg-[#0B101E] border border-[#262F43] flex items-center justify-center text-[#94A3B8]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-[#F8FAFC]">Security Ops</div>
            <div className="text-[10px] text-[#94A3B8] font-mono">SOC Analyst 01</div>
          </div>
        </div>
      </div>
    </header>
  );
}
