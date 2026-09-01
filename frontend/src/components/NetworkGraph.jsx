import React, { useState, useEffect, useRef } from 'react';
import { Share2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function NetworkGraph({ graphData, onNodeSelect, selectedNodeId }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  useEffect(() => {
    if (!nodes.length) return;

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const positions = {};
    const n = nodes.length;

    nodes.forEach((node, i) => {
      let radius = 130;
      if (node.type === 'UPI_ENTITY') radius = 60;
      else if (node.type === 'CALLER') radius = 170;
      else if (node.type === 'DEVICE') radius = 110;

      const angle = (i / n) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.sin(i * 3) * 20),
        y: centerY + radius * Math.sin(angle) + (Math.cos(i * 2) * 15),
        ...node
      };
    });

    setNodePositions(positions);
  }, [graphData]);

  const getNodeColor = (type, riskScore = 0) => {
    if (riskScore >= 70) return '#FF4757'; // Threat Crimson
    if (type === 'UPI_ENTITY') return '#00D2D3'; // Electric Teal
    if (type === 'CALLER') return '#FFA502'; // Alert Orange
    if (type === 'DEVICE') return '#94A3B8'; // Muted Slate
    return '#1E90FF'; // Dodger Blue for users
  };

  return (
    <div className="relative w-full h-[450px] bg-[#0B101E] rounded-xl border border-[#262F43] overflow-hidden flex flex-col">
      {/* Controls Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#151B2B] p-1.5 rounded-lg border border-[#262F43]">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-[#F8FAFC]">
          <Share2 className="w-3.5 h-3.5 text-[#00D2D3]" />
          <span>Graph Entities ({nodes.length})</span>
        </div>
        <div className="h-4 w-px bg-[#262F43]" />
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
          className="p-1 rounded hover:bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC]"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
          className="p-1 rounded hover:bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC]"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 rounded hover:bg-[#0B101E] text-[#94A3B8] hover:text-[#F8FAFC]"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 bg-[#151B2B] px-3 py-1.5 rounded-lg border border-[#262F43] text-[11px] text-[#94A3B8] font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1E90FF]" />
          <span className="text-[#F8FAFC]">User</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D2D3]" />
          <span className="text-[#F8FAFC]">Receiver UPI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFA502]" />
          <span className="text-[#F8FAFC]">Caller</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
          <span className="text-[#F8FAFC]">Device</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF4757]" />
          <span className="text-[#FF4757] font-bold">Threat Ring (70+)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
        >
          {/* Grid Background */}
          <defs>
            <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#151B2B" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="600" height="400" fill="url(#graph-grid)" />

          {/* Edges */}
          {edges.map((edge, i) => {
            const src = nodePositions[edge.source];
            const tgt = nodePositions[edge.target];
            if (!src || !tgt) return null;

            const isHighRisk = edge.relation === 'CALLED' || edge.amount > 20000;
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isHighRisk ? '#FF4757' : '#262F43'}
                  strokeWidth={isHighRisk ? 2 : 1.2}
                  strokeDasharray={edge.relation === 'CALLED' ? '4,4' : undefined}
                  opacity={0.8}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNode?.id === node.id;
            const color = getNodeColor(node.type, node.risk_score);
            const radius = node.type === 'UPI_ENTITY' ? 14 : 11;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onNodeSelect && onNodeSelect(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {(isSelected || isHovered || node.risk_score >= 70) && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={isSelected ? '2,2' : undefined}
                    opacity={0.6}
                  />
                )}

                <circle
                  r={radius}
                  fill={color}
                  stroke="#151B2B"
                  strokeWidth="2"
                />

                <text
                  y={radius + 12}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.label?.length > 12 ? `${node.label.slice(0, 10)}..` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip on hover */}
      {hoveredNode && (
        <div className="absolute top-3 right-3 z-20 p-3 rounded-xl bg-[#151B2B] border border-[#262F43] text-xs shadow-2xl max-w-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#F8FAFC] font-mono">{hoveredNode.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B101E] border border-[#262F43] text-[#94A3B8] font-bold">
              {hoveredNode.type}
            </span>
          </div>
          {hoveredNode.holder && (
            <div className="text-[#94A3B8] text-[11px]">Holder: <span className="text-[#F8FAFC]">{hoveredNode.holder}</span></div>
          )}
          {hoveredNode.risk_score !== undefined && (
            <div className="text-[11px] text-[#94A3B8] flex items-center gap-1">
              <span>Risk Score:</span>
              <span className={`font-mono font-bold ${hoveredNode.risk_score >= 70 ? 'text-[#FF4757]' : 'text-[#2ED573]'}`}>
                {Math.round(hoveredNode.risk_score)}/100
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
