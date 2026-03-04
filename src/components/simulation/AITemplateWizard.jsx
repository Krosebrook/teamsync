import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, RefreshCw, Play, ChevronDown, ChevronUp, Users, Target, Lightbulb } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DECISION_TYPES = [
  { id: "pre_mortem", label: "Pre-Mortem Analysis", hint: "What could go wrong before we launch?" },
  { id: "roadmap", label: "Roadmap Prioritization", hint: "Which features/bets to fund next quarter?" },
  { id: "adr", label: "Architecture Decision (ADR)", hint: "A key technical choice with long-term implications" },
  { id: "build_buy", label: "Build vs. Buy", hint: "Make it internally or purchase a solution?" },
  { id: "tech_debt", label: "Tech Debt Resolution", hint: "When and how to address accumulated debt" },
  { id: "hiring", label: "Hiring Decision", hint: "Who, when, what level, and for which team?" },
  { id: "migration", label: "Platform Migration", hint: "Moving off a legacy system or to a new stack" },
  { id: "customer_escalation", label: "Customer Escalation", hint: "High-stakes client issue requiring cross-team decision" },
  { id: "custom", label: "Custom / Freeform", hint: "Define your own scenario" },
];

const COMPLEXITY_OPTIONS = [
  { id: "low", label: "Low", desc: "Clean scenario, minimal conflict" },
  { id: "medium", label: "Medium", desc: "Competing priorities, some tension" },
  { id: "high", label: "High", desc: "Conflicting incentives, time pressure, hidden agendas" },
];

function RoleRow({ role, onUpdateInfluence, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{role.name}</p>
        <p className="text-xs text-slate-500 truncate">{role.reason}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400 w-12 text-right">Inf: {role.influence}/10</span>
        <Slider
          value={[role.influence]}
          onValueChange={([v]) => onUpdateInfluence(role.id, v)}
          min={1} max={10} step={1}
          className="w-20"
        />
        <button onClick={() => onRemove(role.id)} className="text-slate-300 hover:text-rose-500 text-xs px-1">✕</button>
      </div>
    </div>
  );
}

