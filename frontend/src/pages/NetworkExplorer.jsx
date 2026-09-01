import React, { useState, useEffect } from 'react';
import { getEntityNetwork } from '../services/api';
import NetworkGraph from '../components/NetworkGraph';
import RiskBadge from '../components/RiskBadge';

export default function NetworkExplorer() {
  const [networkData, setNetworkData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState('quick.fast.cash@paytm');
  const [loading, setLoading] = useState(false);

  const fetchGraph = async (upiId) => {
    setLoading(true);
    try {
      const res = await getEntityNetwork(upiId, 3);
      setNetworkData(res.data);
    } catch (err) {
      console.error('Failed to load network graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(selectedEntityId);
  }, [selectedEntityId]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              MODULE G
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Payment Network & Syndicate Graph Explorer
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Topological analysis connecting Senders, Receiver UPI hubs, Multiplexed Devices, and Phishing Callers
          </p>
        </div>
      </div>

      {/* Preset Hub Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-[#151B2B] p-3 rounded-xl border border-[#262F43] text-xs">
        <span className="text-[#94A3B8] font-bold px-2">Investigate Syndicate Cluster:</span>
        {[
          { label: '🚨 Quick Cash Mule Hub', upi: 'quick.fast.cash@paytm' },
          { label: '🚨 Fake KYC Desk Ring', upi: 'kyc.verification.desk@ybl' },
          { label: '🚨 Telegram Crypto Ring', upi: 'crypto.trader99@okhdfcbank' },
          { label: '✅ DMart Legitimate Hub', upi: 'dmart.retail@axis' },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedEntityId(item.upi)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              selectedEntityId === item.upi
                ? 'bg-[#00D2D3] text-black shadow-sm'
                : 'bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#262F43]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Graph Area & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkGraph
            graphData={networkData}
            onNodeSelect={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Node Inspector Panel */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262F43] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Graph Entity Inspector
            </h3>
            {selectedNode && (
              <RiskBadge
                score={selectedNode.risk_score}
                level={selectedNode.risk_score >= 70 ? 'CRITICAL' : 'LOW'}
                size="sm"
              />
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-2">
                <div className="font-mono text-sm font-bold text-[#F8FAFC] break-all">
                  {selectedNode.id}
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Entity Type:</span>
                  <span className="font-bold text-[#F8FAFC]">{selectedNode.type}</span>
                </div>
                {selectedNode.holder && (
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Holder:</span>
                    <span className="font-bold text-[#00D2D3]">{selectedNode.holder}</span>
                  </div>
                )}
                {selectedNode.inflow > 0 && (
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Observed Inflow:</span>
                    <span className="font-mono text-[#2ED573] font-bold">
                      ₹{selectedNode.inflow?.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {selectedNode.reports > 0 && (
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Fraud Reports:</span>
                    <span className="font-mono text-[#FF4757] font-bold">
                      {selectedNode.reports} complaints
                    </span>
                  </div>
                )}
              </div>

              {/* Topology Signals */}
              <div className="p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Detected Network Patterns
                </div>
                {selectedNode.risk_score >= 70 ? (
                  <div className="text-[#FF4757] space-y-1">
                    <p className="font-bold">• Multi-Victim Star Topology Identified</p>
                    <p className="text-[#94A3B8] text-[11px]">
                      This node acts as a primary aggregation point connected to multiple independent senders.
                    </p>
                  </div>
                ) : (
                  <div className="text-[#2ED573] space-y-1">
                    <p className="font-bold">• Normal Peer Connectivity</p>
                    <p className="text-[#94A3B8] text-[11px]">
                      No anomalous syndicate clustering or shared hardware reuse found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[#94A3B8] text-xs">
              Click any node in the graph visualization to view its topological links and risk metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
