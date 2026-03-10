/**
 * KnowledgeGraphView — cross-simulation force-directed knowledge graph.
 *
 * Graph model (in-memory, no external DB required):
 *   Nodes: unique roles across all simulations
 *   Edges: tension relationships, weighted by frequency × severity
 *   Node size: total influence across all simulations (prominence)
 *   Node color: dominant risk tolerance (from responses)
 *   Edge thickness: weighted conflict score
 *   Edge color: severity (critical=red, high=orange, medium=amber, low=green)
 *
 * Extension guide:
 *   - For Neo4j: export `graphData` as Cypher CREATE statements
 *   - For D3 force layout: pass `graphData.nodes` and `graphData.edges` to d3.forceSimulation
 *   - Add more edge types by processing `decision_trade_offs` between roles
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };
const SEVERITY_COLOR  = { critical: '#f43f5e', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
const RISK_COLOR      = { low: '#10b981', medium: '#3b82f6', high: '#f43f5e' };

// Simple force-directed layout using Euler integration (no d3 dependency)
function applyForces(nodes, edges, iterations = 200) {
  const k = 80; // spring rest length
  const kRepel = 3000;
  const width = 700, height = 460;

  const positions = nodes.map((n, i) => ({
    id: n.id,
    x: width / 2 + Math.cos((i / nodes.length) * 2 * Math.PI) * 180,
    y: height / 2 + Math.sin((i / nodes.length) * 2 * Math.PI) * 180,
    vx: 0, vy: 0,
  }));

  const posMap = Object.fromEntries(positions.map(p => [p.id, p]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pi = positions[i], pj = positions[j];
        const dx = pi.x - pj.x, dy = pi.y - pj.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = kRepel / (dist * dist);
        const fx = (dx / dist) * force * alpha;
        const fy = (dy / dist) * force * alpha;
        pi.vx += fx; pi.vy += fy;
        pj.vx -= fx; pj.vy -= fy;
      }
    }

    // Spring attraction on edges
    edges.forEach(e => {
      const s = posMap[e.source], t = posMap[e.target];
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = dist - k;
      const force = stretch * 0.05 * alpha;
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      s.vx += fx; s.vy += fy;
      t.vx -= fx; t.vy -= fy;
    });

    // Gravity toward center
    positions.forEach(p => {
      p.vx += (width / 2 - p.x) * 0.003 * alpha;
      p.vy += (height / 2 - p.y) * 0.003 * alpha;
    });

    // Integrate + dampen
    positions.forEach(p => {
      p.x = Math.max(40, Math.min(width - 40, p.x + p.vx));
      p.y = Math.max(40, Math.min(height - 40, p.y + p.vy));
      p.vx *= 0.85; p.vy *= 0.85;
    });
  }

  return posMap;
}

export default function KnowledgeGraphView({ simulations }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Build aggregated graph from all simulations
  const graphData = useMemo(() => {
    if (!simulations.length) return null;

    const roleMap = {}; // id -> { id, totalInfluence, appearances, dominantRisk, simIds }
    const edgeMap = {}; // "a||b" -> { source, target, count, weightedScore, maxSeverity }

    simulations.forEach(sim => {
      const roleRiskMap = {};
      sim.responses?.forEach(r => { roleRiskMap[r.role] = r.risk_tolerance; });

      sim.selected_roles?.forEach(sr => {
        if (!roleMap[sr.role]) {
          roleMap[sr.role] = { id: sr.role, label: sr.role.replace(/_/g, ' '), totalInfluence: 0, appearances: 0, riskCounts: {}, simIds: [] };
        }
        roleMap[sr.role].totalInfluence += sr.influence || 5;
        roleMap[sr.role].appearances++;
        const risk = roleRiskMap[sr.role] || 'medium';
        roleMap[sr.role].riskCounts[risk] = (roleMap[sr.role].riskCounts[risk] || 0) + 1;
        roleMap[sr.role].simIds.push(sim.id);
      });

      sim.tensions?.forEach(t => {
        if (t.between?.length !== 2) return;
        const [a, b] = [...t.between].sort();
        const key = `${a}||${b}`;
        if (!edgeMap[key]) edgeMap[key] = { source: a, target: b, count: 0, weightedScore: 0, maxSeverity: 'low', severities: [] };
        edgeMap[key].count++;
        edgeMap[key].weightedScore += SEVERITY_WEIGHT[t.severity] || 1;
        edgeMap[key].severities.push(t.severity);
        const sev = ['critical','high','medium','low'];
        if (sev.indexOf(t.severity) < sev.indexOf(edgeMap[key].maxSeverity)) {
          edgeMap[key].maxSeverity = t.severity;
        }
      });
    });

    const nodes = Object.values(roleMap).map(r => ({
      ...r,
      dominantRisk: Object.entries(r.riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium',
      avgInfluence: parseFloat((r.totalInfluence / r.appearances).toFixed(1)),
    }));

    const edges = Object.values(edgeMap);

    return { nodes, edges };
  }, [simulations]);

  const positions = useMemo(() => {
    if (!graphData || graphData.nodes.length < 2) return {};
    return applyForces(graphData.nodes, graphData.edges);
  }, [graphData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData || !Object.keys(positions).length) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    const maxEdgeScore = Math.max(...graphData.edges.map(e => e.weightedScore), 1);
    const maxAppearances = Math.max(...graphData.nodes.map(n => n.appearances), 1);

    // Draw edges
    graphData.edges.forEach(e => {
      const s = positions[e.source], t = positions[e.target];
      if (!s || !t) return;
      const color = SEVERITY_COLOR[e.maxSeverity] || '#94a3b8';
      const width = 1 + (e.weightedScore / maxEdgeScore) * 5;

      if (selectedNode && e.source !== selectedNode && e.target !== selectedNode) {
        ctx.globalAlpha = 0.1;
      } else {
        ctx.globalAlpha = 0.7;
      }

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();

      // Edge count label on midpoint
      if (e.count > 1) {
        const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.count, mx, my);
      }
    });

    ctx.globalAlpha = 1;

    // Draw nodes
    graphData.nodes.forEach(n => {
      const pos = positions[n.id];
      if (!pos) return;
      const r = 10 + (n.appearances / maxAppearances) * 20;
      const color = RISK_COLOR[n.dominantRisk] || '#64748b';
      const isSelected = selectedNode === n.id;

      if (selectedNode && !isSelected) {
        const isConnected = graphData.edges.some(e => (e.source === selectedNode && e.target === n.id) || (e.target === selectedNode && e.source === n.id));
        ctx.globalAlpha = isConnected ? 0.8 : 0.2;
      } else {
        ctx.globalAlpha = 1;
      }

      // Glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}33`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#1e293b' : '#fff';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = `${isSelected ? 'bold ' : ''}10px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        n.label.length > 14 ? n.label.slice(0, 14) + '…' : n.label,
        pos.x,
        pos.y + r + 4
      );
    });

    ctx.globalAlpha = 1;
    ctx.restore();

    // Legend
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Node size = # appearances   Node color = risk (green=low, blue=med, red=high)', 12, H - 20);
    ctx.fillText('Edge thickness & color = tension severity (red=critical → green=low)', 12, H - 8);
  }, [graphData, positions, zoom, selectedNode]);

  const handleCanvasClick = (e) => {
    if (!graphData || !Object.keys(positions).length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Adjust for zoom (approximate)
    const W = canvasRef.current.width, H = canvasRef.current.height;
    const ax = (mx - W / 2) / zoom + W / 2;
    const ay = (my - H / 2) / zoom + H / 2;

    const maxApp = Math.max(...graphData.nodes.map(n => n.appearances), 1);
    let hit = null;
    graphData.nodes.forEach(n => {
      const pos = positions[n.id];
      if (!pos) return;
      const r = 10 + (n.appearances / maxApp) * 20;
      const dx = ax - pos.x, dy = ay - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < r) hit = n.id;
    });
    setSelectedNode(prev => prev === hit ? null : hit);
  };

  const selectedNodeData = selectedNode && graphData?.nodes.find(n => n.id === selectedNode);
  const connectedEdges = selectedNode && graphData?.edges.filter(e => e.source === selectedNode || e.target === selectedNode);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Network className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No graph data available</p>
        <p className="text-slate-400 text-sm mt-1">Run simulations with role tensions to generate the knowledge graph</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Cross-simulation knowledge graph.</span> Nodes = unique roles (size = frequency). Edges = tensions (thickness & color = severity). Click a node to highlight its relationships.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" /> Role Conflict Knowledge Graph
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">{graphData.nodes.length} roles</Badge>
            <Badge variant="outline" className="text-xs">{graphData.edges.length} tension pairs</Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.15))}><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}><ZoomOut className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setSelectedNode(null); }}><RotateCcw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={700}
          height={460}
          className="w-full border border-slate-200 rounded-lg cursor-pointer"
          onClick={handleCanvasClick}
        />
      </Card>

      {/* Selected node detail panel */}
      {selectedNodeData && (
        <Card className="p-5 border-blue-200 bg-blue-50">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">{selectedNodeData.label}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
            <div className="bg-white rounded p-2 border">
              <p className="text-slate-400">Appearances</p>
              <p className="font-bold text-slate-800 text-lg">{selectedNodeData.appearances}</p>
            </div>
            <div className="bg-white rounded p-2 border">
              <p className="text-slate-400">Avg Influence</p>
              <p className="font-bold text-slate-800 text-lg">{selectedNodeData.avgInfluence}/10</p>
            </div>
            <div className="bg-white rounded p-2 border">
              <p className="text-slate-400">Dominant Risk</p>
              <p className="font-bold text-slate-800 text-lg capitalize">{selectedNodeData.dominantRisk}</p>
            </div>
          </div>
          {connectedEdges.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Connected tensions ({connectedEdges.length})</p>
              <div className="space-y-1.5">
                {connectedEdges.sort((a, b) => b.weightedScore - a.weightedScore).map((e, i) => {
                  const other = e.source === selectedNode ? e.target : e.source;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2 border">
                      <span className="text-slate-700 font-medium">{other.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{e.count}x</Badge>
                        <div className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[e.maxSeverity] }} />
                        <span className="text-slate-500">score {e.weightedScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Top conflict pairs summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Top Conflict Pairs Across All Simulations</h3>
        <div className="space-y-2">
          {graphData.edges
            .sort((a, b) => b.weightedScore - a.weightedScore)
            .slice(0, 8)
            .map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-100 last:border-0">
                <span className="w-5 text-slate-400 font-mono">#{i + 1}</span>
                <span className="flex-1 font-medium text-slate-700">
                  {e.source.replace(/_/g, ' ')} ↔ {e.target.replace(/_/g, ' ')}
                </span>
                <Badge variant="outline" className="text-xs">{e.count}x</Badge>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLOR[e.maxSeverity] }} />
                <span className="text-slate-500 w-16 text-right">score {e.weightedScore}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}