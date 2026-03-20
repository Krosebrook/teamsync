import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';

export default function PlaybookStepsPanel({ playbook }) {
  const [open, setOpen] = useState(true);
  const [completed, setCompleted] = useState({});

  if (!playbook?.steps?.length) return null;

  const toggle = (i) => setCompleted(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{playbook.name} — Framework Steps</span>
          <span className="text-xs text-slate-400">{Object.values(completed).filter(Boolean).length}/{playbook.steps.length}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          {playbook.steps.sort((a, b) => (a.order || 0) - (b.order || 0)).map((step, i) => (
            <div key={i} className={`px-4 py-3 flex gap-3 ${completed[i] ? 'bg-emerald-50/40' : 'bg-white'}`}>
              <button onClick={() => toggle(i)} className="mt-0.5 shrink-0">
                {completed[i]
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Circle className="w-4 h-4 text-slate-300" />}
              </button>
              <div>
                <p className={`text-sm font-medium ${completed[i] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {step.order}. {step.name}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}