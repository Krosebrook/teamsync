import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Plus, Trash2, Play, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const COMPLEXITY_STYLES = {
  simple: 'bg-green-100 text-green-700',
  moderate: 'bg-blue-100 text-blue-700',
  complex: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['simulationTemplates'],
    queryFn: () => base44.entities.SimulationTemplate.list('-use_count', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SimulationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulationTemplates'] });
      toast.success('Template deleted');
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.industry?.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const handleUse = (template) => {
    // Pass template data as URL search params to Simulation page
    const params = new URLSearchParams({
      template_id: template.id,
      title: template.name,
      scenario: template.scenario_template,
    });
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
            <p className="text-sm text-slate-500 mt-0.5">{templates.length} saved template{templates.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">No templates yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Save any completed simulation as a template to reuse it.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No templates match "{search}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug">{t.name}</h3>
                  <button
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {t.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1 line-clamp-3">{t.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {t.industry && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t.industry.replace(/_/g, ' ')}</span>
                  )}
                  {t.complexity && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPLEXITY_STYLES[t.complexity] || 'bg-slate-100 text-slate-600'}`}>
                      {t.complexity}
                    </span>
                  )}
                  {t.estimated_duration && (
                    <span className="text-xs flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />{t.estimated_duration}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{t.use_count || 0} uses</span>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleUse(t)}>
                    <Play className="w-3 h-3" /> Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}