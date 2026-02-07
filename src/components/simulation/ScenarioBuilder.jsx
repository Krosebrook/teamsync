import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Zap, AlertTriangle, DollarSign, Users, Calendar } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const INDUSTRY_FOCUS = [
  { value: 'fintech', label: 'Fintech / Financial Services' },
  { value: 'healthcare', label: 'Healthcare / MedTech' },
  { value: 'saas', label: 'B2B SaaS' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'enterprise', label: 'Enterprise Software' },
  { value: 'consumer', label: 'Consumer Tech' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'manufacturing', label: 'Manufacturing / Industrial' },
  { value: 'education', label: 'EdTech / Education' },
  { value: 'energy', label: 'Energy / CleanTech' }
];

const CONFLICT_TYPES = [
  { value: 'ethical_dilemma', label: 'Ethical Dilemma', icon: AlertTriangle, description: 'Moral conflicts between business needs and ethical concerns' },
  { value: 'resource_scarcity', label: 'Resource Scarcity', icon: DollarSign, description: 'Limited budget, time, or personnel constraints' },
  { value: 'technical_debt', label: 'Technical Debt', icon: Zap, description: 'Short-term solutions vs long-term architecture' },
  { value: 'stakeholder_conflict', label: 'Stakeholder Conflict', icon: Users, description: 'Competing interests from different stakeholders' },
  { value: 'time_pressure', label: 'Time Pressure', icon: Calendar, description: 'Urgent deadlines forcing rushed decisions' },
  { value: 'quality_speed', label: 'Quality vs Speed', icon: Zap, description: 'Trade-off between thoroughness and velocity' }
];

const STAKEHOLDER_PRESSURES = [
  'Investor demands for faster growth',
  'Board pressure to reduce costs',
  'Customer escalations requiring immediate response',
  'Regulatory compliance deadlines',
  'Competitive threats requiring quick action',
  'Team burnout and retention concerns',
  'Technical infrastructure at capacity',
  'Market shift requiring pivot'
];

export default function ScenarioBuilder({ open, onOpenChange, onScenarioGenerated, allRoles }) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    industry: 'saas',
    conflictTypes: [],
    stakeholderPressures: [],
    customPressure: '',
    companyStage: 'series_b',
    teamSize: 'medium',
    decisionUrgency: 'moderate',
    additionalContext: ''
  });

  const toggleConflictType = (type) => {
    setParams(prev => ({
      ...prev,
      conflictTypes: prev.conflictTypes.includes(type)
        ? prev.conflictTypes.filter(t => t !== type)
        : [...prev.conflictTypes, type]
    }));
  };

  const togglePressure = (pressure) => {
    setParams(prev => ({
      ...prev,
      stakeholderPressures: prev.stakeholderPressures.includes(pressure)
        ? prev.stakeholderPressures.filter(p => p !== pressure)
        : [...prev.stakeholderPressures, pressure]
    }));
  };

  const addCustomPressure = () => {
    if (params.customPressure.trim()) {
      setParams(prev => ({
        ...prev,
        stakeholderPressures: [...prev.stakeholderPressures, prev.customPressure.trim()],
        customPressure: ''
      }));
    }
  };

  const generateScenario = async () => {
    if (params.conflictTypes.length === 0) {
      toast.error('Select at least one conflict type');
      return;
    }

    setLoading(true);
    try {
      const availableRoles = allRoles?.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description
      })) || [];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating complex, realistic decision simulation scenarios with specific parameters.

SCENARIO PARAMETERS:
- Industry: ${INDUSTRY_FOCUS.find(i => i.value === params.industry)?.label}
- Conflict Types: ${params.conflictTypes.map(ct => CONFLICT_TYPES.find(c => c.value === ct)?.label).join(', ')}
- Stakeholder Pressures: ${params.stakeholderPressures.join(', ')}
- Company Stage: ${params.companyStage}
- Team Size: ${params.teamSize}
- Decision Urgency: ${params.decisionUrgency}
${params.additionalContext ? `- Additional Context: ${params.additionalContext}` : ''}

