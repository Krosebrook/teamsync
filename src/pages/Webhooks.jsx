import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Zap, Plus, Trash2, TestTube, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const ALL_EVENTS = [
  { id: 'simulation.started', label: 'Simulation Started' },
  { id: 'simulation.completed', label: 'Simulation Completed' },
  { id: 'tension.critical', label: 'Critical Tension Detected' },
  { id: 'tension.high', label: 'High Tension Detected' },
  { id: 'next_step.created', label: 'Next Step Created' },
];

const EVENT_COLORS = {
  'simulation.started': 'bg-blue-100 text-blue-700',
  'simulation.completed': 'bg-green-100 text-green-700',
  'tension.critical': 'bg-red-100 text-red-700',
  'tension.high': 'bg-orange-100 text-orange-700',
  'next_step.created': 'bg-violet-100 text-violet-700',
};

const DEFAULT_FORM = { name: '', url: '', events: [], secret: '' };

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [testing, setTesting] = useState(null);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Webhook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setFormOpen(false);
      setForm(DEFAULT_FORM);
      toast.success('Webhook created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Webhook.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webhook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
  });

  const handleToggleEvent = (eventId) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(eventId)
        ? f.events.filter(e => e !== eventId)
        : [...f.events, eventId],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.url.trim()) return toast.error('URL is required');
    if (!form.events.length) return toast.error('Select at least one event');
    createMutation.mutate({
      name: form.name,
      url: form.url,
      events: form.events,
      secret: form.secret || undefined,
      active: true,
      success_count: 0,
      failure_count: 0,
    });
  };

  const handleTest = async (webhook) => {
    setTesting(webhook.id);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (webhook.secret) headers['X-Webhook-Secret'] = webhook.secret;
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ event: 'test', timestamp: new Date().toISOString() }),
      });
      if (res.ok) {
        toast.success(`Test delivered to ${webhook.name}`);
      } else {
        toast.error(`Test failed — ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      toast.error(`Test failed — ${e.message}`);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 flex items-center justify-center rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Webhooks</h1>
              <p className="text-sm text-slate-500">Fire events to Slack, Zapier, n8n or any HTTP endpoint</p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No webhooks configured</p>
            <p className="text-sm text-slate-400 mt-1">Add one to fire events to Slack, n8n, Zapier, or any HTTP endpoint.</p>
            <Button className="mt-4 gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{webhook.name}</span>
                      {webhook.active ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-2">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(webhook.events || []).map(e => (
                        <span key={e} className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_COLORS[e] || 'bg-slate-100 text-slate-600'}`}>
                          {e}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {webhook.last_triggered && (
                        <span>Last fired: {format(new Date(webhook.last_triggered), 'MMM d, HH:mm')}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {webhook.success_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" />
                        {webhook.failure_count || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={!!webhook.active}
                      onCheckedChange={(v) => updateMutation.mutate({ id: webhook.id, data: { active: v } })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-8 text-xs"
                      disabled={testing === webhook.id}
                      onClick={() => handleTest(webhook)}
                    >
                      <TestTube className="w-3 h-3" />
                      {testing === webhook.id ? 'Testing…' : 'Test'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{webhook.name}" will be permanently deleted and will stop receiving events.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteMutation.mutate(webhook.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Webhook Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">Name</Label>
              <Input
                placeholder="e.g. Slack Notifications"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">URL</Label>
              <Input
                placeholder="https://hooks.slack.com/..."
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Events</Label>
              <div className="space-y-2">
                {ALL_EVENTS.map(ev => (
                  <div key={ev.id} className="flex items-center gap-2">
                    <Checkbox
                      id={ev.id}
                      checked={form.events.includes(ev.id)}
                      onCheckedChange={() => handleToggleEvent(ev.id)}
                    />
                    <Label htmlFor={ev.id} className="text-sm font-normal cursor-pointer">{ev.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Secret (optional)</Label>
              <Input
                placeholder="Sent as X-Webhook-Secret header"
                value={form.secret}
                onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Save Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}