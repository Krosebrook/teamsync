import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Users, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function SettingsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleResetOnboarding = async () => {
    await base44.auth.updateMe({ onboarding_completed: false });
    toast.success('Onboarding reset — reload to start guided setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Settings</h1>

        <div className="space-y-3">
          <Link to="/Webhooks" className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Webhooks</p>
                <p className="text-sm text-slate-500">Fire events to Slack, Zapier, n8n or any HTTP endpoint</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </Link>

          <Link to="/Team" className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Team Members</p>
                <p className="text-sm text-slate-500">Manage team profiles used in simulations</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </Link>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Reset Onboarding</p>
                  <p className="text-sm text-slate-500">Re-run the guided setup wizard</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetOnboarding}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}