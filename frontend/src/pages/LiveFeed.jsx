import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { getLiveFeed } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';

export default function LiveFeed({ selectedTxFromParent }) {
  const [feed, setFeed] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const res = await getLiveFeed(50);
      setFeed(res.data);
      if (!selectedTx && res.data.length > 0) {
        setSelectedTx(selectedTxFromParent || res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTxFromParent) {
      setSelectedTx(selectedTxFromParent);
    }
  }, [selectedTxFromParent]);

  const filteredFeed = feed.filter((tx) => {
    const matchesLevel = filterLevel === 'ALL' || tx.risk_level === filterLevel;
    const matchesSearch =
      tx.sender_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiver_upi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#151B2B] border border-[#262F43]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2ED573]" />
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Real-Time Transaction Risk Stream
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Live telemetry of evaluated UPI payments and multi-signal fraud scoring
          </p>
        </div>
        <button
          onClick={fetchFeed}
          className="px-3.5 py-2 rounded-lg bg-[#0B101E] hover:bg-[#262F43] text-[#F8FAFC] text-xs font-bold flex items-center gap-1.5 border border-[#262F43] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#00D2D3]" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#151B2B] p-3 rounded-xl border border-[#262F43]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search User, UPI ID, TxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterLevel === lvl
                  ? 'bg-[#00D2D3] text-black shadow-sm'
                  : 'bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#262F43]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Stream Table + Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Table */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-[#151B2B] border border-[#262F43] overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0B101E] border-b border-[#262F43] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Parties</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262F43] text-[#F8FAFC]">
                {filteredFeed.map((tx, idx) => {
                  const isSelected = selectedTx?.assessment_id === tx.assessment_id;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedTx(tx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0B101E] border-l-2 border-[#00D2D3]' : 'hover:bg-[#0B101E]'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#F8FAFC]">{tx.transaction_id || `TXN_${idx}`}</div>
                        <div className="text-[10px] text-[#94A3B8] font-mono">
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'Just now'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#F8FAFC]">{tx.sender_id}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">→ {tx.receiver_upi}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#F8FAFC]">
                        ₹{tx.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-xs text-[#00D2D3] text-right">
                        {tx.action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Inspection Drawer */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262F43] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Transaction Deep-Dive
            </h3>
            {selectedTx && (
              <RiskBadge level={selectedTx.risk_level} score={selectedTx.risk_score} size="sm" />
            )}
          </div>

          {selectedTx ? (
            <div className="space-y-4">
              <RiskGauge score={selectedTx.risk_score} size={150} />

              <div className="p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Transaction ID:</span>
                  <span className="font-mono text-[#F8FAFC] font-bold">{selectedTx.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Sender ID:</span>
                  <span className="font-mono text-[#F8FAFC]">{selectedTx.sender_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Receiver UPI:</span>
                  <span className="font-mono text-[#00D2D3] font-bold">{selectedTx.receiver_upi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Amount:</span>
                  <span className="font-mono text-[#F8FAFC] font-bold">₹{selectedTx.amount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Location:</span>
                  <span className="text-[#F8FAFC]">{selectedTx.location || 'Mumbai'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Policy Verdict:</span>
                  <span className="font-mono text-[#2ED573] font-bold">{selectedTx.action}</span>
                </div>
              </div>

              {/* Top Reason */}
              <div className="p-3 rounded-lg bg-[#0B101E] border border-[#262F43] text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  Primary Anomaly Trigger
                </div>
                <p className="text-[#F8FAFC] leading-relaxed">
                  {selectedTx.top_reason || 'Transaction amounts and entity histories match approved safe baseline.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[#94A3B8] text-xs">
              Select a transaction from the live feed to inspect its full signal breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
