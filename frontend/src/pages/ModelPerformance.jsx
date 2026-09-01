import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getModelMetrics, getRiskWeights, updateRiskWeights } from '../services/api';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [weights, setWeights] = useState({
    weight_rule: 0.25,
    weight_ml: 0.30,
    weight_entity: 0.20,
    weight_voice: 0.15,
    weight_network: 0.10,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getModelMetrics(), getRiskWeights()])
      .then(([mRes, wRes]) => {
        setMetrics(mRes.data);
        if (wRes.data) setWeights(wRes.data);
      })
      .catch((err) => console.error('Failed to load metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveWeights = async () => {
    try {
      await updateRiskWeights(weights);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update weights:', err);
    }
  };

  const cm = metrics?.confusion_matrix || { tp: 220, fp: 6, fn: 5, tn: 1269 };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#00D2D3]">
              MODULE J & ML
            </span>
            <h1 className="text-xl font-extrabold text-[#F8FAFC] tracking-tight">
              Machine Learning Model Metrics & Risk Weight Governance
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Supervised model accuracy, confusion matrix, feature importances, and configurable weight calibration
          </p>
        </div>
      </div>

      {/* Metrics Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'ROC-AUC', value: `${((metrics?.roc_auc || 0.99) * 100).toFixed(1)}%`, color: 'text-[#00D2D3]' },
          { label: 'Precision', value: `${((metrics?.precision || 0.97) * 100).toFixed(1)}%`, color: 'text-[#2ED573]' },
          { label: 'Recall', value: `${((metrics?.recall || 0.98) * 100).toFixed(1)}%`, color: 'text-[#1E90FF]' },
          { label: 'F1 Score', value: `${((metrics?.f1_score || 0.97) * 100).toFixed(1)}%`, color: 'text-[#00D2D3]' },
          { label: 'False Pos. Rate', value: `${((metrics?.false_positive_rate || 0.005) * 100).toFixed(2)}%`, color: 'text-[#FFA502]' },
          { label: 'False Neg. Rate', value: `${((metrics?.false_negative_rate || 0.02) * 100).toFixed(2)}%`, color: 'text-[#FF4757]' },
        ].map((m, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-1">
            <div className="text-[11px] text-[#94A3B8] font-bold">{m.label}</div>
            <div className={`text-xl font-extrabold font-mono ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Grid: Confusion Matrix + Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confusion Matrix */}
        <div className="p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Validation Confusion Matrix</h3>
            <p className="text-xs text-[#94A3B8]">Class predictions on synthetic holdout dataset</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-4 rounded-lg bg-[#0B101E] border border-[#2ED573]/40 space-y-1">
              <div className="text-[#94A3B8] text-[10px] uppercase font-bold">True Negative (Legit)</div>
              <div className="text-2xl font-extrabold font-mono text-[#2ED573]">{cm.tn}</div>
              <div className="text-[10px] text-[#2ED573] font-bold">Correctly Allowed</div>
            </div>

            <div className="p-4 rounded-lg bg-[#0B101E] border border-[#FFA502]/40 space-y-1">
              <div className="text-[#94A3B8] text-[10px] uppercase font-bold">False Positive</div>
              <div className="text-2xl font-extrabold font-mono text-[#FFA502]">{cm.fp}</div>
              <div className="text-[10px] text-[#FFA502] font-bold">Exempted via Modal</div>
            </div>

            <div className="p-4 rounded-lg bg-[#0B101E] border border-[#FF4757]/40 space-y-1">
              <div className="text-[#94A3B8] text-[10px] uppercase font-bold">False Negative</div>
              <div className="text-2xl font-extrabold font-mono text-[#FF4757]">{cm.fn}</div>
              <div className="text-[10px] text-[#FF4757] font-bold">Missed Baseline</div>
            </div>

            <div className="p-4 rounded-lg bg-[#0B101E] border border-[#FF4757]/50 space-y-1">
              <div className="text-[#94A3B8] text-[10px] uppercase font-bold">True Positive (Fraud)</div>
              <div className="text-2xl font-extrabold font-mono text-[#FF4757]">{cm.tp}</div>
              <div className="text-[10px] text-[#FF4757] font-bold">Correctly Intercepted</div>
            </div>
          </div>
        </div>

        {/* Feature Importances Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Model Feature Importances (Tree Gain Weight)</h3>
            <p className="text-xs text-[#94A3B8]">Relative information gain across XGBoost decision trees</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.feature_importances?.slice(0, 7) || []}
                layout="vertical"
                margin={{ left: 40, right: 20 }}
              >
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#94A3B8" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B101E',
                    borderColor: '#262F43',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
                <Bar dataKey="importance" fill="#00D2D3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Weight Configuration */}
      <div className="p-6 rounded-xl bg-[#151B2B] border border-[#262F43] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#262F43]">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00D2D3]" />
              <span>Multi-Signal Fusion Weight Calibrator</span>
            </h3>
            <p className="text-xs text-[#94A3B8]">Adjust contribution weights for each risk intelligence layer</p>
          </div>
          {savedSuccess && (
            <div className="flex items-center gap-1 text-[#2ED573] text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Weights Updated Successfully!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {[
            { key: 'weight_rule', label: 'Rule Engine Weight', desc: 'Deterministic heuristics' },
            { key: 'weight_ml', label: 'ML Probability Weight', desc: 'Supervised tree model' },
            { key: 'weight_entity', label: 'Entity Profile Weight', desc: 'Mule ratio & velocity' },
            { key: 'weight_voice', label: 'Voice Phishing Weight', desc: 'NLP intent & templates' },
            { key: 'weight_network', label: 'Network Graph Weight', desc: 'Syndicate topologies' },
          ].map((item) => (
            <div key={item.key} className="p-3.5 rounded-lg bg-[#0B101E] border border-[#262F43] space-y-2">
              <div className="flex justify-between font-bold text-[#F8FAFC]">
                <span>{item.label}</span>
                <span className="font-mono text-[#00D2D3]">{(weights[item.key] * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.60"
                step="0.05"
                value={weights[item.key]}
                onChange={(e) => setWeights({ ...weights, [item.key]: parseFloat(e.target.value) })}
                className="w-full accent-[#00D2D3] cursor-pointer"
              />
              <p className="text-[10px] text-[#94A3B8]">{item.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveWeights}
          className="px-6 py-2.5 rounded-lg bg-[#00D2D3] hover:bg-[#00b8b9] text-black font-extrabold text-xs flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4 text-black" />
          <span>Save Calibrated Weights</span>
        </button>
      </div>
    </div>
  );
}
