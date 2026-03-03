import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  BookOpenCheck, Search, Edit2, Trash2, Plus, X, Save, ArrowRight,
  Sparkles, Loader2, Users, MessageSquare
} from "lucide-react";

export const FRAMEWORK_LABELS = {
  daci: 'DACI', raci: 'RACI', six_thinking_hats: 'Six Thinking Hats',
  pre_mortem: 'Pre-Mortem', post_mortem: 'Post-Mortem', swot: 'SWOT',
  cost_benefit: 'Cost-Benefit', ooda: 'OODA', custom: 'Custom'
};

export const BUILT_IN_USE_CASES = {
  pre_mortem: 'Pre-Mortem', roadmap: 'Roadmap', adr: 'ADR',
  pmf_validation: 'PMF Validation', tech_debt: 'Tech Debt', post_mortem: 'Post-Mortem',
  hiring: 'Hiring', build_buy: 'Build vs Buy', migration: 'Migration',
  customer_escalation: 'Customer Escalation', custom: 'Custom'
};

// Merge built-ins with any custom use cases stored in localStorage
function getUseCaseLabels() {
  try {
    const custom = JSON.parse(localStorage.getItem('custom_use_cases') || '{}');
    return { ...BUILT_IN_USE_CASES, ...custom };
  } catch {
    return { ...BUILT_IN_USE_CASES };
  }
}

function saveCustomUseCase(key, label) {
  try {
    const existing = JSON.parse(localStorage.getItem('custom_use_cases') || '{}');
    existing[key] = label;
    localStorage.setItem('custom_use_cases', JSON.stringify(existing));
  } catch {}
}

function removeCustomUseCase(key) {
  try {
    const existing = JSON.parse(localStorage.getItem('custom_use_cases') || '{}');
    delete existing[key];
    localStorage.setItem('custom_use_cases', JSON.stringify(existing));
  } catch {}
}

