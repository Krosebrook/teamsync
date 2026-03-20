import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Map, GitBranch, AlertTriangle, ChevronRight, ChevronLeft,
  Sparkles, X, CheckCircle2, Plus, Loader2, Zap
} from 'lucide-react';
import { ROLES } from '../simulation/RoleSelector';
import { toast } from 'sonner';

const USE_CASE_TYPES = [
  { id: 'pre_mortem', label: 'Pre-Mortem', desc: 'Imagine failure before it happens' },
  { id: 'roadmap', label: 'Roadmap Decision', desc: 'What to build next' },
  { id: 'adr', label: 'Architecture Decision', desc: 'Technical direction choices' },
  { id: 'pmf_validation', label: 'PMF Validation', desc: 'Does this solve a real problem?' },
  { id: 'tech_debt', label: 'Tech Debt', desc: 'Fix now vs. ship faster' },
  { id: 'build_buy', label: 'Build vs. Buy', desc: 'Make or acquire?' },
  { id: 'migration', label: 'Migration', desc: 'Move systems or data' },
  { id: 'post_mortem', label: 'Post-Mortem', desc: 'Learn from what went wrong' },
  { id: 'hiring', label: 'Hiring Decision', desc: 'Team composition choices' },
  { id: 'customer_escalation', label: 'Customer Escalation', desc: 'Crisis response decisions' },
  { id: 'custom', label: 'Custom', desc: 'Anything else' },
];

const EXAMPLE_USE_CASES = [
  { icon: Map, label: 'Roadmap Decisions', color: 'text-violet-600 bg-violet-50' },
  { icon: GitBranch, label: 'Build vs. Buy', color: 'text-blue-600 bg-blue-50' },
  { icon: AlertTriangle, label: 'Post-Mortem', color: 'text-amber-600 bg-amber-50' },
];

const QUALITY_COLORS = {
  weak: 'bg-red-100 text-red-700 border-red-200',
  fair: 'bg-amber-100 text-amber-700 border-amber-200',
  good: 'bg-blue-100 text-blue-700 border-blue-200',
  strong: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// Skeleton loader for AI sections
const AISkeleton = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
  </div>
);

const AIBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5">
    <Sparkles className="w-2.5 h-2.5" /> AI
  </span>
);

