import React, { useEffect, useRef, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Network } from "lucide-react";

export default function NetworkGraph({ simulation }) {
  const canvasRef = useRef(null);

  const graphData = useMemo(() => {
    if (!simulation?.responses || !simulation?.tensions) return null;

    const nodes = simulation.selected_roles?.map(sr => {
      const response = simulation.responses.find(r => r.role === sr.role);
      return {
        id: sr.role,
        influence: sr.influence,
        riskTolerance: response?.risk_tolerance || 'medium'
      };
    }) || [];

    const edges = simulation.tensions?.map(t => ({
      source: t.between[0],
      target: t.between[1],
      severity: t.severity
    })) || [];

    return { nodes, edges };
  }, [simulation]);

  useEffect(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const nodePositions = {};
    graphData.nodes.forEach((node, idx) => {
      const angle = (idx / graphData.nodes.length) * 2 * Math.PI - Math.PI / 2;
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    // Draw edges
    graphData.edges.forEach(edge => {
      const source = nodePositions[edge.source];
      const target = nodePositions[edge.target];
      if (!source || !target) return;

      const severityColors = {
        critical: '#dc2626',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#84cc16'
      };

      const severityWidths = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = severityColors[edge.severity] || '#94a3b8';
      ctx.lineWidth = severityWidths[edge.severity] || 1;
      ctx.stroke();
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const riskColors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444'
      };

      const nodeRadius = 8 + (node.influence * 2);

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = riskColors[node.riskTolerance] || '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        node.id.replace(/_/g, ' ').substring(0, 12),
        pos.x,
        pos.y + nodeRadius + 12
      );
    });

    // Legend
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Node size = Influence', 10, height - 30);
    ctx.fillText('Edge thickness = Tension severity', 10, height - 18);
    ctx.fillText('Node color = Risk tolerance', 10, height - 6);

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