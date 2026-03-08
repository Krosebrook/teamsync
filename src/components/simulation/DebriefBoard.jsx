import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Lightbulb, GraduationCap, CheckSquare, Plus, X, Sparkles,
  Loader2, GripVertical, Pencil, Check, Trash2, ClipboardList
} from "lucide-react";

const COLUMNS = [
  {
    id: 'key_insights',
    label: 'Key Insights',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    headerBg: 'bg-amber-100',
    cardBorder: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'lessons_learned',
    label: 'Lessons Learned',
    icon: GraduationCap,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    headerBg: 'bg-violet-100',
    cardBorder: 'border-violet-200',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'action_items',
    label: 'Action Items',
    icon: CheckSquare,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-100',
    cardBorder: 'border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

function buildInitialCards(simulation) {
  if (!simulation) return { key_insights: [], lessons_learned: [], action_items: [] };

  const cards = { key_insights: [], lessons_learned: [], action_items: [] };

  // Key insights from summary + tensions
  if (simulation.summary) {
    const sentences = simulation.summary.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
    sentences.slice(0, 3).forEach((s, i) => {
      cards.key_insights.push({ id: `summary_${i}`, text: s.trim(), source: 'summary', feedback: '' });
    });
  }

  simulation.tensions?.forEach((t, i) => {
    if (t.severity === 'high' || t.severity === 'critical') {
      cards.key_insights.push({
        id: `tension_${i}`,
        text: t.description,
        source: 'tension',
        severity: t.severity,
        feedback: '',
      });
    }
  });

  // Lessons learned from role responses + trade-offs
  simulation.responses?.slice(0, 4).forEach((r, i) => {
    if (r.primary_driver) {
      cards.lessons_learned.push({
        id: `driver_${i}`,
        text: `${r.role}: ${r.primary_driver}`,
        source: 'role',
        role: r.role,
        feedback: '',
      });
    }
  });

  simulation.decision_trade_offs?.forEach((t, i) => {
    cards.lessons_learned.push({
      id: `tradeoff_${i}`,
      text: `Trade-off — ${t.trade_off}: ${t.option_a} vs. ${t.option_b}`,
      source: 'trade_off',
      feedback: '',
    });
  });

  // Action items from next_steps
  simulation.next_steps?.forEach((s, i) => {
    cards.action_items.push({
      id: `step_${i}`,
      text: s.action,
      source: 'next_step',
      priority: s.priority,
      owner: s.owner_role,
      completed: s.completed || false,
      feedback: '',
    });
  });

  return cards;
}

function KanbanCard({ card, columnId, allColumns, onMove, onDelete, onFeedbackChange, onToggleComplete }) {
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState(card.feedback || '');
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const sourceLabel = {
    summary: '📝 Summary',
    tension: '⚡ Tension',
    role: '👤 Role',
    trade_off: '⚖️ Trade-off',
    next_step: '✅ Next Step',
    custom: '✏️ Custom',
  }[card.source] || '📌';

  const priorityColor = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  }[card.priority];

  const col = COLUMNS.find(c => c.id === columnId);

  return (
    <div className={`bg-white border ${col.cardBorder} rounded-lg p-3 shadow-sm hover:shadow-md transition-all group relative`}>
      {/* Source badge + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] text-slate-400 font-medium leading-tight">{sourceLabel}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Move to */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(m => !m)}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Move to column"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            {showMoveMenu && (
              <div className="absolute right-0 top-5 bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-1 min-w-[140px]">
                {allColumns.filter(c => c.id !== columnId).map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onMove(card.id, columnId, c.id); setShowMoveMenu(false); }}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50 flex items-center gap-1.5 ${c.color}`}
                  >
                    <c.icon className="w-3 h-3" /> {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onDelete(card.id, columnId)}
            className="p-0.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <p className={`text-sm text-slate-700 leading-relaxed ${card.completed ? 'line-through text-slate-400' : ''}`}>
        {card.text}
      </p>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {card.priority && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColor}`}>
            {card.priority}
          </span>
        )}
        {card.owner && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
            @{card.owner}
          </span>
        )}
        {card.severity && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${card.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
            {card.severity}
          </span>
        )}
      </div>

      {/* Action item complete toggle */}
      {columnId === 'action_items' && (
        <button
          onClick={() => onToggleComplete(card.id, columnId)}
          className={`mt-2 text-[10px] font-medium flex items-center gap-1 transition-colors ${card.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
        >
          <Check className="w-3 h-3" /> {card.completed ? 'Done' : 'Mark complete'}
        </button>
      )}

      {/* Feedback area */}
      {editingFeedback ? (
        <div className="mt-2 space-y-1.5">
          <Textarea
            value={feedbackDraft}
            onChange={e => setFeedbackDraft(e.target.value)}
            placeholder="Add your team feedback or notes..."
            className="text-xs min-h-[60px] resize-none border-slate-200"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => { onFeedbackChange(card.id, columnId, feedbackDraft); setEditingFeedback(false); }}>
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => { setFeedbackDraft(card.feedback || ''); setEditingFeedback(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingFeedback(true)}
          className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <Pencil className="w-2.5 h-2.5" />
          {card.feedback ? 'Edit feedback' : 'Add feedback'}
        </button>
      )}

      {card.feedback && !editingFeedback && (
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded p-2 text-[11px] text-slate-600 italic">
          💬 {card.feedback}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ column, cards, allColumns, onMove, onDelete, onFeedbackChange, onToggleComplete, onAddCustom }) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardText, setNewCardText] = useState('');
  const Icon = column.icon;

  const handleAdd = () => {
    if (!newCardText.trim()) return;
    onAddCustom(column.id, newCardText.trim());
    setNewCardText('');
    setAddingCard(false);
  };

  return (
    <div className={`flex flex-col rounded-xl border ${column.border} ${column.bg} min-h-[400px] w-full`}>
      {/* Column header */}
      <div className={`${column.headerBg} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${column.color}`} />
          <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${column.badgeColor}`}>
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => setAddingCard(true)}
          className={`${column.color} hover:opacity-70 transition-opacity`}
          title="Add card"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            columnId={column.id}
            allColumns={allColumns}
            onMove={onMove}
            onDelete={onDelete}
            onFeedbackChange={onFeedbackChange}
            onToggleComplete={onToggleComplete}
          />
        ))}

        {addingCard && (
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-sm">
            <Textarea
              value={newCardText}
              onChange={e => setNewCardText(e.target.value)}
              placeholder={`Add a ${column.label.toLowerCase()} note...`}
              className="text-sm min-h-[70px] resize-none border-slate-200"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd(); }}
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs px-3" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingCard(false); setNewCardText(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DebriefBoard({ open, onClose, simulation }) {
  const [cards, setCards] = useState(() => buildInitialCards(simulation));
  const [generating, setGenerating] = useState(false);

  // Reset cards when simulation changes
  React.useEffect(() => {
    if (open) setCards(buildInitialCards(simulation));
  }, [simulation?.id, open]);

  const handleMove = (cardId, fromCol, toCol) => {
    setCards(prev => {
      const card = prev[fromCol].find(c => c.id === cardId);
      if (!card) return prev;
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter(c => c.id !== cardId),
        [toCol]: [...prev[toCol], { ...card, id: `${card.id}_moved_${Date.now()}` }],
      };
    });
    toast.success(`Moved to ${COLUMNS.find(c => c.id === toCol)?.label}`);
  };

  const handleDelete = (cardId, colId) => {
    setCards(prev => ({ ...prev, [colId]: prev[colId].filter(c => c.id !== cardId) }));
  };

  const handleFeedbackChange = (cardId, colId, feedback) => {
    setCards(prev => ({
      ...prev,
      [colId]: prev[colId].map(c => c.id === cardId ? { ...c, feedback } : c),
    }));
  };

  const handleToggleComplete = (cardId, colId) => {
    setCards(prev => ({
      ...prev,
      [colId]: prev[colId].map(c => c.id === cardId ? { ...c, completed: !c.completed } : c),
    }));
  };

  const handleAddCustom = (colId, text) => {
    const newCard = {
      id: `custom_${Date.now()}`,
      text,
      source: 'custom',
      feedback: '',
    };
    setCards(prev => ({ ...prev, [colId]: [...prev[colId], newCard] }));
  };

  const handleAIEnrich = async () => {
    if (!simulation) return;
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a team learning facilitator. Based on this simulation, generate concise debrief content.

Scenario: ${simulation.scenario || simulation.title}
Summary: ${simulation.summary || ''}
Tensions: ${simulation.tensions?.map(t => t.description).join('; ') || ''}
Next Steps: ${simulation.next_steps?.map(s => s.action).join('; ') || ''}

Generate:
- 3 key insights (non-obvious observations about the team dynamics or decision)
- 3 lessons learned (what teams should take away from this simulation)
- 2 action items (specific things the team should do after this debrief)`,
        response_json_schema: {
          type: "object",
          properties: {
            key_insights: { type: "array", items: { type: "string" } },
            lessons_learned: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
          }
        }
      });

      setCards(prev => ({
        key_insights: [
          ...prev.key_insights,
          ...(result.key_insights || []).map((t, i) => ({ id: `ai_insight_${Date.now()}_${i}`, text: t, source: 'custom', feedback: '' })),
        ],
        lessons_learned: [
          ...prev.lessons_learned,
          ...(result.lessons_learned || []).map((t, i) => ({ id: `ai_lesson_${Date.now()}_${i}`, text: t, source: 'custom', feedback: '' })),
        ],
        action_items: [
          ...prev.action_items,
          ...(result.action_items || []).map((t, i) => ({ id: `ai_action_${Date.now()}_${i}`, text: t, source: 'custom', feedback: '', completed: false })),
        ],
      }));
      toast.success('AI-generated debrief items added');
    } catch {
      toast.error('AI enrichment failed');
    }
    setGenerating(false);
  };

  const totalCards = Object.values(cards).flat().length;
  const completedActions = cards.action_items.filter(c => c.completed).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[92vw] w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-slate-700" />
              Debrief Board
              {simulation?.title && (
                <span className="text-sm font-normal text-slate-500 ml-1">— {simulation.title}</span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{totalCards} cards</span>
                <span>{completedActions}/{cards.action_items.length} actions done</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAIEnrich}
                disabled={generating || !simulation}
                className="gap-1.5 h-8 text-xs text-violet-600 border-violet-200 hover:bg-violet-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI Enrich
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-5">
          {!simulation ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-20">
              <ClipboardList className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">Run a simulation first to populate the debrief board.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 h-full">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  cards={cards[col.id] || []}
                  allColumns={COLUMNS}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onFeedbackChange={handleFeedbackChange}
                  onToggleComplete={handleToggleComplete}
                  onAddCustom={handleAddCustom}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}