export default function OnboardingWizard({ open, onClose, onLaunchSimulation, allRoles }) {
  // Check onboarding_completed on mount — never show if already done
  useEffect(() => {
    if (!open) return;
    base44.auth.me().then(user => {
      if (user?.onboarding_completed) onClose();
    }).catch(() => {});
  }, [open]);

  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [useCaseType, setUseCaseType] = useState('');
  const [title, setTitle] = useState('');

  // AI state
  const [qualityCheck, setQualityCheck] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [compositionCheck, setCompositionCheck] = useState(null);
  const [compositionLoading, setCompositionLoading] = useState(false);
  const [typeLoading, setTypeLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);

  const debounceRef = useRef(null);
  const roles = allRoles || ROLES;

  // Debounced scenario quality check
  useEffect(() => {
    if (!scenario.trim() || scenario.length < 30) {
      setQualityCheck(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkScenarioQuality(scenario);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [scenario]);

  // Role composition check when roles change on step 3
  useEffect(() => {
    if (step === 3 && selectedRoles.length >= 2 && scenario) {
      checkRoleComposition();
    }
  }, [selectedRoles.length, step]);

  // Generate title when reaching step 5
  useEffect(() => {
    if (step === 5 && scenario && !title) {
      generateTitle();
    }
  }, [step]);

  const checkScenarioQuality = async (text) => {
    setQualityLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Rate this scenario for simulation quality and give specific improvements if needed:

"${text}"

Return JSON only:
{
  "quality_score": 0-100,
  "quality_label": "weak|fair|good|strong",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "missing_context": ["what's unclear that would change the simulation"],
  "strong_points": ["what's working well"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            quality_score: { type: "number" },
            quality_label: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
            missing_context: { type: "array", items: { type: "string" } },
            strong_points: { type: "array", items: { type: "string" } }
          }
        }
      });
      setQualityCheck(result);
    } catch (e) {
      console.error(e);
    }
    setQualityLoading(false);
  };

  const checkRoleComposition = async () => {
    setCompositionLoading(true);
    try {
      const roleNames = selectedRoles.map(r => r.role.replace(/_/g, ' '));
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Scenario: "${scenario}"
Selected roles: ${roleNames.join(', ')}

Evaluate:
1. Are the right voices in the room for this specific decision?
2. Who's missing that would change the outcome?
3. Are there any role conflicts that will make this simulation more interesting?

Return JSON only:
{
  "composition_score": 0-100,
  "missing_critical_roles": [{"role": "role name", "reason": "why they matter here"}],
  "predicted_dominant_voice": "which role will dominate this discussion and why",
  "predicted_key_tension": "the most likely friction point",
  "recommendation": "one sentence on whether to proceed or adjust"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            composition_score: { type: "number" },
            missing_critical_roles: { type: "array", items: { type: "object", properties: { role: { type: "string" }, reason: { type: "string" } } } },
            predicted_dominant_voice: { type: "string" },
            predicted_key_tension: { type: "string" },
            recommendation: { type: "string" }
          }
        }
      });
      setCompositionCheck(result);
    } catch (e) {
      console.error(e);
    }
    setCompositionLoading(false);
  };

  const suggestUseCaseType = async () => {
    setTypeLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Scenario: "${scenario}"

Pick the best use_case_type from: pre_mortem, roadmap, adr, pmf_validation, tech_debt, post_mortem, hiring, build_buy, migration, customer_escalation, custom

Return JSON only: { "recommended_type": "...", "reason": "one sentence why" }`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_type: { type: "string" },
            reason: { type: "string" }
          }
        }
      });
      if (result.recommended_type) {
        setUseCaseType(result.recommended_type);
        toast.success(`Suggested: ${result.recommended_type.replace(/_/g, ' ')} — ${result.reason}`);
      }
    } catch (e) {
      console.error(e);
    }
    setTypeLoading(false);
  };

  const generateTitle = async () => {
    setTitleLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise simulation title (max 8 words) for this scenario: "${scenario}". Return JSON: { "title": "..." }`,
        response_json_schema: {
          type: "object",
          properties: { title: { type: "string" } }
        }
      });
      if (result.title) setTitle(result.title);
    } catch (e) {
      console.error(e);
    }
    setTitleLoading(false);
  };

  const toggleRole = (roleId) => {
    const exists = selectedRoles.find(r => r.role === roleId);
    if (exists) {
      setSelectedRoles(selectedRoles.filter(r => r.role !== roleId));
    } else {
      if (selectedRoles.length >= 8) return;
      setSelectedRoles([...selectedRoles, { role: roleId, influence: 7 }]);
    }
  };

  const addQuickRole = (roleName) => {
    const match = roles.find(r => r.name?.toLowerCase().includes(roleName.toLowerCase()) || r.id?.toLowerCase().includes(roleName.toLowerCase().replace(/ /g, '_')));
    if (match && !selectedRoles.find(r => r.role === match.id)) {
      setSelectedRoles([...selectedRoles, { role: match.id, influence: 7 }]);
    }
  };

  const skipOnboarding = async () => {
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (e) {}
    onClose();
  };

  const handleLaunch = async (asDraft = false) => {
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (e) {}
    onLaunchSimulation({
      title,
      scenario,
      selectedRoles,
      useCaseType,
      runImmediately: !asDraft,
    });
    onClose();
  };

  if (!open) return null;

  const progress = ((step - 1) / 4) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Setup Wizard</span>
            </div>
            <span className="text-xs text-slate-400">Step {step} of 5</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to TeamSync</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  TeamSync simulates how your team would actually respond to a decision — before you make it.
                  You describe a scenario, pick the roles in the room, and AI gives each voice a position,
                  surfaces the tensions, and tells you what to decide next.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {EXAMPLE_USE_CASES.map(({ icon: Icon, label, color }) => (
                  <div key={label} className={`rounded-xl p-4 ${color} border border-current/10`}>
                    <Icon className="w-5 h-5 mb-2" />
                    <p className="text-xs font-semibold">{label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">How it works</h3>
                <ol className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex gap-2"><span className="font-bold text-slate-900">1.</span> Describe your decision scenario</li>
                  <li className="flex gap-2"><span className="font-bold text-slate-900">2.</span> Pick the roles in the room</li>
                  <li className="flex gap-2"><span className="font-bold text-slate-900">3.</span> AI runs the simulation and surfaces tensions</li>
                  <li className="flex gap-2"><span className="font-bold text-slate-900">4.</span> Get actionable next steps</li>
                </ol>
              </div>
            </div>
          )}

          {/* STEP 2: Scenario */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Describe the decision</h2>
                <p className="text-sm text-slate-500">What does your team need to decide? Be specific — the more context, the better the simulation.</p>
              </div>
              <Textarea
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                placeholder="e.g. We're considering rebuilding our auth system from scratch vs. using Auth0. We have 6 engineers, a hard deadline in 4 months, and compliance requirements incoming."
                className="min-h-[140px] text-sm resize-none"
              />

              {/* Quality feedback */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIBadge />
                  <span className="text-xs font-medium text-slate-600">Scenario Quality</span>
                  {qualityLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>

                {qualityLoading && <AISkeleton />}

                {!qualityLoading && qualityCheck && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border ${QUALITY_COLORS[qualityCheck.quality_label]}`}>
                        {qualityCheck.quality_label} · {qualityCheck.quality_score}/100
                      </Badge>
                    </div>
                    {qualityCheck.strong_points?.length > 0 && (
                      <div className="space-y-1">
                        {qualityCheck.strong_points.map((pt, i) => (
                          <p key={i} className="text-xs text-emerald-700 flex gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />{pt}</p>
                        ))}
                      </div>
                    )}
                    {qualityCheck.suggestions?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-600">Suggestions:</p>
                        {qualityCheck.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setScenario(prev => prev + '\n\n' + s)}
                            className="block text-left text-xs bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-lg px-3 py-2 text-slate-700 w-full transition-colors"
                          >
                            <Plus className="w-3 h-3 inline mr-1 text-violet-500" /> {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!qualityLoading && !qualityCheck && scenario.length < 30 && (
                  <p className="text-xs text-slate-400">Start typing to get real-time quality feedback…</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Role Selector */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Who's in the room?</h2>
                <p className="text-sm text-slate-500">Select 3–6 roles. Each will get a distinct AI voice in the simulation.</p>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {roles.slice(0, 30).map((role) => {
                  const isSelected = selectedRoles.some(r => r.role === role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      className={`text-left rounded-lg border px-3 py-2 text-xs transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-400 text-slate-700'
                      }`}
                    >
                      <span className="font-medium">{role.name}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400">{selectedRoles.length} selected</p>

              {/* Composition analysis */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIBadge />
                  <span className="text-xs font-medium text-slate-600">Team Composition Analysis</span>
                  {compositionLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>

                {compositionLoading && <AISkeleton />}

                {!compositionLoading && compositionCheck && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Score: {compositionCheck.composition_score}/100</Badge>
                    </div>
                    {compositionCheck.predicted_key_tension && (
                      <p className="text-xs text-slate-600"><span className="font-medium">Key tension:</span> {compositionCheck.predicted_key_tension}</p>
                    )}
                    {compositionCheck.recommendation && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 rounded p-2">{compositionCheck.recommendation}</p>
                    )}
                    {compositionCheck.missing_critical_roles?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-600">Consider adding:</p>
                        {compositionCheck.missing_critical_roles.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-amber-800">{item.role} — {item.reason}</span>
                            <button
                              onClick={() => addQuickRole(item.role)}
                              className="text-xs text-amber-700 font-medium hover:underline ml-2"
                            >
                              +Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!compositionLoading && !compositionCheck && selectedRoles.length < 2 && (
                  <p className="text-xs text-slate-400">Select at least 2 roles to see analysis…</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Use Case Type */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">What type of decision is this?</h2>
                <p className="text-sm text-slate-500">This helps frame the simulation correctly.</p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestUseCaseType}
                  disabled={typeLoading}
                  className="gap-1.5 text-xs h-7 text-violet-600 border-violet-200"
                >
                  {typeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Suggest for my scenario
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {USE_CASE_TYPES.map(ut => (
                  <button
                    key={ut.id}
                    onClick={() => setUseCaseType(ut.id)}
                    className={`text-left rounded-lg border px-3 py-2.5 text-xs transition-all ${
                      useCaseType === ut.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    <p className="font-semibold">{ut.label}</p>
                    <p className={`text-xs mt-0.5 ${useCaseType === ut.id ? 'text-slate-300' : 'text-slate-400'}`}>{ut.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Review + Launch */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Ready to simulate</h2>
                <p className="text-sm text-slate-500">Review your setup and launch the simulation.</p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-700">Simulation Title</label>
                  <AIBadge />
                  {titleLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>
                {titleLoading ? (
                  <div className="h-9 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter a title for this simulation"
                    className="text-sm"
                  />
                )}
              </div>

              {/* Summary */}
              <Card className="p-4 space-y-3 bg-slate-50 border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Scenario</p>
                  <p className="text-sm text-slate-700 line-clamp-3">{scenario}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Roles ({selectedRoles.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoles.map(r => (
                      <Badge key={r.role} variant="outline" className="text-xs">
                        {r.role.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Use Case</p>
                    <Badge className="text-xs bg-slate-200 text-slate-700">{(useCaseType || 'custom').replace(/_/g, ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Est. Time</p>
                    <Badge variant="outline" className="text-xs">~2 min</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1.5 text-xs h-8">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
            {step === 1 && (
              <button onClick={skipOnboarding} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                I know what I'm doing — skip to blank simulation
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 && (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 2 && scenario.trim().length < 30) ||
                  (step === 3 && selectedRoles.length < 3)
                }
                size="sm"
                className="gap-1.5 text-xs h-8"
              >
                {step === 2 && qualityCheck?.quality_label === 'weak' ? 'Continue anyway' : 'Continue'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
            {step === 5 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLaunch(true)}
                  className="text-xs h-8"
                >
                  Save as Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLaunch(false)}
                  disabled={!title.trim() || !scenario.trim() || selectedRoles.length < 2}
                  className="gap-1.5 text-xs h-8 bg-slate-900 hover:bg-slate-800"
                >
                  Run Simulation →
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}