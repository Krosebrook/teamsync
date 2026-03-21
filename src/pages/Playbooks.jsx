import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FRAMEWORK_LABELS = {
  daci: 'DACI', raci: 'RACI', six_thinking_hats: 'Six Thinking Hats',
  pre_mortem: 'Pre-Mortem', post_mortem: 'Post-Mortem', swot: 'SWOT',
  cost_benefit: 'Cost-Benefit', ooda: 'OODA', custom: 'Custom',
};

const FRAMEWORK_COLORS = {
  daci: 'bg-blue-100 text-blue-700',
  raci: 'bg-violet-100 text-violet-700',
  six_thinking_hats: 'bg-amber-100 text-amber-700',
  pre_mortem: 'bg-red-100 text-red-700',
  post_mortem: 'bg-slate-100 text-slate-600',
  swot: 'bg-green-100 text-green-700',
  cost_benefit: 'bg-emerald-100 text-emerald-700',
  ooda: 'bg-indigo-100 text-indigo-700',
  custom: 'bg-slate-100 text-slate-600',
};

export default function PlaybooksPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: ['decisionPlaybooks'],
    queryFn: () => base44.entities.DecisionPlaybook.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DecisionPlaybook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisionPlaybooks'] });
      toast.success('Playbook deleted');
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return playbooks;
    const q = search.toLowerCase();
    return playbooks.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.framework?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [playbooks, search]);

  const handleUse = (playbook) => {
    const params = new URLSearchParams({ playbook_id: playbook.id });
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Playbooks</h1>
            <p className="text-sm text-slate-500 mt-0.5">{playbooks.length} playbook{playbooks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search playbooks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">No playbooks yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Add a decision framework to structure your next simulation.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No playbooks match "{search}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug">{p.name}</h3>
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1 line-clamp-3">{p.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.framework && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FRAMEWORK_COLORS[p.framework] || 'bg-slate-100 text-slate-600'}`}>
                      {FRAMEWORK_LABELS[p.framework] || p.framework}
                    </span>
                  )}
                  {p.use_case_type && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      {p.use_case_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {p.is_template && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">template</span>
                  )}
                </div>

                {p.steps?.length > 0 && (
                  <p className="text-xs text-slate-400 mb-3">{p.steps.length} step{p.steps.length !== 1 ? 's' : ''}</p>
                )}

                <div className="flex justify-end">
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleUse(p)}>
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