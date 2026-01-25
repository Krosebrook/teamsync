import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save, FileText } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function TemplateGenerator({ open, onOpenChange, onApplyTemplate }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);

  const generateTemplate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating cross-functional team simulation templates for product and business decisions.

USER REQUEST: ${prompt}

Generate a comprehensive simulation template that includes:
1. A realistic, detailed scenario description (3-4 sentences with specific context)
2. 5-8 most relevant team roles with their influence levels
3. Template metadata

Consider what roles would have meaningful, potentially conflicting perspectives on this type of decision.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            industry: { type: "string" },
            goal: { type: "string" },
            scenario: { type: "string" },
            roles: {
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
            }
          }
        }
      });
      
      setGeneratedTemplate(result);
    } catch (error) {
      toast.error('Failed to generate template');
      console.error(error);
    }
    setLoading(false);
  };

  const saveTemplate = async () => {
    if (!generatedTemplate) return;
    
    try {
      await base44.entities.SimulationTemplate.create({
        name: generatedTemplate.name,
        description: generatedTemplate.description,
        industry: generatedTemplate.industry,
        goal: generatedTemplate.goal,
        scenario_template: generatedTemplate.scenario,
        suggested_roles: generatedTemplate.roles.map(r => ({
          role: r.role_id,
          influence: r.influence
        })),
        is_ai_generated: true,
        use_count: 0
      });
      
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const applyTemplate = () => {
    if (!generatedTemplate) return;
    
    onApplyTemplate({
      title: generatedTemplate.name,
      scenario: generatedTemplate.scenario,
      roles: generatedTemplate.roles.map(r => ({
        role: r.role_id,
        influence: r.influence
      }))
    });
    
    setGeneratedTemplate(null);
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Template Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedTemplate ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">What kind of simulation do you need?</Label>
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
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                <h3 className="font-semibold text-violet-900 mb-2">{generatedTemplate.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{generatedTemplate.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{generatedTemplate.industry}</Badge>
                  <Badge variant="outline">{generatedTemplate.goal}</Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-2 block">Scenario</Label>
                <p className="text-sm text-slate-700 leading-relaxed p-3 bg-slate-50 rounded-lg">
                  {generatedTemplate.scenario}
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-2 block">
                  Suggested Roles ({generatedTemplate.roles.length})
                </Label>
                <div className="space-y-2">
                  {generatedTemplate.roles.map((role, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800">{role.role_name}</span>
                        <Badge variant="outline" className="text-xs">
                          Influence: {role.influence}/10
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{role.why_relevant}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedTemplate(null)}
                  className="flex-1"
                >
                  Generate New
                </Button>
                <Button
                  variant="outline"
                  onClick={saveTemplate}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </Button>
                <Button
                  onClick={applyTemplate}
                  className="flex-1 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}