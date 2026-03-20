import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';

const INDUSTRY_LABELS = {
  fintech: 'Fintech', healthcare: 'Healthcare', b2b_saas: 'B2B SaaS',
  e_commerce: 'E-Commerce', enterprise: 'Enterprise', consumer: 'Consumer',
  devtools: 'DevTools', ai_ml: 'AI/ML', crypto: 'Crypto',
  consulting: 'Consulting', marketing: 'Marketing', technology: 'Technology', general: 'General',
};

const COMPLEXITY_COLORS = {
  simple: 'bg-green-50 text-green-700 border-green-200',
  moderate: 'bg-blue-50 text-blue-700 border-blue-200',
  complex: 'bg-orange-50 text-orange-700 border-orange-200',
  advanced: 'bg-red-50 text-red-700 border-red-200',
};

export default function EmptyDashboard({ onRunTemplate, onStartFromScratch }) {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['publicTemplates'],
    queryFn: () => base44.entities.SimulationTemplate.filter({ is_public: true }),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, use_count }) => base44.entities.SimulationTemplate.update(id, { use_count }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publicTemplates'] }),
  });

  const handleRun = (template) => {
    // Increment use_count
    updateTemplateMutation.mutate({ id: template.id, use_count: (template.use_count || 0) + 1 });
    onRunTemplate(template);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl mb-4">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Run your first simulation</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Pick a real scenario below to see how your team would actually respond — positions, tensions, and next steps in ~2 minutes.
        </p>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">{template.name}</h3>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {template.industry && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {INDUSTRY_LABELS[template.industry] || template.industry}
                  </Badge>
                )}
                {template.complexity && (
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${COMPLEXITY_COLORS[template.complexity] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {template.complexity}
                  </span>
                )}
                {template.estimated_duration && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md bg-slate-50">
                    <Clock className="w-2.5 h-2.5" /> {template.estimated_duration}
                  </span>
                )}
              </div>

              {template.description && (
                <p className="text-xs text-slate-500 mb-3 flex-1 leading-relaxed">{template.description}</p>
              )}

              {template.conflict_types?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.conflict_types.map((ct, i) => (
                    <span key={i} className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                      {ct}
                    </span>
                  ))}
                </div>
              )}

              <Button
                size="sm"
                onClick={() => handleRun(template)}
                className="w-full mt-auto gap-2 bg-slate-900 hover:bg-slate-700 text-white"
              >
                Run This Scenario <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 mb-8">Loading scenarios...</div>
      )}

      <div className="text-center border-t border-slate-100 pt-6">
        <p className="text-sm text-slate-500 mb-3">Have your own scenario?</p>
        <Button variant="outline" onClick={onStartFromScratch} className="gap-2">
          <Plus className="w-4 h-4" /> Start from scratch →
        </Button>
      </div>
    </div>
  );
}