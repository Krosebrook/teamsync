import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, Edit2, CheckCircle2, XCircle, Clock } from "lucide-react";

const EVENT_OPTIONS = [
  { id: 'simulation.started', label: 'Simulation Started', description: 'When a simulation begins running' },
  { id: 'simulation.completed', label: 'Simulation Completed', description: 'When a simulation finishes' },
  { id: 'tension.critical', label: 'Critical Tension', description: 'When a critical tension is identified' },
  { id: 'tension.high', label: 'High Tension', description: 'When a high tension is identified' },
  { id: 'next_step.created', label: 'Next Step Created', description: 'When next steps are generated' },
];

export default function WebhookManager({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Webhook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created');
      setFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Webhook.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook updated');
      setFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webhook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    payload_template: '{\n  "simulation_id": "{{simulation_id}}",\n  "event": "{{event}}",\n  "data": {{data}}\n}',
    active: true,
    secret: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      payload_template: '{\n  "simulation_id": "{{simulation_id}}",\n  "event": "{{event}}",\n  "data": {{data}}\n}',
      active: true,
      secret: ''
    });
    setEditingWebhook(null);
  };

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || [],
      payload_template: JSON.stringify(webhook.payload_template || {}, null, 2),
      active: webhook.active,
      secret: webhook.secret || ''
    });
    setFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let payloadObj;
    try {
      payloadObj = JSON.parse(formData.payload_template);
    } catch (error) {
      toast.error('Invalid JSON in payload template');
      return;
    }

    const data = {
      ...formData,
      payload_template: payloadObj
    };

    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleEvent = (eventId) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-violet-600" />
              Webhook Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Configure webhooks to send simulation events to external systems
              </p>
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Webhook
              </Button>
            </div>

            <div className="grid gap-3">
              {webhooks.length === 0 ? (
                <Card className="p-8 text-center">
                  <Webhook className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No webhooks configured yet</p>
                </Card>
              ) : (
                webhooks.map(webhook => (
                  <Card key={webhook.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{webhook.name}</h4>
                          {webhook.active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2 font-mono">{webhook.url}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {webhook.events?.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {webhook.success_count || 0} success
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            {webhook.failure_count || 0} failures
                          </div>
                          {webhook.last_triggered && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {new Date(webhook.last_triggered).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(webhook)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Edit' : 'Create'} Webhook</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Slack Notifications"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-endpoint.com/webhook"
                required
              />
            </div>

            <div>
              <Label className="mb-3 block">Trigger Events</Label>
              <div className="space-y-2">
                {EVENT_OPTIONS.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{event.label}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="payload">Payload Template (JSON)</Label>
              <Textarea
                id="payload"
                value={formData.payload_template}
                onChange={(e) => setFormData({ ...formData, payload_template: e.target.value })}
                placeholder='{"simulation_id": "{{simulation_id}}"}'
                className="font-mono text-xs min-h-[150px]"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use placeholders: {`{{simulation_id}}, {{event}}, {{data}}`}
              </p>
            </div>

            <div>
              <Label htmlFor="secret">Secret (optional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Optional verification secret"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-xs text-slate-500">Enable webhook to receive events</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingWebhook ? 'Update' : 'Create'} Webhook
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}