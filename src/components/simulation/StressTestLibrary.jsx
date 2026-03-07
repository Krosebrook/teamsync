import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Library, Plus, Search, Tag, Download, Upload, Trash2, Play,
  Flame, Users, BookOpen, Target, Copy, Star, Filter, X, Save, Sparkles, Loader2
} from "lucide-react";

const CATEGORY_CONFIG = {
  conflict:      { label: 'Conflict',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
  resource:      { label: 'Resource',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  technical:     { label: 'Technical',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ethical:       { label: 'Ethical',       color: 'bg-violet-100 text-violet-700 border-violet-200' },
  strategic:     { label: 'Strategic',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  interpersonal: { label: 'Interpersonal', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  custom:        { label: 'Custom',        color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const DIFFICULTY_CONFIG = {
  low:     { label: 'Low',     color: 'text-emerald-600', dot: 'bg-emerald-400' },
  medium:  { label: 'Medium',  color: 'text-amber-600',   dot: 'bg-amber-400' },
  high:    { label: 'High',    color: 'text-rose-600',    dot: 'bg-rose-400' },
  extreme: { label: 'Extreme', color: 'text-rose-800',    dot: 'bg-rose-700' },
};

function DifficultyBadge({ difficulty }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TemplateCard({ template, onLoad, onDelete, onExport }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.custom;

  return (
    <Card className="border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catCfg.color}`}>
                {catCfg.label}
              </span>
              <DifficultyBadge difficulty={template.difficulty} />
              {template.is_public && (
                <span className="text-xs text-slate-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3" /> Public
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 leading-tight">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
            )}

            {template.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 bg-slate-50 text-slate-600">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {template.scenario && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Scenario</p>
                    <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 line-clamp-4">{template.scenario}</p>
                  </div>
                )}
                {template.selected_roles?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Roles ({template.selected_roles.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {template.selected_roles.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{r.role}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {template.learning_objectives?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Learning Objectives</p>
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {template.learning_objectives.map((o, i) => (
                        <li key={i} className="flex items-start gap-1"><span className="text-emerald-500 mt-0.5">•</span>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {template.expected_tensions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Expected Tensions</p>
                    <ul className="text-xs text-slate-600 space-y-0.5">
                      {template.expected_tensions.map((t, i) => (
                        <li key={i} className="flex items-start gap-1"><span className="text-rose-400 mt-0.5">⚡</span>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <Button size="sm" onClick={() => onLoad(template)} className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white">
              <Play className="w-3 h-3" /> Load
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExport(template)} className="h-7 text-xs gap-1">
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(template.id)} className="h-7 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors"
        >
          {expanded ? '▲ Less' : '▼ More details'}
        </button>
      </CardContent>
    </Card>
  );
}

function SaveTemplateForm({ currentSimulation, selectedRoles, personaTunings, environmentalFactors, onSaved, onCancel }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: currentSimulation?.title ? `Stress Test: ${currentSimulation.title}` : '',
    description: '',
    category: 'custom',
    difficulty: 'medium',
    tags: [],
    learning_objectives: [],
    expected_tensions: [],
    is_public: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [objInput, setObjInput] = useState('');
  const [tensionInput, setTensionInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.StressTestTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stressTestTemplates'] });
      toast.success('Stress test template saved to library!');
      onSaved();
    }
  });

  const aiSuggest = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a team dynamics expert. Based on this simulation scenario and role configuration, suggest metadata for saving it as a reusable stress test template.

Scenario: ${currentSimulation?.scenario || 'Not provided'}
Roles: ${selectedRoles?.map(r => r.role).join(', ') || 'Not provided'}

Generate:
1. A concise template name (under 60 chars, starts with a verb like "Stress Test:", "Challenge:", "Simulate:")
2. A 1-2 sentence description of what this stress test surfaces
3. Best category: conflict | resource | technical | ethical | strategic | interpersonal | custom
4. Difficulty: low | medium | high | extreme
5. 3-5 short tags (single words or hyphenated)
6. 3 learning objectives for teams running this
7. 2-4 specific tensions this scenario will surface`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            learning_objectives: { type: "array", items: { type: "string" } },
            expected_tensions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setForm(prev => ({ ...prev, ...result }));
      toast.success('AI filled in template details');
    } catch { toast.error('AI suggestion failed'); }
    setGenerating(false);
  };

  const addToArray = (field, val, setter) => {
    const v = val.trim();
    if (!v) return;
    setForm(prev => ({ ...prev, [field]: [...prev[field], v] }));
    setter('');
  };

  const removeFromArray = (field, idx) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !currentSimulation?.scenario) {
      toast.error('Name and scenario are required');
      return;
    }
    saveMutation.mutate({
      ...form,
      scenario: currentSimulation.scenario,
      selected_roles: selectedRoles || [],
      persona_tunings: personaTunings || {},
      environmental_factors: environmentalFactors || {},
      use_case_type: currentSimulation?.use_case_type || 'custom',
      source_simulation_id: currentSimulation?.id || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Save the current scenario, roles, and persona tunings as a reusable template.</p>
        <Button size="sm" variant="outline" onClick={aiSuggest} disabled={generating} className="gap-1.5 shrink-0">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-500" />}
          AI Fill
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Template Name *</Label>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Stress Test: Budget Freeze with Security Conflict" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="What does this stress test surface? When should teams run it?"
          className="min-h-[60px] resize-none text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Difficulty</Label>
          <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label className="text-xs">Tags</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('tags', tagInput, setTagInput))}
            placeholder="e.g., budget-conflict" className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addToArray('tags', tagInput, setTagInput)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {form.tags.map((t, i) => (
            <Badge key={i} variant="outline" className="text-xs gap-1 bg-slate-50">
              #{t} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeFromArray('tags', i)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="space-y-1.5">
        <Label className="text-xs">Learning Objectives</Label>
        <div className="flex gap-2">
          <Input value={objInput} onChange={e => setObjInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('learning_objectives', objInput, setObjInput))}
            placeholder="e.g., Practice navigating ethical trade-offs under time pressure" className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addToArray('learning_objectives', objInput, setObjInput)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {form.learning_objectives.map((o, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
            <Target className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="flex-1">{o}</span>
            <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => removeFromArray('learning_objectives', i)} />
          </div>
        ))}
      </div>

      {/* Expected Tensions */}
      <div className="space-y-1.5">
        <Label className="text-xs">Expected Tensions</Label>
        <div className="flex gap-2">
          <Input value={tensionInput} onChange={e => setTensionInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('expected_tensions', tensionInput, setTensionInput))}
            placeholder="e.g., Security vs. Speed" className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addToArray('expected_tensions', tensionInput, setTensionInput)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {form.expected_tensions.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
            <Flame className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="flex-1">{t}</span>
            <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => removeFromArray('expected_tensions', i)} />
          </div>
        ))}
      </div>

      {/* Snapshot summary */}
      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600">What will be saved:</p>
        <p className="text-xs text-slate-500">✓ Full scenario text</p>
        <p className="text-xs text-slate-500">✓ {selectedRoles?.length || 0} role configuration(s) with influence weights</p>
        <p className="text-xs text-slate-500">✓ {Object.values(personaTunings || {}).filter(t => t?.enabled).length} active persona tuning(s)</p>
        {environmentalFactors && Object.keys(environmentalFactors).length > 0 && (
          <p className="text-xs text-slate-500">✓ Environmental factors</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !form.name.trim()} className="flex-1 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save to Library
        </Button>
      </div>
    </div>
  );
}

export default function StressTestLibrary({ open, onClose, onLoadTemplate, currentSimulation, selectedRoles, personaTunings, environmentalFactors }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['stressTestTemplates'],
    queryFn: () => base44.entities.StressTestTemplate.list('-created_date', 100),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StressTestTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stressTestTemplates'] });
      toast.success('Template deleted');
    }
  });

  const incrementUseMutation = useMutation({
    mutationFn: ({ id, count }) => base44.entities.StressTestTemplate.update(id, { use_count: count + 1 }),
  });

  const handleLoad = (template) => {
    incrementUseMutation.mutate({ id: template.id, count: template.use_count || 0 });
    onLoadTemplate(template);
    onClose();
    toast.success(`Loaded: ${template.name}`);
  };

  const handleExport = (template) => {
    const exportData = {
      ...template,
      exported_at: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template exported as JSON');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const { id, created_date, updated_date, created_by, exported_at, version, ...importData } = data;
        await base44.entities.StressTestTemplate.create({ ...importData, name: `${importData.name} (imported)` });
        queryClient.invalidateQueries({ queryKey: ['stressTestTemplates'] });
        toast.success('Template imported successfully!');
      } catch {
        toast.error('Failed to import — invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    const matchDiff = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Library className="w-5 h-5 text-violet-600" />
            Stress Test Library
            <Badge variant="outline" className="text-xs font-normal ml-1">{templates.length} templates</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="browse" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Browse Library
            </TabsTrigger>
            <TabsTrigger value="save" className="gap-1.5 text-xs">
              <Save className="w-3.5 h-3.5" /> Save Current as Template
            </TabsTrigger>
          </TabsList>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="flex-1 overflow-y-auto space-y-4 mt-3">
            {/* Search + Filters */}
            <div className="space-y-2 sticky top-0 bg-white pb-2 z-10">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search templates, tags..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1.5">
                    <span><Upload className="w-3.5 h-3.5" /> Import</span>
                  </Button>
                </label>
              </div>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <Flame className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Difficulties</SelectItem>
                    {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading library...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Library className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-500">
                  {templates.length === 0 ? 'No templates yet' : 'No templates match your filters'}
                </p>
                <p className="text-xs text-slate-400">
                  {templates.length === 0
                    ? 'Save your first stress test template from the "Save Current" tab'
                    : 'Try adjusting your search or filters'}
                </p>
                {templates.length === 0 && (
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('save')} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Save first template
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onLoad={handleLoad}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onExport={handleExport}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* SAVE TAB */}
          <TabsContent value="save" className="flex-1 overflow-y-auto mt-3">
            {!currentSimulation?.scenario ? (
              <div className="text-center py-12 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">No active scenario to save.</p>
                <p className="text-xs text-slate-400">Configure a scenario and roles first, then save it as a template.</p>
              </div>
            ) : (
              <SaveTemplateForm
                currentSimulation={currentSimulation}
                selectedRoles={selectedRoles}
                personaTunings={personaTunings}
                environmentalFactors={environmentalFactors}
                onSaved={() => setActiveTab('browse')}
                onCancel={onClose}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}