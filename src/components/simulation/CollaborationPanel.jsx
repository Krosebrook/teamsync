import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, User, Check } from "lucide-react";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CollaborationPanel({ simulationId }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', simulationId],
    queryFn: () => base44.entities.SimulationComment.filter({ simulation_id: simulationId }, '-created_date'),
    enabled: !!simulationId
  });

  const { data: simulation } = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: async () => {
      const sims = await base44.entities.Simulation.filter({ id: simulationId });
      return sims[0];
    },
    enabled: !!simulationId
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      setNewComment('');
      toast.success('Comment added');
    },
  });

  const shareSimulationMutation = useMutation({
    mutationFn: ({ email }) => base44.entities.Simulation.update(simulationId, {
      shared_with: [...(simulation?.shared_with || []), email]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setShareEmail('');
      toast.success('Simulation shared');
    },
  });

  const toggleResolvedMutation = useMutation({
    mutationFn: ({ id, resolved }) => base44.entities.SimulationComment.update(id, { resolved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // Extract mentions (simple @email detection)
    const mentions = (newComment.match(/@[\w.-]+@[\w.-]+/g) || []).map(m => m.slice(1));

    createCommentMutation.mutate({
      simulation_id: simulationId,
      content: newComment,
      mentions
    });
  };

  const handleShare = () => {
    if (!shareEmail.trim() || !shareEmail.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    shareSimulationMutation.mutate({ email: shareEmail });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Shared With
        </h3>
        <div className="space-y-1 mb-2">
          {(simulation?.shared_with || []).map(email => (
            <div key={email} className="flex items-center gap-2 text-xs text-slate-600">
              <User className="w-3 h-3" />
              {email}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-7 text-xs"
          />
          <Button size="sm" onClick={handleShare} className="h-7 text-xs">
            Share
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Comments ({comments.length})
        </h3>

        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className={`p-2 border ${comment.resolved ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-slate-700">
                  {comment.created_by}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleResolvedMutation.mutate({ id: comment.id, resolved: !comment.resolved })}
                  className="h-5 w-5 p-0"
                >
                  <Check className={`w-3 h-3 ${comment.resolved ? 'text-emerald-600' : 'text-slate-300'}`} />
                </Button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {format(new Date(comment.created_date), 'MMM d, h:mm a')}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (use @email to mention)"
            className="min-h-[60px] text-xs resize-none"
          />
          <Button size="sm" onClick={handleAddComment} className="w-full h-7 text-xs gap-2">
            <Send className="w-3 h-3" />
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}