export default function AITemplateWizard({ open, onClose, onApply, allRoles = [] }) {
  const [step, setStep] = useState('configure'); // configure | preview | customize
  const [decisionType, setDecisionType] = useState('');
  const [complexity, setComplexity] = useState('medium');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);

  // Generated template (editable)
  const [template, setTemplate] = useState(null);

  const reset = () => {
    setStep('configure');
    setTemplate(null);
    setDecisionType('');
    setComplexity('medium');
    setContext('');
  };

  const generate = async () => {
    if (!decisionType) { toast.error('Select a decision type first'); return; }
    setGenerating(true);
    try {
      const dtLabel = DECISION_TYPES.find(d => d.id === decisionType)?.label || decisionType;
      const availableRoleNames = allRoles.slice(0, 20).map(r => r.name || r.id).join(', ');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert simulation designer. Generate a realistic, high-quality ${dtLabel} simulation template.

Complexity: ${complexity}
Additional context: ${context || 'none'}

Available roles to choose from: ${availableRoleNames}

Create a template with:
1. A specific, grounded scenario (3–5 sentences) with real stakes
2. A hidden complication or twist that makes it non-trivial
3. 3–5 participant roles chosen from the available list that create interesting dynamics
   - Assign each an influence level (1–10) and a brief reason for their involvement
4. 3 key starting tensions or questions that will drive the discussion
5. A suggested simulation goal (what decision should be reached?)

Make it realistic for a ${complexity}-complexity ${dtLabel} decision.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            scenario: { type: "string" },
            hidden_complication: { type: "string" },
            simulation_goal: { type: "string" },
            roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "role id matching available roles" },
                  name: { type: "string" },
                  influence: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            starting_tensions: { type: "array", items: { type: "string" } },
            suggested_parameters: {
              type: "object",
              properties: {
                time_pressure: { type: "string" },
                stakes_level: { type: "string" },
                information_completeness: { type: "string" }
              }
            }
          }
        }
      });

      // Normalize roles: match to actual available roles by id or name
      const normalizedRoles = (result.roles || []).map(r => {
        const matched = allRoles.find(ar =>
          ar.id === r.id ||
          (ar.name || '').toLowerCase() === (r.name || '').toLowerCase() ||
          ar.id?.replace(/_/g, ' ').toLowerCase() === (r.name || '').toLowerCase()
        );
        return {
          id: matched?.id || r.id,
          name: matched?.name || r.name,
          influence: r.influence || 5,
          reason: r.reason,
        };
      }).filter(r => r.id);

      setTemplate({ ...result, roles: normalizedRoles });
      setStep('customize');
    } catch (err) {
      toast.error('Generation failed — please try again');
    }
    setGenerating(false);
  };

  const handleUpdateInfluence = (roleId, value) => {
    setTemplate(prev => ({
      ...prev,
      roles: prev.roles.map(r => r.id === roleId ? { ...r, influence: value } : r)
    }));
  };

  const handleRemoveRole = (roleId) => {
    setTemplate(prev => ({ ...prev, roles: prev.roles.filter(r => r.id !== roleId) }));
  };

  const handleApply = () => {
    if (!template) return;
    const scenarioFull = template.scenario
      + (template.hidden_complication ? `\n\nHidden factor: ${template.hidden_complication}` : '')
      + (template.simulation_goal ? `\n\nGoal: ${template.simulation_goal}` : '');
    onApply({
      title: template.title,
      scenario: scenarioFull,
      roles: template.roles.map(r => ({ role: r.id, influence: r.influence })),
      decisionType,
    });
    toast.success('Template applied');
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Template Wizard
            {step === 'customize' && template && (
              <Badge variant="outline" className="ml-auto text-xs font-normal">{template.title}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Configure */}
          {step === 'configure' && (
            <div className="px-5 py-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Decision Type</Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {DECISION_TYPES.map(dt => (
                    <button
                      key={dt.id}
                      onClick={() => setDecisionType(dt.id)}
                      className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3
                        ${decisionType === dt.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 ${decisionType === dt.id ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{dt.label}</p>
                        <p className="text-xs text-slate-500">{dt.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Complexity</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPLEXITY_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setComplexity(c.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${complexity === c.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <p className="text-sm font-medium text-slate-800">{c.label}</p>
                      <p className="text-xs text-slate-500">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Additional Context <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Company stage, industry, specific constraints…"
                  className="min-h-[70px] resize-none text-sm"
                />
              </div>

              <Button
                onClick={generate}
                disabled={!decisionType || generating}
                className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white h-10"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating template…' : 'Generate Template'}
              </Button>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 'customize' && template && (
            <div className="px-5 py-4 space-y-5">
              {/* Scenario */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</Label>
                <Input
                  value={template.title}
                  onChange={e => setTemplate(prev => ({ ...prev, title: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scenario</Label>
                <Textarea
                  value={template.scenario}
                  onChange={e => setTemplate(prev => ({ ...prev, scenario: e.target.value }))}
                  className="min-h-[100px] resize-none text-sm"
                />
              </div>

              {template.hidden_complication && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Hidden Complication
                  </Label>
                  <Textarea
                    value={template.hidden_complication}
                    onChange={e => setTemplate(prev => ({ ...prev, hidden_complication: e.target.value }))}
                    className="min-h-[60px] resize-none text-sm border-amber-200 bg-amber-50"
                  />
                </div>
              )}

              {template.simulation_goal && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Simulation Goal
                  </Label>
                  <Input
                    value={template.simulation_goal}
                    onChange={e => setTemplate(prev => ({ ...prev, simulation_goal: e.target.value }))}
                    className="h-9 text-sm border-emerald-200 bg-emerald-50"
                  />
                </div>
              )}

              {/* Roles */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Suggested Roles
                </Label>
                <div className="border border-slate-200 rounded-lg px-3 divide-y divide-slate-100">
                  {template.roles.map(role => (
                    <RoleRow
                      key={role.id}
                      role={role}
                      onUpdateInfluence={handleUpdateInfluence}
                      onRemove={handleRemoveRole}
                    />
                  ))}
                  {template.roles.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">All roles removed</p>
                  )}
                </div>
              </div>

              {/* Starting tensions */}
              {template.starting_tensions?.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Starting Tensions
                  </Label>
                  <ul className="space-y-1">
                    {template.starting_tensions.map((t, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="shrink-0 text-amber-500 font-bold mt-0.5">{i + 1}.</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested parameters */}
              {template.suggested_parameters && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(template.suggested_parameters).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5 capitalize">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setStep('configure'); }} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={template.roles.length < 2}
                  className="flex-1 gap-2 bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Play className="w-4 h-4" />
                  Apply & Configure Simulation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}