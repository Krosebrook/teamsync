import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SimulationRunner({ 
  open, 
  onClose, 
  scenario, 
  selectedRoles, 
  teamMemberProfiles,
  onSimulationComplete 
}) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [roleResponses, setRoleResponses] = useState([]);
  const [tensions, setTensions] = useState([]);
  const [tradeOffs, setTradeOffs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);

  const totalSteps = (selectedRoles || []).length + 3; // roles + tensions + tradeoffs + summary

  const runSimulation = async () => {
    setRunning(true);
    setCurrentStep(0);
    setRoleResponses([]);
    setTensions([]);
    setTradeOffs([]);
    setSummary(null);

    try {
      // Step 1: Generate responses for each role
      const responses = [];
      for (let i = 0; i < selectedRoles.length; i++) {
        const role = selectedRoles[i];
        setCurrentStep(i + 1);
        setProgress(((i + 1) / totalSteps) * 100);

        // Find matching team member profile if available
        const memberProfile = teamMemberProfiles?.find(
          m => m.role === role.role || m.matched_role === role.role
        );

        const response = await generateRoleResponse(role, memberProfile);
        responses.push(response);
        setRoleResponses([...responses]);
      }

      // Step 2: Detect tensions
      setCurrentStep(selectedRoles.length + 1);
      setProgress(((selectedRoles.length + 1) / totalSteps) * 100);
      const detectedTensions = await detectTensions(responses);
      setTensions(detectedTensions);

      // Step 3: Identify trade-offs
      setCurrentStep(selectedRoles.length + 2);
      setProgress(((selectedRoles.length + 2) / totalSteps) * 100);
      const identifiedTradeOffs = await identifyTradeOffs(responses);
      setTradeOffs(identifiedTradeOffs);

      // Step 4: Generate summary
      setCurrentStep(selectedRoles.length + 3);
      setProgress(100);
      const simulationSummary = await generateSummary(responses, detectedTensions, identifiedTradeOffs);
      setSummary(simulationSummary);

      // Complete
      onSimulationComplete({
        responses,
        tensions: detectedTensions,
        decision_trade_offs: identifiedTradeOffs,
        summary: simulationSummary.summary,
        next_steps: simulationSummary.next_steps,
        final_decision: simulationSummary.final_decision
      });

      toast.success('Simulation completed successfully');
    } catch (error) {
      toast.error('Simulation failed');
      console.error(error);
    }
    
    setRunning(false);
  };

  const generateRoleResponse = async (role, memberProfile) => {
    const roleName = role.role.replace(/_/g, ' ');
    const profileLines = memberProfile ? `
TEAM MEMBER PROFILE:
- Name: ${memberProfile.name}
- Decision-Making Biases: ${(memberProfile.decision_biases || []).join(', ') || 'Unknown'}
- Conflict Resolution Style: ${memberProfile.conflict_style || 'Unknown'}
- Communication Style: ${memberProfile.communication_style || 'Unknown'}
- Risk Tolerance: ${memberProfile.risk_tolerance || 'Unknown'}
- Key Strengths: ${(memberProfile.strengths || []).join(', ') || 'Unknown'}
- Past Performance Patterns: ${memberProfile.performance_patterns || 'Unknown'}` : '';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `ROLE: You are simulating ${roleName} — a ${roleName} with the following profile:
- Influence level: ${role.influence}/10 (affects how assertively they advocate)
${profileLines}

INPUT: The team is deciding on the following:
SCENARIO: ${scenario}

STEPS (Chain of Thought — reason step by step before responding):
1. SCAN: What does this scenario mean for my role? What's at stake for me personally and professionally?
2. RISK FILTER: Run this through my known biases. What am I likely to over- or under-weight?
3. POSITION: What is my actual recommendation? Be specific — no hedge answers.
4. CONCERNS: What are my top 2-3 objections or risks I'd surface?
5. TENSION CHECK: Which other roles in the room do I predict will disagree with me, and why?
6. COMMUNICATE: Deliver my position in my authentic voice — using my communication style and signature phrases.

EXPECTATION: Return structured JSON with the exact schema provided.`,
      response_json_schema: {
        type: "object",
        properties: {
          role: { type: "string" },
          position: { type: "string", description: "1-3 sentence clear stance" },
          concerns: { type: "array", items: { type: "string" }, description: "Top 2-3 concerns" },
          recommendation: { type: "string", description: "Concrete recommendation with tradeoffs acknowledged" },
          risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
          primary_driver: { type: "string", description: "What's driving this position" },
          predicted_tensions_with: { type: "array", items: { type: "string" }, description: "Roles they predict will disagree" },
          authentic_voice_quote: { type: "string", description: "How they would actually say this in a meeting" },
          bias_manifestation: { type: "string", description: "How known biases are affecting this stance" }
        }
      }
    });

    return { ...result, influence: role.influence };
  };

  const detectTensions = async (responses) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `ROLE: You are a neutral organizational psychologist observing this team discussion.

INPUT: Here are the responses from each team member:
${JSON.stringify(responses, null, 2)}

STEPS:
1. Identify pairs of roles with conflicting positions or values
2. For each conflict: classify severity (low/medium/high/critical), describe the root cause, and name which cognitive biases are colliding
3. Flag any "hidden alignments" — roles that seem to conflict but actually share an underlying goal
4. Identify the single most dangerous tension that could derail this decision

EXPECTATION: Return tensions array with the exact schema provided.`,
      response_json_schema: {
        type: "object",
        properties: {
          tensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                between: { type: "array", items: { type: "string" } },
                description: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                root_cause: { type: "string" },
                hidden_alignment_if_any: { type: "string" },
                nature: { type: "string", enum: ["values", "tactical", "resource", "timeline", "risk_tolerance"] },
                resolution_difficulty: { type: "string", enum: ["easy", "moderate", "difficult", "requires_escalation"] }
              }
            }
          }
        }
      }
    });

    return result.tensions;
  };

  const identifyTradeOffs = async (responses) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on these role responses, identify the key decision trade-offs that emerged.

