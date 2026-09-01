import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Send,
  Copy,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Zap
} from 'lucide-react';
import api from '../services/api';

export default function ApiPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('analyze-combined');
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        transaction: {
          sender_id: "U101",
          receiver_upi: "quick.fast.cash@paytm",
          amount: 50000.0,
          device_id: "DEV_ROG_99",
          location: "Bhubaneswar",
          description: "Customs clearance deposit"
        },
        call: {
          caller_number: "+919876500111",
          recipient_id: "U101",
          transcript: "This is Officer Sharma from Cyber Crime. Your parcel with fake passports was seized. You are under digital arrest. Transfer 50000 rupees security deposit immediately."
        }
      },
      null,
      2
    )
  );
  const [responseOutput, setResponseOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'analyze-combined',
      name: 'Combined Multi-Modal Risk Analysis',
      method: 'POST',
      path: '/api/v1/risk/analyze-combined',
      desc: 'Fuses transaction anomaly, entity behavior, voice phishing NLP, and network graph.',
      sample: {
        transaction: {
          sender_id: "U101",
          receiver_upi: "quick.fast.cash@paytm",
          amount: 50000.0,
          device_id: "DEV_ROG_99",
          location: "Bhubaneswar",
          description: "Customs clearance deposit"
        },
        call: {
          caller_number: "+919876500111",
          recipient_id: "U101",
          transcript: "This is Officer Sharma from Cyber Crime. Your parcel with fake passports was seized. You are under digital arrest. Transfer 50000 rupees security deposit immediately."
        }
      }
    },
    {
      id: 'analyze-transaction',
      name: 'Transaction Intelligence Only',
      method: 'POST',
      path: '/api/v1/risk/analyze-transaction',
      desc: 'Evaluates amount Z-score, IQR, 1h/24h rolling velocity, and device delta.',
      sample: {
        sender_id: "U101",
        receiver_upi: "crypto.trader99@okhdfcbank",
        amount: 48000.0,
        device_id: "DEV_ROG_99",
        location: "Kolkata",
        description: "Investment deposit"
      }
    },
    {
      id: 'analyze-call',
      name: 'Voice Phishing NLP Intent',
      method: 'POST',
      path: '/api/v1/risk/analyze-call',
      desc: 'Scans speech transcript for authority impersonation and scam templates.',
      sample: {
        caller_number: "+919876500111",
        recipient_id: "U102",
        transcript: "Sir I am calling from bank KYC branch. Your bank account is suspended immediately. Transfer 25000 rupees right now to our verification server."
      }
    },
    {
      id: 'entity-profile',
      name: 'Get Receiver UPI Profile',
      method: 'GET',
      path: '/api/v1/entities/quick.fast.cash@paytm',
      desc: 'Fetches receiver money mule metrics, unique senders ratio, and inflow surges.',
      sample: null
    },
    {
      id: 'dashboard-overview',
      name: 'Dashboard Overview KPIs',
      method: 'GET',
      path: '/api/v1/dashboard/overview',
      desc: 'Fetches real-time fraud prevention metrics, total analyzed volume, and 7-day trend.',
      sample: null
    }
  ];

  const handleSelectEndpoint = (ep) => {
    setSelectedEndpoint(ep.id);
    if (ep.sample) {
      setRequestBody(JSON.stringify(ep.sample, null, 2));
    } else {
      setRequestBody('// GET request has no body');
    }
    setResponseOutput(null);
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponseOutput(null);
    const ep = endpoints.find((e) => e.id === selectedEndpoint);

    try {
      let res;
      if (ep.method === 'POST') {
        const parsed = JSON.parse(requestBody);
        res = await api.post(ep.path.replace('/api/v1', ''), parsed);
      } else {
        res = await api.get(ep.path.replace('/api/v1', ''));
      }
      setResponseOutput(res.data);
    } catch (err) {
      setResponseOutput({
        error: true,
        message: err.response?.data || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (responseOutput) {
      navigator.clipboard.writeText(JSON.stringify(responseOutput, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              INTEGRATED DEVELOPER API
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Live API Engine & Interactive Playground
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Test and integrate Fraud Shield Engine endpoints directly inside this unified console
          </p>
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-lg bg-[#0B101E] hover:bg-[#262F43] text-[#00D2D3] font-bold text-xs flex items-center gap-2 border border-[#262F43] transition-colors self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Open Swagger Documentation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {endpoints.map((ep) => {
          const isSelected = selectedEndpoint === ep.id;
          return (
            <button
              key={ep.id}
              onClick={() => handleSelectEndpoint(ep)}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                isSelected
                  ? 'bg-[#0B101E] border-[#00D2D3] text-[#F8FAFC]'
                  : 'bg-[#151B2B] border-[#262F43] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#374151]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    ep.method === 'POST'
                      ? 'bg-[#1E90FF]/15 text-[#1E90FF] border-[#1E90FF]/30'
                      : 'bg-[#2ED573]/15 text-[#2ED573] border-[#2ED573]/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">REST</span>
              </div>
              <div className="text-xs font-bold text-[#F8FAFC] truncate">{ep.name}</div>
              <div className="text-[10px] text-[#94A3B8] truncate mt-0.5">{ep.path}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive Request / Response Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  currentEp.method === 'POST'
                    ? 'bg-[#1E90FF]/15 text-[#1E90FF] border-[#1E90FF]/30'
                    : 'bg-[#2ED573]/15 text-[#2ED573] border-[#2ED573]/30'
                }`}
              >
                {currentEp.method}
              </span>
              <span className="text-xs font-mono font-bold text-[#F8FAFC]">{currentEp.path}</span>
            </div>
            <button
              onClick={handleSendRequest}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg bg-[#00D2D3] hover:bg-[#00b8b9] text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-black" />
              <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
            </button>
          </div>

          <p className="text-xs text-[#94A3B8]">{currentEp.desc}</p>

          <div className="flex-1 flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-[#00D2D3]" />
              <span>Request Payload (JSON)</span>
            </label>
            <textarea
              rows={12}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              disabled={currentEp.method === 'GET'}
              className="w-full flex-1 p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] font-mono text-xs text-[#00D2D3] focus:outline-none focus:border-[#00D2D3] leading-relaxed"
            />
          </div>
        </div>

        {/* Response Panel */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#2ED573]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                Live Response Output
              </h3>
            </div>
            {responseOutput && (
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1 rounded-lg bg-[#0B101E] hover:bg-[#262F43] text-[#F8FAFC] text-xs font-bold flex items-center gap-1 border border-[#262F43] transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED573]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[320px] p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] overflow-y-auto max-h-[500px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] text-xs space-y-2 py-20">
                <Zap className="w-6 h-6 text-[#00D2D3] animate-spin" />
                <span>Processing multi-signal analysis...</span>
              </div>
            ) : responseOutput ? (
              <pre className="font-mono text-xs text-[#2ED573] whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(responseOutput, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] text-xs py-20 space-y-1">
                <Code2 className="w-8 h-8 text-[#262F43]" />
                <span>Click "Send Request" to see the live engine response.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
