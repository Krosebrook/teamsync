import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Target } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const outcomeIcons = {
  success: { icon: CheckCircle2, color: 'text-emerald-600' },
  partial_success: { icon: Target, color: 'text-amber-600' },
  failure: { icon: XCircle, color: 'text-rose-600' },
  abandoned: { icon: XCircle, color: 'text-slate-400' },
  ongoing: { icon: Clock, color: 'text-blue-600' }
};

export default function OutcomeTracker({ simulationId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outcome, setOutcome] = useState('success');
  const [notes, setNotes] = useState('');
  const [accuracy, setAccuracy] = useState(75);
  const [lessons, setLessons] = useState('');

  const { data: existingOutcome } = useQuery({
    queryKey: ['outcome', simulationId],
    queryFn: async () => {
      const outcomes = await base44.entities.SimulationOutcome.filter({ simulation_id: simulationId });
      return outcomes[0];
    },
    enabled: !!simulationId
  });

  const createOutcomeMutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationOutcome.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outcome', simulationId] });
      toast.success('Outcome recorded');
      setDialogOpen(false);
    },
  });

  const handleSubmit = () => {
    createOutcomeMutation.mutate({
      simulation_id: simulationId,
      actual_outcome: outcome,
      outcome_notes: notes,
      predicted_tensions_accuracy: accuracy,
      lessons_learned: lessons,
      outcome_date: new Date().toISOString().split('T')[0]
    });
  };

  if (existingOutcome) {
    const Icon = outcomeIcons[existingOutcome.actual_outcome]?.icon || Clock;
    const color = outcomeIcons[existingOutcome.actual_outcome]?.color || 'text-slate-500';

    return (
      <div className="p-3 border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-slate-700 capitalize">
            {existingOutcome.actual_outcome.replace(/_/g, ' ')}
          </span>
          <Badge variant="outline" className="ml-auto text-xs">
            {existingOutcome.predicted_tensions_accuracy}% accurate
          </Badge>
        </div>
        {existingOutcome.outcome_notes && (
          <p className="text-xs text-slate-600 mb-2">{existingOutcome.outcome_notes}</p>
        )}
        {existingOutcome.lessons_learned && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">Lessons Learned</p>
            <p className="text-xs text-slate-600">{existingOutcome.lessons_learned}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-2">
          <Target className="w-3 h-3" />
          Record Outcome
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track Decision Outcome</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Actual Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial_success">Partial Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
                <SelectItem value="ongoing">Still Ongoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Outcome Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What actually happened?"
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label>Prediction Accuracy ({accuracy}%)</Label>
            <input
              type="range"
              value={accuracy}
              onChange={(e) => setAccuracy(parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              How accurate were the predicted tensions?
            </p>
          </div>

          <div>
            <Label>Lessons Learned</Label>
            <Textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="Key takeaways for future decisions..."
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Save Outcome
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}