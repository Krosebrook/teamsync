import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, X, Plus, Link, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ShareSimulationModal({ simulation, open, onOpenChange, onSimulationUpdate }) {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState('');
  const [visibility, setVisibility] = useState(
    simulation?.shared_with?.includes('__public__') ? 'public' : 'private'
  );

  const simUrl = `${window.location.origin}${window.location.pathname}?sim=${simulation?.id}`;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Simulation.update(simulation.id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      onSimulationUpdate?.(updated);
    },
  });

  const sharedEmails = (simulation?.shared_with || []).filter(e => e !== '__public__');

  const copyLink = () => {
    navigator.clipboard.writeText(simUrl);
    toast.success('Link copied!');
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    if (sharedEmails.includes(email)) { toast.error('Already shared with this email'); return; }
    const newList = [...sharedEmails, email];
    if (visibility === 'public') newList.push('__public__');
    updateMutation.mutate({ shared_with: newList });
    setEmailInput('');
    toast.success(`Shared with ${email}`);
  };

  const removeEmail = (email) => {
    const newList = sharedEmails.filter(e => e !== email);
    if (visibility === 'public') newList.push('__public__');
    updateMutation.mutate({ shared_with: newList });
  };

  const toggleVisibility = (val) => {
    setVisibility(val);
    const newList = [...sharedEmails];
    if (val === 'public') newList.push('__public__');
    updateMutation.mutate({ shared_with: newList });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link className="w-4 h-4" /> Share Simulation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Simulation URL */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Simulation link</p>
            <div className="flex gap-2">
              <Input value={simUrl} readOnly className="text-xs h-8 text-slate-600 bg-slate-50" />
              <Button size="sm" variant="outline" onClick={copyLink} className="h-8 shrink-0 gap-1.5">
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </div>

          {/* Visibility toggle */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Visibility</p>
            <div className="flex gap-2">
              {['private', 'public'].map(v => (
                <button
                  key={v}
                  onClick={() => toggleVisibility(v)}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-md border font-medium transition-all ${
                    visibility === v
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {v === 'private' ? '🔒 Private' : '🌐 Anyone with link'}
                </button>
              ))}
            </div>
            {visibility === 'public' && (
              <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Anyone with the link can view this simulation without logging in.
              </p>
            )}
          </div>

          {/* Invite by email */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Invite by email</p>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEmail()}
                placeholder="teammate@company.com"
                className="text-sm h-8"
              />
              <Button size="sm" onClick={addEmail} className="h-8 shrink-0 gap-1">
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
          </div>

          {/* Shared with list */}
          {sharedEmails.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">Shared with</p>
              {sharedEmails.map(email => (
                <div key={email} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-1.5 border border-slate-100">
                  <span className="text-sm text-slate-700">{email}</span>
                  <button onClick={() => removeEmail(email)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}