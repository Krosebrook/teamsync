import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Users, 
  X,
  AtSign,
  Reply,
  Trash2,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollaborationPanel({ simulation, open, onOpenChange, initialCommentTarget }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [commentTarget, setCommentTarget] = useState({ type: null, value: null });

  useEffect(() => {
    if (initialCommentTarget) {
      setCommentTarget(initialCommentTarget);
    }
  }, [initialCommentTarget]);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', simulation?.id],
    queryFn: () => base44.entities.SimulationComment.filter({ simulation_id: simulation.id }),
    enabled: !!simulation?.id && open,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulation.id] });
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment added');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.SimulationComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulation.id] });
      toast.success('Comment deleted');
    },
  });

  const updateSimulationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Simulation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Simulation shared');
      setShareDialogOpen(false);
      setShareEmail('');
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const mentions = extractMentions(newComment);

    createCommentMutation.mutate({
      simulation_id: simulation.id,
      content: newComment,
      mentions,
      parent_comment_id: replyingTo?.id || null,
      role_id: commentTarget.type === 'role' ? commentTarget.value : null,
      tension_index: commentTarget.type === 'tension' ? commentTarget.value : null,
    });
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\S+@\S+\.\S+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  };

  const handleShare = () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    const currentShared = simulation.shared_with || [];
    if (currentShared.includes(shareEmail)) {
      toast.error('Already shared with this user');
      return;
    }

    updateSimulationMutation.mutate({
      id: simulation.id,
      data: {
        shared_with: [...currentShared, shareEmail]
      }
    });
  };

  const handleUnshare = (email) => {
    const currentShared = simulation.shared_with || [];
    updateSimulationMutation.mutate({
      id: simulation.id,
      data: {
        shared_with: currentShared.filter(e => e !== email)
      }
    });
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  if (!simulation) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Team Collaboration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Sharing Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Shared With</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShareDialogOpen(true)}
                  className="gap-2"
                >
                  <UserPlus className="w-3 h-3" />
                  Share
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {simulation.shared_with && simulation.shared_with.length > 0 ? (
                  simulation.shared_with.map(email => (
                    <Badge key={email} variant="outline" className="gap-2">
                      {email}
                      <button onClick={() => handleUnshare(email)}>
                        <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Not shared with anyone yet</p>
                )}
              </div>
            </Card>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussion ({comments.length})
              </h3>

              {/* New Comment */}
              <div className="space-y-2">
                {replyingTo && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-2 rounded">
                    <Reply className="w-3 h-3" />
                    Replying to {replyingTo.created_by}
                    <button onClick={() => setReplyingTo(null)} className="ml-auto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {commentTarget.type && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-violet-50 p-2 rounded">
                    <MessageSquare className="w-3 h-3" />
                    Commenting on {commentTarget.type}: {commentTarget.value}
                    <button onClick={() => setCommentTarget({ type: null, value: null })} className="ml-auto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... Use @email to mention someone"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentTarget({ type: 'role', value: null })}
                      className="h-7 text-xs"
                    >
                      Comment on Role
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentTarget({ type: 'tension', value: null })}
                      className="h-7 text-xs"
                    >
                      Comment on Tension
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {topLevelComments.map(comment => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <CommentCard
                        comment={comment}
                        replies={getReplies(comment.id)}
                        currentUser={currentUser}
                        onReply={setReplyingTo}
                        onDelete={deleteCommentMutation.mutate}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {comments.length === 0 && (
                  <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No comments yet. Start the discussion!</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Simulation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User Email</label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare}>
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CommentCard({ comment, replies, currentUser, onReply, onDelete }) {
  const canDelete = currentUser?.email === comment.created_by || currentUser?.role === 'admin';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-xs font-medium text-violet-700">
              {comment.created_by?.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{comment.created_by}</p>
            <p className="text-xs text-slate-500">
              {new Date(comment.created_date).toLocaleString()}
            </p>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(comment.id)}
            className="h-6 w-6"
          >
            <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
          </Button>
        )}
      </div>
      {(comment.role_id || comment.tension_index !== null) && (
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {comment.role_id && `Role: ${comment.role_id.replace(/_/g, ' ')}`}
            {comment.tension_index !== null && `Tension #${comment.tension_index + 1}`}
          </Badge>
        </div>
      )}
      <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{comment.content}</p>
      {comment.mentions && comment.mentions.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <AtSign className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">
            Mentioned: {comment.mentions.join(', ')}
          </span>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onReply(comment)}
        className="h-6 px-2 text-xs gap-1"
      >
        <Reply className="w-3 h-3" />
        Reply
      </Button>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-2">
          {replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replies={[]}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Card>
  );
}