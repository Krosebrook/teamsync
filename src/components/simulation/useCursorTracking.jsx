import { useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useCursorTracking(simulationId) {
  const timeoutRef = useRef(null);

  const trackCursor = useCallback((field, lineNum = 0, charNum = 0, isEditing = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    base44.functions.invoke('updateCursorPosition', {
      simulation_id: simulationId,
      field,
      line: lineNum,
      char: charNum,
      is_editing: isEditing,
    }).catch(() => {});

    // Debounce — only update every 500ms during typing
    timeoutRef.current = setTimeout(() => {
      if (isEditing) {
        base44.functions.invoke('updateCursorPosition', {
          simulation_id: simulationId,
          field,
          is_editing: false,
        }).catch(() => {});
      }
    }, 500);
  }, [simulationId]);

  return trackCursor;
}