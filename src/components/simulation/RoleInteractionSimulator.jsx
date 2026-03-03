import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PlayCircle, Users, Zap, MessageSquare, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

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

function getRoleColor(roleId, allRoleIds) {
  const idx = allRoleIds.indexOf(roleId);
  return ROLE_COLORS[idx % ROLE_COLORS.length] || ROLE_COLORS[0];
}

function DialogueBubble({ turn, roleColor, isNew }) {
  const [expanded, setExpanded] = useState(true);
  const isDecisionPoint = turn.type === 'decision_point';
  const isConflict = turn.type === 'conflict';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mb-3 ${isDecisionPoint ? 'border-l-4 border-amber-400 pl-3' : isConflict ? 'border-l-4 border-rose-400 pl-3' : ''}`}
    >
      {isDecisionPoint && (
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Decision Point</span>
        </div>
      )}
      {isConflict && (
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Conflict Triggered</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <Badge className={`text-xs shrink-0 mt-0.5 border ${roleColor}`}>
          {turn.role?.replace(/_/g, ' ')}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-relaxed">{turn.dialogue}</p>
          {turn.internal_state && (
            <button
              className="flex items-center gap-1 mt-1 text-xs text-slate-400 hover:text-slate-600"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'Show'} internal state
            </button>
          )}
          {expanded && turn.internal_state && (
            <p className="text-xs text-slate-500 italic mt-1 pl-2 border-l-2 border-slate-200">
              {turn.internal_state}
            </p>
          )}
          {turn.trigger_fired && (
            <Badge className="mt-1 text-xs bg-rose-50 text-rose-700 border border-rose-200">
              ⚡ Trigger: {turn.trigger_fired}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function RoleInteractionSimulator({ open, onClose, template, scenario, selectedRoles, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | generating | done
  const [turns, setTurns] = useState([]);
  const [decisionPoints, setDecisionPoints] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('');
  const bottomRef = useRef(null);

  const roleIds = selectedRoles.map(r => r.role);

  // Fetch role profiles for all selected roles
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['roleProfiles'],
    queryFn: () => base44.entities.RoleProfile.list(),
    enabled: open
  });

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const getProfile = (roleId) => allProfiles.find(p => p.role_id === roleId) || null;

  const buildRoleContext = (roleObj) => {
    const p = getProfile(roleObj.role);
    const name = roleObj.role.replace(/_/g, ' ');
    let ctx = `ROLE: ${name} (Influence: ${roleObj.influence}/10)`;
    if (p?.communication_style) ctx += `\nCommunication style: ${p.communication_style}`;
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

  const startSimulation = async () => {
    setPhase('generating');
    setTurns([]);
    setDecisionPoints([]);
    setOutcome(null);
    setProgress(0);

    const roleContexts = selectedRoles.map(buildRoleContext).join('\n\n---\n\n');
    const frameworkInfo = template ? `Framework: ${template.framework || 'custom'}\nUse Case: ${template.use_case_type || 'general'}` : '';

    try {
      // Phase 1: Opening statements
      setStatusLabel('Generating opening statements...');
      setProgress(15);
      const openingResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are simulating a realistic cross-functional team meeting. Each role makes an opening statement about the scenario below, staying true to their profile, using their signature phrases and communication style where fitting.

SCENARIO: ${scenario}
${frameworkInfo}

ROLE PROFILES:
${roleContexts}

Generate opening statements for each role in sequence. For each:
- Use the role's actual communication style and personality
- Reference their signature phrases naturally (not forced)
- Show their initial position and primary concern
- Keep each statement 2–4 sentences

Return turns in meeting order (by influence descending).`,
        response_json_schema: {
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
                  internal_state: { type: "string", description: "What this role is really thinking (not said aloud)" },
                  trigger_fired: { type: "string", description: "If an emotional trigger was activated, name it briefly" }
                }
              }
            }
          }
        }
      });
      const opening = openingResult.turns || [];
      setTurns(opening);
      setProgress(35);

      // Phase 2: Conflict & interaction round
      setStatusLabel('Simulating role interactions and conflicts...');
      const interactionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Continue the meeting simulation. Based on the opening statements, roles now interact, challenge each other, and emotional triggers fire naturally. Some roles should conflict. Show the meeting getting heated or productive based on the conflict styles.

SCENARIO: ${scenario}
${frameworkInfo}

ROLE PROFILES:
${roleContexts}

OPENING STATEMENTS SO FAR:
${JSON.stringify(opening, null, 2)}

Generate 4–7 more interaction turns showing:
- Roles responding to each other's opening positions
- At least 1 conflict moment (where a trigger fires)
- At least 1 moment of unexpected alignment
- Roles using their conflict styles (avoiding, competing, collaborating, etc.)
- 1–2 decision points emerging from the debate

