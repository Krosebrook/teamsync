import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Save, FileText, Edit2, Plus, X } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function TemplateGenerator({ open, onOpenChange, onApplyTemplate, allRoles }) {
  const [mode, setMode] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  
  // Editable template fields
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateIndustry, setTemplateIndustry] = useState('');
  const [templateGoal, setTemplateGoal] = useState('');
  const [templateScenario, setTemplateScenario] = useState('');
  const [templateRoles, setTemplateRoles] = useState([]);

  const generateTemplate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const availableRoles = allRoles?.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description
      })) || [];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating cross-functional team simulation templates for product and business decisions.

USER REQUEST: ${prompt}

AVAILABLE ROLES:
${JSON.stringify(availableRoles, null, 2)}

Generate a comprehensive simulation template that includes:
1. A realistic, detailed scenario description (3-4 sentences with specific context)
2. 5-8 most relevant team roles from AVAILABLE ROLES with their influence levels
3. 2-4 CUSTOM role suggestions specific to this scenario/industry (with full definitions including seniority, skills, personality)
4. Identify potential CONFLICTS and SYNERGIES between suggested roles
5. Template metadata

For custom roles, provide detailed attributes:
- Unique role name (not in available roles)
- Description of their concerns and priorities (2-3 sentences)
- Seniority level (junior, mid, senior, executive)
- Key technical/domain skills (list 3-5)
- Personality traits relevant to decisions (e.g., risk-averse, data-driven, customer-focused)
- Suggested icon name (from lucide-react: User, Building, Shield, Target, Cpu, Bot, etc.)
- Color theme (violet, blue, rose, emerald, amber, etc.)
- Default influence level (1-10)

IMPORTANT: For role conflicts/synergies:
- Identify which role pairs are likely to have tension and why
- Identify which roles will naturally align and complement each other
- Consider personality traits, priorities, and typical decision-making styles

