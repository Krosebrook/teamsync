import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';
import {
  GitBranch, Plus, Trash2, Save, Play, ZoomIn, ZoomOut,
  RotateCcw, ChevronRight, Zap, Flag, CheckCircle2,
  GitMerge, HelpCircle, Settings, X, ArrowRight, Eye, Download, BookOpen
} from "lucide-react";
import OrgPlaybookGenerator from "./OrgPlaybookGenerator";

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_TYPES = {
  start:   { label: 'Start',   color: 'bg-violet-100 border-violet-400', dot: 'bg-violet-500',  icon: Flag,          text: 'text-violet-800' },
  choice:  { label: 'Choice',  color: 'bg-blue-100 border-blue-400',     dot: 'bg-blue-500',    icon: HelpCircle,    text: 'text-blue-800' },
  branch:  { label: 'Branch',  color: 'bg-amber-100 border-amber-400',   dot: 'bg-amber-500',   icon: GitBranch,     text: 'text-amber-800' },
  merge:   { label: 'Merge',   color: 'bg-emerald-100 border-emerald-400',dot: 'bg-emerald-500', icon: GitMerge,      text: 'text-emerald-800' },
  outcome: { label: 'Outcome', color: 'bg-slate-100 border-slate-400',   dot: 'bg-slate-500',   icon: CheckCircle2,  text: 'text-slate-800' },
};

const NODE_W = 160;
const NODE_H = 72;

let _idCounter = Date.now();
const uid = () => `n${_idCounter++}`;

// ─── Edge SVG renderer ───────────────────────────────────────────────────────

