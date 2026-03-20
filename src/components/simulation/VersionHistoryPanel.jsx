import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, Clock, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft: { icon: Circle, color: 'text-slate-400', label: 'Draft' },
  running: { icon: Loader2, color: 'text-blue-500', label: 'Running', spin: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
};

export default function VersionHistoryPanel({ simulation, open, onOpenChange, onLoadVersion }) {
  const queryClient = useQueryClient();

  // Find root ID — either this sim's parent or itself
  const rootId = simulation?.parent_simulation_id || simulation?.id;

  const { data: allSims = [] } = useQuery({
    queryKey: ['simulations'],
    enabled: open,
  });

  // Build lineage: simulations that share the same root
  const lineage = allSims
    .filter(s => s.id === rootId || s.parent_simulation_id === rootId || s.id === simulation?.parent_simulation_id)
    .sort((a, b) => (a.version_number || 1) - (b.version_number || 1));

  const forkMutation = useMutation({
    mutationFn: () => base44.entities.Simulation.create({
      title: `${simulation.title} (Fork)`,
      scenario: simulation.scenario,
      selected_roles: simulation.selected_roles,
      use_case_type: simulation.use_case_type,
      parent_simulation_id: simulation.id,
      version_number: (simulation.version_number || 1) + 1,
      version_label: `Fork of v${simulation.version_number || 1}`,
      status: 'draft',
      tags: simulation.tags || [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Fork created — find it in your history');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4" /> Version History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {lineage.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No version history found for this simulation.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-3">
                {lineage.map((sim, idx) => {
                  const isActive = sim.id === simulation?.id;
                  const cfg = STATUS_CONFIG[sim.status] || STATUS_CONFIG.draft;
                  const Icon = cfg.icon;
                  return (
                    <div key={sim.id} className={`relative flex gap-3 pl-8 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                      <div className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 ${isActive ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'}`} />
                      <div className={`flex-1 rounded-lg border p-3 ${isActive ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{sim.title}</p>
                            {sim.version_label && (
                              <p className="text-xs text-slate-500">{sim.version_label}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-xs">v{sim.version_number || 1}</Badge>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {sim.created_date ? format(new Date(sim.created_date), 'MMM d, yyyy') : '—'}
                          </span>
                          {!isActive && (
                            <Button size="sm" variant="ghost" onClick={() => { onLoadVersion(sim); onOpenChange(false); }} className="h-6 text-xs px-2">
                              View this version →
                            </Button>
                          )}
                          {isActive && <span className="text-xs text-slate-500 font-medium">Current</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <Button
              onClick={() => forkMutation.mutate()}
              disabled={forkMutation.isPending}
              variant="outline"
              className="w-full gap-2 text-sm"
            >
              {forkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              Fork this simulation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}