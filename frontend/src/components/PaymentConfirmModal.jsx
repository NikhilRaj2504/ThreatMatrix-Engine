import React, { useState, useEffect } from 'react';
import { AlertOctagon, XCircle, CheckCircle, ShieldCheck, Clock } from 'lucide-react';
import { recordUserConfirmation } from '../services/api';

export default function PaymentConfirmModal({ assessment, isOpen, onClose, onDecisionMade }) {
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState(null);

  const isCritical = assessment?.risk_level === 'CRITICAL';
  const score = assessment?.final_risk_score || 0;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setDecisionSuccess(null);
      setFeedbackNote('');
      return;
    }
    if (isCritical) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [isOpen, isCritical]);

  if (!isOpen || !assessment) return null;

  const handleDecision = async (decision) => {
    setIsSubmitting(true);
    try {
      await recordUserConfirmation({
        assessment_id: assessment.assessment_id,
        decision: decision,
        feedback_comment: feedbackNote || (decision === 'CANCELLED' ? 'User heeded fraud warning' : 'User accepted risk')
      });
      setDecisionSuccess(decision);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onDecisionMade) onDecisionMade(decision);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit user decision:', err);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      {/* Mobile Simulation Frame */}
      <div className="w-full max-w-md bg-[#151B2B] border border-[#262F43] rounded-2xl shadow-2xl overflow-hidden text-[#F8FAFC] flex flex-col max-h-[90vh]">
        
        {/* UPI Header Simulation */}
        <div className="bg-[#0B101E] px-6 py-4 border-b border-[#262F43] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00D2D3] flex items-center justify-center text-xs font-black text-black">
              FS
            </div>
            <span className="text-xs font-bold tracking-wider text-[#F8FAFC]">UPI FRAUD SHIELD™</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/40 font-mono font-bold">
            INTERCEPTED
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {decisionSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              {decisionSuccess === 'CANCELLED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#2ED573]/20 border border-[#2ED573] flex items-center justify-center text-[#2ED573]">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[#2ED573]">Payment Safely Cancelled</h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs">
                    Your account has not been debited. Fraud Shield recorded this incident to protect other users.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#FFA502]/20 border border-[#FFA502] flex items-center justify-center text-[#FFA502]">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[#FFA502]">Payment Processed At Risk</h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs">
                    Transaction continued per your explicit confirmation.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Payment Summary */}
              <div className="p-4 rounded-xl bg-[#0B101E] border border-[#262F43] text-center">
                <div className="text-xs text-[#94A3B8] font-medium">Pending Transfer Amount</div>
                <div className="text-3xl font-extrabold font-mono text-[#F8FAFC] mt-1">
                  ₹{(assessment?.amount || assessment?.detailed_signals?.transaction?.amount || 50000).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#94A3B8] mt-1 flex items-center justify-center gap-1">
                  <span>To:</span>
                  <span className="font-mono text-[#00D2D3] font-bold">
                    {assessment?.receiver_upi || assessment?.detailed_signals?.entity?.upi_id || 'quick.fast.cash@paytm'}
                  </span>
                </div>
              </div>

              {/* Warning Banner */}
              <div className={`p-4 rounded-xl border ${isCritical ? 'bg-[#FF4757]/15 border-[#FF4757]/40' : 'bg-[#FFA502]/15 border-[#FFA502]/40'}`}>
                <div className="flex items-start gap-3">
                  <AlertOctagon className={`w-6 h-6 flex-shrink-0 ${isCritical ? 'text-[#FF4757]' : 'text-[#FFA502]'}`} />
                  <div>
                    <h3 className={`text-sm font-bold ${isCritical ? 'text-[#FF4757]' : 'text-[#FFA502]'}`}>
                      {assessment?.user_warning_title || 'High Risk Transaction Detected'}
                    </h3>
                    <p className="text-xs text-[#F8FAFC] mt-0.5 leading-relaxed">
                      {assessment?.guidance || 'This transaction exhibits characteristics strongly aligned with known financial fraud.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Why you are seeing this warning */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Why are you seeing this warning?
                </h4>
                <div className="space-y-1.5">
                  {assessment?.reasons?.slice(0, 4).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-[#0B101E] p-2.5 rounded-lg border border-[#262F43]">
                      <span className="text-[#00D2D3] font-bold">•</span>
                      <span className="text-[#F8FAFC]">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Note */}
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Optional note for fraud prevention:
                </label>
                <input
                  type="text"
                  placeholder="e.g., received suspicious call from someone claiming to be bank"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() => handleDecision('CANCELLED')}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#2ED573] hover:bg-[#26af5f] font-extrabold text-sm text-black flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-black" />
                  <span>CANCEL PAYMENT (Recommended)</span>
                </button>

                <button
                  onClick={() => handleDecision('CONTINUED')}
                  disabled={isSubmitting || countdown > 0}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${
                    countdown > 0
                      ? 'bg-[#0B101E] border-[#262F43] text-[#94A3B8] cursor-not-allowed'
                      : 'bg-[#FF4757]/15 border-[#FF4757]/40 text-[#FF4757] hover:bg-[#FF4757]/25'
                  }`}
                >
                  {countdown > 0 ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-[#94A3B8]" />
                      <span>Review carefully ({countdown}s)...</span>
                    </>
                  ) : (
                    <span>I understand the risk, Continue Anyway</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
