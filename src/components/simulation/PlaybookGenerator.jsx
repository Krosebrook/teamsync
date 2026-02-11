import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookOpen, Sparkles, Save, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PlaybookGenerator({ open, onClose, simulation }) {
  const [loading, setLoading] = useState(false);
  const [generatedPlaybook, setGeneratedPlaybook] = useState(null);
  const [playbookName, setPlaybookName] = useState('');
  const [playbookDescription, setPlaybookDescription] = useState('');
  const [orgContext, setOrgContext] = useState({
    decisionFrameworks: '',
    communicationNorms: '',
    roleGuidelines: '',
    culturalValues: ''
  });

  const generatePlaybook = async () => {
    if (!simulation) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating actionable decision-making playbooks based on simulation outcomes. Analyze this simulation and create a comprehensive playbook for handling similar scenarios in the future.

ORGANIZATIONAL CONTEXT:
${orgContext.decisionFrameworks ? `Decision-Making Frameworks: ${orgContext.decisionFrameworks}` : ''}
${orgContext.communicationNorms ? `Communication Norms: ${orgContext.communicationNorms}` : ''}
${orgContext.roleGuidelines ? `Role Guidelines: ${orgContext.roleGuidelines}` : ''}
${orgContext.culturalValues ? `Cultural Values: ${orgContext.culturalValues}` : ''}

CRITICAL: Tailor ALL recommendations to align with the organization's existing frameworks, norms, and values described above. Use their terminology, reference their processes, and adapt strategies to fit their culture.

SIMULATION SCENARIO:
${simulation.scenario}

USE CASE TYPE: ${simulation.use_case_type || 'custom'}

ROLE RESPONSES:
${JSON.stringify(simulation.responses, null, 2)}

DETECTED TENSIONS:
${JSON.stringify(simulation.tensions, null, 2)}

IDENTIFIED TRADE-OFFS:
${JSON.stringify(simulation.decision_trade_offs, null, 2)}

NEXT STEPS:
${JSON.stringify(simulation.next_steps, null, 2)}

SUMMARY:
${simulation.summary}

Generate a comprehensive, actionable playbook that ALIGNS WITH THE ORGANIZATION'S CONTEXT and includes:

1. PLAYBOOK METADATA:
   - Name: Clear, descriptive title
   - Description: When to use this playbook (1-2 sentences)
   - Applicable Scenarios: List of scenario types where this applies
   - Decision Framework: What framework best fits (DACI, RACI, Pre-mortem, etc.)

2. KEY INSIGHTS FROM THIS SIMULATION:
   - What worked well in the team composition
   - What tensions emerged and why
   - Critical trade-offs that had to be navigated
   - Patterns in how different roles approached the decision

3. BEST PRACTICES FOR SIMILAR SCENARIOS:
   - Pre-Decision Phase: What to do before making the decision
   - During Discussion: How to facilitate the conversation
   - Post-Decision: Follow-up actions and validation

4. TENSION RESOLUTION STRATEGIES:
   For each major tension type that emerged, provide:
   - Recognition signs: How to spot this tension early
   - Root cause: Why this tension typically occurs
   - Resolution approach: Specific steps to resolve it
   - Prevention tactics: How to minimize it in future

5. TRADE-OFF NAVIGATION GUIDE:
   For each major trade-off, provide:
   - Evaluation criteria: How to assess each option
   - Decision matrix: Factors to weigh
   - Recommended approach: When to favor which option
   - Compromise strategies: How to find middle ground

6. ROLE REQUIREMENTS & DYNAMICS:
   - Essential roles for this type of decision
   - Optional but beneficial roles
   - Role influence recommendations
   - Roles that typically align vs conflict
   - How to leverage high-influence roles

7. COMMUNICATION GUIDELINES:
   - How to frame the decision to different stakeholders (using organization's communication norms)
   - Key talking points for alignment (using organization's terminology)
   - How to handle objections from specific roles (aligned with cultural values)
   - Escalation paths when consensus fails (following organization's processes)

8. SUCCESS METRICS & VALIDATION:
   - How to measure if the decision was right
   - Timeline for validation checkpoints
   - Warning signs that indicate course correction needed

9. LESSONS LEARNED TEMPLATE:
   - Questions to ask post-decision
   - Data to track for future reference
   - Continuous improvement opportunities

10. PRACTICAL CHECKLIST:
    - Pre-meeting checklist (5-7 items)
    - During-meeting checklist (5-7 items)
    - Post-meeting checklist (5-7 items)

Make everything ACTIONABLE and SPECIFIC. Avoid generic advice. Base recommendations on the actual patterns observed in this simulation.

If organizational context was provided, ensure the playbook:
- Uses the organization's existing decision-making frameworks as the foundation
- Follows their communication norms and uses their terminology
- Respects their role guidelines and cultural values
- References their specific processes rather than generic best practices
- Feels native to their organization, not generic consulting advice`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            applicable_scenarios: { type: "array", items: { type: "string" } },
            framework: { 
              type: "string",
              enum: ["daci", "raci", "six_thinking_hats", "pre_mortem", "post_mortem", "swot", "cost_benefit", "ooda", "custom"]
            },
            key_insights: {
              type: "object",
              properties: {
                team_composition_strengths: { type: "array", items: { type: "string" } },
                emergent_tensions: { type: "array", items: { type: "string" } },
                critical_tradeoffs: { type: "array", items: { type: "string" } },
                role_patterns: { type: "array", items: { type: "string" } }
              }
            },
            best_practices: {
              type: "object",
              properties: {
                pre_decision: { type: "array", items: { type: "string" } },
                during_discussion: { type: "array", items: { type: "string" } },
                post_decision: { type: "array", items: { type: "string" } }
              }
            },
            tension_resolution_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tension_type: { type: "string" },
                  recognition_signs: { type: "array", items: { type: "string" } },
                  root_cause: { type: "string" },
                  resolution_steps: { type: "array", items: { type: "string" } },
                  prevention_tactics: { type: "array", items: { type: "string" } }
                }
              }
            },
            tradeoff_navigation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tradeoff_name: { type: "string" },
                  evaluation_criteria: { type: "array", items: { type: "string" } },
                  decision_factors: { type: "array", items: { type: "string" } },
                  recommended_approach: { type: "string" },
                  compromise_strategies: { type: "array", items: { type: "string" } }
                }
              }
            },
            role_requirements: {
              type: "object",
              properties: {
                essential_roles: { type: "array", items: { type: "string" } },
                optional_roles: { type: "array", items: { type: "string" } },
                influence_recommendations: { type: "array", items: { type: "string" } },
                alignment_patterns: { type: "array", items: { type: "string" } },
                conflict_patterns: { type: "array", items: { type: "string" } }
              }
            },
            communication_guidelines: {
              type: "object",
              properties: {
                framing_strategies: { type: "array", items: { type: "string" } },
                key_talking_points: { type: "array", items: { type: "string" } },
                objection_handling: { type: "array", items: { type: "string" } },
                escalation_paths: { type: "array", items: { type: "string" } }
              }
            },
            success_metrics: {
              type: "object",
              properties: {
                measurement_criteria: { type: "array", items: { type: "string" } },
                validation_timeline: { type: "array", items: { type: "string" } },
                warning_signs: { type: "array", items: { type: "string" } }
              }
            },
            lessons_learned_template: {
              type: "object",
              properties: {
                post_decision_questions: { type: "array", items: { type: "string" } },
                data_to_track: { type: "array", items: { type: "string" } },
                improvement_opportunities: { type: "array", items: { type: "string" } }
              }
            },
            practical_checklist: {
              type: "object",
              properties: {
                pre_meeting: { type: "array", items: { type: "string" } },
                during_meeting: { type: "array", items: { type: "string" } },
                post_meeting: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setGeneratedPlaybook(result);
      setPlaybookName(result.name);
      setPlaybookDescription(result.description);
      toast.success('Playbook generated successfully');
    } catch (error) {
      toast.error('Failed to generate playbook');
      console.error(error);
    }
    setLoading(false);
  };

  const savePlaybook = async () => {
    if (!generatedPlaybook || !playbookName.trim()) {
      toast.error('Playbook name is required');
      return;
    }

    try {
      await base44.entities.DecisionPlaybook.create({
        name: playbookName,
        framework: generatedPlaybook.framework,
        description: playbookDescription || generatedPlaybook.description,
        required_roles: generatedPlaybook.role_requirements?.essential_roles?.map(role => ({
          role: role,
          framework_position: 'participant'
        })) || [],
        steps: [
          {
            order: 1,
            name: 'Pre-Decision Phase',
            description: 'Preparation and context gathering',
            prompts: generatedPlaybook.best_practices?.pre_decision || []
          },
          {
            order: 2,
            name: 'Discussion Phase',
            description: 'Facilitated team discussion',
            prompts: generatedPlaybook.best_practices?.during_discussion || []
          },
          {
            order: 3,
            name: 'Post-Decision Phase',
            description: 'Follow-up and validation',
            prompts: generatedPlaybook.best_practices?.post_decision || []
          }
        ],
        output_template: JSON.stringify(generatedPlaybook, null, 2)
      });

      toast.success('Playbook saved');
      onClose();
    } catch (error) {
      toast.error('Failed to save playbook');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            AI Playbook Generator
          </DialogTitle>
        </DialogHeader>

        {!generatedPlaybook ? (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Generate an actionable playbook based on this simulation's outcomes. Provide your organization's context
              to create a playbook that aligns with your existing frameworks and culture.
            </p>

            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
              <h3 className="font-semibold text-sm text-slate-900 mb-3">
                Organizational Context (Optional but Recommended)
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Decision-Making Frameworks</Label>
                  <Textarea
                    placeholder="e.g., 'We use DACI for major decisions, Amazon's two-way door framework for reversible decisions, and require written memos before meetings'"
                    value={orgContext.decisionFrameworks}
                    onChange={(e) => setOrgContext({...orgContext, decisionFrameworks: e.target.value})}
                    className="h-16 resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Communication Norms</Label>
                  <Textarea
                    placeholder="e.g., 'Direct communication preferred, written async-first culture, use Slack for quick decisions, Notion for documentation'"
                    value={orgContext.communicationNorms}
                    onChange={(e) => setOrgContext({...orgContext, communicationNorms: e.target.value})}
                    className="h-16 resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Role Guidelines & Responsibilities</Label>
                  <Textarea
                    placeholder="e.g., 'PMs own product decisions, Eng leads own technical decisions, VP approval needed for >$50k spend, Customer Success has veto power on customer-facing changes'"
                    value={orgContext.roleGuidelines}
                    onChange={(e) => setOrgContext({...orgContext, roleGuidelines: e.target.value})}
                    className="h-16 resize-none text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cultural Values & Principles</Label>
                  <Textarea
                    placeholder="e.g., 'Customer obsession, bias for action, disagree and commit, data-driven decisions, strong opinions loosely held'"
                    value={orgContext.culturalValues}
                    onChange={(e) => setOrgContext({...orgContext, culturalValues: e.target.value})}
                    className="h-16 resize-none text-sm"
                  />
                </div>
              </div>
            </Card>
            
            <Button
              onClick={generatePlaybook}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Simulation & Generating Personalized Playbook...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Personalized Playbook
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Editable Metadata */}
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
              <div className="space-y-3">
                <div>
                  <Label>Playbook Name</Label>
                  <Input
                    value={playbookName}
                    onChange={(e) => setPlaybookName(e.target.value)}
                    placeholder="e.g., SaaS Pricing Decision Playbook"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={playbookDescription}
                    onChange={(e) => setPlaybookDescription(e.target.value)}
                    placeholder="When to use this playbook..."
                    className="h-20 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white">
                    {generatedPlaybook.framework}
                  </Badge>
                  <span className="text-xs text-slate-500">Decision Framework</span>
                </div>
              </div>
            </Card>

            {/* Applicable Scenarios */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-slate-900 mb-2">Applicable Scenarios</h3>
              <div className="flex flex-wrap gap-1">
                {generatedPlaybook.applicable_scenarios?.map((scenario, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{scenario}</Badge>
                ))}
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Key Insights from This Simulation
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-slate-700 mb-1">Team Composition Strengths</p>
                  <ul className="space-y-1">
                    {generatedPlaybook.key_insights?.team_composition_strengths?.map((item, i) => (
                      <li key={i} className="text-slate-600">✓ {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-700 mb-1">Role Patterns</p>
                  <ul className="space-y-1">
                    {generatedPlaybook.key_insights?.role_patterns?.map((item, i) => (
                      <li key={i} className="text-slate-600">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Best Practices */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-slate-900 mb-3">Best Practices</h3>
              <div className="space-y-3">
                {['pre_decision', 'during_discussion', 'post_decision'].map(phase => (
                  <div key={phase} className="p-3 bg-slate-50 rounded">
                    <p className="text-xs font-semibold text-slate-800 mb-2 uppercase">
                      {phase.replace(/_/g, ' ')}
                    </p>
                    <ul className="space-y-1">
                      {generatedPlaybook.best_practices?.[phase]?.map((item, i) => (
                        <li key={i} className="text-xs text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tension Resolution Strategies */}
            {generatedPlaybook.tension_resolution_strategies?.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Tension Resolution Strategies
                </h3>
                <div className="space-y-3">
                  {generatedPlaybook.tension_resolution_strategies.map((strategy, idx) => (
                    <div key={idx} className="p-3 border border-rose-200 rounded bg-rose-50">
                      <p className="font-semibold text-sm text-rose-900 mb-2">{strategy.tension_type}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Recognition Signs:</p>
                          <ul className="space-y-0.5">
                            {strategy.recognition_signs?.map((sign, i) => (
                              <li key={i} className="text-slate-600">→ {sign}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Resolution Steps:</p>
                          <ul className="space-y-0.5">
                            {strategy.resolution_steps?.map((step, i) => (
                              <li key={i} className="text-slate-600">{i + 1}. {step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 mt-2">
                        <strong>Root Cause:</strong> {strategy.root_cause}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Trade-off Navigation */}
            {generatedPlaybook.tradeoff_navigation?.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Trade-off Navigation Guide</h3>
                <div className="space-y-3">
                  {generatedPlaybook.tradeoff_navigation.map((tradeoff, idx) => (
                    <div key={idx} className="p-3 border border-amber-200 rounded bg-amber-50">
                      <p className="font-semibold text-sm text-amber-900 mb-2">{tradeoff.tradeoff_name}</p>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Evaluation Criteria:</p>
                          <div className="flex flex-wrap gap-1">
                            {tradeoff.evaluation_criteria?.map((criteria, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{criteria}</Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-700">
                          <strong>Recommended Approach:</strong> {tradeoff.recommended_approach}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Role Requirements */}
            {generatedPlaybook.role_requirements && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Role Requirements & Dynamics</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Essential Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {generatedPlaybook.role_requirements.essential_roles?.map((role, i) => (
                        <Badge key={i} className="bg-emerald-600 text-white text-xs">{role}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Optional Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {generatedPlaybook.role_requirements.optional_roles?.map((role, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{role}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {generatedPlaybook.role_requirements.alignment_patterns?.length > 0 && (
                    <div className="p-2 bg-emerald-50 rounded">
                      <p className="text-xs font-medium text-emerald-900 mb-1">Typical Alignments:</p>
                      <ul className="space-y-0.5">
                        {generatedPlaybook.role_requirements.alignment_patterns.map((item, i) => (
                          <li key={i} className="text-xs text-slate-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {generatedPlaybook.role_requirements.conflict_patterns?.length > 0 && (
                    <div className="p-2 bg-rose-50 rounded">
                      <p className="text-xs font-medium text-rose-900 mb-1">Typical Conflicts:</p>
                      <ul className="space-y-0.5">
                        {generatedPlaybook.role_requirements.conflict_patterns.map((item, i) => (
                          <li key={i} className="text-xs text-slate-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Practical Checklist */}
            {generatedPlaybook.practical_checklist && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Practical Checklist
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {['pre_meeting', 'during_meeting', 'post_meeting'].map(phase => (
                    <div key={phase} className="p-2 bg-slate-50 rounded">
                      <p className="font-semibold text-slate-800 mb-2 uppercase text-xs">
                        {phase.replace(/_/g, ' ')}
                      </p>
                      <ul className="space-y-1">
                        {generatedPlaybook.practical_checklist[phase]?.map((item, i) => (
                          <li key={i} className="text-slate-700 flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Success Metrics */}
            {generatedPlaybook.success_metrics && (
              <Card className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Success Metrics & Validation</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Measurement Criteria:</p>
                    <ul className="space-y-0.5">
                      {generatedPlaybook.success_metrics.measurement_criteria?.map((item, i) => (
                        <li key={i} className="text-slate-600">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Warning Signs:</p>
                    <ul className="space-y-0.5">
                      {generatedPlaybook.success_metrics.warning_signs?.map((item, i) => (
                        <li key={i} className="text-rose-700">⚠ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={savePlaybook} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                Save Playbook
              </Button>
              <Button onClick={() => setGeneratedPlaybook(null)} variant="outline">
                Generate New
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}