import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, PlayCircle, Users, Zap, MessageSquare, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Swords, Send, RefreshCw, Brain, Target, Star,
  Sparkles, ChevronRight, Trophy, TrendingUp, Settings2
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// ─── Constants ────────────────────────────────────────────────────────────────

const DECISION_TYPES = [
  { id: "pre_mortem", label: "Pre-Mortem Analysis" },
  { id: "roadmap", label: "Roadmap Prioritization" },
  { id: "adr", label: "Architecture Decision (ADR)" },
  { id: "build_buy", label: "Build vs. Buy" },
  { id: "tech_debt", label: "Tech Debt Resolution" },
  { id: "hiring", label: "Hiring Decision" },
  { id: "migration", label: "Platform Migration" },
  { id: "customer_escalation", label: "Customer Escalation" },
  { id: "custom", label: "Custom / Freeform" },
];

const CHALLENGE_MODES = [
  { id: "watch", label: "Watch Only", desc: "Observe the AI simulation play out — no participation required." },
  { id: "participant", label: "Participate as a Role", desc: "Take one role and respond to the meeting in real time." },
  { id: "facilitator", label: "Practice Facilitation", desc: "Guide the meeting — you'll be prompted to steer conversations." },
];

const ROLE_COLORS = [
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
];

const CURVEBALL_TYPES = [
  "Budget just got cut by 30% — how does each role react?",
  "A key engineer just resigned. Re-assess your priorities.",
  "The CEO just walked in and asked for a decision in 10 minutes.",
  "A competitor just announced a very similar feature.",
  "Legal has flagged a compliance risk with the current approach.",
  "Customer Success just reported a critical churn risk tied to this decision.",
  "The timeline was just moved up by 6 weeks.",
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function getRoleColor(roleId, allRoleIds) {
  const idx = allRoleIds.indexOf(roleId);
  return ROLE_COLORS[idx % ROLE_COLORS.length] || ROLE_COLORS[0];
}

function formatRole(r) {
  return r?.replace(/_/g, ' ') || r;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DialogueBubble({ turn, roleColor, isNew, isUserTurn }) {
  const [expanded, setExpanded] = useState(false);
  const isDecisionPoint = turn.type === 'decision_point';
  const isConflict = turn.type === 'conflict';
  const isCurveball = turn.type === 'curveball';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mb-3 ${isDecisionPoint ? 'border-l-4 border-amber-400 pl-3' : isConflict ? 'border-l-4 border-rose-400 pl-3' : isCurveball ? 'border-l-4 border-violet-400 pl-3' : ''}`}
    >
      {isDecisionPoint && (
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Decision Point</span>
        </div>
      )}
      {isConflict && (
        <div className="flex items-center gap-1.5 mb-1">
          <Swords className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Conflict</span>
        </div>
      )}
      {isCurveball && (
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Curveball Injected</span>
        </div>
      )}
      <div className={`flex items-start gap-2 ${isUserTurn ? 'flex-row-reverse' : ''}`}>
        <Badge className={`text-xs shrink-0 mt-0.5 border ${isUserTurn ? 'bg-slate-800 text-white border-slate-700' : roleColor}`}>
          {isUserTurn ? '🧑 You' : formatRole(turn.role)}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${isUserTurn ? 'text-right text-slate-900 font-medium' : 'text-slate-800'}`}>
            {turn.dialogue}
          </p>
          {turn.internal_state && (
            <>
              <button
                className="flex items-center gap-1 mt-1 text-xs text-slate-400 hover:text-slate-600"
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide' : 'Show'} internal state
              </button>
              {expanded && (
                <p className="text-xs text-slate-500 italic mt-1 pl-2 border-l-2 border-slate-200">
                  💭 {turn.internal_state}
                </p>
              )}
            </>
          )}
          {turn.trigger_fired && (
            <Badge className="mt-1 text-xs bg-rose-50 text-rose-700 border border-rose-200">
              ⚡ Trigger: {turn.trigger_fired}
            </Badge>
          )}
          {turn.coaching_hint && (
            <p className="mt-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded px-2 py-1">
              💡 Coach: {turn.coaching_hint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PracticePrompt({ prompt, onRespond, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onRespond(text.trim());
    setText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-violet-200 bg-violet-50 rounded-lg p-3 space-y-2 shrink-0"
    >
      <p className="text-xs font-semibold text-violet-800 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5" /> Your Turn — {prompt}
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your response..."
        className="min-h-[70px] resize-none text-sm bg-white"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) handleSubmit();
        }}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">⌘ + Enter to submit</span>
        <Button size="sm" onClick={handleSubmit} disabled={!text.trim() || disabled} className="gap-1.5">
          <Send className="w-3.5 h-3.5" />
          Respond
        </Button>
      </div>
    </motion.div>
  );
}

function ScoreCard({ score }) {
  const metrics = [
    { label: "Clarity of Position", key: "clarity", color: "blue" },
    { label: "Stakeholder Awareness", key: "stakeholder_awareness", color: "violet" },
    { label: "Conflict Navigation", key: "conflict_navigation", color: "rose" },
    { label: "Decision Quality", key: "decision_quality", color: "emerald" },
    { label: "Facilitation / Influence", key: "facilitation", color: "amber" },
  ];

  const colorMap = {
    blue: 'bg-blue-500', violet: 'bg-violet-500', rose: 'bg-rose-500',
    emerald: 'bg-emerald-500', amber: 'bg-amber-500',
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm text-emerald-900">Session Debrief</span>
          <Badge className="ml-auto bg-emerald-600 text-white border-0 text-sm px-3">
            {score.overall_score}/100
          </Badge>
        </div>
        <p className="text-sm text-slate-700">{score.summary}</p>
        <div className="space-y-2">
          {metrics.map(({ label, key, color }) => (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium text-slate-800">{score[key] ?? '—'}/20</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorMap[color]}`}
                  style={{ width: `${Math.min(100, ((score[key] ?? 0) / 20) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {score.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-1">Strengths</p>
            <ul className="space-y-0.5">
              {score.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600">✓ {s}</li>)}
            </ul>
          </div>
        )}
        {score.improvements?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">Areas to Improve</p>
            <ul className="space-y-0.5">
              {score.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600">→ {s}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoleInteractionSimulator({ open, onClose, template, scenario: externalScenario, selectedRoles: externalRoles, onComplete }) {
  // Setup phase
  const [setupPhase, setSetupPhase] = useState('config'); // config | running | done
  const [decisionType, setDecisionType] = useState(template?.use_case_type || template?.framework || 'custom');
  const [scenarioText, setScenarioText] = useState(externalScenario || '');
  const [challengeMode, setChallengeMode] = useState('watch');
  const [userRole, setUserRole] = useState('');
  const [generatingScenario, setGeneratingScenario] = useState(false);

  // Simulation state
  const [phase, setPhase] = useState('idle'); // idle | generating | waiting_user | curveball | done
  const [turns, setTurns] = useState([]);
  const [decisionPoints, setDecisionPoints] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [score, setScore] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('');
  const [practicePrompt, setPracticePrompt] = useState('');
  const [userResponses, setUserResponses] = useState([]);
  const [pendingCurveball, setPendingCurveball] = useState(null);
  const [curveballInjected, setCurveballInjected] = useState(false);

  const bottomRef = useRef(null);
  const roles = externalRoles || [];
  const roleIds = roles.map(r => r.role);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['roleProfiles'],
    queryFn: () => base44.entities.RoleProfile.list(),
    enabled: open,
  });

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [turns, phase]);

  // Sync external scenario
  useEffect(() => {
    if (externalScenario) setScenarioText(externalScenario);
  }, [externalScenario]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSetupPhase('config');
      setPhase('idle');
      setTurns([]);
      setDecisionPoints([]);
      setOutcome(null);
      setScore(null);
      setProgress(0);
      setUserResponses([]);
      setCurveballInjected(false);
    }
  }, [open]);

  const getProfile = (roleId) => allProfiles.find(p => p.role_id === roleId) || null;

  const buildRoleContext = (roleObj) => {
    const p = getProfile(roleObj.role);
    let ctx = `ROLE: ${formatRole(roleObj.role)} (Influence: ${roleObj.influence}/10)`;
    if (p?.communication_style) ctx += `\nComm style: ${p.communication_style}`;
    if (p?.decision_making_approach) ctx += `\nDecision approach: ${p.decision_making_approach}`;
    if (p?.risk_tolerance) ctx += `\nRisk tolerance: ${p.risk_tolerance}`;
    if (p?.conflict_style) ctx += `\nConflict style: ${p.conflict_style}`;
    if (p?.typical_motivations?.length) ctx += `\nMotivations: ${p.typical_motivations.join(', ')}`;
    if (p?.emotional_triggers?.length) ctx += `\nEmotional triggers: ${p.emotional_triggers.join('; ')}`;
    if (p?.signature_phrases?.length) ctx += `\nSignature phrases: "${p.signature_phrases.join('", "')}"`;
    if (p?.personality_traits?.length) ctx += `\nPersonality traits: ${p.personality_traits.slice(0, 3).join('; ')}`;
    if (p?.cognitive_biases?.length) ctx += `\nCognitive biases: ${p.cognitive_biases.map(b => b.bias).join(', ')}`;
    if (p?.relationship_dynamics?.friction_with?.length) ctx += `\nClashes with: ${p.relationship_dynamics.friction_with.join(', ')}`;
    return ctx;
  };

  // ── Auto-generate scenario ────────────────────────────────────────────────
  const generateScenario = async () => {
    if (!decisionType || roles.length === 0) return;
    setGeneratingScenario(true);
    const roleNames = roles.map(r => formatRole(r.role)).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a realistic, challenging ${decisionType.replace(/_/g, ' ')} scenario for a cross-functional team meeting.
Participants: ${roleNames}
The scenario should:
- Be specific and grounded (real product/engineering/business context)
- Include at least 1 hidden complication or time constraint
- Have clear competing priorities between the roles listed
- Be 3–5 sentences

Return JSON: { "scenario": "...", "hidden_complication": "..." }`,
      response_json_schema: {
        type: "object",
        properties: {
          scenario: { type: "string" },
          hidden_complication: { type: "string" }
        }
      }
    });
    setScenarioText(result.scenario + (result.hidden_complication ? `\n\nHidden factor: ${result.hidden_complication}` : ''));
    setGeneratingScenario(false);
    toast.success('Scenario generated');
  };

  // ── Main simulation ───────────────────────────────────────────────────────
  const startSimulation = async () => {
    if (!scenarioText.trim()) {
      toast.error('Please enter or generate a scenario first');
      return;
    }
    setSetupPhase('running');
    setPhase('generating');
    setTurns([]);
    setDecisionPoints([]);
    setOutcome(null);
    setScore(null);
    setProgress(0);

    const roleContexts = roles.map(buildRoleContext).join('\n\n---\n\n');
    const decisionLabel = DECISION_TYPES.find(d => d.id === decisionType)?.label || decisionType;
    const modeNote = challengeMode === 'participant'
      ? `\nNOTE: The user is playing the role of "${formatRole(userRole)}". Do NOT generate turns for that role — leave gaps for the user to fill in.`
      : challengeMode === 'facilitator'
      ? `\nNOTE: The user is practicing facilitation. After 2–3 turns, pause and ask the facilitator what to do next.`
      : '';

    try {
      // Phase 1 — Opening
      setStatusLabel('Generating opening statements...');
      setProgress(10);
      const openingResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are running a realistic, high-stakes ${decisionLabel} meeting. Each participant opens with their position.
${modeNote}

SCENARIO: ${scenarioText}

ROLE PROFILES:
${roleContexts}

Generate opening statements in order of influence (highest first).
- Use each role's communication style and signature phrases
- Show their initial position and primary concern clearly
- 2–4 sentences per turn
- Mark type: "statement", "conflict", or "decision_point"
- Add "internal_state" (what they're NOT saying aloud)
- Add "trigger_fired" if an emotional trigger fires`,
        response_json_schema: turnSchema()
      });

      const opening = openingResult.turns || [];
      setTurns(opening);
      setProgress(30);

      // Phase 2 — Conflict & interaction
      setStatusLabel('Simulating role interactions...');
      const interactionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Continue the ${decisionLabel} meeting. Roles now respond to each other. Things get heated.
${modeNote}

SCENARIO: ${scenarioText}

ROLE PROFILES:
${roleContexts}

DIALOGUE SO FAR:
${JSON.stringify(opening, null, 2)}

Generate 5–8 turns showing:
- Direct responses and push-backs between roles
- At least 2 conflict moments (trigger fires)
- 1 unexpected alignment between unlikely roles
- 1–2 decision points where the group must choose
- Roles using their specific conflict styles

Mark types accurately. Add "coaching_hint" on any turn where the facilitator or participant could improve outcomes.`,
        response_json_schema: { ...turnSchema(), properties: { ...turnSchema().properties, decision_points: decisionPointSchema() } }
      });

      const interactionTurns = interactionResult.turns || [];
      setTurns(prev => [...prev, ...interactionTurns]);
      setDecisionPoints(interactionResult.decision_points || []);
      setProgress(60);

      // Optional: pause for user if participant mode
      if (challengeMode === 'participant' && userRole) {
        setPhase('waiting_user');
        setPracticePrompt(`As ${formatRole(userRole)}, how do you respond to the current state of the meeting?`);
        return; // will resume via handleUserRespond
      }

      // Phase 3 — Optional curveball
      if (!curveballInjected) {
        const curveball = CURVEBALL_TYPES[Math.floor(Math.random() * CURVEBALL_TYPES.length)];
        setPendingCurveball(curveball);
        await finishSimulation([...opening, ...interactionTurns], roleContexts, decisionLabel, curveball);
      } else {
        await finishSimulation([...opening, ...interactionTurns], roleContexts, decisionLabel, null);
      }

    } catch (err) {
      toast.error('Simulation failed — please try again');
      console.error(err);
      setPhase('idle');
      setSetupPhase('config');
    }
  };

  const handleUserRespond = async (text) => {
    const userTurn = { role: userRole, dialogue: text, type: 'statement', isUserTurn: true };
    setTurns(prev => [...prev, userTurn]);
    setUserResponses(prev => [...prev, text]);
    setPracticePrompt('');
    setPhase('generating');
    setStatusLabel('Generating AI responses to your input...');

    const allSoFar = [...turns, userTurn];
    const roleContexts = roles.map(buildRoleContext).join('\n\n---\n\n');
    const decisionLabel = DECISION_TYPES.find(d => d.id === decisionType)?.label || decisionType;

    const reactionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `The user playing ${formatRole(userRole)} just said: "${text}"
Continue the meeting with 2–3 AI role reactions. Then generate the closing and outcome.

SCENARIO: ${scenarioText}
ROLE PROFILES:
${roleContexts}
FULL DIALOGUE:
${JSON.stringify(allSoFar, null, 2)}`,
      response_json_schema: turnSchema()
    });

    const reactionTurns = reactionResult.turns || [];
    setTurns(prev => [...prev, ...reactionTurns]);
    await finishSimulation([...allSoFar, ...reactionTurns], roleContexts, decisionLabel, null);
  };

  const injectCurveball = async () => {
    const curveball = pendingCurveball || CURVEBALL_TYPES[Math.floor(Math.random() * CURVEBALL_TYPES.length)];
    const curveballTurn = {
      role: 'SYSTEM',
      dialogue: `⚡ CURVEBALL: ${curveball}`,
      type: 'curveball',
    };
    setTurns(prev => [...prev, curveballTurn]);
    setCurveballInjected(true);
    setPhase('generating');
    setStatusLabel('Generating role reactions to curveball...');

    const roleContexts = roles.map(buildRoleContext).join('\n\n---\n\n');
    const decisionLabel = DECISION_TYPES.find(d => d.id === decisionType)?.label || decisionType;

    const reactionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `A curveball was just injected into the meeting: "${curveball}"
Generate 2–4 reactions from different roles showing how they adapt (or panic).

SCENARIO: ${scenarioText}
ROLE PROFILES:
${roleContexts}
DIALOGUE SO FAR:
${JSON.stringify(turns, null, 2)}`,
      response_json_schema: turnSchema()
    });

    const reactionTurns = reactionResult.turns || [];
    setTurns(prev => [...prev, ...reactionTurns]);
    await finishSimulation([...turns, curveballTurn, ...reactionTurns], roleContexts, decisionLabel, null);
  };

  const finishSimulation = async (allTurns, roleContexts, decisionLabel, curveball) => {
    setStatusLabel('Generating resolution and outcome...');
    setProgress(80);

    const curveballNote = curveball ? `\nA curveball was injected mid-meeting: "${curveball}"\nFactor this into the outcome and tensions.` : '';

    const resolutionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate the closing phase and outcome of this ${decisionLabel} meeting.
${curveballNote}

SCENARIO: ${scenarioText}
FULL DIALOGUE:
${JSON.stringify(allTurns, null, 2)}

Generate:
1. 2–3 closing turns (final positions)
2. Meeting outcome with consensus level, key agreements, unresolved tensions, next steps`,
      response_json_schema: {
        type: "object",
        properties: {
          closing_turns: turnSchema().properties.turns,
          outcome: outcomeSchema()
        }
      }
    });

    const closingTurns = resolutionResult.closing_turns || [];
    setTurns(prev => [...prev, ...closingTurns]);
    setOutcome(resolutionResult.outcome);
    setProgress(95);

    // Score user if they participated
    if (challengeMode !== 'watch' && userResponses.length > 0) {
      setStatusLabel('Scoring your performance...');
      const scoreResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a decision-making coach. Score this user's performance in the ${decisionLabel} simulation.

USER ROLE: ${formatRole(userRole)}
USER RESPONSES: ${userResponses.join('\n---\n')}
FULL SIMULATION DIALOGUE: ${JSON.stringify([...allTurns, ...closingTurns], null, 2)}

Score on 5 dimensions (0–20 each):
- clarity: How clearly did they express their position?
- stakeholder_awareness: Did they acknowledge other perspectives?
- conflict_navigation: Did they handle conflict effectively?
- decision_quality: Were their recommendations sound?
- facilitation: Did they help move the group forward?

Also provide: overall_score (0–100), summary, strengths (3 items), improvements (3 items).`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            clarity: { type: "number" },
            stakeholder_awareness: { type: "number" },
            conflict_navigation: { type: "number" },
            decision_quality: { type: "number" },
            facilitation: { type: "number" },
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } }
          }
        }
      });
      setScore(scoreResult);
    }

    setProgress(100);
    setPhase('done');
    setStatusLabel('');

    if (onComplete) {
      onComplete({ turns: [...allTurns, ...closingTurns], outcome: resolutionResult.outcome });
    }
    toast.success('Simulation complete');
  };

  // ─── Schema helpers ───────────────────────────────────────────────────────
  function turnSchema() {
    return {
      type: "object",
      properties: {
        turns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              dialogue: { type: "string" },
              type: { type: "string", enum: ["statement", "conflict", "decision_point"] },
              internal_state: { type: "string" },
              trigger_fired: { type: "string" },
              coaching_hint: { type: "string" }
            }
          }
        }
      }
    };
  }

  function decisionPointSchema() {
    return {
      type: "array",
      items: {
        type: "object",
        properties: {
          point: { type: "string" },
          option_a: { type: "string" },
          option_b: { type: "string" },
          roles_split: {
            type: "object",
            properties: {
              a: { type: "array", items: { type: "string" } },
              b: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    };
  }

  function outcomeSchema() {
    return {
      type: "object",
      properties: {
        consensus_reached: { type: "boolean" },
        consensus_level: { type: "string", enum: ["unanimous", "strong_majority", "split", "escalation_needed"] },
        summary: { type: "string" },
        key_agreements: { type: "array", items: { type: "string" } },
        unresolved_tensions: { type: "array", items: { type: "string" } },
        next_steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              owner_role: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] }
            }
          }
        }
      }
    };
  }

  const consensusColors = {
    unanimous: 'bg-emerald-100 text-emerald-800',
    strong_majority: 'bg-blue-100 text-blue-800',
    split: 'bg-amber-100 text-amber-800',
    escalation_needed: 'bg-rose-100 text-rose-800',
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Role Interaction Simulator
            {template?.name && <Badge variant="outline" className="text-xs font-normal ml-1">{template.name}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* ── Config Phase ── */}
        {setupPhase === 'config' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Roles summary */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Participants</Label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r, i) => (
                  <Badge key={r.role} className={`text-xs border ${getRoleColor(r.role, roleIds)}`}>
                    {formatRole(r.role)} · {r.influence}/10
                  </Badge>
                ))}
              </div>
            </div>

            {/* Decision type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Decision Type</Label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select decision type" />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_TYPES.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scenario */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scenario</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-violet-600 hover:text-violet-700"
                  onClick={generateScenario}
                  disabled={generatingScenario || roles.length === 0}
                >
                  {generatingScenario ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generatingScenario ? 'Generating...' : 'Auto-generate'}
                </Button>
              </div>
              <Textarea
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                placeholder="Describe the decision scenario, context, and constraints..."
                className="min-h-[100px] resize-none text-sm"
              />
            </div>

            {/* Challenge mode */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Practice Mode</Label>
              <div className="grid grid-cols-1 gap-2">
                {CHALLENGE_MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setChallengeMode(m.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${challengeMode === m.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${challengeMode === m.id ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`} />
                      <span className="text-sm font-medium text-slate-800">{m.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Role selection for participant mode */}
            {challengeMode === 'participant' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select which role you'll play" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.role} value={r.role}>{formatRole(r.role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={startSimulation}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white h-10"
              disabled={!scenarioText.trim() || (challengeMode === 'participant' && !userRole)}
            >
              <PlayCircle className="w-4 h-4" />
              Start Simulation
            </Button>
          </div>
        )}

        {/* ── Simulation Phase ── */}
        {setupPhase === 'running' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Progress bar */}
            {(phase === 'generating') && (
              <div className="px-5 py-2 border-b border-slate-100 shrink-0 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />{statusLabel}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            {/* Phase badge row */}
            <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-2 shrink-0 flex-wrap">
              {roles.map(r => (
                <Badge key={r.role} className={`text-xs border ${getRoleColor(r.role, roleIds)} ${r.role === userRole ? 'ring-2 ring-violet-400' : ''}`}>
                  {r.role === userRole ? '🧑 ' : ''}{formatRole(r.role)}
                </Badge>
              ))}
              {phase === 'done' && !curveballInjected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto h-6 text-xs gap-1 text-violet-600 border-violet-300"
                  onClick={injectCurveball}
                >
                  <Zap className="w-3 h-3" /> Inject Curveball
                </Button>
              )}
              {(phase === 'done' || phase === 'waiting_user') && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-1 text-slate-500 ml-auto"
                  onClick={() => { setSetupPhase('config'); setPhase('idle'); }}
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>

            {/* Dialogue feed */}
            <ScrollArea className="flex-1 min-h-0 px-5 py-3">
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {turns.map((turn, idx) => (
                    <DialogueBubble
                      key={idx}
                      turn={turn}
                      roleColor={getRoleColor(turn.role, roleIds)}
                      isNew={idx >= turns.length - 4}
                      isUserTurn={!!turn.isUserTurn}
                    />
                  ))}
                </AnimatePresence>
                {phase === 'generating' && (
                  <div className="flex items-center gap-2 py-2 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">{statusLabel}</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Decision points */}
            {decisionPoints.length > 0 && phase !== 'generating' && (
              <div className="px-5 py-3 border-t border-slate-100 space-y-2 shrink-0 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Decision Points Emerged
                </p>
                {decisionPoints.map((dp, i) => (
                  <Card key={i} className="border-amber-200 bg-amber-50">
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-amber-900 mb-2">{dp.point}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded p-2 border border-amber-200">
                          <p className="font-medium text-slate-600 mb-1">Option A</p>
                          <p className="text-slate-600">{dp.option_a}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dp.roles_split?.a?.map((r, j) => (
                              <Badge key={j} variant="outline" className="text-[10px] py-0">{formatRole(r)}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2 border border-amber-200">
                          <p className="font-medium text-slate-600 mb-1">Option B</p>
                          <p className="text-slate-600">{dp.option_b}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dp.roles_split?.b?.map((r, j) => (
                              <Badge key={j} variant="outline" className="text-[10px] py-0">{formatRole(r)}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* User input prompt */}
            {phase === 'waiting_user' && practicePrompt && (
              <div className="px-5 pb-4 pt-2 shrink-0">
                <PracticePrompt
                  prompt={practicePrompt}
                  onRespond={handleUserRespond}
                  disabled={false}
                />
              </div>
            )}

            {/* Outcome */}
            {outcome && phase === 'done' && (
              <div className="px-5 pb-4 shrink-0 space-y-3 border-t border-slate-100 pt-3 max-h-64 overflow-y-auto">
                <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      <span className="font-semibold text-sm text-violet-900">Meeting Outcome</span>
                      <Badge className={`text-xs ml-auto ${consensusColors[outcome.consensus_level] || ''}`}>
                        {outcome.consensus_level?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700">{outcome.summary}</p>
                    {outcome.key_agreements?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Key Agreements</p>
                        <ul className="space-y-0.5">
                          {outcome.key_agreements.map((a, i) => <li key={i} className="text-xs text-slate-600">✓ {a}</li>)}
                        </ul>
                      </div>
                    )}
                    {outcome.unresolved_tensions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-rose-600 mb-1">Unresolved Tensions</p>
                        <ul className="space-y-0.5">
                          {outcome.unresolved_tensions.map((t, i) => <li key={i} className="text-xs text-slate-600">⚠ {t}</li>)}
                        </ul>
                      </div>
                    )}
                    {outcome.next_steps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Next Steps</p>
                        <ul className="space-y-1">
                          {outcome.next_steps.map((s, i) => (
                            <li key={i} className="text-xs flex items-start gap-2">
                              <Badge className={`shrink-0 ${s.priority === 'high' ? 'bg-rose-600 text-white' : s.priority === 'medium' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {s.priority}
                              </Badge>
                              <span className="text-slate-700">{s.action} <span className="text-slate-400">— {formatRole(s.owner_role)}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Score card */}
                {score && <ScoreCard score={score} />}

                <Button onClick={onClose} className="w-full" variant="outline">Close</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}