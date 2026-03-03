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
  BookTemplate, Search, Edit2, Trash2, ChevronRight, Plus, X, Save, ArrowRight
} from "lucide-react";

const FRAMEWORK_LABELS = {
  daci: 'DACI', raci: 'RACI', six_thinking_hats: 'Six Thinking Hats',
  pre_mortem: 'Pre-Mortem', post_mortem: 'Post-Mortem', swot: 'SWOT',
  cost_benefit: 'Cost-Benefit', ooda: 'OODA', custom: 'Custom'
};

const USE_CASE_LABELS = {
  pre_mortem: 'Pre-Mortem', roadmap: 'Roadmap', adr: 'ADR',
  pmf_validation: 'PMF Validation', tech_debt: 'Tech Debt', post_mortem: 'Post-Mortem',
  hiring: 'Hiring', build_buy: 'Build vs Buy', migration: 'Migration',
  customer_escalation: 'Customer Escalation', custom: 'Custom'
};

function EditTemplateDialog({ template, open, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
    scenario_starter: template?.scenario_starter || '',
    framework: template?.framework || 'custom',
    use_case_type: template?.use_case_type || 'custom',
    tags: template?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  React.useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        description: template.description || '',
        scenario_starter: template.scenario_starter || '',
        framework: template.framework || 'custom',
        use_case_type: template.use_case_type || 'custom',
        tags: template.tags || [],
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.DecisionPlaybook.update(template.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbookTemplates'] });
      toast.success('Template updated');
      onSaved();
      onClose();
    }
  });

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Playbook Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Template Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., SaaS Pricing Decision" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="When to use this template..." className="h-20 resize-none" />
          </div>
          <div>
            <Label>Scenario Starter</Label>
            <Textarea
              value={form.scenario_starter}
              onChange={e => setForm(f => ({ ...f, scenario_starter: e.target.value }))}
              placeholder="Pre-filled scenario text that gets applied when this template is used..."
              className="h-24 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">This text will pre-populate the scenario field in new simulations.</p>
          </div>
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
              <Label>Use Case</Label>
              <Select value={form.use_case_type} onValueChange={v => setForm(f => ({ ...f, use_case_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(USE_CASE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
          <Button onClick={() => saveMutation.mutate({ ...form, is_template: true })} disabled={!form.name.trim()} className="gap-2">
            <Save className="w-4 h-4" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PlaybookTemplatesManager({ open, onClose, onApply }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  const handleApply = (template) => {
    onApply(template);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookTemplate className="w-5 h-5 text-indigo-600" />
              Playbook Templates
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <BookTemplate className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No templates yet.</p>
                <p className="text-xs mt-1">Save a playbook as a template from the Playbook Generator.</p>
              </div>
            ) : (
              filtered.map(template => (
                <Card key={template.id} className="hover:border-indigo-300 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-sm">{template.name}</h3>
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">{FRAMEWORK_LABELS[template.framework] || template.framework}</Badge>
                          {template.use_case_type && template.use_case_type !== 'custom' && (
                            <Badge variant="outline" className="text-xs">{USE_CASE_LABELS[template.use_case_type]}</Badge>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {template.required_roles?.slice(0, 4).map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{r.role}</Badge>
                          ))}
                          {(template.required_roles?.length || 0) > 4 && (
                            <span className="text-xs text-slate-400">+{template.required_roles.length - 4} more</span>
                          )}
                          {template.tags?.map((tag, i) => (
                            <Badge key={i} className="text-xs bg-violet-100 text-violet-700">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" onClick={() => handleApply(template)} className="gap-1 text-xs h-7">
                          Use <ArrowRight className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEditingTemplate(template)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700"
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

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => setEditingTemplate(null)}
        />
      )}
    </>
  );
}