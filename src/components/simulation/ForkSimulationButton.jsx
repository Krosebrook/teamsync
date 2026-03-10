import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { GitFork, Loader2, GitBranch, ArrowRight } from 'lucide-react';

/**
 * ForkSimulationButton
 *
 * Props:
 *   simulation       — the source simulation object
 *   onForkCreated    — callback(forkedSim) called after a successful fork
 *   size             — "sm" | "default" (Button size)
 *   variant          — Button variant
 */
export default function ForkSimulationButton({ simulation, onForkCreated, size = 'sm', variant = 'outline' }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  if (!simulation) return null;

  const defaultLabel = `Fork of "${simulation.title}"`;

  const handleFork = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('forkSimulation', {
        simulation_id: simulation.id,
        fork_label: label.trim() || defaultLabel,
      });

      if (!data?.success) throw new Error(data?.error || 'Fork failed');

      toast.success(`Fork created: "${data.fork.title}"`);
      setOpen(false);
      setLabel('');
      onForkCreated?.(data.fork);
    } catch (err) {
      toast.error(err.message || 'Failed to fork simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="gap-1.5"
        title="Fork this simulation into an independent draft"
      >
        <GitFork className="w-3 h-3" />
        Fork
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GitFork className="w-4 h-4 text-violet-600" />
              Fork Simulation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Lineage preview */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 min-w-0">
                <GitBranch className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate font-medium text-slate-700">{simulation.title}</span>
                {simulation.version_number && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">v{simulation.version_number}</Badge>
                )}
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-violet-600 font-medium flex-shrink-0">New fork (draft)</span>
            </div>

            {/* What gets copied */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-600 mb-2">What will be copied:</p>
              {[
                'All role configurations & influence levels',
                'Persona tunings and role profiles',
                'Scenario text & decision type',
                'Environmental factors',
                'Existing responses, tensions & trade-offs',
                'Next steps (reset to incomplete)',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* Fork label */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">Fork name</label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={defaultLabel}
                className="text-sm"
                onKeyDown={e => e.key === 'Enter' && handleFork()}
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700" onClick={handleFork} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitFork className="w-4 h-4" />}
                {loading ? 'Forking…' : 'Create Fork'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}