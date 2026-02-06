import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from 'sonner';

export default function TeamMemberMatcher({ open, onClose, scenario, selectedRoles, onApplyMatching }) {
  const [matching, setMatching] = useState(null);
  const [loading, setLoading] = useState(false);

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
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert team composition analyst. Given a scenario and required roles, match available team members to roles for optimal outcomes.

SCENARIO:
${scenario}

REQUIRED ROLES:
${selectedRoles.map(r => `- ${r.role} (Influence: ${r.influence})`).join('\n')}

AVAILABLE TEAM MEMBERS:
${JSON.stringify(teamMembers, null, 2)}

Analyze and provide:
1. Optimal matching of team members to required roles
2. Match score and reasoning for each assignment
3. Potential conflicts or synergies in the proposed team composition
4. Alternative compositions if certain combinations are risky
5. Skills gaps or missing perspectives

Consider:
- Skill alignment with role requirements
- Communication styles and personality compatibility
- Historical performance and risk tolerance
- Diversity of perspectives
- Past collaboration history`,
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