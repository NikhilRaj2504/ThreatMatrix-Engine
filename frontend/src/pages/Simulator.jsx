import React, { useState, useEffect } from 'react';
import {
  Play,
  RefreshCw,
  AlertOctagon,
  Sparkles,
  Zap
} from 'lucide-react';
import { getScenarios, runScenario, analyzeCombined } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import RiskBadge from '../components/RiskBadge';
import ExplainReasons from '../components/ExplainReasons';
import PaymentConfirmModal from '../components/PaymentConfirmModal';

export default function Simulator() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [engineOutput, setEngineOutput] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Custom simulation form
  const [customSender, setCustomSender] = useState('U101');
  const [customReceiver, setCustomReceiver] = useState('quick.fast.cash@paytm');
  const [customAmount, setCustomAmount] = useState('50000');
  const [customDevice, setCustomDevice] = useState('DEV_ROG_99');
  const [customLocation, setCustomLocation] = useState('Bhubaneswar');
  const [customDescription, setCustomDescription] = useState('Customs verification fee');
  const [customCaller, setCustomCaller] = useState('+919876500111');
  const [customTranscript, setCustomTranscript] = useState(
    'This is Officer Sharma from Cyber Crime. Your parcel with fake passports was seized. You are under digital arrest. Transfer 50000 rupees immediately to verify.'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getScenarios()
      .then((res) => setScenarios(res.data))
      .catch((err) => console.error('Failed to load scenarios:', err));
  }, []);

  const handleRunScenario = async (scen) => {
    setActiveScenarioId(scen.id);
    setIsRunning(true);
    setEngineOutput(null);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 250);
    setTimeout(() => setActiveStep(3), 500);
    setTimeout(() => setActiveStep(4), 750);

    try {
      const res = await runScenario(scen.id);
      setTimeout(() => {
        setActiveStep(5);
        setEngineOutput(res.data.engine_output);
        setIsRunning(false);
        if (res.data.engine_output.requires_user_confirmation) {
          setIsModalOpen(true);
        }
      }, 950);
    } catch (err) {
      console.error('Failed to execute scenario:', err);
      setIsRunning(false);
    }
  };

  const handleRunCustom = async () => {
    setIsRunning(true);
    setActiveScenarioId('custom');
    setEngineOutput(null);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 200);
    setTimeout(() => setActiveStep(3), 450);
    setTimeout(() => setActiveStep(4), 700);

    try {
      const payload = {
        transaction: {
          sender_id: customSender,
          receiver_upi: customReceiver,
          amount: parseFloat(customAmount) || 1000.0,
          device_id: customDevice,
          location: customLocation,
          description: customDescription,
        },
        call: customTranscript.trim()
          ? {
              caller_number: customCaller,
              recipient_id: customSender,
              transcript: customTranscript,
            }
          : null,
      };

      const res = await analyzeCombined(payload);
      setTimeout(() => {
        setActiveStep(5);
        setEngineOutput(res.data);
        setIsRunning(false);
        if (res.data.requires_user_confirmation) {
          setIsModalOpen(true);
        }
      }, 900);
    } catch (err) {
      console.error('Failed custom analysis:', err);
      setIsRunning(false);
    }
  };

  const pipelineSteps = [
    { title: '1. Ingestion & Baseline', desc: 'User history & device delta' },
    { title: '2. Entity Analytics', desc: 'Mule ratio & inflow velocity' },
    { title: '3. Voice NLP & Intent', desc: 'Impersonation & scam templates' },
    { title: '4. Network Graph', desc: 'Syndicate rings & caller links' },
    { title: '5. Multi-Layer Fusion', desc: 'Rules + XGBoost probability' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              DEMO WORKBENCH
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Fraud & Voice Phishing Simulation Engine
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Test the 5 standardized hackathon attack vectors or configure bespoke synthetic fraud transactions.
          </p>
        </div>
      </div>

      {/* 5 Predefined Scenario Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
          Predefined Attack & Verification Scenarios (1-Click Run)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map((scen) => {
            const isSelected = activeScenarioId === scen.id;
            return (
              <div
                key={scen.id}
                onClick={() => !isRunning && handleRunScenario(scen)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-[#151B2B] border-[#00D2D3]'
                    : 'bg-[#151B2B] border-[#262F43] hover:border-[#374151]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F8FAFC]">{scen.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3] font-bold">
                      {scen.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                    {scen.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#262F43] flex items-center justify-between text-xs">
                  <div className="text-[11px] text-[#94A3B8]">
                    Expected: <span className="text-[#F8FAFC] font-bold">{scen.expected.level}</span>
                  </div>
                  <button
                    disabled={isRunning}
                    className="px-3 py-1 rounded bg-[#00D2D3] hover:bg-[#00b8b9] text-black font-extrabold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current text-black" />
                    <span>Run Test</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Pipeline Execution Animator */}
      {isRunning && (
        <div className="p-6 rounded-xl bg-[#151B2B] border border-[#00D2D3] space-y-4">
          <div className="flex items-center gap-2 text-[#00D2D3] font-bold text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-[#00D2D3]" />
            <span>Executing Real-Time Analysis Pipeline...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pipelineSteps.map((step, idx) => {
              const isCompleted = activeStep > idx + 1;
              const isCurrent = activeStep === idx + 1;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isCompleted
                      ? 'bg-[#0B101E] border-[#2ED573] text-[#2ED573]'
                      : isCurrent
                      ? 'bg-[#0B101E] border-[#00D2D3] text-[#00D2D3]'
                      : 'bg-[#0B101E] border-[#262F43] text-[#94A3B8]'
                  }`}
                >
                  <div className="font-bold">{step.title}</div>
                  <div className="text-[10px] mt-0.5 opacity-80">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engine Output Display */}
      {engineOutput && (
        <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262F43]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-[#F8FAFC]">
                  Risk Engine Assessment Output
                </h3>
                <RiskBadge level={engineOutput.risk_level} score={engineOutput.final_risk_score} />
              </div>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Assessment ID: {engineOutput.assessment_id}
              </p>
            </div>
            {engineOutput.requires_user_confirmation && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#FF4757] hover:bg-[#e03847] text-white font-extrabold text-xs flex items-center gap-2 transition-colors"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>View User Warning Modal</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge & Subscores */}
            <div className="space-y-4">
              <RiskGauge score={engineOutput.final_risk_score} />

              <div className="p-4 rounded-xl bg-[#0B101E] border border-[#262F43] space-y-2 text-xs">
                <div className="font-bold text-[#94A3B8] uppercase tracking-wider text-[10px] pb-1 border-b border-[#262F43]">
                  Sub-Engine Risk Scores
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Transaction Risk:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">
                    {engineOutput.scores_breakdown.transaction_risk}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Receiver Entity Risk:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">
                    {engineOutput.scores_breakdown.entity_risk}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Voice Phishing Risk:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">
                    {engineOutput.scores_breakdown.voice_risk}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Network Graph Risk:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">
                    {engineOutput.scores_breakdown.network_risk}/100
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#262F43] text-[#00D2D3] font-bold">
                  <span>ML Probability P(Fraud):</span>
                  <span className="font-mono">
                    {(engineOutput.scores_breakdown.ml_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Explainable Reasons */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-[#0B101E] border border-[#262F43]">
                <div className="text-xs font-bold text-[#94A3B8] mb-1">Recommended Policy Action</div>
                <div className="text-sm font-extrabold text-[#00D2D3] font-mono">
                  {engineOutput.recommended_action}
                </div>
                <p className="text-xs text-[#F8FAFC] mt-1 leading-relaxed">
                  {engineOutput.guidance}
                </p>
              </div>

              <ExplainReasons reasons={engineOutput.reasons} riskLevel={engineOutput.risk_level} />
            </div>
          </div>
        </div>
      )}

      {/* Custom Simulation Builder */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00D2D3]" />
          <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">
            Custom Transaction & Scam Call Builder
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Sender User ID</label>
            <input
              type="text"
              value={customSender}
              onChange={(e) => setCustomSender(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Receiver UPI ID</label>
            <input
              type="text"
              value={customReceiver}
              onChange={(e) => setCustomReceiver(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Amount (₹)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Device ID</label>
            <input
              type="text"
              value={customDevice}
              onChange={(e) => setCustomDevice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Location</label>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] font-bold block mb-1">Caller Number (Optional)</label>
            <input
              type="text"
              value={customCaller}
              onChange={(e) => setCustomCaller(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-[#94A3B8] font-bold block mb-1">
              Call Transcript / Voice Phishing Speech (Optional)
            </label>
            <textarea
              rows={2}
              value={customTranscript}
              onChange={(e) => setCustomTranscript(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC]"
            />
          </div>
        </div>

        <button
          onClick={handleRunCustom}
          disabled={isRunning}
          className="px-6 py-2.5 rounded-lg bg-[#00D2D3] hover:bg-[#00b8b9] font-extrabold text-xs text-black flex items-center gap-2 transition-colors"
        >
          <Zap className="w-4 h-4 fill-current text-black" />
          <span>Analyze Custom Transaction</span>
        </button>
      </div>

      {/* User Confirmation Mobile Interception Modal */}
      <PaymentConfirmModal
        assessment={engineOutput}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDecisionMade={(dec) => {
          console.log('User made decision:', dec);
        }}
      />
    </div>
  );
}