ROLE RESPONSES:
${JSON.stringify(responses, null, 2)}

Identify trade-offs where choosing one path means sacrificing another. Focus on:
- Explicit trade-offs mentioned by roles
- Implicit trade-offs created by conflicting recommendations
- Trade-offs between different stakeholder needs
- Strategic vs tactical trade-offs`,
      response_json_schema: {
        type: "object",
        properties: {
          trade_offs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trade_off: { type: "string", description: "Name of the trade-off" },
                option_a: { type: "string", description: "First option" },
                option_b: { type: "string", description: "Second option" },
                roles_favoring_a: { type: "array", items: { type: "string" } },
                roles_favoring_b: { type: "array", items: { type: "string" } },
                impact: { type: "string", description: "What's at stake" }
              }
            }
          }
        }
      }
    });

    return result.trade_offs;
  };

  const generateSummary = async (responses, tensions, tradeOffs) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `ROLE: You are a senior decision facilitator. Your job is to synthesize a team simulation into actionable clarity.

INPUT:
- Scenario: ${scenario}
- Role responses: ${JSON.stringify(responses, null, 2)}
- Tensions: ${JSON.stringify(tensions, null, 2)}
- Trade-offs: ${JSON.stringify(tradeOffs, null, 2)}

STEPS:
1. CONSENSUS SCAN: What do most roles actually agree on, even if they disagree on approach?
2. WEDGE ISSUES: What are the 2-3 things the team will NOT naturally resolve without a structured decision?
3. TRADEOFFS: Frame the core decision as A vs B — not as a spectrum, but as a forced choice with known costs
4. NEXT STEPS: Generate 3-5 specific, assignable actions with owner role, priority, and confidence %

