import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  MessageSquare, Send, Users, X, AtSign, Reply, Trash2, UserPlus,
  ThumbsUp, CheckCircle2, Flag, Lightbulb, HelpCircle, Check,
  ListTodo, Filter, ChevronDown, ChevronUp, Pin, AlertCircle,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTIONS = [
  { id: 'agree',    icon: ThumbsUp,     label: 'Agree',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'disagree', icon: X,            label: 'Disagree',  color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'question', icon: HelpCircle,   label: 'Question',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'flag',     icon: Flag,         label: 'Flag',      color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'idea',     icon: Lightbulb,    label: 'Idea',      color: 'text-violet-600 bg-violet-50 border-violet-200' },
];

const TARGET_OPTIONS = [
  { id: 'general',   label: 'General Discussion' },
  { id: 'outcome',   label: 'Outcome' },
  { id: 'role',      label: 'Role Perspective' },
  { id: 'tension',   label: 'Tension' },
  { id: 'next_step', label: 'Next Step' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(email) {
  if (!email) return '??';
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : email.substring(0, 2).toUpperCase();
}

function Avatar({ email, size = 'sm' }) {
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  const colorIdx = email ? email.charCodeAt(0) % colors.length : 0;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`rounded-full flex items-center justify-center font-semibold shrink-0 ${sizeClass} ${colors[colorIdx]}`}>
      {getInitials(email)}
    </div>
  );
}

