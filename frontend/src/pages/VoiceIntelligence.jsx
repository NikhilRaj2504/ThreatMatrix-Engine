import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Mic,
  Sparkles,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { getScamPatterns, analyzeCall } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';

export default function VoiceIntelligence() {
  const [patterns, setPatterns] = useState([]);
  const [callerNumber, setCallerNumber] = useState('+919876500111');
  const [transcript, setTranscript] = useState(
    'Sir I am calling from bank headquarters. Your KYC has expired today. Transfer 25000 immediately or your account will be blocked.'
  );
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    getScamPatterns()
      .then((res) => setPatterns(res.data))
      .catch((err) => console.error('Failed to load scam patterns:', err));
  }, []);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeCall({
        caller_number: callerNumber,
        transcript: transcript,
      });
      setAnalysisResult(res.data);
    } catch (err) {
      console.error('Failed voice analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleTranscripts = [
    {
      title: 'Digital Arrest / Fake Police',
      text: 'This is Officer Sharma from Delhi Police Cyber Crime. A parcel with fake passports was seized in your name. You are under digital arrest. Pay 50000 rupees security deposit immediately.',
    },
    {
      title: 'Bank KYC Expiry Threat',
      text: 'Sir I am calling from bank headquarters. Your KYC has expired today. Transfer 25000 immediately or your account will be blocked.',
    },
    {
      title: 'Electricity Power Cut Scam',
      text: 'Dear consumer, your electricity power supply will be disconnected tonight at 9:30 PM because your bill was not updated. Pay pending verification charges immediately via UPI.',
    },
    {
      title: 'Legitimate Delivery Confirmation',
      text: 'Hello sir, this is your Swiggy delivery partner calling. I am at the main gate of your society.',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              MODULE E & F
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Voice Phishing & Repeated Scam Pattern Engine
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Speech-to-Text intent extraction, authority impersonation detection, and semantic narrative clustering
          </p>
        </div>
      </div>

      {/* Main Analysis Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Box & Audio Upload */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Voice Telemetry Ingestion
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[#00D2D3] font-bold">
              <Mic className="w-3.5 h-3.5" />
              <span>STT Pipeline Ready</span>
            </div>
          </div>

          {/* Caller number input */}
          <div>
            <label className="text-xs text-[#94A3B8] font-bold block mb-1">
              Caller Phone Number
            </label>
            <input
              type="text"
              value={callerNumber}
              onChange={(e) => setCallerNumber(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] font-mono text-[#F8FAFC]"
            />
          </div>

          {/* Transcript Textarea */}
          <div>
            <label className="text-xs text-[#94A3B8] font-bold block mb-1">
              Voice Call Transcript (or Audio Stream Output)
            </label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter spoken call transcript..."
              className="w-full text-xs p-3 rounded-lg bg-[#0B101E] border border-[#262F43] focus:outline-none focus:border-[#00D2D3] text-[#F8FAFC] leading-relaxed"
            />
          </div>

          {/* Preset Samples */}
          <div>
            <div className="text-[11px] font-bold text-[#94A3B8] mb-1.5">
              Quick Test Preloaded Voice Transcripts:
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleTranscripts.map((samp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(samp.text);
                    setCallerNumber(i === 3 ? '+919123456789' : '+919876500111');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0B101E] hover:bg-[#262F43] text-xs text-[#F8FAFC] font-semibold border border-[#262F43] transition-colors"
                >
                  {samp.title}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-lg bg-[#00D2D3] hover:bg-[#00b8b9] font-extrabold text-xs text-black flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isAnalyzing ? 'Extracting NLP Intent...' : 'Analyze Voice Phishing Intent'}</span>
          </button>
        </div>

        {/* Voice Score Gauge */}
        <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col items-center justify-center space-y-4">
          <RiskGauge score={analysisResult?.voice_risk_score || 0} />
          {analysisResult && (
            <div className="text-center space-y-1">
              <RiskBadge level={analysisResult.risk_level} score={analysisResult.voice_risk_score} />
              <p className="text-xs text-[#94A3B8] font-mono pt-2 font-bold">
                Pattern Confidence: {analysisResult.pattern_confidence}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detected Intent Badges */}
          <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Extracted Psychological & Scam Indicators
            </h3>
            {analysisResult.raw_indicators?.length > 0 ? (
              <div className="space-y-2">
                {analysisResult.raw_indicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FF4757] font-mono">{ind.description}</span>
                      <span className="text-[#94A3B8] font-mono text-[11px]">+{ind.weight} pts</span>
                    </div>
                    <div className="text-[#94A3B8] text-[11px]">
                      Matched trigger words: <span className="text-[#F8FAFC] font-mono">{ind.evidence?.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#0B101E] border border-[#2ED573]/30 text-[#2ED573] text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>No phishing intent or psychological coercion keywords detected.</span>
              </div>
            )}
          </div>

          {/* Semantic Scam Pattern Match */}
          <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Matched Scam Narrative Templates
            </h3>
            {analysisResult.matched_scam_narratives?.length > 0 ? (
              <div className="space-y-2">
                {analysisResult.matched_scam_narratives.map((mat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00D2D3]">{mat.category}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3] font-bold">
                        {Math.round(mat.similarity_score * 100)}% Match
                      </span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                      {mat.matched_narrative_sample}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#0B101E] text-[#94A3B8] text-xs border border-[#262F43]">
                No matching serial scam campaign templates found.
              </div>
            )}

            {/* Serial Caller Campaign */}
            {analysisResult.caller_stats?.is_serial_scam_caller && (
              <div className="p-3 rounded-lg bg-[#0B101E] border border-[#FF4757]/40 text-xs flex items-start gap-2">
                <Flame className="w-4 h-4 text-[#FF4757] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#FF4757] block">Cross-Victim Serial Scammer Alert</span>
                  <span className="text-[#94A3B8]">
                    Caller '{analysisResult.caller_number}' has targeted {analysisResult.caller_stats.distinct_victims_targeted} distinct users across {analysisResult.caller_stats.total_calls_recorded} recorded calls.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