Mark type as "conflict" when a trigger fires, "decision_point" when a key choice emerges, "statement" otherwise.`,
        response_json_schema: {
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
                  trigger_fired: { type: "string" }
                }
              }
            },
            decision_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  point: { type: "string", description: "The key choice or question" },
                  option_a: { type: "string" },
                  option_b: { type: "string" },
                  roles_split: { type: "object", properties: { a: { type: "array", items: { type: "string" } }, b: { type: "array", items: { type: "string" } } } }
                }
              }
            }
          }
        }
      });

      const interactionTurns = interactionResult.turns || [];
      setTurns(prev => [...prev, ...interactionTurns]);
      setDecisionPoints(interactionResult.decision_points || []);
      setProgress(70);

      // Phase 3: Resolution & outcome
      setStatusLabel('Generating resolution and outcome...');
      const allTurns = [...opening, ...interactionTurns];
      const resolutionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate the closing phase of this team decision meeting. Roles move toward resolution (or agree to disagree). End with a clear outcome.

SCENARIO: ${scenario}

FULL DIALOGUE SO FAR:
${JSON.stringify(allTurns, null, 2)}

Generate:
1. 2–3 closing turns where roles signal their final position
2. A meeting outcome: did they reach consensus, a split decision, or escalation needed?
3. 3–5 concrete next steps agreed upon (or contested)`,
        response_json_schema: {
          type: "object",
          properties: {
            closing_turns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  dialogue: { type: "string" },
                  type: { type: "string", enum: ["statement", "conflict", "decision_point"] },
                  internal_state: { type: "string" },
                  trigger_fired: { type: "string" }
                }
              }
            },
            outcome: {
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
            }
          }
        }
      });

      const closingTurns = resolutionResult.closing_turns || [];
      setTurns(prev => [...prev, ...closingTurns]);
      setOutcome(resolutionResult.outcome);
      setProgress(100);
      setPhase('done');
      setStatusLabel('');

      if (onComplete) {
        onComplete({
          turns: [...allTurns, ...closingTurns],
          decision_points: interactionResult.decision_points || [],
          outcome: resolutionResult.outcome
        });
      }

      toast.success('Role interaction simulation complete');
    } catch (err) {
      toast.error('Simulation failed');
      console.error(err);
      setPhase('idle');
    }
  };

  const consensusColors = {
    unanimous: 'bg-emerald-100 text-emerald-800',
    strong_majority: 'bg-blue-100 text-blue-800',
    split: 'bg-amber-100 text-amber-800',
    escalation_needed: 'bg-rose-100 text-rose-800',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Role Interaction Simulation
            {template?.name && <Badge variant="outline" className="text-xs font-normal">{template.name}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Role pills */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
          {selectedRoles.map((r, i) => (
            <Badge key={r.role} className={`text-xs border ${getRoleColor(r.role, roleIds)}`}>
              {r.role.replace(/_/g, ' ')} · {r.influence}/10
            </Badge>
          ))}
        </div>

        {/* Progress */}
        {phase === 'generating' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{statusLabel}</span>
              <span className="text-xs text-slate-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Start button */}
        {phase === 'idle' && (
          <Button onClick={startSimulation} className="gap-2 w-full" size="lg">
            <PlayCircle className="w-5 h-5" />
            Start Role Interaction Simulation
          </Button>
        )}

        {/* Dialogue feed */}
        {turns.length > 0 && (
          <ScrollArea className="flex-1 min-h-0 pr-2">
            <div className="space-y-1 py-1">
              <AnimatePresence initial={false}>
                {turns.map((turn, idx) => (
                  <DialogueBubble
                    key={idx}
                    turn={turn}
                    roleColor={getRoleColor(turn.role, roleIds)}
                    isNew={phase === 'generating' && idx >= turns.length - 3}
                  />
                ))}
              </AnimatePresence>

              {phase === 'generating' && (
                <div className="flex items-center gap-2 py-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">{statusLabel}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* Decision Points */}
        {decisionPoints.length > 0 && (
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Decision Points
            </p>
            {decisionPoints.map((dp, i) => (
              <Card key={i} className="border-amber-200 bg-amber-50">
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-amber-900 mb-2">{dp.point}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2 border border-amber-200">
                      <p className="font-medium text-slate-700 mb-1">Option A</p>
                      <p className="text-slate-600">{dp.option_a}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dp.roles_split?.a?.map((r, j) => (
                          <Badge key={j} variant="outline" className="text-xs py-0">{r.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2 border border-amber-200">
                      <p className="font-medium text-slate-700 mb-1">Option B</p>
                      <p className="text-slate-600">{dp.option_b}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dp.roles_split?.b?.map((r, j) => (
                          <Badge key={j} variant="outline" className="text-xs py-0">{r.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Outcome */}
        {outcome && phase === 'done' && (
          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white shrink-0">
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
                    {outcome.key_agreements.map((a, i) => (
                      <li key={i} className="text-xs text-slate-700">✓ {a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {outcome.unresolved_tensions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-rose-600 mb-1">Unresolved Tensions</p>
                  <ul className="space-y-0.5">
                    {outcome.unresolved_tensions.map((t, i) => (
                      <li key={i} className="text-xs text-slate-600">⚠ {t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {outcome.next_steps?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Next Steps</p>
                  <ul className="space-y-1">
                    {outcome.next_steps.map((s, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <Badge className={`shrink-0 text-xs ${s.priority === 'high' ? 'bg-rose-600 text-white' : s.priority === 'medium' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {s.priority}
                        </Badge>
                        <span className="text-slate-700">{s.action} <span className="text-slate-400">— {s.owner_role?.replace(/_/g, ' ')}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={onClose} className="w-full mt-2" variant="outline">Close</Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}