import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import LiveFeed from './pages/LiveFeed';
import Simulator from './pages/Simulator';
import EntityIntelligence from './pages/EntityIntelligence';
import VoiceIntelligence from './pages/VoiceIntelligence';
import NetworkExplorer from './pages/NetworkExplorer';
import CaseManagement from './pages/CaseManagement';
import ModelPerformance from './pages/ModelPerformance';
import ApiPlayground from './pages/ApiPlayground';

export default function App() {
  const [currentTab, setTab] = useState('overview');
  const [inspectedTx, setInspectedTx] = useState(null);

  const handleInspectTransaction = (tx) => {
    setInspectedTx(tx);
    setTab('live-feed');
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'overview':
        return <Overview setTab={setTab} onInspectTransaction={handleInspectTransaction} />;
      case 'live-feed':
        return <LiveFeed selectedTxFromParent={inspectedTx} />;
      case 'simulator':
        return <Simulator />;
      case 'entities':
        return <EntityIntelligence />;
      case 'voice':
        return <VoiceIntelligence />;
      case 'network':
        return <NetworkExplorer />;
      case 'cases':
        return <CaseManagement />;
      case 'model':
        return <ModelPerformance />;
      case 'api-playground':
        return <ApiPlayground />;
      default:
        return <Overview setTab={setTab} onInspectTransaction={handleInspectTransaction} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B101E] text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar onOpenSimulator={() => setTab('simulator')} />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar currentTab={currentTab} setTab={setTab} alertCount={12} />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B101E]">
          <div className="max-w-7xl mx-auto">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
