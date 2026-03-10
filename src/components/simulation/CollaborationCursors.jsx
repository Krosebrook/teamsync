import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function CollaborationCursors({ simulationId, currentUser }) {
  const { data: activeSessions = [] } = useQuery({
    queryKey: ['activeSessions', simulationId],
    queryFn: () => base44.entities.ActiveSession.filter({ simulation_id: simulationId }),
    refetchInterval: 1000,
  });

  // Filter out own cursor and inactive sessions (> 5 minutes old)
  const otherUsers = activeSessions.filter(session => {
    if (session.user_email === currentUser?.email) return false;
    const lastActivity = new Date(session.last_activity);
    const now = new Date();
    return (now - lastActivity) < 5 * 60 * 1000;
  });

  return (
    <div className="fixed top-14 right-80 pointer-events-none z-40 space-y-1">
      {otherUsers.map((session) => (
        <div
          key={session.id}
          className="text-xs px-2 py-1 rounded whitespace-nowrap"
          style={{
            backgroundColor: session.color,
            opacity: session.is_editing ? 1 : 0.6,
            border: `2px solid ${session.color}`,
          }}
        >
          <span className="text-white font-semibold">
            {session.user_email.split('@')[0]}
          </span>
          <span className="text-white text-xs ml-1">
            {session.cursor_position?.field}
          </span>
          {session.is_editing && (
            <span className="ml-1 animate-pulse">✏️</span>
          )}
        </div>
      ))}
    </div>
  );
}