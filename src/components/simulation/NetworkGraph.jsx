/**
 * NetworkGraph — interactive SVG force-directed role relationship graph.
 * Hover edges to see tension severity & description.
 * Hover nodes to see role name, influence, risk tolerance.
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const SEVERITY_COLOR  = { critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#84cc16' };
const SEVERITY_BG     = { critical: 'bg-rose-100 text-rose-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
const SEVERITY_WIDTH  = { critical: 5, high: 3.5, medium: 2.5, low: 1.5 };
const RISK_COLOR      = { low: '#10b981', medium: '#3b82f6', high: '#ef4444' };
const RISK_LABEL      = { low: 'Low Risk', medium: 'Med Risk', high: 'High Risk' };

function useForceLayout(nodes, edges, W, H) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!nodes.length) return;

    // Initial positions on a circle
    const pos = {};
    nodes.forEach((node, idx) => {
      const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
      const r = Math.min(W, H) * 0.32;
      pos[node.id] = { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) };
    });

    const edgeSet = edges.map(e => ({ ...e }));
    let iter = 0;
    const MAX = 120;

    const tick = () => {
      if (iter++ >= MAX) { setPositions({ ...pos }); return; }

      const REPEL = 4000;
      const ATTRACT = 0.03;
      const CENTER = 0.008;
      const IDEAL = Math.min(W, H) * 0.3;

      const force = {};
      nodes.forEach(n => { force[n.id] = { x: 0, y: 0 }; });

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos[nodes[i].id], b = pos[nodes[j].id];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = REPEL / (dist * dist);
          force[nodes[i].id].x -= f * dx / dist;
          force[nodes[i].id].y -= f * dy / dist;
          force[nodes[j].id].x += f * dx / dist;
          force[nodes[j].id].y += f * dy / dist;
        }
      }

      // Attraction along edges
      edgeSet.forEach(e => {
        const a = pos[e.source], b = pos[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = ATTRACT * (dist - IDEAL);
        force[e.source].x += f * dx / dist;
        force[e.source].y += f * dy / dist;
        force[e.target].x -= f * dx / dist;
        force[e.target].y -= f * dy / dist;
      });

      // Center gravity
      nodes.forEach(n => {
        force[n.id].x += CENTER * (W / 2 - pos[n.id].x);
        force[n.id].y += CENTER * (H / 2 - pos[n.id].y);
      });

      nodes.forEach(n => {
        pos[n.id] = {
          x: Math.max(40, Math.min(W - 40, pos[n.id].x + force[n.id].x)),
          y: Math.max(40, Math.min(H - 40, pos[n.id].y + force[n.id].y)),
        };
      });

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [nodes.map(n => n.id).join(','), edges.length, W, H]);

  return positions;
}

export default function NetworkGraph({ simulation }) {
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  const W = 620, H = 400;

  const graphData = useMemo(() => {
    if (!simulation?.responses || !simulation?.tensions) return null;

    const nodes = (simulation.selected_roles || []).map(sr => {
      const response = simulation.responses.find(r => r.role === sr.role);
      return {
        id: sr.role,
        label: sr.role.replace(/_/g, ' '),
        influence: sr.influence || 5,
        riskTolerance: response?.risk_tolerance || 'medium',
        position: response?.position || '',
        recommendation: response?.recommendation || '',
      };
    });

    const edges = (simulation.tensions || []).map((t, i) => ({
      id: i,
      source: t.between?.[0],
      target: t.between?.[1],
      severity: t.severity,
      description: t.description,
    })).filter(e => e.source && e.target);

    return { nodes, edges };
  }, [simulation]);

  const positions = useForceLayout(
    graphData?.nodes || [],
    graphData?.edges || [],
    W, H
  );

  const handleMouseMoveSVG = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });
  }, [zoom]);

  const isEdgeHovered = useCallback((edge) => {
    if (!hoveredEdge) return false;
    return hoveredEdge.id === edge.id;
  }, [hoveredEdge]);

  if (!graphData || !graphData.nodes.length) return null;

  const hasPositions = Object.keys(positions).length === graphData.nodes.length;

  return (
    <Card className="p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <Network className="w-4 h-4 text-blue-600" />
          Role Tension Network
          <span className="text-xs font-normal text-slate-400">— hover edges & nodes</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 2))} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border border-slate-200 rounded-xl bg-slate-50 overflow-hidden" style={{ height: H }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="select-none"
          onMouseMove={handleMouseMoveSVG}
          onMouseLeave={() => { setHoveredEdge(null); setHoveredNode(null); }}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.15s' }}
        >
          <defs>
            {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
              <filter key={sev} id={`glow-${sev}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Edges */}
          {hasPositions && graphData.edges.map(edge => {
            const s = positions[edge.source];
            const t = positions[edge.target];
            if (!s || !t) return null;
            const hovered = isEdgeHovered(edge);
            const color = SEVERITY_COLOR[edge.severity] || '#94a3b8';
            const width = SEVERITY_WIDTH[edge.severity] || 1.5;

            // Midpoint for hit area
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2;

            return (
              <g key={edge.id}>
                {/* Visible line */}
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={color}
                  strokeWidth={hovered ? width + 2 : width}
                  strokeOpacity={hovered ? 1 : 0.65}
                  filter={hovered ? `url(#glow-${edge.severity})` : undefined}
                  strokeDasharray={edge.severity === 'low' ? '5 4' : undefined}
                />
                {/* Invisible fat hit area */}
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {/* Severity dot at midpoint */}
                {hovered && (
                  <circle cx={mx} cy={my} r={5} fill={color} stroke="white" strokeWidth={2} />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {hasPositions && graphData.nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const r = 10 + node.influence * 1.5;
            const color = RISK_COLOR[node.riskTolerance] || '#64748b';
            const hovered = hoveredNode?.id === node.id;
            const label = node.label.length > 13 ? node.label.slice(0, 13) + '…' : node.label;

            return (
              <g key={node.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {hovered && (
                  <circle cx={pos.x} cy={pos.y} r={r + 6} fill={color} fillOpacity={0.15} />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={color}
                  stroke="white"
                  strokeWidth={3}
                  filter={hovered ? `url(#glow-${node.riskTolerance === 'high' ? 'critical' : 'low'})` : undefined}
                />
                {/* Influence number inside */}
                <text
                  x={pos.x} y={pos.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.max(8, r * 0.55)} fontWeight="bold" fill="white"
                >
                  {node.influence}
                </text>
                {/* Label below */}
                <text
                  x={pos.x} y={pos.y + r + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={hovered ? 700 : 400}
                  fill="#1e293b"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Edge tooltip */}
        {hoveredEdge && (
          <div
            className="absolute z-20 pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg p-3 max-w-xs text-xs"
            style={{ left: Math.min(tooltip.x * zoom + 10, W * zoom - 220), top: Math.min(tooltip.y * zoom - 60, H * zoom - 100) }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-slate-700 capitalize">{hoveredEdge.source?.replace(/_/g, ' ')}</span>
              <span className="text-slate-400">↔</span>
              <span className="font-semibold text-slate-700 capitalize">{hoveredEdge.target?.replace(/_/g, ' ')}</span>
            </div>
            <Badge className={`text-[10px] mb-2 ${SEVERITY_BG[hoveredEdge.severity]}`}>
              {hoveredEdge.severity} severity
            </Badge>
            <p className="text-slate-600 leading-relaxed">{hoveredEdge.description}</p>
          </div>
        )}

        {/* Node tooltip */}
        {hoveredNode && !hoveredEdge && (
          <div
            className="absolute z-20 pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg p-3 w-52 text-xs"
            style={{ left: Math.min(tooltip.x * zoom + 12, W * zoom - 210), top: Math.min(tooltip.y * zoom - 80, H * zoom - 120) }}
          >
            <p className="font-semibold text-slate-800 capitalize mb-1">{hoveredNode.label}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500">Influence: <strong>{hoveredNode.influence}/10</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{RISK_LABEL[hoveredNode.riskTolerance]}</span>
            </div>
            {hoveredNode.recommendation && (
              <p className="text-slate-600 leading-relaxed line-clamp-3 italic">"{hoveredNode.recommendation}"</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Tension:</span>
          {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
            <span key={sev} className="flex items-center gap-1 text-[10px] text-slate-600 capitalize">
              <span className="inline-block w-5 h-1.5 rounded-full" style={{ background: color }} />
              {sev}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Risk:</span>
          {Object.entries(RISK_COLOR).map(([risk, color]) => (
            <span key={risk} className="flex items-center gap-1 text-[10px] text-slate-600 capitalize">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
              {risk}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-slate-400 ml-auto">Node size = influence level</span>
      </div>
    </Card>
  );
}