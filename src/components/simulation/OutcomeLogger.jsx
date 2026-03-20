import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Edit2, Target, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const OUTCOME_OPTIONS = [
  { value: 'success', label: 'It worked', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'partial_success', label: 'Partially worked', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'failure', label: 'It failed', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'abandoned', label: 'We dropped it', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'ongoing', label: 'Still in progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
];

export default function OutcomeLogger({ simulation }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    actual_outcome: '',
    predicted_tensions_accuracy: 50,
    outcome_notes: '',
    unexpected_issues: [],
    lessons_learned: '',
    outcome_date: new Date().toISOString().split('T')[0],
  });
  const [issueInput, setIssueInput] = useState('');

  const { data: outcomes = [] } = useQuery({
    queryKey: ['simulationOutcome', simulation?.id],
    queryFn: () => base44.entities.SimulationOutcome.filter({ simulation_id: simulation.id }),
    enabled: !!simulation?.id,
  });

  const existing = outcomes[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationOutcome.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulationOutcome', simulation.id] });
      setIsEditing(false);
      toast.success('Outcome logged!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SimulationOutcome.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulationOutcome', simulation.id] });
      setIsEditing(false);
      toast.success('Outcome updated!');
    },
  });

  const handleEdit = () => {
    if (existing) {
      setForm({
        actual_outcome: existing.actual_outcome || '',
        predicted_tensions_accuracy: existing.predicted_tensions_accuracy ?? 50,
        outcome_notes: existing.outcome_notes || '',
        unexpected_issues: existing.unexpected_issues || [],
        lessons_learned: existing.lessons_learned || '',
        outcome_date: existing.outcome_date || new Date().toISOString().split('T')[0],
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!form.actual_outcome) { toast.error('Please select an outcome'); return; }
    const payload = { ...form, simulation_id: simulation.id };
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addIssue = () => {
    if (issueInput.trim()) {
      setForm(f => ({ ...f, unexpected_issues: [...f.unexpected_issues, issueInput.trim()] }));
      setIssueInput('');
    }
  };

  const removeIssue = (i) => setForm(f => ({ ...f, unexpected_issues: f.unexpected_issues.filter((_, idx) => idx !== i) }));

  const outcomeOption = OUTCOME_OPTIONS.find(o => o.value === existing?.actual_outcome);

  if (existing && !isEditing) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">Outcome Logged</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleEdit} className="h-6 text-xs gap-1">
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {outcomeOption && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${outcomeOption.color}`}>
              {outcomeOption.label}
            </span>
          )}
          <span className="text-xs text-slate-500">
            Tension accuracy: <strong>{existing.predicted_tensions_accuracy ?? '—'}%</strong>
          </span>
          {existing.outcome_date && (
            <span className="text-xs text-slate-400">{existing.outcome_date}</span>
          )}
        </div>
        {existing.outcome_notes && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{existing.outcome_notes}</p>
        )}
        {existing.lessons_learned && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Lessons learned</p>
            <p className="text-sm text-slate-600">{existing.lessons_learned}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center">
        <Target className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700 mb-1">What actually happened?</p>
        <p className="text-xs text-slate-500 mb-3">Close the loop by recording what actually occurred vs. what the simulation predicted.</p>
        <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2">
          <Plus className="w-3 h-3" /> Log Outcome
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Log Outcome</p>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(false)}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Outcome selector */}
      <div>
        <p className="text-xs text-slate-500 mb-2">What happened?</p>
        <div className="flex flex-wrap gap-2">
          {OUTCOME_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setForm(f => ({ ...f, actual_outcome: o.value }))}
              className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                form.actual_outcome === o.value ? o.color + ' ring-2 ring-offset-1 ring-slate-400' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tension accuracy slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-slate-500">How accurate were the predicted tensions?</p>
          <span className="text-xs font-medium text-slate-700">{form.predicted_tensions_accuracy}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Completely wrong</span>
          <input
            type="range" min="0" max="100" value={form.predicted_tensions_accuracy}
            onChange={e => setForm(f => ({ ...f, predicted_tensions_accuracy: Number(e.target.value) }))}
            className="flex-1 h-1.5 accent-slate-800"
          />
          <span>Spot on</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs text-slate-500 mb-1">What actually happened?</p>
        <Textarea
          value={form.outcome_notes}
          onChange={e => setForm(f => ({ ...f, outcome_notes: e.target.value }))}
          placeholder="Describe the actual outcome..."
          className="text-sm h-20 resize-none"
        />
      </div>

      {/* Unexpected issues */}
      <div>
        <p className="text-xs text-slate-500 mb-1">What did the simulation miss?</p>
        <div className="flex gap-2">
          <Input
            value={issueInput}
            onChange={e => setIssueInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIssue()}
            placeholder="Add an issue and press Enter"
            className="text-sm h-8"
          />
          <Button size="sm" variant="outline" onClick={addIssue} className="h-8 px-2">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        {form.unexpected_issues.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.unexpected_issues.map((issue, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {issue}
                <button onClick={() => removeIssue(i)}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lessons learned */}
      <div>
        <p className="text-xs text-slate-500 mb-1">Key lessons learned</p>
        <Textarea
          value={form.lessons_learned}
          onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))}
          placeholder="What would you do differently next time?"
          className="text-sm h-16 resize-none"
        />
      </div>

      {/* Date */}
      <div>
        <p className="text-xs text-slate-500 mb-1">When was the outcome determined?</p>
        <Input
          type="date"
          value={form.outcome_date}
          onChange={e => setForm(f => ({ ...f, outcome_date: e.target.value }))}
          className="text-sm h-8 w-40"
        />
      </div>

      <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Outcome'}
      </Button>
    </div>
  );
}