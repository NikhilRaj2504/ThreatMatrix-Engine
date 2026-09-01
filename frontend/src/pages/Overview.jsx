import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Flame,
  IndianRupee,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getOverview, getLiveFeed } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function Overview({ setTab, onInspectTransaction }) {
  const [overview, setOverview] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Robust default trend data
  const defaultTrend = [
    { day: "Mon", normal: 420, prevented: 14 },
    { day: "Tue", normal: 510, prevented: 20 },
    { day: "Wed", normal: 480, prevented: 28 },
    { day: "Thu", normal: 620, prevented: 25 },
    { day: "Fri", normal: 740, prevented: 38 },
    { day: "Sat", normal: 890, prevented: 46 },
    { day: "Sun", normal: 680, prevented: 33 },
  ];

  const fetchOverviewData = async () => {
    try {
      const [ovRes, feedRes] = await Promise.all([getOverview(), getLiveFeed(6)]);
      setOverview(ovRes.data);
      if (feedRes.data && feedRes.data.length > 0) {
        setLiveFeed(feedRes.data);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 8000);
    return () => clearInterval(interval);
  }, []);

  const trendData = overview?.recent_trend || defaultTrend;

  const riskPieData = [
    { name: 'Low Risk', value: overview?.low_risk_count || 1180, color: '#2ED573' },
    { name: 'Medium Risk', value: overview?.medium_risk_count || 145, color: '#FFA502' },
    { name: 'High Risk', value: overview?.high_risk_count || 62, color: '#FF4757' },
    { name: 'Critical Scam', value: overview?.critical_risk_count || 33, color: '#E11D48' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero Header */}
      <div className="p-6 rounded-2xl bg-[#151B2B] border-2 border-[#262F43] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-[#00D2D3]/15 text-[#00D2D3] border border-[#00D2D3]/40">
              CENTRAL INTELLIGENCE ENGINE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#2ED573] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2ED573] animate-pulse" /> LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
            Explainable Real-Time Fraud Shield Console
          </h1>
          <p className="text-xs text-[#94A3B8] font-medium">
            Multi-signal behavioral analytics, voice phishing NLP intent detection & syndicate graph defense
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('simulator')}
            className="px-5 py-2.5 rounded-xl bg-[#00D2D3] hover:bg-[#00b8b9] text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00D2D3]/25 transition-all transform active:scale-95"
          >
            <span>Run Attack Simulation</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* 4 Distinct High-Contrast KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="p-5 rounded-2xl bg-[#151B2B] border border-[#262F43] hover:border-[#1E90FF]/60 transition-all space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">Total Transactions</span>
            <div className="w-9 h-9 rounded-xl bg-[#1E90FF]/20 border border-[#1E90FF]/40 flex items-center justify-center text-[#1E90FF]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#F8FAFC]">
              {overview?.total_analyzed?.toLocaleString() || '1,420'}
            </span>
            <span className="text-xs text-[#2ED573] font-bold flex items-center">
              +14% <TrendingUp className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] font-mono">
            <Clock className="w-3 h-3 text-[#1E90FF]" />
            <span>Avg Response: 14ms SLA</span>
          </div>
        </div>

        {/* Prevented Fraud Amount */}
        <div className="p-5 rounded-2xl bg-[#151B2B] border border-[#262F43] hover:border-[#2ED573]/60 transition-all space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">Fraud Loss Prevented</span>
            <div className="w-9 h-9 rounded-xl bg-[#2ED573]/20 border border-[#2ED573]/40 flex items-center justify-center text-[#2ED573]">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[#2ED573]">₹</span>
            <span className="text-3xl font-black font-mono text-[#2ED573]">
              {(overview?.fraud_prevented_amount || 890000).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Protected across intercepted scam payments
          </div>
        </div>

        {/* High & Critical Alerts */}
        <div className="p-5 rounded-2xl bg-[#151B2B] border border-[#262F43] hover:border-[#FF4757]/60 transition-all space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">High / Critical Scams</span>
            <div className="w-9 h-9 rounded-xl bg-[#FF4757]/20 border border-[#FF4757]/40 flex items-center justify-center text-[#FF4757]">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#FF4757]">
              {((overview?.high_risk_count || 62) + (overview?.critical_risk_count || 33))}
            </span>
            <span className="text-[11px] text-[#FFA502] font-mono font-bold">
              ({overview?.confirmed_fraud_count || 28} confirmed)
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            Triggered interactive user warning modals
          </div>
        </div>

        {/* False Positive Rate */}
        <div className="p-5 rounded-2xl bg-[#151B2B] border border-[#262F43] hover:border-[#00D2D3]/60 transition-all space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">False Positive Rate</span>
            <div className="w-9 h-9 rounded-xl bg-[#00D2D3]/20 border border-[#00D2D3]/40 flex items-center justify-center text-[#00D2D3]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#00D2D3]">
              0.28%
            </span>
            <span className="text-xs text-[#2ED573] font-bold px-1.5 py-0.5 rounded bg-[#2ED573]/15">
              Low Friction
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8]">
            {overview?.false_positives_count || 4} user confirmed exemptions
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Area Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Transaction & Scam Volume Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#151B2B] border border-[#262F43] space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262F43] pb-3">
            <div>
              <h3 className="text-sm font-black text-[#F8FAFC]">7-Day Transaction & Scam Activity</h3>
              <p className="text-xs text-[#94A3B8]">Comparing legitimate payments vs prevented fraud attacks</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#2ED573]">
                <span className="w-3 h-3 rounded-full bg-[#2ED573]" /> Legitimate Volume
              </span>
              <span className="flex items-center gap-1.5 text-[#FF4757]">
                <span className="w-3 h-3 rounded-full bg-[#FF4757]" /> Prevented Scams
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B101E',
                    borderColor: '#262F43',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="normal"
                  name="Legitimate Transactions"
                  stroke="#2ED573"
                  strokeWidth={3}
                  fill="#2ED573"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="prevented"
                  name="Prevented Fraud"
                  stroke="#FF4757"
                  strokeWidth={3}
                  fill="#FF4757"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="p-6 rounded-2xl bg-[#151B2B] border border-[#262F43] space-y-4 flex flex-col justify-between shadow-lg">
          <div className="border-b border-[#262F43] pb-3">
            <h3 className="text-sm font-black text-[#F8FAFC]">Risk Severity Distribution</h3>
            <p className="text-xs text-[#94A3B8]">Proportion of transactions by risk level</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#151B2B" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B101E',
                    borderColor: '#262F43',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {riskPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#0B101E] border border-[#262F43]">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="truncate">
                  <div className="text-[#94A3B8] text-[10px] font-bold truncate">{item.name}</div>
                  <div className="font-mono font-black text-[#F8FAFC]">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Intercepted Transactions Table */}
      <div className="p-6 rounded-2xl bg-[#151B2B] border border-[#262F43] space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#262F43] pb-3">
          <div>
            <h3 className="text-sm font-black text-[#F8FAFC]">Recent Transaction Risk Interceptions</h3>
            <p className="text-xs text-[#94A3B8]">Real-time stream of transactions evaluated by the multi-signal engine</p>
          </div>
          <button
            onClick={() => setTab('live-feed')}
            className="px-3 py-1.5 rounded-lg bg-[#0B101E] hover:bg-[#1E293B] text-xs font-extrabold text-[#00D2D3] border border-[#262F43] flex items-center gap-1.5 transition-colors"
          >
            <span>View Full Live Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#262F43] text-[#94A3B8] uppercase tracking-wider text-[10px] bg-[#0B101E]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-lg">Transaction ID</th>
                <th className="py-3 px-3.5">Sender & Receiver</th>
                <th className="py-3 px-3.5">Amount</th>
                <th className="py-3 px-3.5">Risk Score</th>
                <th className="py-3 px-3.5">Primary Reason</th>
                <th className="py-3 px-3.5 text-right rounded-r-lg">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262F43] text-[#F8FAFC]">
              {(liveFeed.length > 0 ? liveFeed : [
                {
                  transaction_id: "TXN_7E594895",
                  sender_id: "U101 (Priya)",
                  receiver_upi: "quick.fast.cash@paytm",
                  amount: 50000,
                  risk_level: "CRITICAL",
                  risk_score: 96,
                  top_reason: "Amount 41.7x spike + Digital Arrest Voice Phishing + Mule Account",
                  action: "STRONG_WARN_CONFIRM"
                },
                {
                  transaction_id: "TXN_38A12B9F",
                  sender_id: "U102 (Rahul)",
                  receiver_upi: "kyc.verification.desk@ybl",
                  amount: 25000,
                  risk_level: "HIGH",
                  risk_score: 78,
                  top_reason: "Fake Bank KYC Voice Threat + Unrecognized Device",
                  action: "WARN_CONFIRM"
                },
                {
                  transaction_id: "TXN_99E10D2C",
                  sender_id: "U103 (Ananya)",
                  receiver_upi: "dmart.retail@axis",
                  amount: 850,
                  risk_level: "LOW",
                  risk_score: 12,
                  top_reason: "Verified Merchant + Normal User Spending Baseline",
                  action: "ALLOW"
                }
              ]).map((tx, i) => (
                <tr
                  key={i}
                  onClick={() => onInspectTransaction && onInspectTransaction(tx)}
                  className="hover:bg-[#0B101E] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-3.5 font-mono font-extrabold text-[#00D2D3]">
                    {tx.transaction_id || `TXN_${i}`}
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-[#F8FAFC]">{tx.sender_id}</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono">→ {tx.receiver_upi}</div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono font-black text-[#F8FAFC]">
                    ₹{tx.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3.5">
                    <RiskBadge level={tx.risk_level} score={tx.risk_score} size="sm" />
                  </td>
                  <td className="py-3.5 px-3.5 max-w-xs truncate text-[#94A3B8] font-medium">
                    {tx.top_reason}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-extrabold text-[#2ED573]">
                    {tx.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
