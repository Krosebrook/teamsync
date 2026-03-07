import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { X, Plus, RotateCcw, Sliders, Sparkles, Brain, Zap, MessageSquare, Swords, PenLine } from "lucide-react";

// Default tuning state — all at "neutral" (no override)
const DEFAULT_TUNING = {
  risk_tolerance_override: null,         // null = use profile default
  directness_level: 5,                   // 1 (very diplomatic) → 10 (very direct)
  contrarianism: 3,                      // 1 (agreeable) → 10 (highly contrarian)
  data_orientation: 5,                   // 1 (gut-driven) → 10 (data-obsessed)
  urgency_bias: 5,                       // 1 (slow/deliberate) → 10 (move-fast)
  conflict_style_override: null,         // null = use profile default
  active_cognitive_biases: [],           // extra biases to inject
  suppressed_biases: [],                 // biases to suppress from profile
  custom_agenda: '',                     // hidden agenda / private motivation
  stress_level: 3,                       // 1 (relaxed) → 10 (high stress)
  // Extended communication tuning
  emotional_expressiveness: 5,           // 1 (stoic) → 10 (highly expressive)
  political_savvy: 5,                    // 1 (naïve) → 10 (highly political)
  empathy_level: 5,                      // 1 (transactional) → 10 (highly empathetic)
  formality_override: null,              // null = use profile default
  // Custom injected context fields
  custom_context_fields: [],             // [{ key: string, value: string }]
  enabled: false,                        // whether tuning is active for this role
};

const PRESET_BIASES = [
  "Confirmation bias",
  "Sunk cost fallacy",
  "Availability heuristic",
  "Anchoring bias",
  "Overconfidence bias",
  "Status quo bias",
  "Optimism bias",
  "Pessimism bias",
  "In-group favoritism",
  "Authority bias",
  "Bandwagon effect",
  "Dunning-Kruger effect",
  "Framing effect",
  "Recency bias",
  "Loss aversion",
];

