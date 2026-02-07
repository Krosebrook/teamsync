import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Users, CheckCircle2, AlertCircle, Target, GraduationCap } from "lucide-react";
import { toast } from 'sonner';

export default function TeamMemberMatcher({ open, onClose, scenario, selectedRoles, onApplyMatching }) {
  const [matching, setMatching] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compositionObjective, setCompositionObjective] = useState('balanced');
  const [customConstraints, setCustomConstraints] = useState('');

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
    enabled: open
  });

  const generateMatching = async () => {
    if (!teamMembers || teamMembers.length === 0) {
      toast.error('No team members found. Add team members first.');
      return;
    }

    setLoading(true);
    try {
      const objectiveDescriptions = {
        balanced: 'Balanced decision-making with diverse perspectives',
        speed: 'Fast consensus and rapid decision-making',
        diversity: 'Maximum diversity of thought and challenge assumptions',
        minimize_conflict: 'Minimal friction and harmonious collaboration',
        innovation: 'Creative problem-solving and out-of-the-box thinking',
        risk_aware: 'Conservative approach with thorough risk analysis'
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert team composition analyst. Given a scenario and required roles, match available team members to roles for optimal outcomes.

SCENARIO:
${scenario}

REQUIRED ROLES:
${selectedRoles.map(r => `- ${r.role} (Influence: ${r.influence})`).join('\n')}

AVAILABLE TEAM MEMBERS (with performance data):
${JSON.stringify(teamMembers, null, 2)}

TEAM COMPOSITION OBJECTIVE: ${objectiveDescriptions[compositionObjective]}
${customConstraints ? `ADDITIONAL CONSTRAINTS: ${customConstraints}` : ''}

Analyze and provide:
1. Optimal matching prioritizing the stated objective
2. Match score and reasoning for each assignment
3. Potential conflicts or synergies in the proposed team composition
4. Fallback roles/candidates if ideal matches are unavailable (including external hire suggestions if critical gaps exist)
5. Skills gaps or missing perspectives
6. Training/development recommendations based on historical performance and identified gaps
7. Deep integration of performance data - highlight trends and patterns

Consider:
- Skill alignment with role requirements and objective
- Communication styles and personality compatibility
- Historical performance metrics (decision quality, collaboration scores)
- Risk tolerance alignment with scenario needs
- Diversity of perspectives (prioritize if objective requires it)
- Past collaboration history and conflict resolution patterns
- Availability status`,
        response_json_schema: {
          type: "object",
          properties: {
            optimal_matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  matched_member: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" }
                    }
                  },
                  match_score: { type: "number" },
                  reasoning: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } }
                }
              }
            },
            team_dynamics: {
              type: "object",
              properties: {
                synergies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      members: { type: "array", items: { type: "string" } },
                      description: { type: "string" }
                    }
                  }
                },
                conflicts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      members: { type: "array", items: { type: "string" } },
                      description: { type: "string" },
                      severity: { type: "string" }
                    }
                  }
                }
              }
            },
            alternative_compositions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  changes: { type: "array", items: { type: "string" } },
                  rationale: { type: "string" }
                }
              }
            },
            skills_gaps: {
              type: "array",
              items: { type: "string" }
            },
            fallback_options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  fallback_candidate: { type: "string" },
                  reasoning: { type: "string" },
                  trade_offs: { type: "string" },
                  external_hire_needed: { type: "boolean" },
                  suggested_profile: { type: "string" }
                }
              },
              description: "Fallback roles and candidates if ideal matches unavailable"
            },
            training_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  member_name: { type: "string" },
                  role: { type: "string" },
                  identified_gap: { type: "string" },
                  recommended_training: { type: "string" },
                  expected_impact: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              },
              description: "Training and development actions based on performance trends"
            },
            performance_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  member_name: { type: "string" },
                  trend: { type: "string" },
                  strength_areas: { type: "array", items: { type: "string" } },
                  growth_areas: { type: "array", items: { type: "string" } }
                }
              },
              description: "Deep analysis of historical performance data"
            },
            overall_assessment: { type: "string" }
          }
        }
      });

      setMatching(result);
    } catch (error) {
      toast.error('Failed to generate team matching');
      console.error(error);
    }
    setLoading(false);
  };

  const applyMatching = () => {
    if (matching?.optimal_matches) {
      onApplyMatching(matching);
      onClose();
      toast.success('Team composition applied');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            AI Team Member Matching
          </DialogTitle>
          <DialogDescription>
            Match available team members to simulation roles based on skills, personality, and historical performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Team Members Summary */}
          <Card className="p-4 bg-slate-50">
            <p className="text-sm text-slate-700">
              <span className="font-medium">{teamMembers.length}</span> team members available
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedRoles.length} roles to fill in this simulation
            </p>
          </Card>

          {!matching ? (
            <>
              {/* Composition Objectives */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="objective" className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-600" />
                    Team Composition Objective
                  </Label>
                  <Select value={compositionObjective} onValueChange={setCompositionObjective}>
                    <SelectTrigger id="objective">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced Decision-Making</SelectItem>
                      <SelectItem value="speed">Prioritize Speed</SelectItem>
                      <SelectItem value="diversity">Ensure Diversity of Thought</SelectItem>
                      <SelectItem value="minimize_conflict">Minimize Conflict</SelectItem>
                      <SelectItem value="innovation">Maximize Innovation</SelectItem>
                      <SelectItem value="risk_aware">Risk-Aware Composition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="constraints" className="text-sm font-medium mb-2">
                    Additional Constraints (Optional)
                  </Label>
                  <Textarea
                    id="constraints"
                    value={customConstraints}
                    onChange={(e) => setCustomConstraints(e.target.value)}
                    placeholder="e.g., 'Must include at least one remote team member', 'Avoid pairing roles with past conflicts', 'Require expertise in fintech regulations'"
                    className="text-sm h-20 resize-none"
                  />
                </div>
              </div>
            </>
          ) : null}

          {!matching ? (
            <Button
              onClick={generateMatching}
              disabled={loading || teamMembers.length === 0}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Team Composition...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Optimal Team Matching
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Overall Assessment */}
              <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
                <h4 className="font-semibold text-sm text-violet-900 mb-2">Overall Assessment</h4>
                <p className="text-sm text-slate-700">{matching.overall_assessment}</p>
              </Card>

              {/* Optimal Matches */}
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-3">Optimal Team Composition</h4>
                <div className="space-y-3">
                  {matching.optimal_matches.map((match, idx) => {
                    const scoreColor = match.match_score >= 80 ? 'emerald' : match.match_score >= 60 ? 'amber' : 'rose';
                    return (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-slate-800 capitalize">
                                {match.role.replace(/_/g, ' ')}
                              </span>
                              <Badge className={`text-xs bg-${scoreColor}-100 text-${scoreColor}-700`}>
                                {match.match_score}% match
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-violet-600">
                              {match.matched_member.name}
                            </p>
                            <p className="text-xs text-slate-500">{match.matched_member.email}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>

                        <p className="text-sm text-slate-600 mb-3">{match.reasoning}</p>

                        <div className="grid grid-cols-2 gap-3">
                          {match.strengths && match.strengths.length > 0 && (
                            <div className="p-2 bg-emerald-50 rounded">
                              <p className="text-xs font-medium text-emerald-900 mb-1">Strengths:</p>
                              <ul className="space-y-0.5">
                                {match.strengths.map((strength, i) => (
                                  <li key={i} className="text-xs text-emerald-800">• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {match.concerns && match.concerns.length > 0 && (
                            <div className="p-2 bg-amber-50 rounded">
                              <p className="text-xs font-medium text-amber-900 mb-1">Considerations:</p>
                              <ul className="space-y-0.5">
                                {match.concerns.map((concern, i) => (
                                  <li key={i} className="text-xs text-amber-800">• {concern}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Team Dynamics */}
              {(matching.team_dynamics?.synergies?.length > 0 || matching.team_dynamics?.conflicts?.length > 0) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-900">Team Dynamics</h4>
                  
                  {matching.team_dynamics.synergies?.length > 0 && (
                    <Card className="p-3 bg-emerald-50 border-emerald-200">
                      <p className="text-xs font-medium text-emerald-900 mb-2">Expected Synergies:</p>
                      {matching.team_dynamics.synergies.map((synergy, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <p className="text-xs font-medium text-emerald-800">
                            {synergy.members.join(' + ')}
                          </p>
                          <p className="text-xs text-emerald-700">{synergy.description}</p>
                        </div>
                      ))}
                    </Card>
                  )}

                  {matching.team_dynamics.conflicts?.length > 0 && (
                    <Card className="p-3 bg-rose-50 border-rose-200">
                      <p className="text-xs font-medium text-rose-900 mb-2">Potential Conflicts:</p>
                      {matching.team_dynamics.conflicts.map((conflict, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium text-rose-800">
                              {conflict.members.join(' vs ')}
                            </p>
                            <Badge className="text-xs bg-rose-600 text-white">
                              {conflict.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-rose-700">{conflict.description}</p>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              )}

              {/* Skills Gaps */}
              {matching.skills_gaps && matching.skills_gaps.length > 0 && (
                <Card className="p-3 bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-medium text-amber-900">Skills Gaps Identified:</p>
                  </div>
                  <ul className="space-y-1">
                    {matching.skills_gaps.map((gap, idx) => (
                      <li key={idx} className="text-xs text-amber-800">• {gap}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Fallback Options */}
              {matching.fallback_options && matching.fallback_options.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-sm text-blue-900 mb-3">Fallback Options</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Alternative candidates or suggestions if ideal matches are unavailable
                  </p>
                  <div className="space-y-3">
                    {matching.fallback_options.map((fallback, idx) => (
                      <div key={idx} className="p-3 bg-white rounded border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-800 capitalize">
                            {fallback.role.replace(/_/g, ' ')}
                          </span>
                          {fallback.external_hire_needed && (
                            <Badge className="text-xs bg-orange-100 text-orange-700">External Hire Needed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          <strong>Fallback:</strong> {fallback.fallback_candidate}
                        </p>
                        <p className="text-xs text-slate-600 mb-1">{fallback.reasoning}</p>
                        <p className="text-xs text-slate-500 italic">Trade-offs: {fallback.trade_offs}</p>
                        {fallback.suggested_profile && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-xs font-medium text-blue-900 mb-1">Suggested Profile:</p>
                            <p className="text-xs text-blue-800">{fallback.suggested_profile}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Training & Development Recommendations */}
              {matching.training_recommendations && matching.training_recommendations.length > 0 && (
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <h4 className="font-semibold text-sm text-emerald-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Training & Development Recommendations
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Based on performance trends and identified skills gaps
                  </p>
                  <div className="space-y-3">
                    {matching.training_recommendations.map((training, idx) => {
                      const priorityColors = {
                        high: 'bg-rose-600',
                        medium: 'bg-amber-500',
                        low: 'bg-slate-400'
                      };
                      return (
                        <div key={idx} className="p-3 bg-white rounded border border-emerald-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-800">{training.member_name}</span>
                            <Badge className={`text-xs ${priorityColors[training.priority]} text-white`}>
                              {training.priority} priority
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">
                            <strong>Role:</strong> {training.role.replace(/_/g, ' ')}
                          </p>
                          <div className="space-y-2 mt-2">
                            <div className="p-2 bg-amber-50 rounded">
                              <p className="text-xs font-medium text-amber-900">Gap Identified:</p>
                              <p className="text-xs text-amber-800">{training.identified_gap}</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded">
                              <p className="text-xs font-medium text-emerald-900">Recommended Training:</p>
                              <p className="text-xs text-emerald-800">{training.recommended_training}</p>
                            </div>
                            <p className="text-xs text-slate-600">
                              <strong>Expected Impact:</strong> {training.expected_impact}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Performance Insights */}
              {matching.performance_insights && matching.performance_insights.length > 0 && (
                <Card className="p-4 bg-violet-50 border-violet-200">
                  <h4 className="font-semibold text-sm text-violet-900 mb-3">Historical Performance Insights</h4>
                  <div className="space-y-3">
                    {matching.performance_insights.map((insight, idx) => (
                      <div key={idx} className="p-3 bg-white rounded border border-violet-200">
                        <p className="text-sm font-medium text-slate-800 mb-2">{insight.member_name}</p>
                        <p className="text-xs text-slate-600 mb-2">{insight.trend}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {insight.strength_areas && insight.strength_areas.length > 0 && (
                            <div className="p-2 bg-emerald-50 rounded">
                              <p className="text-xs font-medium text-emerald-900 mb-1">Strengths:</p>
                              <ul className="space-y-0.5">
                                {insight.strength_areas.map((area, i) => (
                                  <li key={i} className="text-xs text-emerald-800">✓ {area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {insight.growth_areas && insight.growth_areas.length > 0 && (
                            <div className="p-2 bg-amber-50 rounded">
                              <p className="text-xs font-medium text-amber-900 mb-1">Growth Areas:</p>
                              <ul className="space-y-0.5">
                                {insight.growth_areas.map((area, i) => (
                                  <li key={i} className="text-xs text-amber-800">→ {area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Alternative Compositions */}
              {matching.alternative_compositions && matching.alternative_compositions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Alternative Compositions</h4>
                  <div className="space-y-2">
                    {matching.alternative_compositions.map((alt, idx) => (
                      <Card key={idx} className="p-3 bg-slate-50">
                        <p className="text-sm font-medium text-slate-800 mb-1">{alt.description}</p>
                        <p className="text-xs text-slate-600 mb-2">{alt.rationale}</p>
                        <div className="flex flex-wrap gap-1">
                          {alt.changes.map((change, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {change}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={applyMatching} className="flex-1 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Apply This Team Composition
                </Button>
                <Button onClick={() => setMatching(null)} variant="outline">
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}