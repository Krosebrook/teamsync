/**
 * NetworkGraph — single-simulation role influence network.
 * For cross-simulation aggregated graph, see components/analytics/KnowledgeGraphView.jsx
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Network } from "lucide-react";

const SEVERITY_COLOR  = { critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#84cc16' };
const SEVERITY_WIDTH  = { critical: 4, high: 3, medium: 2, low: 1 };
const RISK_COLOR      = { low: '#10b981', medium: '#3b82f6', high: '#ef4444' };

export default function NetworkGraph({ simulation }) {
  const canvasRef = useRef(null);

  const graphData = useMemo(() => {
    if (!simulation?.responses || !simulation?.tensions) return null;

    const nodes = simulation.selected_roles?.map(sr => {
      const response = simulation.responses.find(r => r.role === sr.role);
      return {
        id: sr.role,
        label: sr.role.replace(/_/g, ' '),
        influence: sr.influence,
        riskTolerance: response?.risk_tolerance || 'medium',
      };
    }) || [];

    const edges = simulation.tensions?.map(t => ({
      source: t.between[0],
      target: t.between[1],
      severity: t.severity,
    })) || [];

    return { nodes, edges };
  }, [simulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) / 3;

    const positions = {};
    graphData.nodes.forEach((node, idx) => {
      const angle = (idx / graphData.nodes.length) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    // Edges
    graphData.edges.forEach(edge => {
      const s = positions[edge.source], t = positions[edge.target];
      if (!s || !t) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = SEVERITY_COLOR[edge.severity] || '#94a3b8';
      ctx.lineWidth = SEVERITY_WIDTH[edge.severity] || 1;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Nodes
    graphData.nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;
      const r = 8 + (node.influence * 2);
      const color = RISK_COLOR[node.riskTolerance] || '#64748b';

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label.length > 14 ? node.label.slice(0, 14) + '…' : node.label, pos.x, pos.y + r + 4);
    });

    // Legend
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Node size = Influence  |  Color = Risk tolerance (green=low, blue=med, red=high)', 10, H - 18);
    ctx.fillText('Edge thickness & color = Tension severity', 10, H - 6);
  }, [graphData]);

  if (!graphData) return null;

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Network className="w-5 h-5 text-blue-600" />
        Role Influence Network
      </h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full border border-slate-200 rounded-lg"
      />
    </Card>
  );
}