EXPECTATION: Return {summary, consensus_points, wedge_issues, decision_trade_offs, next_steps, final_decision}`,
      response_json_schema: {
        type: "object",
        properties: {
          final_decision: {
            type: "object",
            properties: {
              reached: { type: "boolean" },
              decision: { type: "string" },
              consensus_level: { type: "string", enum: ["unanimous", "strong_majority", "split", "no_consensus"] },
              dissenting_voices: { type: "array", items: { type: "string" } }
            }
          },
          summary: { type: "string", description: "Executive summary of simulation outcome" },
          trade_offs_navigated: {
            type: "array",
            items: {
              type: "object",
              properties: {
                trade_off: { type: "string" },
                approach: { type: "string" },
                outcome: { type: "string" }
              }
            }
          },
          critical_tensions_status: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tension: { type: "string" },
                resolved: { type: "boolean" },
                resolution_approach: { type: "string" }
              }
            }
          },
          next_steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                owner_role: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                confidence: { type: "number" }
              }
            }
          }
        }
      }
    });

    return result;
  };

  const getStepLabel = () => {
    if (currentStep === 0) return 'Ready to simulate';
    if (currentStep <= selectedRoles.length) {
      return `Simulating ${selectedRoles[currentStep - 1].role.replace(/_/g, ' ')}`;
    }
    if (currentStep === selectedRoles.length + 1) return 'Detecting tensions';
    if (currentStep === selectedRoles.length + 2) return 'Identifying trade-offs';
    if (currentStep === selectedRoles.length + 3) return 'Generating summary';
    return 'Complete';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-violet-600" />
            AI Simulation Runner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {getStepLabel()}
              </span>
              <span className="text-sm text-slate-500">
                {currentStep} / {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>

          {/* Start Button */}
          {!running && roleResponses.length === 0 && (
            <Button
              onClick={runSimulation}
              className="w-full gap-2"
              size="lg"
            >
              <PlayCircle className="w-5 h-5" />
              Run AI Simulation
            </Button>
          )}

          {/* Role Responses */}
          {roleResponses.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-900">Role Responses</h3>
              <AnimatePresence>
                {roleResponses.map((response, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-violet-100 text-violet-700">
                            {response.role.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Influence: {response.influence}/10
                          </Badge>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-2">{response.position}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Key Concerns:</p>
                          <ul className="space-y-0.5">
                            {response.concerns?.map((concern, i) => (
                              <li key={i} className="text-xs text-slate-700">• {concern}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className={`${
                            response.risk_tolerance === 'high' ? 'bg-rose-600' :
                            response.risk_tolerance === 'medium' ? 'bg-amber-500' :
                            'bg-emerald-600'
                          } text-white`}>
                            {response.risk_tolerance} risk
                          </Badge>
                          <span className="text-slate-600">Driver: {response.primary_driver}</span>
                        </div>
                        {response.bias_manifestation && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-900">
                              <strong>Bias Effect:</strong> {response.bias_manifestation}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Tensions */}
          {tensions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Detected Tensions
              </h3>
              {tensions.map((tension, idx) => {
                const severityColors = {
                  critical: 'border-rose-600 bg-rose-50',
                  high: 'border-orange-500 bg-orange-50',
                  medium: 'border-amber-400 bg-amber-50',
                  low: 'border-slate-300 bg-slate-50'
                };
                return (
                  <Card key={idx} className={`p-3 border-l-4 ${severityColors[tension.severity]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-800">
                        {tension.between.map(r => r.replace(/_/g, ' ')).join(' vs ')}
                      </span>
                      <Badge className="text-xs">{tension.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{tension.nature}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{tension.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Resolution: {tension.resolution_difficulty}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Trade-Offs */}
          {tradeOffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-900">Key Trade-Offs</h3>
              {tradeOffs.map((tradeOff, idx) => (
                <Card key={idx} className="p-3">
                  <p className="text-sm font-medium text-slate-800 mb-2">{tradeOff.trade_off}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Option A</p>
                      <p className="text-xs text-slate-700">{tradeOff.option_a}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tradeOff.roles_favoring_a?.map((role, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {role.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs font-medium text-purple-900 mb-1">Option B</p>
                      <p className="text-xs text-slate-700">{tradeOff.option_b}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tradeOff.roles_favoring_b?.map((role, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {role.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    <strong>Impact:</strong> {tradeOff.impact}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
              <h3 className="font-semibold text-violet-900 mb-3">Simulation Outcome</h3>
              
              {/* Final Decision */}
              <div className="mb-4 p-3 bg-white rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${
                    summary.final_decision?.reached ? 'bg-emerald-600' : 'bg-amber-600'
                  } text-white`}>
                    {summary.final_decision?.reached ? 'Decision Reached' : 'No Clear Decision'}
                  </Badge>
                  <Badge variant="outline">{summary.final_decision?.consensus_level}</Badge>
                </div>
                {summary.final_decision?.decision && (
                  <p className="text-sm text-slate-700">{summary.final_decision.decision}</p>
                )}
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{summary.summary}</p>

              {/* Next Steps */}
              {summary.next_steps && summary.next_steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Recommended Next Steps:</h4>
                  <div className="space-y-2">
                    {summary.next_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Badge className={`${
                          step.priority === 'high' ? 'bg-rose-600' :
                          step.priority === 'medium' ? 'bg-amber-500' :
                          'bg-slate-400'
                        } text-white`}>
                          {step.priority}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-slate-800">{step.action}</p>
                          <p className="text-slate-500">Owner: {step.owner_role.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Close Button */}
          {summary && (
            <Button onClick={onClose} className="w-full">
              Close & View Results
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}