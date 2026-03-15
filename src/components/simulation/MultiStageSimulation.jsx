import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';
import {
  GitBranch, Plus, Trash2, Play, ChevronRight, ChevronDown,
  ArrowRight, CheckCircle2, Loader2, Flag, Zap, X, RotateCcw,
  AlertTriangle, Edit2, Save
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

// Stage: { id, label, scenario_fragment, branch_conditions: [{ condition_label, outcome_keyword, next_stage_id }] }
// Execution state: { stage_id, ai_result, chosen_branch }

const uid = () => `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

const OUTCOME_KEYWORDS = [
  { value: 'consensus', label: 'Consensus reached' },
  { value: 'deadlock', label: 'Deadlock / no agreement' },
  { value: 'escalate', label: 'Escalation needed' },
  { value: 'risk_high', label: 'High-risk path chosen' },
  { value: 'risk_low', label: 'Low-risk path chosen' },
  { value: 'defer', label: 'Decision deferred' },
  { value: 'approve', label: 'Decision approved' },
  { value: 'reject', label: 'Decision rejected' },
];

// ─── Stage Editor ─────────────────────────────────────────────────────────────

function StageEditor({ stage, allStages, onChange, onDelete, index }) {
  const [open, setOpen] = useState(index === 0);

  const updateBranch = (bi, updates) => {
    const branches = stage.branch_conditions.map((b, i) => i === bi ? { ...b, ...updates } : b);
    onChange({ ...stage, branch_conditions: branches });
  };

  const addBranch = () => {
    onChange({
      ...stage,
      branch_conditions: [
        ...stage.branch_conditions,
        { id: uid(), condition_label: '', outcome_keyword: 'consensus', next_stage_id: '' }
      ]
    });
  };

  const removeBranch = (bi) => {
    onChange({ ...stage, branch_conditions: stage.branch_conditions.filter((_, i) => i !== bi) });
  };

  const otherStages = allStages.filter(s => s.id !== stage.id);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Stage header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-violet-700">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{stage.label || `Stage ${index + 1}`}</p>
          <p className="text-xs text-slate-400 truncate">{stage.scenario_fragment || 'No scenario text yet'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-[10px]">{stage.branch_conditions.length} branches</Badge>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          <div className="space-y-2">
            <Input
              value={stage.label}
              onChange={e => onChange({ ...stage, label: e.target.value })}
              placeholder="Stage name (e.g. 'Initial Alignment', 'Risk Review')"
              className="h-8 text-sm"
            />
            <Textarea
              value={stage.scenario_fragment}
              onChange={e => onChange({ ...stage, scenario_fragment: e.target.value })}
              placeholder="Describe what happens in this stage. This will be appended to the base scenario and sent to the AI..."
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          {/* Branch conditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-violet-500" />
                Branch Conditions
              </p>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={addBranch}>
                <Plus className="w-3 h-3" /> Add Branch
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Define what outcome triggers which next stage. The AI result is evaluated and the first matching branch is followed.
            </p>

            {stage.branch_conditions.length === 0 && (
              <p className="text-xs text-slate-400 italic">No branches — this stage ends the simulation.</p>
            )}

            {stage.branch_conditions.map((branch, bi) => (
              <div key={branch.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={branch.outcome_keyword}
                      onChange={e => updateBranch(bi, { outcome_keyword: e.target.value })}
                      className="flex-1 h-7 text-xs border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      {OUTCOME_KEYWORDS.map(k => (
                        <option key={k.value} value={k.value}>{k.label}</option>
                      ))}
                    </select>
                    <select
                      value={branch.next_stage_id}
                      onChange={e => updateBranch(bi, { next_stage_id: e.target.value })}
                      className="flex-1 h-7 text-xs border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      <option value="">→ End simulation</option>
                      {otherStages.map(s => (
                        <option key={s.id} value={s.id}>{s.label || s.id}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    value={branch.condition_label}
                    onChange={e => updateBranch(bi, { condition_label: e.target.value })}
                    placeholder="Optional: describe this branch (shown during execution)"
                    className="h-7 text-xs"
                  />
                </div>
                <button onClick={() => removeBranch(bi)} className="text-slate-300 hover:text-rose-500 mt-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-rose-500 hover:text-rose-700 gap-1"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" /> Remove stage
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage Result Card ─────────────────────────────────────────────────────────

function StageResultCard({ execution, stageIndex, stageLabel, chosenBranch, nextStageLabel }) {
  const [expanded, setExpanded] = useState(stageIndex === 0);
  const result = execution?.ai_result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-slate-200 rounded-xl overflow-hidden bg-white"
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
        onClick={() => setExpanded(o => !o)}
      >
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Stage {stageIndex + 1}: {stageLabel}</p>
          {chosenBranch && (
            <p className="text-xs text-violet-600 flex items-center gap-1 mt-0.5">
              <ArrowRight className="w-3 h-3" />
              {chosenBranch.condition_label || chosenBranch.outcome_keyword}
              {nextStageLabel && <span className="text-slate-400">→ {nextStageLabel}</span>}
            </p>
          )}
          {!chosenBranch && <p className="text-xs text-slate-400">Terminal stage</p>}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && result && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {result.stage_summary && (
            <p className="text-sm text-slate-700 leading-relaxed">{result.stage_summary}</p>
          )}
          {result.detected_outcome && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-slate-600">Detected outcome:</span>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                {result.detected_outcome}
              </Badge>
            </div>
          )}
          {result.key_tensions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Key tensions in this stage</p>
              <ul className="space-y-1">
                {result.key_tensions.map((t, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.role_stances?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Role stances</p>
              <div className="space-y-1.5">
                {result.role_stances.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="text-slate-500 capitalize font-medium w-28 flex-shrink-0 truncate">
                      {s.role?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-700">{s.stance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MultiStageSimulation({ open, onClose, baseSimulation, selectedRoles, allRoles }) {
  const [stages, setStages] = useState([
    {
      id: uid(),
      label: 'Stage 1 — Initial Discussion',
      scenario_fragment: '',
      branch_conditions: [
        { id: uid(), outcome_keyword: 'consensus', condition_label: 'All roles aligned', next_stage_id: '' },
        { id: uid(), outcome_keyword: 'deadlock', condition_label: 'No agreement reached', next_stage_id: '' },
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [executions, setExecutions] = useState([]); // [{ stage_id, ai_result, chosen_branch }]
  const [currentStageId, setCurrentStageId] = useState(null);
  const [done, setDone] = useState(false);
  const [view, setView] = useState('build'); // 'build' | 'run'

  const addStage = () => {
    const newStage = {
      id: uid(),
      label: `Stage ${stages.length + 1}`,
      scenario_fragment: '',
      branch_conditions: []
    };
    setStages(s => [...s, newStage]);
  };

  const updateStage = (id, updated) => setStages(s => s.map(st => st.id === id ? updated : st));
  const deleteStage = (id) => setStages(s => s.filter(st => st.id !== id));

  const reset = () => {
    setExecutions([]);
    setCurrentStageId(null);
    setDone(false);
    setView('build');
  };

  const runStage = async (stageId, previousExecutions) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) { setDone(true); return; }

    setCurrentStageId(stageId);

    const baseScenario = baseSimulation?.scenario || '';
    const roleNames = (selectedRoles || []).map(r => {
      const rd = allRoles?.find(x => x.id === r.role);
      return `${rd?.name || r.role} (influence: ${r.influence}/10)`;
    }).join(', ');

    const history = previousExecutions.map((ex, i) => {
      const st = stages.find(s => s.id === ex.stage_id);
      return `STAGE ${i + 1} (${st?.label}): ${ex.ai_result?.stage_summary || 'No summary'}. Outcome: ${ex.ai_result?.detected_outcome || 'unknown'}`;
    }).join('\n');

    const prompt = `You are running a multi-stage team decision simulation.

BASE SCENARIO: ${baseScenario}

ROLES: ${roleNames}

${history ? `PREVIOUS STAGES:\n${history}\n` : ''}
CURRENT STAGE: ${stage.label}
STAGE SCENARIO: ${stage.scenario_fragment || '(No additional context — continue from base scenario)'}

Simulate this stage of the discussion. Identify what outcome best describes this stage's result.
Available outcomes: ${OUTCOME_KEYWORDS.map(k => `"${k.value}" (${k.label})`).join(', ')}

Return JSON:
{
  "stage_summary": "2-3 sentence summary of what happened in this stage",
  "detected_outcome": "one of the outcome keywords above that best fits",
  "key_tensions": ["tension 1", "tension 2"],
  "role_stances": [
    { "role": "role_id", "stance": "1 sentence on their position in this stage" }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          stage_summary: { type: 'string' },
          detected_outcome: { type: 'string' },
          key_tensions: { type: 'array', items: { type: 'string' } },
          role_stances: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                stance: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Match outcome to a branch
    const matchedBranch = stage.branch_conditions.find(
      b => b.outcome_keyword === result.detected_outcome
    ) || null;

    const execution = { stage_id: stageId, ai_result: result, chosen_branch: matchedBranch };
    const newExecutions = [...previousExecutions, execution];
    setExecutions(newExecutions);

    // Follow branch or end
    if (matchedBranch?.next_stage_id) {
      await runStage(matchedBranch.next_stage_id, newExecutions);
    } else {
      setCurrentStageId(null);
      setDone(true);
    }
  };

  const startRun = async () => {
    if (stages.length === 0) { toast.error('Add at least one stage'); return; }
    setView('run');
    setExecutions([]);
    setDone(false);
    setIsRunning(true);
    try {
      await runStage(stages[0].id, []);
    } catch (e) {
      toast.error('Simulation error: ' + e.message);
    } finally {
      setIsRunning(false);
      setCurrentStageId(null);
    }
  };

  const getStageLabel = (id) => stages.find(s => s.id === id)?.label || id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-violet-600" />
            Multi-Stage Branching Simulation
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Define stages and branch conditions — the AI guides participants based on each stage's outcome
          </p>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          <button
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${view === 'build' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setView('build')}
          >
            Build Path
          </button>
          <button
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${view === 'run' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'} ${executions.length === 0 && !isRunning ? 'opacity-40 pointer-events-none' : ''}`}
            onClick={() => setView('run')}
          >
            Execution
            {executions.length > 0 && <Badge className="ml-1.5 text-[10px] bg-violet-100 text-violet-700 border-0">{executions.length}</Badge>}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5">
            {/* BUILD VIEW */}
            {view === 'build' && (
              <div className="space-y-3">
                {/* Base scenario preview */}
                {baseSimulation?.scenario && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Base Scenario</p>
                    <p className="text-xs text-slate-600 line-clamp-3">{baseSimulation.scenario}</p>
                  </div>
                )}

                {/* Stages */}
                {stages.map((stage, index) => (
                  <StageEditor
                    key={stage.id}
                    stage={stage}
                    allStages={stages}
                    index={index}
                    onChange={(updated) => updateStage(stage.id, updated)}
                    onDelete={() => deleteStage(stage.id)}
                  />
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed gap-2 text-slate-600 h-9"
                  onClick={addStage}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </Button>

                {/* Path preview */}
                {stages.length > 1 && (
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <p className="text-xs font-semibold text-violet-700 mb-2">Path Overview</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {stages.map((s, i) => (
                        <React.Fragment key={s.id}>
                          <span className="text-xs bg-white border border-violet-200 text-violet-700 px-2 py-0.5 rounded">
                            {s.label || `Stage ${i + 1}`}
                          </span>
                          {i < stages.length - 1 && <ArrowRight className="w-3 h-3 text-violet-400" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RUN VIEW */}
            {view === 'run' && (
              <div className="space-y-4">
                {/* Running indicator */}
                {isRunning && currentStageId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl"
                  >
                    <Loader2 className="w-4 h-4 text-violet-600 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-violet-800">
                        Running: {getStageLabel(currentStageId)}
                      </p>
                      <p className="text-xs text-violet-500">AI is simulating this stage…</p>
                    </div>
                  </motion.div>
                )}

                {/* Execution results */}
                <AnimatePresence>
                  {executions.map((ex, i) => {
                    const stage = stages.find(s => s.id === ex.stage_id);
                    const nextLabel = ex.chosen_branch?.next_stage_id
                      ? getStageLabel(ex.chosen_branch.next_stage_id)
                      : null;
                    return (
                      <StageResultCard
                        key={ex.stage_id + i}
                        execution={ex}
                        stageIndex={i}
                        stageLabel={stage?.label || `Stage ${i + 1}`}
                        chosenBranch={ex.chosen_branch}
                        nextStageLabel={nextLabel}
                      />
                    );
                  })}
                </AnimatePresence>

                {/* Done state */}
                {done && !isRunning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-800">Simulation Complete</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {executions.length} stage{executions.length !== 1 ? 's' : ''} executed
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5 h-7 text-xs"
                      onClick={reset}
                    >
                      <RotateCcw className="w-3 h-3" /> Reset & Rebuild
                    </Button>
                  </motion.div>
                )}

                {executions.length === 0 && !isRunning && (
                  <div className="text-center py-10 text-slate-400">
                    <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No execution yet</p>
                    <p className="text-xs mt-1">Go to Build Path and click Run</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center gap-2 flex-shrink-0 bg-white">
          <span className="text-xs text-slate-400 mr-auto">
            {stages.length} stage{stages.length !== 1 ? 's' : ''} defined
          </span>
          {done && (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={reset}>
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            disabled={isRunning || stages.length === 0 || done}
            onClick={startRun}
          >
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Running…' : 'Run Simulation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}