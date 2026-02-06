import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

export default function RealTimeSync({ simulationId }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!simulationId) return;

    // Subscribe to simulation updates
    const unsubscribe = base44.entities.Simulation.subscribe((event) => {
      if (event.id === simulationId) {
        if (event.type === 'update') {
          queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
          queryClient.invalidateQueries({ queryKey: ['simulations'] });
          
          // Show notification for co-editing (but not for own edits)
          const updatedBy = event.data?.updated_by;
          if (updatedBy && updatedBy !== currentUser?.email) {
            toast.info(
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Simulation updated by {updatedBy}</span>
              </div>,
              {
                duration: 3000,
                position: 'bottom-right'
              }
            );
          }
        }
      }
    });

    // Subscribe to comments
    const unsubscribeComments = base44.entities.SimulationComment.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      
      if (event.type === 'create') {
        const createdBy = event.data?.created_by;
        const mentions = event.data?.mentions || [];
        
        // Notify if mentioned or if it's a new comment from someone else
        if (mentions.includes(currentUser?.email)) {
          toast.info(
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span><strong>{createdBy}</strong> mentioned you in a comment</span>
            </div>,
            {
              duration: 5000,
              position: 'bottom-right'
            }
          );
        } else if (createdBy && createdBy !== currentUser?.email) {
          toast.info(
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>New comment from {createdBy}</span>
            </div>,
            {
              duration: 3000,
              position: 'bottom-right'
            }
          );
        }
      }
    });

    // Subscribe to sharing updates
    const unsubscribeSharing = base44.entities.Simulation.subscribe((event) => {
      if (event.type === 'update' && event.data?.shared_with) {
        const sharedWith = event.data.shared_with;
        if (sharedWith.includes(currentUser?.email)) {
          const sharedBy = event.data?.updated_by;
          if (sharedBy !== currentUser?.email) {
            toast.success(
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span><strong>{sharedBy}</strong> shared a simulation with you</span>
              </div>,
              {
                duration: 5000,
                position: 'bottom-right'
              }
            );
          }
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeComments();
      unsubscribeSharing();
    };
  }, [simulationId, queryClient, currentUser]);

  return null;
}