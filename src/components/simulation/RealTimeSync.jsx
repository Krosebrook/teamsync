import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function RealTimeSync({ simulationId }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!simulationId) return;

    // Subscribe to simulation updates
    const unsubscribe = base44.entities.Simulation.subscribe((event) => {
      if (event.id === simulationId) {
        if (event.type === 'update') {
          queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
          queryClient.invalidateQueries({ queryKey: ['simulations'] });
          
          // Show toast for co-editing
          const updatedBy = event.data?.updated_by;
          if (updatedBy) {
            toast.info(`Simulation updated by ${updatedBy}`, {
              duration: 2000,
              position: 'bottom-right'
            });
          }
        }
      }
    });

    // Subscribe to comments
    const unsubscribeComments = base44.entities.SimulationComment.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      
      if (event.type === 'create') {
        const createdBy = event.data?.created_by;
        if (createdBy) {
          toast.info(`New comment from ${createdBy}`, {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeComments();
    };
  }, [simulationId, queryClient]);

  return null;
}