import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Users,
  IndianRupee,
  Calendar,
  Flame,
  FileWarning
} from 'lucide-react';
import { getEntities, getEntityProfile, getEntityNetwork } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import NetworkGraph from '../components/NetworkGraph';

export default function EntityIntelligence() {
  const [entities, setEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEntities(30)
      .then((res) => {
        setEntities(res.data);
        if (res.data.length > 0) {
          handleSelectEntity(res.data[0].upi_id);
        }
      })
      .catch((err) => console.error('Failed to load entities:', err));
  }, []);

  const handleSelectEntity = async (upiId) => {
    setSelectedEntity(upiId);
    setLoading(true);
    try {
      const [profRes, netRes] = await Promise.all([
        getEntityProfile(upiId),
        getEntityNetwork(upiId, 2),
      ]);
      setProfileData(profRes.data);
      setNetworkData(netRes.data);
    } catch (err) {
      console.error('Failed to fetch entity details:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = entities.filter(
    (e) =>
      e.upi_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.account_holder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              MODULE B & C
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              UPI Receiver Entity Intelligence
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Mule account detection, sender dispersion ratios, inflow bursts, and business profile mismatches
          </p>
        </div>
      </div>

      {/* Main Grid: Entity Directory + Deep-Dive Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity List & Search */}
        <div className="p-4 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search UPI or Merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
            />
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredEntities.map((e) => {
              const isSelected = selectedEntity === e.upi_id;
              const isHighRisk = e.entity_risk_score >= 70;
              return (
                <div
                  key={e.upi_id}
                  onClick={() => handleSelectEntity(e.upi_id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-[#0B101E] border-[#00D2D3]'
                      : 'bg-[#0B101E] border-[#262F43] hover:border-[#374151]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#F8FAFC] truncate">{e.upi_id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isHighRisk
                          ? 'bg-[#FF4757]/20 text-[#FF4757] border-[#FF4757]/40'
                          : 'bg-[#2ED573]/20 text-[#2ED573] border-[#2ED573]/40'
                      }`}
                    >
                      {Math.round(e.entity_risk_score)}/100
                    </span>
                  </div>
                  <div className="text-xs text-[#F8FAFC] font-medium">{e.account_holder}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                    <span>{e.declared_category}</span>
                    <span>{e.fraud_reports_count} reports</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Profile & Subgraph */}
        <div className="lg:col-span-2 space-y-6">
          {profileData ? (
            <>
              {/* Profile Card Summary */}
              <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262F43]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#F8FAFC] font-mono">{profileData.upi_id}</h2>
                      <RiskBadge score={profileData.entity_risk_score} level={profileData.entity_risk_score >= 70 ? 'CRITICAL' : 'LOW'} />
                    </div>
                    <div className="text-xs text-[#94A3B8] font-medium mt-0.5">
                      Holder: <span className="text-[#00D2D3] font-bold">{profileData.account_holder}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <div className="text-[#94A3B8]">Declared Category:</div>
                    <div className="font-bold text-[#F8FAFC]">{profileData.declared_category}</div>
                  </div>
                </div>

                {/* Stat Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Total Inflow</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[#F8FAFC]">
                      ₹{profileData.total_inflow?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                      <Users className="w-3.5 h-3.5" />
                      <span>Unique Senders</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[#00D2D3]">
                      {profileData.unique_senders_count} ({Math.round(profileData.metrics?.unique_sender_ratio * 100)}%)
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Account Age</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[#F8FAFC]">
                      {profileData.metrics?.account_age_days} Days
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                      <FileWarning className="w-3.5 h-3.5 text-[#FF4757]" />
                      <span>Fraud Complaints</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-[#FF4757]">
                      {profileData.fraud_reports_count} Registered
                    </div>
                  </div>
                </div>

                {/* Mule / Profile Mismatch Signals */}
                {profileData.metrics?.signals?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                      Behavioral Anomaly Triggers
                    </div>
                    <div className="space-y-1.5">
                      {profileData.metrics.signals.map((sig, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-[#0B101E] border border-[#FF4757]/40 text-xs text-[#F8FAFC] flex items-start gap-2.5"
                        >
                          <Flame className="w-4 h-4 flex-shrink-0 text-[#FF4757] mt-0.5" />
                          <div>
                            <span className="font-bold font-mono text-[#FF4757] block">{sig.code}</span>
                            <span className="text-[#94A3B8]">{sig.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subgraph visualization for this receiver */}
              <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    Ego Network Neighborhood Graph
                  </h3>
                  <span className="text-xs text-[#00D2D3] font-mono font-bold">2-Hop Depth</span>
                </div>
                <NetworkGraph graphData={networkData} selectedNodeId={`upi:${profileData.upi_id}`} />
              </div>
            </>
          ) : (
            <div className="p-12 rounded-xl bg-[#151B2B] border border-[#262F43] text-center text-[#94A3B8] text-xs">
              Select an entity to review its behavioral profile and network links.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