AVAILABLE ROLES:
${JSON.stringify(availableRoles, null, 2)}

Generate a highly detailed and complex simulation scenario that incorporates ALL specified conflict types and stakeholder pressures:

1. SCENARIO TITLE: Catchy, specific title reflecting the core dilemma

2. RICH SCENARIO (6-8 paragraphs):
   - Opening paragraph: Set the scene with company context, market position, recent events
   - Problem statement: Clearly articulate the decision that needs to be made
   - Conflict integration: Weave in ALL specified conflict types naturally
   - Stakeholder pressures: Explicitly mention each selected pressure with concrete implications
   - Data points: Include specific numbers (revenue, users, timeline, budget, team size, market share, etc.)
   - Realistic challenges: Technical constraints, competitive dynamics, internal politics
   - Urgency justification: Why this decision can't wait based on ${params.decisionUrgency} urgency
   - Stakes: What happens if they get this wrong vs right

3. SPECIFIC DATA POINTS (all quantified):
   - Financial metrics (ARR, burn rate, runway, budget for this initiative)
   - Timeline constraints (specific dates, quarters, or week counts)
   - Resource constraints (team headcount, available budget, technical capacity)
   - Market metrics (TAM, market share, competitor positions)
   - Customer/user metrics (count, churn rate, NPS, key accounts)
   - Technical metrics (system load, technical debt hours, incident rates)

4. KEY STAKEHOLDER PRESSURES (map each to specific demands):
   For each selected pressure, provide:
   - Who is applying the pressure
   - What they're demanding specifically
   - Why it matters to them
   - Deadline or urgency level

5. REALISTIC CHALLENGES (3-5 specific obstacles):
   - Technical limitations or constraints
   - Resource constraints (budget, people, time)
   - Organizational/political dynamics
   - Market or competitive pressures
   - Regulatory or compliance considerations

6. BALANCED ROLE SELECTION (8-12 roles for effective decision-making):
   - Select roles that will create productive tension and debate
   - Ensure diverse perspectives: technical, business, customer-facing, operational
   - Include roles that will advocate for different conflict resolution approaches
   - Balance senior leadership with operational expertise
   - Include at least one role that will challenge assumptions
   - Provide influence levels based on their relevance to this specific decision
   - Explain why each role is critical for THIS scenario

