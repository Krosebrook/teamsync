import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  AtSign,
  Send,
  X,
  Reply,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const REACTIONS = ['agree', 'disagree', 'question', 'flag', 'idea'];
const REACTION_LABELS = {
  agree: '👍 Agree',
  disagree: '👎 Disagree',
  question: '❓ Question',
  flag: '🚩 Flag',
  idea: '💡 Idea',
};

function CommentThread({ comments, onReply, onEndorse, onResolve, user }) {
  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="border-l-2 border-slate-200 pl-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {comment.created_by?.split('@')[0] || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(comment.created_date).toLocaleDateString()}
              </p>
            </div>
            {comment.resolved && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                Resolved
              </div>
            )}
          </div>

          <p className="text-sm text-slate-700">{comment.content}</p>

          {comment.reaction && (
            <Badge className="text-xs">{REACTION_LABELS[comment.reaction]}</Badge>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEndorse(comment.id)}
              className="text-xs gap-1"
            >
              <ThumbsUp className="w-3 h-3" />
              {comment.endorsements?.length || 0}
            </Button>
            {!comment.resolved && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onResolve(comment.id)}
                className="text-xs"
              >
                Resolve
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReply(comment.id)}
              className="text-xs gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </Button>
          </div>

          {comment.replies?.length > 0 && (
            <div className="mt-2 ml-2 space-y-2">
              <CommentThread
                comments={comment.replies}
                onReply={onReply}
                onEndorse={onEndorse}
                onResolve={onResolve}
                user={user}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SimulationCommentsPanel({
  open,
  onOpenChange,
  simulation,
  targetType,
  targetId,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: fetchedComments } = useQuery({
    queryKey: ['simulation_comments', simulation?.id, targetType, targetId],
    queryFn: async () => {
      if (!simulation?.id || !targetType || !targetId) return [];
      return base44.entities.SimulationComment.filter({
        simulation_id: simulation.id,
        target_type: targetType,
        target_label: targetId,
      });
    },
    enabled: !!simulation?.id && !!targetType && !!targetId,
  });

  useEffect(() => {
    if (fetchedComments) setComments(fetchedComments);
  }, [fetchedComments]);

  const addComment = useMutation({
    mutationFn: async () => {
      if (!newComment.trim()) throw new Error('Comment cannot be empty');

      return base44.entities.SimulationComment.create({
        simulation_id: simulation.id,
        content: newComment,
        target_type: targetType,
        target_label: targetId,
        parent_comment_id: replyingTo,
        reaction: selectedReaction,
      });
    },
    onSuccess: () => {
      setNewComment('');
      setSelectedReaction(null);
      setReplyingTo(null);
      queryClient.invalidateQueries({
        queryKey: ['simulation_comments', simulation?.id, targetType, targetId],
      });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  const endorseComment = useMutation({
    mutationFn: async (commentId) => {
      const comment = comments.find((c) => c.id === commentId);
      const endorsements = comment?.endorsements || [];
      const alreadyEndorsed = endorsements.includes(user?.email);

      return base44.entities.SimulationComment.update(commentId, {
        endorsements: alreadyEndorsed
          ? endorsements.filter((e) => e !== user?.email)
          : [...endorsements, user?.email],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['simulation_comments', simulation?.id, targetType, targetId],
      });
    },
  });

  const resolveComment = useMutation({
    mutationFn: (commentId) =>
      base44.entities.SimulationComment.update(commentId, { resolved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['simulation_comments', simulation?.id, targetType, targetId],
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comments on {targetType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.filter((c) => !c.parent_comment_id).length > 0 ? (
            <CommentThread
              comments={comments.filter((c) => !c.parent_comment_id)}
              onReply={setReplyingTo}
              onEndorse={(id) => endorseComment.mutate(id)}
              onResolve={(id) => resolveComment.mutate(id)}
              user={user}
            />
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-sm"
            rows="3"
          />

          <div className="flex flex-wrap gap-1">
            {REACTIONS.map((reaction) => (
              <Button
                key={reaction}
                size="sm"
                variant={selectedReaction === reaction ? 'default' : 'outline'}
                onClick={() => setSelectedReaction(selectedReaction === reaction ? null : reaction)}
                className="text-xs"
              >
                {REACTION_LABELS[reaction]}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            {replyingTo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel Reply
              </Button>
            )}
            <Button
              onClick={() => addComment.mutate()}
              disabled={addComment.isPending || !newComment.trim()}
              className="ml-auto gap-1 text-xs"
            >
              <Send className="w-3 h-3" />
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}