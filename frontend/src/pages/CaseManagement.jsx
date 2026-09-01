import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { getInvestigationCases, reviewCase } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [reviewVerdict, setReviewVerdict] = useState('CONFIRMED_FRAUD');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    try {
      const res = await getInvestigationCases();
      setCases(res.data);
      if (!selectedCase && res.data.length > 0) {
        setSelectedCase(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleReviewSubmit = async () => {
    if (!selectedCase) return;
    setIsSubmitting(true);
    try {
      await reviewCase({
        assessment_id: selectedCase.assessment_id,
        verdict: reviewVerdict,
        notes: reviewNotes || `Analyst classified as ${reviewVerdict}`,
      });
      fetchCases();
      setSelectedCase((prev) => ({ ...prev, analyst_verdict: reviewVerdict }));
      setReviewNotes('');
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterVerdict === 'ALL') return true;
    return c.analyst_verdict === filterVerdict;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              SOC ANALYST PORTAL
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Fraud Investigation & False Positive Management
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Review intercepted payments, evaluate user warning feedback, and record training ground truth
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#151B2B] p-3 rounded-xl border border-[#262F43] text-xs">
        <span className="text-[#94A3B8] font-bold px-2">Filter Verdict:</span>
        {['ALL', 'UNREVIEWED', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'LEGITIMATE'].map((verdict) => (
          <button
            key={verdict}
            onClick={() => setFilterVerdict(verdict)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              filterVerdict === verdict
                ? 'bg-[#00D2D3] text-black shadow-sm'
                : 'bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#262F43]'
            }`}
          >
            {verdict.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid: Cases List + Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-[#151B2B] border border-[#262F43] overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0B101E] border-b border-[#262F43] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Assessment ID</th>
                  <th className="py-2.5 px-3">Parties</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">User Action</th>
                  <th className="py-2.5 px-3 text-right">Analyst Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262F43] text-[#F8FAFC]">
                {filteredCases.map((c, i) => {
                  const isSelected = selectedCase?.assessment_id === c.assessment_id;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedCase(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0B101E] border-l-2 border-[#00D2D3]' : 'hover:bg-[#0B101E]'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#F8FAFC]">
                        {c.assessment_id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#F8FAFC]">{c.sender_id}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">→ {c.receiver_upi}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#F8FAFC]">
                        ₹{c.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                            c.user_decision === 'CANCELLED'
                              ? 'bg-[#2ED573]/20 text-[#2ED573] border-[#2ED573]/40'
                              : c.user_decision === 'CONTINUED'
                              ? 'bg-[#FFA502]/20 text-[#FFA502] border-[#FFA502]/40'
                              : 'bg-[#0B101E] text-[#94A3B8] border-[#262F43]'
                          }`}
                        >
                          {c.user_decision}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                            c.analyst_verdict === 'CONFIRMED_FRAUD'
                              ? 'bg-[#FF4757]/20 text-[#FF4757] border-[#FF4757]/40'
                              : c.analyst_verdict === 'FALSE_POSITIVE'
                              ? 'bg-[#00D2D3]/20 text-[#00D2D3] border-[#00D2D3]/40'
                              : c.analyst_verdict === 'LEGITIMATE'
                              ? 'bg-[#2ED573]/20 text-[#2ED573] border-[#2ED573]/40'
                              : 'bg-[#0B101E] text-[#94A3B8] border-[#262F43]'
                          }`}
                        >
                          {c.analyst_verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case Verdict Submission Panel */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div className="flex items-center justify-between border-b border-[#262F43] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Analyst Case Adjudication
            </h3>
            {selectedCase && (
              <RiskBadge level={selectedCase.risk_level} score={selectedCase.risk_score} size="sm" />
            )}
          </div>

          {selectedCase ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Assessment:</span>
                  <span className="font-mono text-[#F8FAFC] font-bold">{selectedCase.assessment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Amount:</span>
                  <span className="font-mono text-[#F8FAFC] font-bold">₹{selectedCase.amount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">User Warning Decision:</span>
                  <span className="font-mono text-[#00D2D3] font-bold">{selectedCase.user_decision}</span>
                </div>
              </div>

              {/* Reasons Breakdown */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Triggered Fraud Reasons:
                </div>
                {selectedCase.reasons?.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#0B101E] text-[#F8FAFC] text-[11px] border border-[#262F43]">
                    • {r.message}
                  </div>
                ))}
              </div>

              {/* Adjudication Verdict Options */}
              <div className="space-y-2 pt-2 border-t border-[#262F43]">
                <label className="text-[#94A3B8] font-bold block">Record Ground Truth Verdict:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CONFIRMED_FRAUD', label: '🛑 Fraud' },
                    { id: 'FALSE_POSITIVE', label: '🛡️ False Positive' },
                    { id: 'LEGITIMATE', label: '✅ Legitimate' },
                    { id: 'NEEDS_REVIEW', label: '❓ Escalate' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setReviewVerdict(v.id)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                        reviewVerdict === v.id
                          ? 'bg-[#00D2D3] text-black border-[#00D2D3] shadow-sm'
                          : 'bg-[#0B101E] border-[#262F43] text-[#F8FAFC] hover:border-[#374151]'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[#94A3B8] font-bold block mt-3 mb-1">
                    Analyst Investigation Notes:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter case observations for model retraining feedback..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
                  />
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#2ED573] hover:bg-[#26af5f] font-extrabold text-xs text-black flex items-center justify-center gap-2 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-black" />
                  <span>{isSubmitting ? 'Recording Verdict...' : 'Submit Ground Truth Verdict'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[#94A3B8] text-xs">
              Select a flagged case to review evidence and submit analyst verdict.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
