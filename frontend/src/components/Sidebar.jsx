import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Building2,
  PhoneCall,
  Share2,
  FileCheck2,
  Cpu
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, alertCount = 0 }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      iconColor: 'text-[#1E90FF]'
    },
    {
      id: 'live-feed',
      label: 'Live Risk Feed',
      icon: Zap,
      iconColor: 'text-[#2ED573]',
      badge: 'LIVE',
      badgeClass: 'bg-[#2ED573]/20 text-[#2ED573] border-[#2ED573]/40'
    },
    {
      id: 'simulator',
      label: 'Simulation Workbench',
      icon: Cpu,
      iconColor: 'text-[#00D2D3]',
      badge: 'DEMO',
      badgeClass: 'bg-[#00D2D3]/20 text-[#00D2D3] border-[#00D2D3]/40'
    },
    {
      id: 'entities',
      label: 'Entity Intelligence',
      icon: Building2,
      iconColor: 'text-[#A855F7]'
    },
    {
      id: 'voice',
      label: 'Voice Phishing',
      icon: PhoneCall,
      iconColor: 'text-[#FFA502]'
    },
    {
      id: 'network',
      label: 'Network Graph',
      icon: Share2,
      iconColor: 'text-[#06B6D4]'
    },
    {
      id: 'cases',
      label: 'Case Review & FP',
      icon: FileCheck2,
      iconColor: 'text-[#FF4757]',
      badge: alertCount > 0 ? alertCount : null,
      badgeClass: 'bg-[#FF4757]/20 text-[#FF4757] border-[#FF4757]/40'
    },
  ];

  return (
    <aside className="w-64 bg-[#111827] border-r border-[#262F43] p-4 flex flex-col justify-between flex-shrink-0">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#00D2D3] text-black shadow-lg shadow-[#00D2D3]/20 font-black'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : item.iconColor}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border font-mono ${
                    isActive ? 'bg-black text-[#00D2D3] border-black' : item.badgeClass
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Info Card */}
      <div className="p-3.5 rounded-xl bg-[#0B101E] border border-[#262F43] text-[11px] text-[#94A3B8] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8] font-medium">Engine Mode</span>
          <span className="font-mono text-[#00D2D3] font-bold px-1.5 py-0.5 rounded bg-[#00D2D3]/10 border border-[#00D2D3]/30 text-[10px]">
            Hybrid ML+Rules
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#94A3B8] font-medium">ML Model</span>
          <span className="font-mono text-[#2ED573] font-bold">XGBoost v1.0</span>
        </div>
      </div>
    </aside>
  );
}
