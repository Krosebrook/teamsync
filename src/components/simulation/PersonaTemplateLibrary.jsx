import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import {
  BookMarked, Search, Trash2, Download, Plus, Star,
  Brain, Zap, Swords, MessageSquare, Users
} from "lucide-react";

// Built-in starter templates so the library isn't empty on first use
const STARTER_TEMPLATES = [
  {
    id: '__starter_risk_averse_cfo',
    name: 'Risk-Averse CFO',
    description: 'Highly conservative, data-obsessed, strongly resists unproven investments',
    tags: ['risk-averse', 'finance', 'conservative'],
    is_public: true,
    tuning: {
      enabled: true,
      risk_tolerance_override: 'low',
      directness_level: 7,
      contrarianism: 6,
      data_orientation: 9,
      urgency_bias: 2,
      conflict_style_override: 'competing',
      stress_level: 6,
      emotional_expressiveness: 2,
      political_savvy: 8,
      empathy_level: 3,
      formality_override: 'formal',
      active_cognitive_biases: ['Loss aversion', 'Status quo bias'],
      suppressed_biases: [],
      custom_agenda: 'Protect the balance sheet at all costs. Skeptical of growth-at-all-costs narratives.',
      custom_context_fields: [],
    },
  },
  {
    id: '__starter_aggressive_growth',
    name: 'Aggressive Growth Strategist',
    description: 'Move fast, embrace risk, prioritize market capture over short-term profitability',
    tags: ['aggressive', 'growth', 'risk-tolerant'],
    is_public: true,
    tuning: {
      enabled: true,
      risk_tolerance_override: 'high',
      directness_level: 9,
      contrarianism: 7,
      data_orientation: 4,
      urgency_bias: 9,
      conflict_style_override: 'competing',
      stress_level: 7,
      emotional_expressiveness: 8,
      political_savvy: 6,
      empathy_level: 4,
      formality_override: 'casual',
      active_cognitive_biases: ['Optimism bias', 'Overconfidence bias'],
      suppressed_biases: [],
      custom_agenda: 'Win market share before the window closes. Treats caution as a competitive disadvantage.',
      custom_context_fields: [],
    },
  },
  {
    id: '__starter_empathetic_cpo',
    name: 'Empathetic CPO',
    description: 'User-first, collaborative, deeply considers customer impact in every decision',
    tags: ['empathetic', 'user-focused', 'collaborative'],
    is_public: true,
    tuning: {
      enabled: true,
      risk_tolerance_override: 'medium',
      directness_level: 5,
      contrarianism: 3,
      data_orientation: 6,
      urgency_bias: 5,
      conflict_style_override: 'collaborating',
      stress_level: 4,
      emotional_expressiveness: 8,
      political_savvy: 5,
      empathy_level: 10,
      formality_override: 'adaptive',
      active_cognitive_biases: ['Availability heuristic'],
      suppressed_biases: [],
      custom_agenda: 'Champion the user. Will push back hard on features that compromise UX even if they have business value.',
      custom_context_fields: [],
    },
  },
  {
    id: '__starter_pragmatic_cto',
    name: 'Pragmatic CTO',
    description: 'Systems-thinking, technically rigorous, wary of tech debt and premature scaling',
    tags: ['technical', 'pragmatic', 'data-driven'],
    is_public: true,
    tuning: {
      enabled: true,
      risk_tolerance_override: 'medium',
      directness_level: 7,
      contrarianism: 5,
      data_orientation: 8,
      urgency_bias: 4,
      conflict_style_override: 'compromising',
      stress_level: 5,
      emotional_expressiveness: 3,
      political_savvy: 4,
      empathy_level: 5,
      formality_override: 'adaptive',
      active_cognitive_biases: ['Anchoring bias', 'Sunk cost fallacy'],
      suppressed_biases: [],
      custom_agenda: 'Protect engineering quality and team morale. Resists unrealistic timelines.',
      custom_context_fields: [],
    },
  },
];

function TraitBar({ label, value, max = 10, color = 'violet' }) {
  const colorMap = {
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color]}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-400 w-4 text-right">{value}</span>
    </div>
  );
}

function TemplateCard({ template, onApply, onDelete, isStarter }) {
  const [expanded, setExpanded] = useState(false);
  const t = template.tuning || {};

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-violet-200 hover:shadow-sm transition-all">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isStarter && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
              <h4 className="font-semibold text-slate-800 text-sm truncate">{template.name}</h4>
            </div>
            {template.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
            )}
          </div>
          {!isStarter && onDelete && (
            <button
              onClick={() => onDelete(template.id)}
              className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tags */}
        {template.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Mini trait preview */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-violet-500 hover:text-violet-700 font-medium"
        >
          {expanded ? '▲ Hide traits' : '▼ Preview traits'}
        </button>

        {expanded && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <TraitBar label="Directness" value={t.directness_level ?? 5} color="blue" />
            <TraitBar label="Contrarianism" value={t.contrarianism ?? 3} color="rose" />
            <TraitBar label="Data Focus" value={t.data_orientation ?? 5} color="emerald" />
            <TraitBar label="Urgency" value={t.urgency_bias ?? 5} color="amber" />
            <TraitBar label="Empathy" value={t.empathy_level ?? 5} color="violet" />
            {t.risk_tolerance_override && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] text-slate-500">Risk</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                  t.risk_tolerance_override === 'high' ? 'text-rose-600' :
                  t.risk_tolerance_override === 'low' ? 'text-emerald-600' : 'text-amber-600'
                }`}>{t.risk_tolerance_override}</Badge>
              </div>
            )}
            {t.active_cognitive_biases?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {t.active_cognitive_biases.slice(0, 3).map(b => (
                  <span key={b} className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <Button
          size="sm"
          className="w-full h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          onClick={() => onApply(template)}
        >
          <Download className="w-3 h-3" />
          Apply to Persona
        </Button>
      </div>
    </div>
  );
}

export default function PersonaTemplateLibrary({ open, onClose, onApply }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: savedTemplates = [] } = useQuery({
    queryKey: ['persona_templates'],
    queryFn: () => base44.entities.PersonaTemplate.list('-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonaTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona_templates'] });
      toast.success('Template deleted');
    },
  });

  const allTemplates = [...STARTER_TEMPLATES, ...savedTemplates];
  const filtered = search
    ? allTemplates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : allTemplates;

  const starterIds = new Set(STARTER_TEMPLATES.map(t => t.id));

  const handleApply = (template) => {
    onApply(template.tuning);
    // Increment use_count for saved templates
    if (!starterIds.has(template.id)) {
      base44.entities.PersonaTemplate.update(template.id, {
        use_count: (template.use_count || 0) + 1
      });
    }
    onClose();
    toast.success(`"${template.name}" applied`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookMarked className="w-4 h-4 text-violet-600" />
            Persona Template Library
          </DialogTitle>
          <p className="text-xs text-slate-500">
            {allTemplates.length} templates · {savedTemplates.length} custom
          </p>
        </DialogHeader>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, tag, or trait..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isStarter={starterIds.has(template.id)}
                  onApply={handleApply}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}