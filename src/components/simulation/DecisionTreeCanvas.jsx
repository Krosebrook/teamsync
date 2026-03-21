import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Plus,
  Play,
  Edit2,
  X,
  Circle,
  GitBranch,
  Flag,
  ChevronDown,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const NODE_TYPES = {
  start: { icon: Circle, label: 'Start', color: 'bg-blue-100 border-blue-300' },
  choice: { icon: GitBranch, label: 'Choice', color: 'bg-purple-100 border-purple-300' },
  branch: { icon: GitBranch, label: 'Branch', color: 'bg-green-100 border-green-300' },
  outcome: { icon: Flag, label: 'Outcome', color: 'bg-amber-100 border-amber-300' },
};

function Node({ node, selected, onSelect, onEditLabel, onDelete, onRun, onConnect }) {
  const Icon = NODE_TYPES[node.type]?.icon || Circle;
  const colorClass = NODE_TYPES[node.type]?.color || 'bg-slate-100 border-slate-300';

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={`
        absolute p-3 w-48 border-2 rounded-lg cursor-move
        ${colorClass}
        ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow'}
      `}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium truncate">{NODE_TYPES[node.type]?.label}</span>
        </div>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="text-slate-500 hover:text-red-600 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-2">
        <p className="text-sm font-semibold text-slate-900 break-words">{node.label}</p>
        {node.description && (
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{node.description}</p>
        )}
      </div>

      {selected && (
        <div className="mt-3 flex flex-col gap-1">
          {node.type === 'branch' && (
            <Button size="sm" onClick={() => onRun(node)} className="w-full text-xs">
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
          )}
          {node.type !== 'outcome' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConnect(node)}
              className="w-full text-xs"
            >
              Connect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DecisionTreeCanvas({ open, onOpenChange, simulation }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingFromId, setConnectingFromId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [tree, setTree] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (simulation?.id) {
      base44.entities.DecisionTree.filter({ source_simulation_id: simulation.id })
        .then((trees) => {
          if (trees.length > 0) {
            setTree(trees[0]);
            setNodes(trees[0].nodes || nodes);
            setEdges(trees[0].edges || []);
          }
        })
        .catch(() => {});
    }
  }, [simulation?.id]);

  const saveTree = useMutation({
    mutationFn: async () => {
      if (tree?.id) {
        return base44.entities.DecisionTree.update(tree.id, {
          nodes,
          edges,
        });
      } else {
        return base44.entities.DecisionTree.create({
          title: `Decision Tree - ${simulation?.title || 'Untitled'}`,
          source_simulation_id: simulation?.id,
          nodes,
          edges,
        });
      }
    },
    onSuccess: (updated) => {
      setTree(updated);
      queryClient.invalidateQueries({ queryKey: ['decision_trees'] });
    },
  });

  const addNode = (type) => {
    const isFirstStart = type === 'start' && nodes.length === 0;
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: isFirstStart ? (simulation?.title || 'Base Scenario') : `New ${NODE_TYPES[type]?.label || 'Node'}`,
      description: isFirstStart ? (simulation?.scenario?.substring(0, 100) || '') : '',
      x: isFirstStart ? 100 : Math.random() * 400 + 200,
      y: isFirstStart ? 100 : Math.random() * 400 + 200,
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from_node_id !== id && e.to_node_id !== id));
    setSelectedNodeId(null);
  };

  const connectNodes = (fromId) => {
    setConnectingFromId(fromId);
  };

  const completeConnection = (toId) => {
    if (connectingFromId && connectingFromId !== toId) {
      const newEdge = {
        id: `edge-${Date.now()}`,
        from_node_id: connectingFromId,
        to_node_id: toId,
        label: 'connects to',
        condition: '',
      };
      setEdges([...edges, newEdge]);
    }
    setConnectingFromId(null);
  };

  const updateNodeLabel = (id, label, description) => {
    setNodes(
      nodes.map((n) =>
        n.id === id ? { ...n, label, description: description || n.description } : n
      )
    );
  };

  const moveNode = (id, x, y) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Decision Tree Explorer</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded relative overflow-hidden"
          >
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                  <GitBranch className="w-6 h-6 text-violet-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">No what-if branches yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">Click "+ Start Tree" to explore alternative outcomes from this simulation.</p>
                <button
                  onClick={() => addNode('start')}
                  className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                >
                  + Start Tree
                </button>
              </div>
            )}
            {nodes.map((node) => (
              <Node
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onSelect={() =>
                  connectingFromId ? completeConnection(node.id) : setSelectedNodeId(node.id)
                }
                onEditLabel={(label, desc) => updateNodeLabel(node.id, label, desc)}
                onDelete={deleteNode}
                onRun={() => toast.info('Run simulation for this branch')}
                onConnect={() => connectNodes(node.id)}
              />
            ))}

            {/* Edge preview */}
            {connectingFromId && selectedNodeId && connectingFromId !== selectedNodeId && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {(() => {
                  const from = nodes.find((n) => n.id === connectingFromId);
                  const to = nodes.find((n) => n.id === selectedNodeId);
                  if (!from || !to) return null;
                  return (
                    <line
                      x1={from.x + 96}
                      y1={from.y + 48}
                      x2={to.x + 96}
                      y2={to.y + 48}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })()}
              </svg>
            )}
          </div>

          {/* Sidebar toolbar */}
          <div className="w-48 border-l border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto bg-white">
            <div>
              <h3 className="text-xs font-semibold uppercase mb-2 text-slate-600">Add Node</h3>
              <div className="space-y-1">
                {Object.entries(NODE_TYPES).map(([type, config]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant="outline"
                    onClick={() => addNode(type)}
                    className="w-full justify-start text-xs"
                  >
                    <config.icon className="w-3 h-3 mr-2" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {selectedNodeId && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="text-xs font-semibold mb-2">Edit Node</h3>
                {(() => {
                  const node = nodes.find((n) => n.id === selectedNodeId);
                  if (!node) return null;
                  return (
                    <div className="space-y-2">
                      <Input
                        placeholder="Label"
                        value={node.label}
                        onChange={(e) =>
                          updateNodeLabel(node.id, e.target.value, node.description)
                        }
                        className="text-xs"
                      />
                      <textarea
                        placeholder="Description"
                        value={node.description || ''}
                        onChange={(e) =>
                          updateNodeLabel(node.id, node.label, e.target.value)
                        }
                        className="w-full text-xs p-1 border rounded"
                        rows="2"
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={() => saveTree.mutate()}
              disabled={saveTree.isPending}
              className="w-full text-xs"
            >
              Save Tree
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}