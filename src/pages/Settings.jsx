import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LinkIcon, Users, Bell, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleResetOnboarding = async () => {
    try {
      await base44.auth.updateMe({ onboarding_completed: false });
      toast.success('Onboarding reset — refresh to see the wizard');
    } catch (err) {
      toast.error('Failed to reset onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage integrations, team, and app settings</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Members */}
          <Link to="/Team">
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Team Members</h3>
                  <p className="text-sm text-slate-600 mt-1">Manage organization members and profiles</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Webhooks */}
          <Link to="/Webhooks">
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Webhooks</h3>
                  <p className="text-sm text-slate-600 mt-1">Configure event notifications and integrations</p>
                </div>
              </div>
            </div>
          </Link>

          {/* User Profile */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Profile</h3>
                <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
                <p className="text-xs text-slate-500 mt-1">Role: <span className="font-medium">{user?.role || 'user'}</span></p>
              </div>
            </div>
          </div>

          {/* Onboarding Reset */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Onboarding</h3>
                <p className="text-sm text-slate-600 mt-1">Reset the guided setup wizard</p>
                <Button
                  onClick={handleResetOnboarding}
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                >
                  Reset Wizard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Info */}
        <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Integrations</h3>
              <p className="text-sm text-slate-600 mt-1">Connected services and external APIs</p>
              <div className="mt-3 text-sm">
                <p className="text-slate-700"><span className="font-medium">Linear API:</span> Connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}