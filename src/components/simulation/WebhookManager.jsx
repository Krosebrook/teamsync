import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Send, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const EVENTS = [
  'SimulationCreated',
  'SimulationStarted',
  'SimulationCompleted',
  'NextStepAdded',
  'StepFailed',
  'StressTestStarted',
  'StressTestCompleted',
];

export default function WebhookManager({ open, onOpenChange }) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['SimulationCompleted']);
  const [testPayload, setTestPayload] = useState(null);
  const queryClient = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.Webhook.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Webhook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setUrl('');
      setSelectedEvents(['SimulationCompleted']);
      toast.success('Webhook created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webhook.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const testMutation = useMutation({
    mutationFn: (webhook) =>
      base44.functions.invoke('fireWebhook', {
        event_type: webhook.events[0],
        simulation_id: 'test',
        payload: { test: true, webhook_id: webhook.id },
      }),
  });

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('URL required');
      return;
    }
    createMutation.mutate({
      name: new URL(url).hostname,
      url: url.trim(),
      events: selectedEvents,
      active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Webhook Form */}
          <form onSubmit={handleCreateWebhook} className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <Input
                placeholder="https://example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvents([...selectedEvents, event]);
                        } else {
                          setSelectedEvents(selectedEvents.filter(e => e !== event));
                        }
                      }}
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Webhook
            </Button>
          </form>

          {/* Webhooks List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Active Webhooks ({webhooks.length})</h3>
            {webhooks.length === 0 ? (
              <p className="text-sm text-slate-500">No webhooks configured</p>
            ) : (
              webhooks.map((webhook) => (
                <Card key={webhook.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{webhook.url}</p>
                        <p className="text-xs text-slate-500">
                          Success: {webhook.success_count || 0} | Failure: {webhook.failure_count || 0}
                        </p>
                      </div>
                      <Badge variant={webhook.active ? 'default' : 'outline'}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {webhook.events.slice(0, 3).map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testMutation.mutate(webhook)}
                        disabled={testMutation.isPending}
                        className="gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(webhook.id)}
                        disabled={deleteMutation.isPending}
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>

                    {testMutation.isSuccess && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Test delivered
                      </p>
                    )}
                    {testMutation.isError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Test failed
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Payload Structure Reference */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Payload Structure</h4>
            <pre className="text-xs bg-slate-800 text-slate-100 p-3 rounded overflow-x-auto">
{`{
  "event_type": "SimulationCompleted",
  "timestamp": "2026-03-10T10:30:00Z",
  "simulation_id": "sim_123",
  "user_id": "user_456",
  "user_email": "user@example.com",
  // ... event-specific data
}`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}