function ReactionBadge({ reaction }) {
  const r = REACTIONS.find(x => x.id === reaction);
  if (!r) return null;
  const Icon = r.icon;
  return (
    <Badge className={`text-xs border gap-1 px-1.5 py-0.5 ${r.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {r.label}
    </Badge>
  );
}

function TargetBadge({ comment }) {
  if (!comment.target_type || comment.target_type === 'general') return null;
  return (
    <Badge variant="outline" className="text-xs gap-1 shrink-0">
      {comment.target_label || `${comment.target_type}`}
    </Badge>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({ comment, replies, currentUser, onReply, onDelete, onEndorse, onResolve, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(true);
  const canDelete = currentUser?.email === comment.created_by || currentUser?.role === 'admin';
  const hasEndorsed = (comment.endorsements || []).includes(currentUser?.email);
  const endorseCount = (comment.endorsements || []).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`${depth > 0 ? 'pl-4 border-l-2 border-slate-100' : ''}`}
    >
      <div className={`rounded-lg border p-3 space-y-2 ${comment.resolved ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-start gap-2">
          <Avatar email={comment.created_by} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">{comment.created_by}</span>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
              </span>
              {comment.resolved && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                </Badge>
              )}
              <TargetBadge comment={comment} />
              {comment.reaction && <ReactionBadge reaction={comment.reaction} />}
            </div>
          </div>
          {canDelete && (
            <button onClick={() => onDelete(comment.id)} className="text-slate-300 hover:text-rose-500 shrink-0 mt-0.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>

        {/* Action item */}
        {comment.action_item && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs">
            <ListTodo className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-blue-800 font-medium">{comment.action_item}</span>
            {comment.action_assignee && (
              <Badge variant="outline" className="ml-auto text-xs shrink-0">→ {comment.action_assignee}</Badge>
            )}
          </div>
        )}

        {/* Mentions */}
        {comment.mentions?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <AtSign className="w-3 h-3" />
            {comment.mentions.join(', ')}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-1 pt-1 flex-wrap">
          {/* Endorse */}
          <button
            onClick={() => onEndorse(comment)}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all
              ${hasEndorsed ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
          >
            <ThumbsUp className="w-3 h-3" />
            {endorseCount > 0 ? endorseCount : 'Endorse'}
          </button>

          {/* Reply */}
          {depth === 0 && (
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}

          {/* Resolve */}
          {!comment.resolved && !comment.parent_comment_id && (
            <button
              onClick={() => onResolve(comment)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              <Check className="w-3 h-3" />
              Resolve
            </button>
          )}

          {/* Show/hide replies */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 ml-auto"
            >
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {replies.map(r => (
            <CommentCard
              key={r.id}
              comment={r}
              replies={[]}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              onEndorse={onEndorse}
              onResolve={onResolve}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── New Comment Form ─────────────────────────────────────────────────────────

function NewCommentForm({ simulation, replyingTo, onCancelReply, commentTarget, onClearTarget, onSuccess }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [reaction, setReaction] = useState('');
  const [targetType, setTargetType] = useState(commentTarget?.type || 'general');
  const [targetLabel, setTargetLabel] = useState(commentTarget?.label || '');
  const [actionItem, setActionItem] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [showActionItem, setShowActionItem] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (commentTarget?.type) {
      setTargetType(commentTarget.type);
      setTargetLabel(commentTarget.label || '');
    }
  }, [commentTarget]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.SimulationComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulation.id] });
      setContent('');
      setReaction('');
      setActionItem('');
      setActionAssignee('');
      setShowActionItem(false);
      onCancelReply?.();
      onClearTarget?.();
      toast.success('Comment added');
      onSuccess?.();
    },
  });

  const extractMentions = (text) => {
    const matches = text.match(/@(\S+@\S+\.\S+)/g);
    return matches ? matches.map(m => m.substring(1)) : [];
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    mutation.mutate({
      simulation_id: simulation.id,
      content,
      mentions: extractMentions(content),
      parent_comment_id: replyingTo?.id || null,
      target_type: targetType,
      target_label: targetLabel || targetType,
      role_id: targetType === 'role' ? targetLabel : null,
      tension_index: targetType === 'tension' ? parseInt(targetLabel) : null,
      reaction: reaction || null,
      action_item: actionItem || null,
      action_assignee: actionAssignee || null,
      resolved: false,
      endorsements: [],
    });
  };

  return (
    <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-white">
      {replyingTo && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
          <Reply className="w-3 h-3 text-blue-500" />
          Replying to <span className="font-medium">{replyingTo.created_by}</span>
          <button onClick={onCancelReply} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Target selector */}
      {!replyingTo && (
        <div className="flex items-center gap-2">
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger className="h-7 text-xs w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_OPTIONS.map(o => <SelectItem key={o.id} value={o.id} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(targetType === 'role' || targetType === 'tension' || targetType === 'next_step') && (
            <Input
              value={targetLabel}
              onChange={e => setTargetLabel(e.target.value)}
              placeholder={targetType === 'role' ? 'Role name' : targetType === 'tension' ? 'Tension #' : 'Step description'}
              className="h-7 text-xs flex-1"
            />
          )}
        </div>
      )}

      {/* Reaction picker */}
      <div className="flex gap-1 flex-wrap">
        {REACTIONS.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setReaction(prev => prev === r.id ? '' : r.id)}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all
                ${reaction === r.id ? r.color : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
              title={r.label}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{r.label}</span>
            </button>
          );
        })}
      </div>

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add a comment… Use @email to mention someone"
        className="min-h-[72px] resize-none text-sm"
        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
      />

      {/* Action item toggle */}
      {showActionItem ? (
        <div className="space-y-1.5 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs font-medium text-blue-800 flex items-center gap-1.5">
            <ListTodo className="w-3.5 h-3.5" /> Action Item
            <button onClick={() => setShowActionItem(false)} className="ml-auto"><X className="w-3 h-3" /></button>
          </p>
          <Input value={actionItem} onChange={e => setActionItem(e.target.value)} placeholder="What needs to be done?" className="h-7 text-xs" />
          <Input value={actionAssignee} onChange={e => setActionAssignee(e.target.value)} placeholder="Assignee email (optional)" className="h-7 text-xs" />
        </div>
      ) : (
        <button onClick={() => setShowActionItem(true)} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
          <ListTodo className="w-3 h-3" /> Add action item
        </button>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">⌘ + Enter to post</span>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || mutation.isPending} className="gap-1.5 h-7">
          <Send className="w-3.5 h-3.5" />
          {mutation.isPending ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </div>
  );
}

// ─── Action Items Tab ─────────────────────────────────────────────────────────

function ActionItemsTab({ comments, currentUser }) {
  const actionComments = comments.filter(c => c.action_item);
  if (actionComments.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 space-y-2">
        <ListTodo className="w-8 h-8 mx-auto opacity-40" />
        <p className="text-sm">No action items yet. Add one from a comment.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {actionComments.map(c => (
        <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${c.resolved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 font-medium">{c.action_item}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-400">from: {c.created_by}</span>
              {c.action_assignee && (
                <Badge variant="outline" className="text-xs">→ {c.action_assignee}</Badge>
              )}
              {c.resolved && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Resolved</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Votes / Endorsements Tab ─────────────────────────────────────────────────

function VotesTab({ comments }) {
  const withEndorsements = comments
    .filter(c => (c.endorsements || []).length > 0)
    .sort((a, b) => (b.endorsements?.length || 0) - (a.endorsements?.length || 0));

  if (withEndorsements.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 space-y-2">
        <ThumbsUp className="w-8 h-8 mx-auto opacity-40" />
        <p className="text-sm">No endorsed comments yet. React to comments to surface key insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Top Endorsed Insights</p>
      {withEndorsements.map(c => (
        <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <ThumbsUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">{c.endorsements?.length}</span>
          </div>
          <div className="flex-1 min-w-0">
            {c.reaction && <div className="mb-1"><ReactionBadge reaction={c.reaction} /></div>}
            <p className="text-sm text-slate-800 leading-relaxed">{c.content}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-400">{c.created_by}</span>
              <TargetBadge comment={c} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(c.endorsements || []).map(e => (
                <Avatar key={e} email={e} size="xs" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CollaborationPanel({ simulation, open, onOpenChange, initialCommentTarget }) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [activeTab, setActiveTab] = useState('discussion');

  useEffect(() => {
    if (initialCommentTarget) setCommentTarget(initialCommentTarget);
  }, [initialCommentTarget]);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', simulation?.id],
    queryFn: () => base44.entities.SimulationComment.filter({ simulation_id: simulation.id }),
    enabled: !!simulation?.id && open,
    refetchInterval: open ? 8000 : false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SimulationComment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', simulation.id] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SimulationComment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', simulation.id] }),
  });

  const simMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Simulation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setShareDialogOpen(false);
      setShareEmail('');
      toast.success('Shared');
    },
  });

  const handleEndorse = (comment) => {
    const endorsements = comment.endorsements || [];
    const email = currentUser?.email;
    if (!email) return;
    const updated = endorsements.includes(email)
      ? endorsements.filter(e => e !== email)
      : [...endorsements, email];
    updateMutation.mutate({ id: comment.id, data: { endorsements: updated } });
  };

  const handleResolve = (comment) => {
    updateMutation.mutate({ id: comment.id, data: { resolved: true } });
    toast.success('Marked as resolved');
  };

  const handleShare = () => {
    if (!shareEmail.trim()) return;
    const current = simulation.shared_with || [];
    if (current.includes(shareEmail)) { toast.error('Already shared'); return; }
    simMutation.mutate({ id: simulation.id, data: { shared_with: [...current, shareEmail] } });
  };

  const handleUnshare = (email) => {
    simMutation.mutate({ id: simulation.id, data: { shared_with: (simulation.shared_with || []).filter(e => e !== email) } });
  };

  // Filter comments
  const topLevel = comments.filter(c => !c.parent_comment_id);
  const filtered = filterType === 'all' ? topLevel
    : filterType === 'unresolved' ? topLevel.filter(c => !c.resolved)
    : filterType === 'action_items' ? topLevel.filter(c => c.action_item)
    : topLevel.filter(c => c.reaction === filterType);
  const getReplies = (id) => comments.filter(c => c.parent_comment_id === id);

  const unresolvedCount = topLevel.filter(c => !c.resolved).length;
  const actionCount = comments.filter(c => c.action_item).length;
  const topEndorsed = comments.filter(c => (c.endorsements || []).length > 0).length;

  if (!simulation) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-blue-600" />
              Team Collaboration
              <Badge variant="outline" className="ml-auto text-xs font-normal gap-1">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </Badge>
            </DialogTitle>

            {/* Stats row */}
            <div className="flex gap-3 pt-1 flex-wrap">
              {unresolvedCount > 0 && (
                <button onClick={() => { setActiveTab('discussion'); setFilterType('unresolved'); }}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800">
                  <AlertCircle className="w-3 h-3" /> {unresolvedCount} unresolved
                </button>
              )}
              {actionCount > 0 && (
                <button onClick={() => setActiveTab('actions')}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <ListTodo className="w-3 h-3" /> {actionCount} action{actionCount !== 1 ? 's' : ''}
                </button>
              )}
              {topEndorsed > 0 && (
                <button onClick={() => setActiveTab('votes')}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800">
                  <ThumbsUp className="w-3 h-3" /> {topEndorsed} endorsed
                </button>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-5 mt-3 mb-2 w-auto justify-start bg-slate-100 h-8 shrink-0">
              <TabsTrigger value="discussion" className="text-xs h-6 data-[state=active]:bg-white">
                <MessageSquare className="w-3 h-3 mr-1" /> Discussion
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs h-6 data-[state=active]:bg-white">
                <ListTodo className="w-3 h-3 mr-1" /> Actions
                {actionCount > 0 && <Badge className="ml-1 h-4 px-1 text-[10px] bg-blue-600 text-white border-0">{actionCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="votes" className="text-xs h-6 data-[state=active]:bg-white">
                <ThumbsUp className="w-3 h-3 mr-1" /> Endorsed
              </TabsTrigger>
              <TabsTrigger value="sharing" className="text-xs h-6 data-[state=active]:bg-white">
                <UserPlus className="w-3 h-3 mr-1" /> Sharing
              </TabsTrigger>
            </TabsList>

            {/* Discussion Tab */}
            <TabsContent value="discussion" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
              {/* Filter bar */}
              <div className="px-5 pb-2 flex items-center gap-2 shrink-0 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {['all', 'unresolved', 'agree', 'disagree', 'question', 'flag', 'idea', 'action_items'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-all capitalize
                      ${filterType === f ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {f.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* New comment form */}
              <div className="px-5 pb-3 shrink-0">
                <NewCommentForm
                  simulation={simulation}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  commentTarget={commentTarget}
                  onClearTarget={() => setCommentTarget(null)}
                />
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
                <AnimatePresence>
                  {filtered.map(comment => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      replies={getReplies(comment.id)}
                      currentUser={currentUser}
                      onReply={setReplyingTo}
                      onDelete={deleteMutation.mutate}
                      onEndorse={handleEndorse}
                      onResolve={handleResolve}
                    />
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-sm">
                      {filterType === 'all' ? 'No comments yet — start the discussion!' : `No "${filterType.replace(/_/g, ' ')}" comments.`}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="flex-1 overflow-y-auto px-5 py-3 mt-0">
              <ActionItemsTab comments={comments} currentUser={currentUser} />
            </TabsContent>

            {/* Votes Tab */}
            <TabsContent value="votes" className="flex-1 overflow-y-auto px-5 py-3 mt-0">
              <VotesTab comments={comments} />
            </TabsContent>

            {/* Sharing Tab */}
            <TabsContent value="sharing" className="flex-1 overflow-y-auto px-5 py-3 mt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') handleShare(); }}
                  />
                  <Button size="sm" onClick={handleShare} disabled={!shareEmail.trim()} className="h-8 gap-1 shrink-0">
                    <UserPlus className="w-3.5 h-3.5" /> Share
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(simulation.shared_with || []).length === 0 ? (
                    <p className="text-sm text-slate-400">Not shared with anyone yet.</p>
                  ) : (
                    simulation.shared_with.map(email => (
                      <Badge key={email} variant="outline" className="gap-2 text-sm">
                        <Avatar email={email} size="xs" />
                        {email}
                        <button onClick={() => handleUnshare(email)}>
                          <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}