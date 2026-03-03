import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Users, Target, Zap, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ALIGNMENT_COLORS = {
  high: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-rose-700 bg-rose-50 border-rose-200',
};

const CONFIDENCE_COLOR = (score) => {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

function ImpactItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = item.direction === 'positive';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div className={`p-3 rounded-lg border text-sm ${isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
        <div className="flex-1">
          <span className="font-medium text-slate-800">{item.area}</span>
          <span className="ml-2 text-xs text-slate-500">({item.timeframe})</span>
        </div>
        <Badge className={`text-xs border shrink-0 ${isPositive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
          {item.magnitude}
        </Badge>
        {item.details && (expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />)}
      </div>
      {expanded && item.details && (
        <p className="text-xs text-slate-600 mt-2 pl-6">{item.details}</p>
      )}
    </div>
  );
}

export default function OutcomePrediction({ open, onClose, scenario, selectedRoles, environmentalFactors = [], allRoles = [] }) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const getRoleName = (roleId) => {
    const role = allRoles.find(r => r.id === roleId);
    return role?.name || roleId;
  };

  const generatePrediction = async () => {
    if (!scenario?.trim() || selectedRoles.length < 2) {
      toast.error('Add a scenario and at least 2 roles first');
      return;
    }
    setLoading(true);
    try {
      const roleList = selectedRoles.map(r => `${getRoleName(r.role)} (influence: ${r.influence}/10)`).join(', ');
      const envList = environmentalFactors.length > 0
        ? environmentalFactors.map(f => `[${f.category} | ${f.impact} impact | ${f.drift}] ${f.name}${f.current_state ? ': ' + f.current_state : ''}`).join('\n')
        : 'None defined';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert organizational decision-intelligence system. Analyze the following simulation setup and predict the most likely outcomes BEFORE the simulation is run.

SCENARIO:
${scenario}

PARTICIPATING ROLES & INFLUENCE:
${roleList}

ENVIRONMENTAL FACTORS:
${envList}

Generate a detailed outcome prediction covering:

1. TEAM ALIGNMENT FORECAST
   - Overall alignment level (high/medium/low)
   - Which roles will likely align and why
   - Which roles will likely diverge and why
   - Predicted alignment score (0-100)

2. PREDICTED KEY DECISIONS
   - The 3-5 most likely decisions the team will converge on
   - For each: the decision, confidence that it will be made (0-100), and primary driver role

3. ANTICIPATED TENSIONS
   - The top 3 role conflicts most likely to emerge
   - Severity prediction for each

4. PROBABLE IMPACTS
   - 4-6 probable outcomes/impacts of this decision-making process
   - For each: area affected, direction (positive/negative), magnitude (minor/moderate/major/critical), timeframe (immediate/short-term/long-term), and details

5. RISK FACTORS
   - 3-5 key risks that could derail or complicate the process
   - Likelihood (low/medium/high) and mitigation suggestion for each

6. OVERALL PREDICTION CONFIDENCE
   - A score (0-100) reflecting how predictable this scenario is given the role mix and environmental context
   - A 2-3 sentence rationale

Be specific and grounded. Reference actual role names and environmental factors in your analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            alignment: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["high", "medium", "low"] },
                score: { type: "number" },
                aligned_roles: { type: "array", items: { type: "string" } },
                diverging_roles: { type: "array", items: { type: "string" } },
                rationale: { type: "string" }
              }
            },
            predicted_decisions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  confidence: { type: "number" },
                  primary_driver: { type: "string" },
                  supporting_roles: { type: "array", items: { type: "string" } }
                }
              }
            },
            anticipated_tensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  roles: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
                }
              }
            },
            probable_impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  direction: { type: "string", enum: ["positive", "negative"] },
                  magnitude: { type: "string", enum: ["minor", "moderate", "major", "critical"] },
                  timeframe: { type: "string", enum: ["immediate", "short-term", "long-term"] },
                  details: { type: "string" }
                }
              }
            },
            risk_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  likelihood: { type: "string", enum: ["low", "medium", "high"] },
                  mitigation: { type: "string" }
                }
              }
            },
            overall_confidence: { type: "number" },
            confidence_rationale: { type: "string" }
          }
        }
      });

      setPrediction(result);
    } catch (err) {
      toast.error('Failed to generate prediction');
      console.error(err);
    }
    setLoading(false);
  };

  const severityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const likelihoodColors = {
    low: 'text-slate-500',
    medium: 'text-amber-600',
    high: 'text-rose-600',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            AI Outcome Prediction
          </DialogTitle>
        </DialogHeader>

        {!prediction ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Before running the simulation, get an AI-powered forecast of likely team alignment, key decisions,
              tensions, and probable impacts based on the current scenario, roles, and environmental factors.
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <Card className="p-3 bg-slate-50">
                <p className="text-slate-500 mb-1">Roles analyzed</p>
                <p className="font-semibold text-slate-800 text-base">{selectedRoles.length}</p>
              </Card>
              <Card className="p-3 bg-slate-50">
                <p className="text-slate-500 mb-1">Environmental factors</p>
                <p className="font-semibold text-slate-800 text-base">{environmentalFactors.length}</p>
              </Card>
              <Card className="p-3 bg-slate-50">
                <p className="text-slate-500 mb-1">Scenario defined</p>
                <p className="font-semibold text-slate-800 text-base">{scenario?.trim() ? '✓' : '✗'}</p>
              </Card>
            </div>

            <Button
              onClick={generatePrediction}
              disabled={loading || !scenario?.trim() || selectedRoles.length < 2}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Predicting outcomes...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Outcome Prediction</>
              )}
            </Button>
            {selectedRoles.length < 2 && (
              <p className="text-xs text-slate-400 text-center">Add at least 2 roles to generate a prediction.</p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Overall Confidence */}
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">Prediction Confidence</span>
                <span className="text-2xl font-bold text-violet-700">{prediction.overall_confidence}%</span>
              </div>
              <Progress value={prediction.overall_confidence} className="h-2 mb-2" indicatorClassName={CONFIDENCE_COLOR(prediction.overall_confidence)} />
              <p className="text-xs text-slate-500">{prediction.confidence_rationale}</p>
            </Card>

            {/* Team Alignment */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm">Team Alignment Forecast</h3>
                <Badge className={`text-xs border ml-auto ${ALIGNMENT_COLORS[prediction.alignment?.level] || ALIGNMENT_COLORS.medium}`}>
                  {prediction.alignment?.level} alignment
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Progress value={prediction.alignment?.score} className="flex-1 h-2" />
                <span className="text-sm font-semibold text-slate-700 w-10 text-right">{prediction.alignment?.score}%</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{prediction.alignment?.rationale}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {prediction.alignment?.aligned_roles?.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1 font-medium">Likely to align</p>
                    <div className="flex flex-wrap gap-1">
                      {prediction.alignment.aligned_roles.map((r, i) => (
                        <Badge key={i} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {prediction.alignment?.diverging_roles?.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1 font-medium">Likely to diverge</p>
                    <div className="flex flex-wrap gap-1">
                      {prediction.alignment.diverging_roles.map((r, i) => (
                        <Badge key={i} className="bg-rose-100 text-rose-700 border-rose-200 text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Predicted Key Decisions */}
            {prediction.predicted_decisions?.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Predicted Key Decisions</h3>
                </div>
                <div className="space-y-3">
                  {prediction.predicted_decisions.map((d, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 font-medium">{d.decision}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-500">Driver: <span className="font-medium text-slate-700">{d.primary_driver}</span></span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-500">Confidence:</span>
                            <Progress value={d.confidence} className="w-16 h-1.5" />
                            <span className="text-xs font-semibold text-slate-700">{d.confidence}%</span>
                          </div>
                          {d.supporting_roles?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {d.supporting_roles.map((r, j) => (
                                <Badge key={j} variant="outline" className="text-xs h-4 px-1">{r}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Anticipated Tensions */}
            {prediction.anticipated_tensions?.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <h3 className="font-semibold text-sm">Anticipated Tensions</h3>
                </div>
                <div className="space-y-2">
                  {prediction.anticipated_tensions.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                      <Badge className={`text-xs border shrink-0 ${severityColors[t.severity]}`}>{t.severity}</Badge>
                      <div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {t.roles?.map((r, j) => (
                            <span key={j} className="text-xs font-semibold text-slate-700">{r}{j < t.roles.length - 1 ? ' ⟷' : ''}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Probable Impacts */}
            {prediction.probable_impacts?.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  <h3 className="font-semibold text-sm">Probable Impacts</h3>
                </div>
                <div className="space-y-2">
                  {prediction.probable_impacts.map((item, i) => (
                    <ImpactItem key={i} item={item} />
                  ))}
                </div>
              </Card>
            )}

            {/* Risk Factors */}
            {prediction.risk_factors?.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="font-semibold text-sm">Risk Factors</h3>
                </div>
                <div className="space-y-2">
                  {prediction.risk_factors.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-semibold uppercase ${likelihoodColors[r.likelihood]}`}>{r.likelihood}</span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{r.risk}</p>
                          {r.mitigation && (
                            <p className="text-xs text-slate-500 mt-1"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setPrediction(null)} className="flex-1">
                Regenerate
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close & Run Simulation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}