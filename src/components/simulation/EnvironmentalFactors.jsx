import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, TrendingUp, TrendingDown, Zap, AlertTriangle, DollarSign, Users, Globe, Wrench, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const FACTOR_CATEGORIES = [
  { id: 'market', label: 'Market Conditions', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'competitor', label: 'Competitor Moves', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { id: 'resource', label: 'Resource Constraints', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { id: 'financial', label: 'Financial Pressure', icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  { id: 'regulatory', label: 'Regulatory / Legal', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { id: 'team', label: 'Team / Org Changes', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  { id: 'technology', label: 'Technology Shift', icon: Zap, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
  { id: 'custom', label: 'Custom', icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

const DRIFT_OPTIONS = [
  { id: 'stable', label: 'Stable' },
  { id: 'worsening', label: 'Worsening' },
  { id: 'improving', label: 'Improving' },
  { id: 'volatile', label: 'Volatile / Unpredictable' },
  { id: 'resolving', label: 'Resolving' },
];

const IMPACT_LEVELS = ['low', 'medium', 'high', 'critical'];

const IMPACT_COLORS = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
};

function FactorRow({ factor, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const catConfig = FACTOR_CATEGORIES.find(c => c.id === factor.category) || FACTOR_CATEGORIES[7];
  const Icon = catConfig.icon;

  return (
    <Card className={`border ${catConfig.bg} transition-all`}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${catConfig.color}`} />
          <div className="flex-1 min-w-0">
            <Input
              value={factor.name}
              onChange={e => onChange({ ...factor, name: e.target.value })}
              placeholder="Factor name (e.g. Major competitor launched similar product)"
              className="h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 font-medium placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className={`text-xs border ${IMPACT_COLORS[factor.impact] || IMPACT_COLORS.medium} cursor-pointer`}
              onClick={() => {
                const idx = IMPACT_LEVELS.indexOf(factor.impact);
                onChange({ ...factor, impact: IMPACT_LEVELS[(idx + 1) % IMPACT_LEVELS.length] });
              }}
              title="Click to change impact level"
            >
              {factor.impact}
            </Badge>
            <button onClick={() => setExpanded(v => !v)} className="text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} className="text-slate-300 hover:text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 pl-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Category</Label>
                <Select value={factor.category} onValueChange={v => onChange({ ...factor, category: v })}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACTOR_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Trend / Drift</Label>
                <Select value={factor.drift} onValueChange={v => onChange({ ...factor, drift: v })}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIFT_OPTIONS.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Current State</Label>
              <Textarea
                value={factor.current_state}
                onChange={e => onChange({ ...factor, current_state: e.target.value })}
                placeholder="Describe the current state of this factor..."
                className="text-xs h-14 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">How it may evolve (optional)</Label>
              <Input
                value={factor.evolution_hint}
                onChange={e => onChange({ ...factor, evolution_hint: e.target.value })}
                placeholder="e.g. May escalate if negotiations fail..."
                className="h-7 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function newFactor() {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    category: 'market',
    impact: 'medium',
    drift: 'stable',
    current_state: '',
    evolution_hint: '',
  };
}

export default function EnvironmentalFactors({ factors, onChange, scenario }) {
  const [generating, setGenerating] = useState(false);

  const addFactor = () => onChange([...factors, newFactor()]);

  const updateFactor = (id, updated) => onChange(factors.map(f => f.id === id ? updated : f));

  const deleteFactor = (id) => onChange(factors.filter(f => f.id !== id));

  const aiSuggest = async () => {
    if (!scenario?.trim()) {
      toast.error('Add a scenario first so the AI can suggest relevant environmental factors');
      return;
    }
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic scenario planner. Given the following simulation scenario, identify 3–5 realistic environmental factors (market conditions, competitor moves, resource constraints, regulatory pressures, etc.) that would meaningfully influence the decision-making dynamics of the team.

SCENARIO:
${scenario}

EXISTING FACTORS ALREADY ADDED:
${factors.map(f => f.name).filter(Boolean).join(', ') || 'None'}

For each factor:
- Give it a concise name
- Assign the most fitting category
- Describe its current state in 1-2 sentences
- Determine how it might drift/evolve over the course of the simulation
- Assign an impact level

Only suggest factors NOT already listed above.`,
        response_json_schema: {
          type: "object",
          properties: {
            factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string", enum: ["market", "competitor", "resource", "financial", "regulatory", "team", "technology", "custom"] },
                  impact: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  drift: { type: "string", enum: ["stable", "worsening", "improving", "volatile", "resolving"] },
                  current_state: { type: "string" },
                  evolution_hint: { type: "string" }
                }
              }
            }
          }
        }
      });
      const newFactors = (result.factors || []).map(f => ({ ...f, id: Math.random().toString(36).slice(2) }));
      onChange([...factors, ...newFactors]);
      toast.success(`Added ${newFactors.length} environmental factors`);
    } catch (err) {
      toast.error('Failed to generate factors');
    }
    setGenerating(false);
  };

  const categoryCounts = FACTOR_CATEGORIES.map(c => ({
    ...c,
    count: factors.filter(f => f.category === c.id).length
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-3">
      {/* Summary chips */}
      {categoryCounts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {categoryCounts.map(c => {
            const Icon = c.icon;
            return (
              <Badge key={c.id} variant="outline" className={`text-xs gap-1 ${c.bg} border`}>
                <Icon className={`w-3 h-3 ${c.color}`} />
                {c.label} ({c.count})
              </Badge>
            );
          })}
        </div>
      )}

      {/* Factor list */}
      <div className="space-y-2">
        {factors.map(factor => (
          <FactorRow
            key={factor.id}
            factor={factor}
            onChange={updated => updateFactor(factor.id, updated)}
            onDelete={() => deleteFactor(factor.id)}
          />
        ))}
      </div>

      {factors.length === 0 && (
        <p className="text-xs text-slate-400 italic text-center py-2">
          No environmental factors yet. Add one manually or use AI to suggest relevant factors based on your scenario.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addFactor} className="flex-1 gap-1 h-8 text-xs">
          <Plus className="w-3.5 h-3.5" />
          Add Factor
        </Button>
        <Button variant="outline" size="sm" onClick={aiSuggest} disabled={generating} className="flex-1 gap-1 h-8 text-xs">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          AI Suggest
        </Button>
      </div>
    </div>
  );
}

export { FACTOR_CATEGORIES, DRIFT_OPTIONS };