function EdgeLayer({ nodes, edges, selectedEdge, onSelectEdge }) {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
        </marker>
      </defs>
      {edges.map(edge => {
        const from = nodes.find(n => n.id === edge.from_node_id);
        const to   = nodes.find(n => n.id === edge.to_node_id);
        if (!from || !to) return null;

        const x1 = from.x + NODE_W;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        const cx = (x1 + x2) / 2;

        const isSelected = selectedEdge === edge.id;
        const color = isSelected ? '#6366f1' : '#94a3b8';

        return (
          <g key={edge.id}>
            <path
              d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.5}
              markerEnd={`url(#${isSelected ? 'arrow-selected' : 'arrow'})`}
              style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
              onClick={() => onSelectEdge(edge.id)}
            />
            {edge.label && (
              <text
                x={cx}
                y={(y1 + y2) / 2 - 6}
                textAnchor="middle"
                fill={color}
                fontSize="10"
                fontWeight="500"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Node component ──────────────────────────────────────────────────────────

function NodeCard({ node, isSelected, onSelect, onDragEnd, onDelete, onStartEdge, isConnecting }) {
  const meta = NODE_TYPES[node.type] || NODE_TYPES.choice;
  const Icon = meta.icon;
  const dragStart = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };

    const onMove = (ev) => {
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      onDragEnd(node.id, dragStart.current.nx + dx, dragStart.current.ny + dy);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H, position: 'absolute' }}
      className={`rounded-lg border-2 cursor-grab active:cursor-grabbing select-none transition-shadow ${meta.color} ${isSelected ? 'ring-2 ring-offset-1 ring-indigo-400 shadow-lg' : 'shadow-sm hover:shadow-md'}`}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 h-full">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${meta.text}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate ${meta.text}`}>{node.label || meta.label}</p>
          {node.description && (
            <p className="text-xs text-slate-500 truncate">{node.description}</p>
          )}
          {node.condition && (
            <p className="text-xs text-indigo-500 truncate font-mono">if {node.condition}</p>
          )}
        </div>
      </div>
      {/* Connect handle */}
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-slate-300 hover:bg-indigo-400 border border-white z-10 flex items-center justify-center transition-colors"
        onClick={(e) => { e.stopPropagation(); onStartEdge(node.id); }}
        title="Connect to another node"
      >
        <ArrowRight className="w-2.5 h-2.5 text-white" />
      </button>
      {/* Delete */}
      {isSelected && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 border border-white z-10 flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

// ─── Properties panel ────────────────────────────────────────────────────────

function PropertiesPanel({ node, edge, edges, nodes, onUpdateNode, onUpdateEdge, onDeleteEdge, allRoles, envFactors }) {
  if (!node && !edge) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <Settings className="w-8 h-8 text-slate-300 mb-3" />
      <p className="text-sm text-slate-400">Select a node or edge to inspect its properties</p>
    </div>
  );

  if (edge) {
    const fromNode = nodes.find(n => n.id === edge.from_node_id);
    const toNode = nodes.find(n => n.id === edge.to_node_id);
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Edge Properties</p>
        <p className="text-xs text-slate-500">
          {fromNode?.label || '?'} <ArrowRight className="w-3 h-3 inline" /> {toNode?.label || '?'}
        </p>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Label</label>
          <Input
            value={edge.label || ''}
            onChange={e => onUpdateEdge(edge.id, { label: e.target.value })}
            placeholder="e.g. Yes / No / Option A"
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Condition (optional)</label>
          <Input
            value={edge.condition || ''}
            onChange={e => onUpdateEdge(edge.id, { condition: e.target.value })}
            placeholder="e.g. risk_score > 0.7"
            className="h-7 text-xs font-mono"
          />
        </div>
        <Button variant="destructive" size="sm" className="w-full h-7 text-xs mt-2"
          onClick={() => onDeleteEdge(edge.id)}>
          <Trash2 className="w-3 h-3 mr-1" /> Delete Edge
        </Button>
      </div>
    );
  }

  const meta = NODE_TYPES[node.type] || NODE_TYPES.choice;
  const roleOverrides = node.role_overrides || {};
  const envOverrides = node.env_overrides || {};

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{meta.label} Node</p>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Label</label>
            <Input value={node.label || ''} onChange={e => onUpdateNode(node.id, { label: e.target.value })}
              placeholder="Node label" className="h-7 text-xs" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Description</label>
            <Input value={node.description || ''} onChange={e => onUpdateNode(node.id, { description: e.target.value })}
              placeholder="What happens here?" className="h-7 text-xs" />
          </div>
          {node.type !== 'start' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Entry Condition</label>
              <Input value={node.condition || ''} onChange={e => onUpdateNode(node.id, { condition: e.target.value })}
                placeholder="e.g. choice == 'A'" className="h-7 text-xs font-mono" />
              <p className="text-xs text-slate-400 mt-1">Supports: ==, !=, &gt;, &lt;, &&, ||</p>
            </div>
          )}
        </div>

        {/* Role overrides */}
        {(node.type === 'branch' || node.type === 'choice') && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Role Overrides
            </p>
            <p className="text-xs text-slate-400 mb-2">Override role traits for this branch context</p>
            {allRoles.slice(0, 5).map(role => (
              <div key={role.id} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-600 w-20 truncate">{role.name}</span>
                <Input
                  value={roleOverrides[role.id] || ''}
                  onChange={e => onUpdateNode(node.id, {
                    role_overrides: { ...roleOverrides, [role.id]: e.target.value }
                  })}
                  placeholder="e.g. risk_tolerance: high"
                  className="h-6 text-xs flex-1 font-mono"
                />
              </div>
            ))}
          </div>
        )}

        {/* Env overrides */}
        {node.type === 'branch' && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-blue-500" /> Environment Overrides
            </p>
            <p className="text-xs text-slate-400 mb-2">Adjust environmental parameters in this branch</p>
            {(envFactors || []).slice(0, 4).map(f => (
              <div key={f.id || f.name} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-600 w-20 truncate">{f.name}</span>
                <Input
                  value={envOverrides[f.name] || ''}
                  onChange={e => onUpdateNode(node.id, {
                    env_overrides: { ...envOverrides, [f.name]: e.target.value }
                  })}
                  placeholder="override value"
                  className="h-6 text-xs flex-1"
                />
              </div>
            ))}
            {(!envFactors || envFactors.length === 0) && (
              <p className="text-xs text-slate-400">No environmental factors set in the current simulation.</p>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Preview runner ──────────────────────────────────────────────────────────

function PreviewRunner({ nodes, edges, onClose }) {
  const [current, setCurrent] = useState(() => nodes.find(n => n.type === 'start')?.id || nodes[0]?.id);
  const [history, setHistory] = useState([]);
  const [varStore, setVarStore] = useState({});

  const currentNode = nodes.find(n => n.id === current);
  const outEdges = edges.filter(e => e.from_node_id === current);

  const step = (edgeId) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    setHistory(h => [...h, current]);
    if (edge.condition) setVarStore(v => ({ ...v, last_condition: edge.condition }));
    setCurrent(edge.to_node_id);
  };

  const goBack = () => {
    if (!history.length) return;
    setCurrent(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const reset = () => { setCurrent(nodes.find(n => n.type === 'start')?.id || nodes[0]?.id); setHistory([]); };

  const meta = NODE_TYPES[currentNode?.type] || NODE_TYPES.choice;
  const Icon = meta.icon;

  return (
    <div className="border rounded-xl bg-white shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Play className="w-4 h-4 text-violet-500" /> Branch Preview
        </p>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goBack} disabled={!history.length}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {history.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {history.map(id => {
            const n = nodes.find(x => x.id === id);
            return <React.Fragment key={id}>
              <span className="text-xs text-slate-400">{n?.label || id}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </React.Fragment>;
          })}
        </div>
      )}

      {/* Current node */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`p-4 rounded-lg border-2 ${meta.color}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${meta.text}`} />
            <p className={`text-sm font-semibold ${meta.text}`}>{currentNode?.label || 'Unknown'}</p>
            <Badge variant="outline" className="text-xs ml-auto">{meta.label}</Badge>
          </div>
          {currentNode?.description && <p className="text-xs text-slate-600">{currentNode.description}</p>}
          {currentNode?.condition && (
            <p className="text-xs font-mono text-indigo-600 mt-1">Condition: {currentNode.condition}</p>
          )}
          {Object.keys(currentNode?.role_overrides || {}).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(currentNode.role_overrides).map(([r, v]) => v && (
                <Badge key={r} className="bg-amber-100 text-amber-700 text-xs">{r}: {v}</Badge>
              ))}
            </div>
          )}
          {Object.keys(currentNode?.env_overrides || {}).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.entries(currentNode.env_overrides).map(([k, v]) => v && (
                <Badge key={k} className="bg-blue-100 text-blue-700 text-xs">env:{k}={v}</Badge>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Choices */}
      {outEdges.length > 0 ? (
        <div>
          <p className="text-xs text-slate-400 mb-2">Choose a path:</p>
          <div className="space-y-1.5">
            {outEdges.map(e => {
              const target = nodes.find(n => n.id === e.to_node_id);
              return (
                <Button key={e.id} variant="outline" size="sm" className="w-full h-8 text-xs justify-start gap-2"
                  onClick={() => step(e.id)}>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  {e.label || target?.label || e.to_node_id}
                  {e.condition && <span className="ml-auto font-mono text-indigo-400 text-xs">{e.condition}</span>}
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-slate-500">End of path reached</p>
          <Button size="sm" variant="ghost" className="text-xs mt-1 h-6" onClick={reset}>Start over</Button>
        </div>
      )}

      {/* Variable watch */}
      {Object.keys(varStore).length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs text-slate-400 mb-1">Variable store</p>
          {Object.entries(varStore).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs font-mono">
              <span className="text-indigo-500">{k}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Palette ─────────────────────────────────────────────────────────────────

function Palette({ onAddNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Node Types</p>
      {Object.entries(NODE_TYPES).map(([type, meta]) => {
        const Icon = meta.icon;
        return (
          <button
            key={type}
            onClick={() => onAddNode(type)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all hover:shadow-sm ${meta.color}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
            <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DecisionTreeBuilder({ open, onClose, simulation, allRoles, environmentalFactors }) {
  const [nodes, setNodes] = useState([
    { id: uid(), type: 'start', label: 'Start', description: simulation?.title || 'Root decision', x: 60, y: 180, role_overrides: {}, env_overrides: {} }
  ]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [title, setTitle] = useState(simulation?.title ? `${simulation.title} — Branch Tree` : 'Decision Tree');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const panStart = useRef(null);

  const currentNode = nodes.find(n => n.id === selectedNode);
  const currentEdge = edges.find(e => e.id === selectedEdge);

  // Auto-layout new nodes in a cascade
  const getNextPosition = () => {
    const lastNode = nodes[nodes.length - 1];
    return { x: (lastNode?.x || 60) + 220, y: (lastNode?.y || 180) + (Math.random() > 0.5 ? 60 : -60) };
  };

  const addNode = (type) => {
    const pos = getNextPosition();
    const newNode = { id: uid(), type, label: NODE_TYPES[type].label, description: '', x: pos.x, y: pos.y, role_overrides: {}, env_overrides: {}, condition: '' };
    setNodes(n => [...n, newNode]);
    setSelectedNode(newNode.id);
    setSelectedEdge(null);
  };

  const updateNode = (id, updates) => {
    setNodes(n => n.map(node => node.id === id ? { ...node, ...updates } : node));
  };

  const deleteNode = (id) => {
    setNodes(n => n.filter(node => node.id !== id));
    setEdges(e => e.filter(edge => edge.from_node_id !== id && edge.to_node_id !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const dragNode = (id, x, y) => {
    setNodes(n => n.map(node => node.id === id ? { ...node, x: Math.max(0, x), y: Math.max(0, y) } : node));
  };

  const startEdge = (fromId) => {
    if (connectingFrom === fromId) { setConnectingFrom(null); return; }
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom !== fromId && !edges.find(e => e.from_node_id === connectingFrom && e.to_node_id === fromId)) {
        setEdges(e => [...e, { id: uid(), from_node_id: connectingFrom, to_node_id: fromId, label: '', condition: '' }]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(fromId);
      toast.info("Now click the target node's → button to connect", { duration: 2000 });
    }
  };

  const updateEdge = (id, updates) => setEdges(e => e.map(edge => edge.id === id ? { ...edge, ...updates } : edge));
  const deleteEdge = (id) => { setEdges(e => e.filter(edge => edge.id !== id)); setSelectedEdge(null); };

  const handleCanvasClick = () => { setSelectedNode(null); setSelectedEdge(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.DecisionTree.create({
        title,
        source_simulation_id: simulation?.id,
        nodes,
        edges,
        variable_store: {},
        version: 1,
      });
      toast.success('Decision tree saved');
    } catch (e) {
      toast.error('Failed to save tree');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ title, nodes, edges, variable_store: {}, version: 1 }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Canvas pan
  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current && !e.target.classList.contains('canvas-bg')) return;
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    const onMove = (ev) => {
      setPan({ x: panStart.current.px + ev.clientX - panStart.current.mx, y: panStart.current.py + ev.clientY - panStart.current.my });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[1300px] max-h-[95vh] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 py-3 border-b shrink-0 flex-row items-center gap-3">
          <GitBranch className="w-5 h-5 text-violet-600 flex-shrink-0" />
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-7 text-sm font-semibold border-0 shadow-none p-0 focus-visible:ring-0 flex-1"
          />
          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut className="w-3.5 h-3.5" /></Button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPreview(p => !p)} title="Preview runner">
              <Eye className={`w-3.5 h-3.5 ${showPreview ? 'text-violet-600' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportJSON} title="Export JSON">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left palette */}
          <div className="w-44 border-r bg-slate-50 p-3 flex-shrink-0 overflow-y-auto">
            <Palette onAddNode={addNode} />
            {connectingFrom && (
              <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <p className="font-semibold">Connecting…</p>
                <p>Click → on the target node, or click here to cancel.</p>
                <Button size="sm" variant="ghost" className="h-6 text-xs mt-1 w-full" onClick={() => setConnectingFrom(null)}>Cancel</Button>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative bg-slate-100">
            <div
              ref={canvasRef}
              className="w-full h-full cursor-default canvas-bg"
              style={{
                backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
            >
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'relative', width: '2400px', height: '1600px' }}>
                <EdgeLayer
                  nodes={nodes}
                  edges={edges}
                  selectedEdge={selectedEdge}
                  onSelectEdge={(id) => { setSelectedEdge(id); setSelectedNode(null); }}
                />
                {nodes.map(node => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNode === node.id}
                    onSelect={(id) => { setSelectedNode(id); setSelectedEdge(null); }}
                    onDragEnd={dragNode}
                    onDelete={deleteNode}
                    onStartEdge={startEdge}
                    isConnecting={connectingFrom !== null}
                  />
                ))}
              </div>
            </div>

            {/* Preview overlay */}
            {showPreview && nodes.length > 0 && (
              <div className="absolute bottom-4 right-4 w-80 z-20">
                <PreviewRunner nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} />
              </div>
            )}

            {/* Node/edge count */}
            <div className="absolute bottom-3 left-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded border">
              {nodes.length} nodes · {edges.length} edges
            </div>
          </div>

          {/* Right: Properties panel */}
          <div className="w-56 border-l bg-white flex-shrink-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Properties</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <PropertiesPanel
                node={currentNode}
                edge={currentEdge}
                nodes={nodes}
                edges={edges}
                onUpdateNode={updateNode}
                onUpdateEdge={updateEdge}
                onDeleteEdge={deleteEdge}
                allRoles={allRoles || []}
                envFactors={environmentalFactors || []}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}