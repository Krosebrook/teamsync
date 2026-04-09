import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

export function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const state = history[index];

  const setState = useCallback((newState) => {
    setHistory((h) => {
      const truncated = h.slice(0, index + 1);
      const next = [...truncated, newState].slice(-MAX_HISTORY);
      return next;
    });
    setIndex((i) => Math.min(i + 1, MAX_HISTORY - 1));
  }, [index]);

  const undo = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const redo = useCallback(() => {
    setIndex((i) => Math.min(i + 1, history.length - 1));
  }, [history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const reset = useCallback((newState) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  return { state, setState, undo, redo, canUndo, canRedo, reset };
}