7. EXPECTED DECISION DYNAMICS:
   - Which roles will likely align
   - Which roles will conflict and why
   - Key trade-offs the team will need to navigate
   - Potential blindspots if certain perspectives are missing`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            scenario: { type: "string", description: "6-8 paragraph detailed scenario" },
            industry: { type: "string" },
            use_case_type: {
              type: "string",
              enum: ["pre_mortem", "roadmap", "adr", "pmf_validation", "tech_debt", "post_mortem", "hiring", "build_buy", "migration", "customer_escalation", "custom"]
            },
            data_points: {
              type: "object",
              properties: {
                financial: {
                  type: "object",
                  properties: {
                    arr: { type: "string" },
                    burn_rate: { type: "string" },
                    runway: { type: "string" },
                    initiative_budget: { type: "string" }
                  }
                },
                timeline: {
                  type: "object",
                  properties: {
                    deadline: { type: "string" },
                    phases: { type: "array", items: { type: "string" } }
                  }
                },
                resources: {
                  type: "object",
                  properties: {
                    team_size: { type: "string" },
                    available_headcount: { type: "string" },
                    technical_capacity: { type: "string" }
                  }
                },
                market: {
                  type: "object",
                  properties: {
                    tam: { type: "string" },
                    market_share: { type: "string" },
                    competitor_positions: { type: "array", items: { type: "string" } }
                  }
                },
                customers: {
                  type: "object",
                  properties: {
                    total_count: { type: "string" },
                    churn_rate: { type: "string" },
                    nps: { type: "string" },
                    key_accounts_at_risk: { type: "string" }
                  }
                }
              }
            },
            stakeholder_demands: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stakeholder: { type: "string" },
                  demand: { type: "string" },
                  why_it_matters: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            challenges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  challenge: { type: "string" },
                  impact: { type: "string" },
                  constraint_type: { type: "string" }
                }
              }
            },
            recommended_roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_id: { type: "string" },
                  role_name: { type: "string" },
                  influence: { type: "number" },
                  why_critical: { type: "string" },
                  expected_position: { type: "string" }
                }
              }
            },
            decision_dynamics: {
              type: "object",
              properties: {
                expected_alignments: { type: "array", items: { type: "string" } },
                expected_conflicts: { type: "array", items: { type: "string" } },
                key_tradeoffs: { type: "array", items: { type: "string" } },
                potential_blindspots: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      onScenarioGenerated(result);
      onOpenChange(false);
      toast.success('Complex scenario generated');
    } catch (error) {
      toast.error('Failed to generate scenario');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Advanced Scenario Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Industry Focus */}
          <div>
            <Label>Industry Focus</Label>
            <Select value={params.industry} onValueChange={(v) => setParams({...params, industry: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_FOCUS.map(ind => (
                  <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conflict Types */}
          <div>
            <Label className="mb-3 block">Conflict Types (select 1-3)</Label>
            <div className="grid grid-cols-2 gap-2">
              {CONFLICT_TYPES.map(conflict => {
                const Icon = conflict.icon;
                const isSelected = params.conflictTypes.includes(conflict.value);
                return (
                  <Card
                    key={conflict.value}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleConflictType(conflict.value)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-violet-600' : 'text-slate-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-violet-900' : 'text-slate-800'}`}>
                          {conflict.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{conflict.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {params.conflictTypes.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Selected: {params.conflictTypes.length} conflict type(s)
              </p>
            )}
          </div>

          {/* Stakeholder Pressures */}
          <div>
            <Label className="mb-3 block">Stakeholder Pressures (select multiple)</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {STAKEHOLDER_PRESSURES.map(pressure => {
                const isSelected = params.stakeholderPressures.includes(pressure);
                return (
                  <div
                    key={pressure}
                    className={`p-2 rounded border cursor-pointer text-sm transition-all ${
                      isSelected ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => togglePressure(pressure)}
                  >
                    {pressure}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add custom pressure..."
                value={params.customPressure}
                onChange={(e) => setParams({...params, customPressure: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && addCustomPressure()}
                className="text-sm"
              />
              <Button size="sm" onClick={addCustomPressure} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {/* Company Context */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Company Stage</Label>
              <Select value={params.companyStage} onValueChange={(v) => setParams({...params, companyStage: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series_a">Series A</SelectItem>
                  <SelectItem value="series_b">Series B</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Team Size</Label>
              <Select value={params.teamSize} onValueChange={(v) => setParams({...params, teamSize: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (10-50)</SelectItem>
                  <SelectItem value="medium">Medium (50-200)</SelectItem>
                  <SelectItem value="large">Large (200+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Decision Urgency</Label>
              <Select value={params.decisionUrgency} onValueChange={(v) => setParams({...params, decisionUrgency: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (weeks)</SelectItem>
                  <SelectItem value="moderate">Moderate (days)</SelectItem>
                  <SelectItem value="high">High (hours)</SelectItem>
                  <SelectItem value="critical">Critical (immediate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Context */}
          <div>
            <Label>Additional Context (Optional)</Label>
            <Textarea
              placeholder="Any specific details you want in the scenario (e.g., 'The CEO just returned from a board meeting', 'A major competitor just launched', 'Key engineer threatening to quit')"
              value={params.additionalContext}
              onChange={(e) => setParams({...params, additionalContext: e.target.value})}
              className="h-20 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateScenario}
            disabled={loading || params.conflictTypes.length === 0}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Complex Scenario...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Detailed Scenario
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}