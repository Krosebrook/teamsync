/**
 * WhatIfBranch — Clone a simulation and modify key parameters to create an A/B "What If" branch.
 * Surfaces a focused editor for changing: title, scenario constraints, role influences, and
 * environmental factors — then forks via the existing forkSimulation backend function.
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { GitBranch, Loader2, Zap, Users, ArrowRightLeft, Plus, Minus, Info } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

const BRANCH_PRESETS = [
  { label: 'Higher Stakes', description: 'Increase pressure on key roles', changes: { influenceBoost: 3, scenarioSuffix: '\n\n[VARIANT: Stakes elevated — budget doubled, deadline halved]' } },
  { label: 'Fewer Stakeholders', description: 'Remove low-influence roles', changes: { filterInfluenceBelow: 5 } },
  { label: 'Flip Risk Appetite', description: 'Invert high/low risk roles', changes: { flipRisk: true } },
  { label: 'Constraint Removed', description: 'Relax the core constraint', changes: { scenarioSuffix: '\n\n[VARIANT: Primary constraint removed — unlimited resources available]' } },
];

function DiffBadge({ changed }) {
  if (!changed) return null;
  return <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold">MODIFIED</span>;
}

export default function WhatIfBranch({ simulation, open, onClose, onBranchCreated }) {
  const [branchName, setBranchName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [scenarioPatch, setScenarioPatch] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const originalRoles = simulation?.selected_roles || [];

  useEffect(() => {
    if (open && simulation) {
      setBranchName(`"${simulation.title}" — What If Branch`);
      setHypothesis('');
      setScenarioPatch('');
      setRoles(originalRoles.map(r => ({ ...r })));
      setActivePreset(null);
    }
  }, [open, simulation?.id]);

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    const p = preset.changes;

    if (p.scenarioSuffix) {
      setScenarioPatch(p.scenarioSuffix.trim());
    }
    if (p.influenceBoost) {
      setRoles(prev => prev.map(r => ({ ...r, influence: Math.min(10, r.influence + p.influenceBoost) })));
    }
    if (p.filterInfluenceBelow !== undefined) {
      setRoles(originalRoles.filter(r => r.influence >= p.filterInfluenceBelow).map(r => ({ ...r })));
    }
    if (p.flipRisk) {
      // Just boost influence of typically low-risk roles (reflect different risk weighting)
      setRoles(prev => prev.map(r => {
        const flipped = 11 - r.influence;
        return { ...r, influence: flipped };
      }));
    }
  };

  const updateInfluence = (idx, val) => {
    setRoles(prev => prev.map((r, i) => i === idx ? { ...r, influence: val } : r));
  };

  const removeRole = (idx) => {
    setRoles(prev => prev.filter((_, i) => i !== idx));
  };

  const addRoleBack = (role) => {
    if (!roles.find(r => r.role === role.role)) {
      setRoles(prev => [...prev, { ...role }]);
    }
  };

  const removedRoles = originalRoles.filter(r => !roles.find(rr => rr.role === r.role));

  const changedRoles = roles.filter(r => {
    const orig = originalRoles.find(or => or.role === r.role);
    return orig && orig.influence !== r.influence;
  });

  const scenarioChanged = scenarioPatch.trim().length > 0;
  const rolesChanged = changedRoles.length > 0 || removedRoles.length > 0;
  const hasChanges = scenarioChanged || rolesChanged;

  const handleCreate = async () => {
    if (!simulation) return;
    if (!hasChanges) {
      toast.error('Make at least one parameter change to create a branch');
      return;
    }

    setLoading(true);
    try {
      const patchedScenario = scenarioPatch.trim()
        ? `${simulation.scenario}\n\n---\n🔀 What If Constraint: ${scenarioPatch.trim()}`
        : simulation.scenario;

      const summary = [
        hypothesis.trim() ? `Hypothesis: ${hypothesis.trim()}` : null,
        scenarioChanged ? `Scenario modified` : null,
        changedRoles.length > 0 ? `${changedRoles.length} role influence(s) adjusted` : null,
        removedRoles.length > 0 ? `${removedRoles.length} role(s) removed` : null,
      ].filter(Boolean).join(' · ');

      const { data } = await base44.functions.invoke('forkSimulation', {
        simulation_id: simulation.id,
        fork_label: branchName.trim() || `What If: ${simulation.title}`,
        overrides: {
          scenario: patchedScenario,
          selected_roles: roles,
          title: branchName.trim() || `What If: ${simulation.title}`,
          version_label: summary || 'What If Branch',
          tags: [...(simulation.tags || []), 'what-if', 'ab-test'],
        },
      });

      if (!data?.success) throw new Error(data?.error || 'Branch creation failed');

      toast.success(`Branch "${data.fork.title}" created — load it from history to run`);
      onBranchCreated?.(data.fork);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  if (!simulation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4 text-violet-600" />
            What If Branch
            <Badge variant="outline" className="ml-1 text-[10px] text-violet-600 border-violet-200">A/B Testing</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Source */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <GitBranch className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">Branching from:</span>
            <span className="font-semibold text-slate-700 truncate">{simulation.title}</span>
            {simulation.version_number && (
              <Badge variant="outline" className="text-[10px] px-1 ml-auto">v{simulation.version_number}</Badge>
            )}
          </div>

          {/* Branch Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Branch Name</label>
            <Input
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              placeholder={`"${simulation.title}" — What If Branch`}
              className="text-sm"
            />
          </div>

          {/* Hypothesis */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              Hypothesis <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              value={hypothesis}
              onChange={e => setHypothesis(e.target.value)}
              placeholder="e.g. If we reduce engineering influence, the team will prioritize speed over quality..."
              className="text-sm"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-2 block">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {BRANCH_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-lg border text-xs transition-all ${
                    activePreset === preset.label
                      ? 'border-violet-400 bg-violet-50 text-violet-800'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-semibold mb-0.5">{preset.label}</p>
                  <p className="text-slate-500 text-[11px]">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Constraint */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3 h-3 text-slate-500" />
              Constraint / Scenario Modification
              <DiffBadge changed={scenarioChanged} />
            </label>
            <Textarea
              value={scenarioPatch}
              onChange={e => setScenarioPatch(e.target.value)}
              placeholder="Describe what changes in this branch (added constraints, removed assumptions, different context)..."
              className="text-xs min-h-[80px] resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              This will be appended to the original scenario as a "What If Constraint" annotation.
            </p>
          </div>

          {/* Role Influence Adjustments */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-slate-500" />
              Role Influence Adjustments
              <DiffBadge changed={rolesChanged} />
            </label>

            <div className="space-y-2.5 bg-slate-50 rounded-xl border border-slate-200 p-3">
              {roles.map((role, idx) => {
                const orig = originalRoles.find(r => r.role === role.role);
                const changed = orig && orig.influence !== role.influence;
                return (
                  <div key={role.role} className={`flex items-center gap-3 ${changed ? 'bg-violet-50 rounded-lg px-2 py-1.5 -mx-1' : ''}`}>
                    <div className="w-32 min-w-0">
                      <p className="text-xs font-medium text-slate-700 capitalize truncate">
                        {role.role.replace(/_/g, ' ')}
                      </p>
                      {changed && (
                        <p className="text-[10px] text-slate-400">{orig.influence} → <strong className="text-violet-600">{role.influence}</strong></p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Slider
                        value={[role.influence]}
                        min={1} max={10} step={1}
                        onValueChange={([v]) => updateInfluence(idx, v)}
                        className="w-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-5 text-center">{role.influence}</span>
                    <button
                      onClick={() => removeRole(idx)}
                      className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove role from this branch"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Removed roles — can be re-added */}
              {removedRoles.length > 0 && (
                <div className="border-t border-slate-200 pt-2.5 mt-2.5">
                  <p className="text-[10px] text-slate-400 mb-2">Removed roles (click to restore):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {removedRoles.map(r => (
                      <button
                        key={r.role}
                        onClick={() => addRoleBack(r)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-slate-300 text-[11px] text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {r.role.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Change summary */}
          {hasChanges && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <Info className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {scenarioChanged && <Badge variant="outline" className="text-[10px] text-violet-700 border-violet-300 bg-white">Scenario modified</Badge>}
                {changedRoles.map(r => (
                  <Badge key={r.role} variant="outline" className="text-[10px] text-violet-700 border-violet-300 bg-white capitalize">
                    {r.role.replace(/_/g, ' ')} influence → {r.influence}
                  </Badge>
                ))}
                {removedRoles.map(r => (
                  <Badge key={r.role} variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-white capitalize">
                    {r.role.replace(/_/g, ' ')} removed
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={handleCreate}
              disabled={loading || !hasChanges}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              {loading ? 'Creating Branch…' : 'Create What If Branch'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}