Consider what roles would have meaningful, potentially conflicting perspectives on this type of decision.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            industry: { type: "string" },
            goal: { type: "string" },
            scenario: { type: "string" },
            existing_roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_id: { type: "string" },
                  role_name: { type: "string" },
                  influence: { type: "number" },
                  why_relevant: { type: "string" }
                }
              }
            },
            custom_roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  seniority_level: { type: "string" },
                  key_skills: { type: "array", items: { type: "string" } },
                  personality_traits: { type: "array", items: { type: "string" } },
                  icon_name: { type: "string" },
                  color: { type: "string" },
                  default_influence: { type: "number" },
                  why_relevant: { type: "string" }
                }
              }
            },
            role_conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  between: { type: "array", items: { type: "string" } },
                  reason: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            role_synergies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  between: { type: "array", items: { type: "string" } },
                  reason: { type: "string" },
                  strength: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setTemplateName(result.name);
      setTemplateDescription(result.description);
      setTemplateIndustry(result.industry);
      setTemplateGoal(result.goal);
      setTemplateScenario(result.scenario);
      setTemplateRoles([
        ...(result.existing_roles || []),
        ...(result.custom_roles || []).map(cr => ({
          ...cr,
          is_custom_suggestion: true
        }))
      ]);
      setGeneratedTemplate(result);
    } catch (error) {
      toast.error('Failed to generate template');
      console.error(error);
    }
    setLoading(false);
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateScenario.trim()) {
      toast.error('Name and scenario are required');
      return;
    }

    try {
      // First, create any custom roles that don't exist yet
      const customRolesToCreate = templateRoles.filter(r => r.is_custom_suggestion);
      
      for (const customRole of customRolesToCreate) {
        await base44.entities.CustomRole.create({
          name: customRole.name,
          description: customRole.description,
          icon_name: customRole.icon_name,
          color: customRole.color,
          default_influence: customRole.default_influence
        });
      }

      // Then save the template
      await base44.entities.SimulationTemplate.create({
        name: templateName,
        description: templateDescription,
        industry: templateIndustry,
        goal: templateGoal,
        scenario_template: templateScenario,
        suggested_roles: templateRoles.map(r => ({
          role: r.role_id || r.name,
          influence: r.influence || r.default_influence || 5
        })),
        is_ai_generated: mode === 'ai',
        use_count: 0
      });
      
      toast.success('Template saved successfully');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save template');
      console.error(error);
    }
  };

  const resetForm = () => {
    setPrompt('');
    setGeneratedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateIndustry('');
    setTemplateGoal('');
    setTemplateScenario('');
    setTemplateRoles([]);
  };

  const applyTemplate = () => {
    if (!templateScenario.trim()) return;
    
    onApplyTemplate({
      title: templateName,
      scenario: templateScenario,
      roles: templateRoles.map(r => ({
        role: r.role_id || r.name,
        influence: r.influence || r.default_influence || 5
      }))
    });
    
    resetForm();
    onOpenChange(false);
  };

  const addManualRole = () => {
    const newRole = {
      role_id: '',
      role_name: 'New Role',
      influence: 5,
      why_relevant: ''
    };
    setTemplateRoles([...templateRoles, newRole]);
  };

  const updateRole = (index, field, value) => {
    const updated = [...templateRoles];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateRoles(updated);
  };

  const removeRole = (index) => {
    setTemplateRoles(templateRoles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Template Builder
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Edit2 className="w-4 h-4 mr-2" />
              Manual Create
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 mt-4">
            {!generatedTemplate ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Describe your simulation need</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Examples:&#10;• Launching a new pricing tier for our SaaS product&#10;• Deciding whether to build or buy a payment gateway&#10;• Handling a data breach customer crisis&#10;• Entering the European market with our fintech app"
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Button
                  onClick={generateTemplate}
                  disabled={loading || !prompt.trim()}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Template...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Template
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedTemplate(null);
                  resetForm();
                }}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Different Template
              </Button>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <p className="text-sm text-slate-500">
              Create a template from scratch without AI assistance
            </p>
          </TabsContent>
        </Tabs>

        {/* Editable Template Form */}
        {(generatedTemplate || mode === 'manual') && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., SaaS Pricing Launch"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={templateIndustry}
                  onChange={(e) => setTemplateIndustry(e.target.value)}
                  placeholder="e.g., SaaS, Fintech, Healthcare"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal">Goal/Use Case</Label>
                <Input
                  id="goal"
                  value={templateGoal}
                  onChange={(e) => setTemplateGoal(e.target.value)}
                  placeholder="e.g., Product Launch, Crisis Response"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="When to use this template"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="scenario">Scenario Template</Label>
              <Textarea
                id="scenario"
                value={templateScenario}
                onChange={(e) => setTemplateScenario(e.target.value)}
                placeholder="Describe the decision scenario in detail..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Roles ({templateRoles.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addManualRole}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Role
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {templateRoles.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg">
                    No roles added yet
                  </div>
                ) : (
                  templateRoles.map((role, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={role.role_name || role.name}
                              onChange={(e) => updateRole(idx, 'role_name', e.target.value)}
                              placeholder="Role name"
                              className="text-sm h-8"
                            />
                            <Input
                              type="number"
                              value={role.influence || role.default_influence}
                              onChange={(e) => updateRole(idx, 'influence', parseInt(e.target.value))}
                              placeholder="Influence"
                              className="text-sm h-8 w-20"
                              min="1"
                              max="10"
                            />
                          </div>
                          {role.is_custom_suggestion && (
                            <Badge className="text-xs bg-violet-100 text-violet-700">
                              Custom Role Suggestion
                            </Badge>
                          )}
                          {role.why_relevant && (
                            <p className="text-xs text-slate-600">{role.why_relevant}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole(idx)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={saveTemplate}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                Save Template
              </Button>
              <Button
                onClick={applyTemplate}
                className="flex-1 gap-2"
                disabled={!templateScenario.trim() || templateRoles.length === 0}
              >
                <FileText className="w-4 h-4" />
                Use This Template
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}