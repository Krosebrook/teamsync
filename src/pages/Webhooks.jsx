import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { id: 'simulation.started', label: 'Simulation Started', desc: 'When a new simulation begins' },
  { id: 'simulation.completed', label: 'Simulation Completed', desc: 'When simulation analysis finishes' },
  { id: 'tension.critical', label: 'Critical Tension Detected', desc: 'When a critical tension is identified' },
  { id: 'tension.high', label: 'High Tension Detected', desc: 'When a high-severity tension is found' },
  { id: 'next_step.created', label: 'Next Step Created', desc: 'When action items are generated' },
];

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    secret: '',
  });
  const [testingWebhookId, setTestingWebhookId] = useState(null);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook.list('-updated_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Webhook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setOpenDialog(false);
      resetForm();
      toast.success('Webhook created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Webhook.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setOpenDialog(false);
      resetForm();
      toast.success('Webhook updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webhook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
  });

  const testMutation = useMutation({
    mutationFn: async (webhookId) => {
      // Fetch the webhook to get its details
      const webhookList = await base44.entities.Webhook.filter({ id: webhookId });
      const webhook = webhookList[0];
      
      if (!webhook) throw new Error('Webhook not found');

      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook payload'
      };

      // Fire the webhook directly
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Update webhook metrics
      await base44.entities.Webhook.update(webhook.id, {
        success_count: (webhook.success_count || 0) + 1,
        last_triggered: new Date().toISOString()
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Test payload delivered successfully');
      setTestingWebhookId(null);
    },
    onError: (err) => {
      toast.error(`Test failed: ${err.message}`);
      setTestingWebhookId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
    });
    setEditingWebhook(null);
  };

  const handleOpenDialog = (webhook = null) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData(webhook);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingWebhook) {
      await updateMutation.mutateAsync({
        id: editingWebhook.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const toggleEvent = (eventId) => {
    setFormData({
      ...formData,
      events: formData.events.includes(eventId)
        ? formData.events.filter(e => e !== eventId)
        : [...formData.events, eventId]
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Webhooks</h1>
            <p className="text-slate-600 mt-1">Manage integrations and event notifications</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </Button>
        </div>

        {/* Webhooks Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-3">No webhooks configured</p>
            <Button onClick={() => handleOpenDialog()} variant="outline">
              Create your first webhook
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Events</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Success / Failures</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Triggered</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map(webhook => (
                    <tr key={webhook.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{webhook.name}</p>
                          <p className="text-xs text-slate-500 truncate">{webhook.url}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {webhook.events?.slice(0, 2).map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {EVENT_TYPES.find(e => e.id === event)?.label || event}
                            </Badge>
                          ))}
                          {webhook.events?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={webhook.active !== false ? 'border-green-200 text-green-700' : 'border-slate-200 text-slate-700'}
                        >
                          {webhook.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 className="w-4 h-4" />
                            {webhook.success_count || 0}
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            {webhook.failure_count || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {webhook.last_triggered ? new Date(webhook.last_triggered).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testMutation.mutate(webhook.id)}
                            disabled={testingWebhookId === webhook.id}
                            className="gap-1 text-xs"
                          >
                            <Play className="w-3 h-3" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(webhook)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(webhook.id)}
                            className="text-destructive text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Webhook Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">URL *</label>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://hooks.slack.com/..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Secret (optional)</label>
                <Input
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Leave blank if not needed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Events to Subscribe *</label>
                <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
                  {EVENT_TYPES.map(event => (
                    <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingWebhook ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}