function TraitSlider({ label, description, value, onChange, min = 1, max = 10, lowLabel, highLabel, color = "slate" }) {
  const colorMap = {
    violet: "text-violet-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    emerald: "text-emerald-600",
    slate: "text-slate-600",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-700">{label}</Label>
        <span className={`text-xs font-bold ${colorMap[color]}`}>{value}/10</span>
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

export default function PersonaTuner({ open, onClose, roleName, roleId, tuning, onSave }) {
  const [local, setLocal] = useState({ ...DEFAULT_TUNING, ...tuning });
  const [biasInput, setBiasInput] = useState('');
  const [customFieldInput, setCustomFieldInput] = useState({ key: '', value: '' });

  useEffect(() => {
    setLocal({ ...DEFAULT_TUNING, ...tuning });
  }, [tuning, open]);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const addBias = (bias) => {
    const b = bias.trim();
    if (!b || local.active_cognitive_biases.includes(b)) return;
    set('active_cognitive_biases', [...local.active_cognitive_biases, b]);
    setBiasInput('');
  };

  const removeBias = (b) => set('active_cognitive_biases', local.active_cognitive_biases.filter(x => x !== b));

  const handleSave = () => {
    onSave({ ...local, enabled: true });
    onClose();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_TUNING });
  };

  const isModified = local.enabled || JSON.stringify(local) !== JSON.stringify({ ...DEFAULT_TUNING, ...tuning });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sliders className="w-4 h-4 text-violet-600" />
            Fine-tune Persona — <span className="text-violet-700">{roleName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-800">Enable Persona Tuning</p>
              <p className="text-xs text-slate-500">Override this role's default traits during the simulation</p>
            </div>
            <Switch
              checked={local.enabled}
              onCheckedChange={(v) => set('enabled', v)}
            />
          </div>

          <div className={`space-y-5 ${!local.enabled ? 'opacity-40 pointer-events-none' : ''}`}>

            {/* SECTION: Personality Sliders */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-500" />
                Personality Traits
              </p>

              <TraitSlider
                label="Communication Directness"
                description="How bluntly does this persona express disagreement or push back?"
                value={local.directness_level}
                onChange={(v) => set('directness_level', v)}
                lowLabel="Highly diplomatic"
                highLabel="Brutally direct"
                color="blue"
              />

              <TraitSlider
                label="Contrarianism"
                description="Tendency to challenge consensus or play devil's advocate"
                value={local.contrarianism}
                onChange={(v) => set('contrarianism', v)}
                lowLabel="Goes with flow"
                highLabel="Constant challenger"
                color="rose"
              />

              <TraitSlider
                label="Data Orientation"
                description="Does this persona rely on data and metrics, or intuition and experience?"
                value={local.data_orientation}
                onChange={(v) => set('data_orientation', v)}
                lowLabel="Gut / experience"
                highLabel="Data obsessed"
                color="emerald"
              />

              <TraitSlider
                label="Urgency Bias"
                description="Does this persona want to move fast, or deliberate carefully?"
                value={local.urgency_bias}
                onChange={(v) => set('urgency_bias', v)}
                lowLabel="Slow & deliberate"
                highLabel="Move fast"
                color="amber"
              />

              <TraitSlider
                label="Stress Level"
                description="Simulates this persona under different pressure conditions (affects emotional triggers)"
                value={local.stress_level}
                onChange={(v) => set('stress_level', v)}
                lowLabel="Relaxed"
                highLabel="High pressure"
                color="rose"
              />
            </div>

            {/* SECTION: Communication Style Tuning */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                Communication Style
              </p>

              <TraitSlider
                label="Emotional Expressiveness"
                description="How much does this persona show emotion in meetings?"
                value={local.emotional_expressiveness}
                onChange={(v) => set('emotional_expressiveness', v)}
                lowLabel="Stoic / poker face"
                highLabel="Highly expressive"
                color="violet"
              />

              <TraitSlider
                label="Political Savvy"
                description="How aware is this persona of office politics and power dynamics?"
                value={local.political_savvy}
                onChange={(v) => set('political_savvy', v)}
                lowLabel="Naïve / blunt"
                highLabel="Highly political"
                color="amber"
              />

              <TraitSlider
                label="Empathy Level"
                description="How much does this persona consider others' feelings and circumstances?"
                value={local.empathy_level}
                onChange={(v) => set('empathy_level', v)}
                lowLabel="Transactional"
                highLabel="Deeply empathetic"
                color="emerald"
              />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Formality Override</p>
                <p className="text-xs text-slate-400">Adjust how formally this persona communicates</p>
                <div className="flex gap-2">
                  {['formal', 'adaptive', 'casual'].map(f => (
                    <button
                      key={f}
                      onClick={() => set('formality_override', local.formality_override === f ? null : f)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-all capitalize
                        ${local.formality_override === f
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {local.formality_override && (
                  <button onClick={() => set('formality_override', null)} className="text-xs text-slate-400 hover:text-rose-500">
                    ✕ Clear override
                  </button>
                )}
              </div>
            </div>

            {/* SECTION: Risk Tolerance Override */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Risk Tolerance Override
              </p>
              <Select
                value={local.risk_tolerance_override || 'default'}
                onValueChange={(v) => set('risk_tolerance_override', v === 'default' ? null : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Use profile default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use profile default</SelectItem>
                  <SelectItem value="low">Low — Prefers safe, proven approaches</SelectItem>
                  <SelectItem value="medium">Medium — Balanced risk assessment</SelectItem>
                  <SelectItem value="high">High — Embraces calculated risks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SECTION: Conflict Style Override */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-orange-500" />
                Conflict Style Override
              </p>
              <Select
                value={local.conflict_style_override || 'default'}
                onValueChange={(v) => set('conflict_style_override', v === 'default' ? null : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Use profile default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use profile default</SelectItem>
                  <SelectItem value="avoiding">Avoiding — Sidesteps conflict</SelectItem>
                  <SelectItem value="accommodating">Accommodating — Yields to others</SelectItem>
                  <SelectItem value="competing">Competing — Stands firm, pushes hard</SelectItem>
                  <SelectItem value="compromising">Compromising — Finds middle ground</SelectItem>
                  <SelectItem value="collaborating">Collaborating — Seeks win-win</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SECTION: Inject Cognitive Biases */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                Inject Cognitive Biases
              </p>
              <p className="text-xs text-slate-400">Add specific biases to amplify in this role's reasoning</p>

              {/* Preset chips */}
              <div className="flex flex-wrap gap-1">
                {PRESET_BIASES.filter(b => !local.active_cognitive_biases.includes(b)).slice(0, 8).map(b => (
                  <button
                    key={b}
                    onClick={() => addBias(b)}
                    className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 rounded transition-colors border border-slate-200"
                  >
                    + {b}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <Input
                  value={biasInput}
                  onChange={(e) => setBiasInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBias(biasInput))}
                  placeholder="Custom bias..."
                  className="h-7 text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => addBias(biasInput)} className="h-7 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Active biases */}
              {local.active_cognitive_biases.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {local.active_cognitive_biases.map(b => (
                    <Badge key={b} className="gap-1 text-xs bg-violet-100 text-violet-800 border-violet-200 border">
                      {b}
                      <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => removeBias(b)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION: Hidden Agenda */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                Hidden Agenda / Private Motivation
              </p>
              <p className="text-xs text-slate-400">
                A private motivation this persona is pursuing — influences their position without stating it explicitly
              </p>
              <Textarea
                value={local.custom_agenda}
                onChange={(e) => set('custom_agenda', e.target.value)}
                placeholder="e.g. This role is trying to protect headcount in their team. They will resist automation even if they don't say so directly."
                className="min-h-[70px] resize-none text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="mr-auto gap-1 text-slate-500">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} className="gap-1 bg-violet-600 hover:bg-violet-700 text-white">
            <Sliders className="w-3.5 h-3.5" />
            Apply Tuning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}