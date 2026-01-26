import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Copy } from "lucide-react";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VersionControl({ simulationId, onLoadVersion }) {
  const queryClient = useQueryClient();

  const { data: simulation } = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: async () => {
      const sims = await base44.entities.Simulation.filter({ id: simulationId });
      return sims[0];
    },
    enabled: !!simulationId
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', simulation?.parent_simulation_id || simulationId],
    queryFn: async () => {
      const parentId = simulation?.parent_simulation_id || simulationId;
      const allVersions = await base44.entities.Simulation.filter({ 
        $or: [
          { id: parentId },
          { parent_simulation_id: parentId }
        ]
      }, '-version_number');
      return allVersions;
    },
    enabled: !!simulation
  });

  const createBranchMutation = useMutation({
    mutationFn: async (label) => {
      const newVersion = await base44.entities.Simulation.create({
        ...simulation,
        id: undefined,
        parent_simulation_id: simulation.parent_simulation_id || simulationId,
        version_number: (simulation.version_number || 1) + 1,
        version_label: label,
        status: 'draft',
        created_date: undefined
      });
      return newVersion;
    },
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      toast.success('New version created');
      onLoadVersion?.(newVersion);
    },
  });

  const handleCreateBranch = () => {
    const label = prompt('Version label (optional):');
    createBranchMutation.mutate(label || '');
  };

  if (versions.length <= 1) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateBranch}
        className="w-full h-7 text-xs gap-2"
      >
        <GitBranch className="w-3 h-3" />
        Create Version
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Versions</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreateBranch}
          className="h-5 text-xs gap-1"
        >
          <Copy className="w-3 h-3" />
          Branch
        </Button>
      </div>
      
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {versions.map(version => (
          <button
            key={version.id}
            onClick={() => onLoadVersion?.(version)}
            className={`w-full p-2 border text-left transition-all ${
              version.id === simulationId 
                ? 'bg-slate-100 border-slate-300' 
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-700">
                v{version.version_number}
              </span>
              {version.version_label && (
                <Badge variant="outline" className="text-[10px] h-4">
                  {version.version_label}
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {format(new Date(version.created_date), 'MMM d, h:mm a')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}