// ── Edit / Create Template Dialog ─────────────────────────────────────────────
function EditTemplateDialog({ template, open, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [useCaseLabels, setUseCaseLabels] = useState(getUseCaseLabels);
  const [newUseCaseInput, setNewUseCaseInput] = useState('');
  const [showNewUseCase, setShowNewUseCase] = useState(false);

  const [form, setForm] = useState(() => ({
    name: template?.name || '',
    description: template?.description || '',
    scenario_starter: template?.scenario_starter || '',
    framework: template?.framework || 'custom',
    use_case_type: template?.use_case_type || 'custom',
    tags: template?.tags || [],
    required_roles: template?.required_roles || [],
  }));

  const [tagInput, setTagInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [generatingRoles, setGeneratingRoles] = useState(false);
  const [generatingScenario, setGeneratingScenario] = useState(false);

  React.useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        scenario_starter: template.scenario_starter || '',
        framework: template.framework || 'custom',
        use_case_type: template.use_case_type || 'custom',
        tags: template.tags || [],
        required_roles: template.required_roles || [],
      });
      setUseCaseLabels(getUseCaseLabels());
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data) => template?.id
      ? base44.entities.DecisionPlaybook.update(template.id, data)
      : base44.entities.DecisionPlaybook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbookTemplates'] });
      toast.success(template?.id ? 'Template updated' : 'Template created');
      onSaved();
      onClose();
    }
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const addRole = () => {
    const r = roleInput.trim();
    if (r && !form.required_roles.find(x => x.role === r)) {
      setForm(f => ({ ...f, required_roles: [...f.required_roles, { role: r, framework_position: 'participant' }] }));
      setRoleInput('');
    }
  };

  const removeRole = (role) => {
    setForm(f => ({ ...f, required_roles: f.required_roles.filter(r => r.role !== role) }));
  };

  const addCustomUseCase = () => {
    const label = newUseCaseInput.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    saveCustomUseCase(key, label);
    setUseCaseLabels(prev => ({ ...prev, [key]: label }));
    setForm(f => ({ ...f, use_case_type: key }));
    setNewUseCaseInput('');
    setShowNewUseCase(false);
  };

  const deleteCustomUseCase = (key) => {
    removeCustomUseCase(key);
    setUseCaseLabels(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (form.use_case_type === key) setForm(f => ({ ...f, use_case_type: 'custom' }));
  };

  const isCustomKey = (key) => !(key in BUILT_IN_USE_CASES);

  // AI: Suggest required roles based on framework + use case + description
  const suggestRoles = async () => {
    if (!form.framework && !form.use_case_type) {
      toast.error('Set a framework or use case first');
      return;
    }
    setGeneratingRoles(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in cross-functional team decision-making.

Given this decision playbook template:
- Framework: ${FRAMEWORK_LABELS[form.framework] || form.framework}
- Use Case Type: ${useCaseLabels[form.use_case_type] || form.use_case_type}
- Name: ${form.name || '(untitled)'}
- Description: ${form.description || '(none)'}

Suggest 5–8 essential roles that should be involved in this type of decision.
Return only role names (short titles, e.g. "Product Manager", "Engineering Lead", "CFO").
Focus on roles that bring diverse, often conflicting perspectives for richer simulation.`,
        response_json_schema: {
          type: "object",
          properties: {
            roles: { type: "array", items: { type: "string" } }
          }
        }
      });
      const suggested = (result.roles || []).filter(r =>
        !form.required_roles.find(x => x.role.toLowerCase() === r.toLowerCase())
      );
      if (suggested.length === 0) {
        toast.info('No new roles to add');
      } else {
        setForm(f => ({
          ...f,
          required_roles: [
            ...f.required_roles,
            ...suggested.map(r => ({ role: r, framework_position: 'participant' }))
          ]
        }));
        toast.success(`Added ${suggested.length} suggested role(s)`);
      }
    } catch {
      toast.error('Failed to suggest roles');
    }
    setGeneratingRoles(false);
  };

  // AI: Generate scenario starter
  const generateScenario = async () => {
    if (!form.name && !form.description) {
      toast.error('Add a name or description first');
      return;
    }
    setGeneratingScenario(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at creating realistic, vivid decision simulation scenarios.

Generate a concise but rich scenario starter (2–3 paragraphs) for a playbook template with:
- Name: ${form.name || '(untitled)'}
- Description: ${form.description || '(none)'}
- Framework: ${FRAMEWORK_LABELS[form.framework] || form.framework}
- Use Case: ${useCaseLabels[form.use_case_type] || form.use_case_type}
- Roles involved: ${form.required_roles.map(r => r.role).join(', ') || 'Not specified'}

The scenario starter should:
- Set a realistic business context with specific (but fictional) company details
- State the decision that needs to be made clearly
- Include 1–2 concrete constraints (budget, timeline, or risk)
- Be written in second person ("Your team is facing...")
- Be reusable as a starting point that users can customize

Return only the scenario text, no headings or metadata.`,
        response_json_schema: {
          type: "object",
          properties: { scenario: { type: "string" } }
        }
      });
      if (result.scenario) {
        setForm(f => ({ ...f, scenario_starter: result.scenario }));
        toast.success('Scenario starter generated');
      }
    } catch {
      toast.error('Failed to generate scenario');
    }
    setGeneratingScenario(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit' : 'New'} Playbook Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Template Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., SaaS Pricing Decision" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="When to use this template..." className="h-16 resize-none" />
            </div>
          </div>

          {/* Framework + Use Case */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Framework</Label>
              <Select value={form.framework} onValueChange={v => setForm(f => ({ ...f, framework: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FRAMEWORK_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Use Case Type</Label>
              <div className="flex gap-1">
                <Select value={form.use_case_type} onValueChange={v => setForm(f => ({ ...f, use_case_type: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(useCaseLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        <span className="flex items-center gap-2">
                          {label}
                          {isCustomKey(val) && (
                            <span
                              className="text-rose-400 hover:text-rose-600 ml-1 cursor-pointer"
                              onClick={e => { e.stopPropagation(); deleteCustomUseCase(val); }}
                              title="Remove custom use case"
                            >×</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="outline" className="shrink-0 h-10 w-10"
                  title="Add custom use case type"
                  onClick={() => setShowNewUseCase(v => !v)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {showNewUseCase && (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newUseCaseInput}
                    onChange={e => setNewUseCaseInput(e.target.value)}
                    placeholder="e.g., Vendor Evaluation"
                    className="text-sm h-8"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomUseCase())}
                  />
                  <Button type="button" size="sm" onClick={addCustomUseCase} className="h-8 text-xs">Add</Button>
                </div>
              )}
            </div>
          </div>

          {/* Required Roles */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Required Roles</Label>
              <Button type="button" variant="outline" size="sm" onClick={suggestRoles} disabled={generatingRoles} className="gap-1 h-7 text-xs">
                {generatingRoles ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Suggest
              </Button>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                placeholder="Add a role..."
                className="text-sm"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
              />
              <Button type="button" size="sm" variant="outline" onClick={addRole} className="h-9">
                <Users className="w-4 h-4" />
              </Button>
            </div>
            {form.required_roles.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {form.required_roles.map((r, i) => (
                  <Badge key={i} variant="outline" className="gap-1 text-xs py-0.5">
                    {r.role}
                    <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => removeRole(r.role)} />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No roles yet. Add manually or use AI Suggest.</p>
            )}
          </div>

          {/* Scenario Starter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Scenario Starter</Label>
              <Button type="button" variant="outline" size="sm" onClick={generateScenario} disabled={generatingScenario} className="gap-1 h-7 text-xs">
                {generatingScenario ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
              </Button>
            </div>
            <Textarea
              value={form.scenario_starter}
              onChange={e => setForm(f => ({ ...f, scenario_starter: e.target.value }))}
              placeholder="Pre-filled scenario text that gets applied when this template is used..."
              className="h-28 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">Pre-populates the scenario field when this template is applied to a new simulation.</p>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="text-sm" />
              <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.tags.map((t, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-xs">
                  {t}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate({ ...form, is_template: true })} disabled={!form.name.trim() || saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Templates Browser ─────────────────────────────────────────────────────
export default function PlaybookTemplatesManager({ open, onClose, onApply, onSimulate }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [useCaseLabels] = useState(getUseCaseLabels);

  const { data: templates = [] } = useQuery({
    queryKey: ['playbookTemplates'],
    queryFn: async () => {
      const all = await base44.entities.DecisionPlaybook.list();
      return all.filter(p => p.is_template);
    },
    enabled: open
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DecisionPlaybook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbookTemplates'] });
      toast.success('Template deleted');
    }
  });

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-indigo-600" />
                Playbook Templates
              </DialogTitle>
              <Button size="sm" onClick={() => setCreatingNew(true)} className="gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> New Template
              </Button>
            </div>
          </DialogHeader>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <BookOpenCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No templates yet.</p>
                <p className="text-xs mt-1">Create a new template or save one from the Playbook Generator.</p>
              </div>
            ) : (
              filtered.map(template => (
                <Card key={template.id} className="hover:border-indigo-300 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-sm">{template.name}</h3>
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs border-0">
                            {FRAMEWORK_LABELS[template.framework] || template.framework}
                          </Badge>
                          {template.use_case_type && (
                            <Badge variant="outline" className="text-xs">
                              {useCaseLabels[template.use_case_type] || template.use_case_type}
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{template.description}</p>
                        )}
                        {template.scenario_starter && (
                          <div className="p-2 bg-slate-50 rounded border border-slate-200 mb-2">
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Scenario starter:</p>
                            <p className="text-xs text-slate-600 line-clamp-2 italic">"{template.scenario_starter}"</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {template.required_roles?.slice(0, 5).map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs py-0 h-5">{r.role}</Badge>
                          ))}
                          {(template.required_roles?.length || 0) > 5 && (
                            <span className="text-xs text-slate-400">+{template.required_roles.length - 5} roles</span>
                          )}
                          {template.tags?.map((tag, i) => (
                            <Badge key={i} className="text-xs bg-violet-100 text-violet-700 border-0 py-0 h-5">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" onClick={() => { onApply(template); onClose(); }} className="gap-1 text-xs h-7">
                          Use <ArrowRight className="w-3 h-3" />
                        </Button>
                        {onSimulate && template.required_roles?.length >= 2 && (
                          <Button size="sm" variant="outline" onClick={() => { onSimulate(template); onClose(); }} className="gap-1 text-xs h-7">
                            <MessageSquare className="w-3 h-3" />
                            Simulate
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Edit" onClick={() => setEditingTemplate(template)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700" title="Delete"
                          onClick={() => confirm('Delete this template?') && deleteMutation.mutate(template.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit existing */}
      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => setEditingTemplate(null)}
        />
      )}

      {/* Create new */}
      {creatingNew && (
        <EditTemplateDialog
          template={null}
          open={creatingNew}
          onClose={() => setCreatingNew(false)}
          onSaved={() => setCreatingNew(false)}
        />
      )}
    </>
  );
}