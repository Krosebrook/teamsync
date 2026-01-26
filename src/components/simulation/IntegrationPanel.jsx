import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  Upload, 
  Download, 
  Send, 
  FileText,
  Loader2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function IntegrationPanel({ simulation, open, onOpenChange }) {
  const [activeIntegration, setActiveIntegration] = useState('linear');
  const [loading, setLoading] = useState(false);
  
  // Linear
  const [linearTeamId, setLinearTeamId] = useState('');
  const { data: linearTeams } = useQuery({
    queryKey: ['linearTeams'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('linearIntegration', { action: 'getTeams' });
      return data.teams;
    },
    enabled: activeIntegration === 'linear'
  });

  // Jira
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const { data: jiraProjects } = useQuery({
    queryKey: ['jiraProjects'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('jiraIntegration', { action: 'getProjects' });
      return data.projects;
    },
    enabled: activeIntegration === 'jira'
  });

  // Slack
  const [slackChannelId, setSlackChannelId] = useState('');
  const { data: slackChannels } = useQuery({
    queryKey: ['slackChannels'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('slackIntegration', { action: 'getChannels' });
      return data.channels;
    },
    enabled: activeIntegration === 'slack'
  });

  // Notion
  const [notionPageId, setNotionPageId] = useState('');
  const { data: notionPages } = useQuery({
    queryKey: ['notionPages'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('notionIntegration', { action: 'searchPages' });
      return data.pages;
    },
    enabled: activeIntegration === 'notion'
  });

  const handleExportToLinear = async () => {
    if (!linearTeamId) {
      toast.error('Select a Linear team');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('linearIntegration', {
        action: 'exportNextSteps',
        nextSteps: simulation.next_steps,
        teamId: linearTeamId
      });

      toast.success(`Created ${data.createdIssues.length} Linear issues`);
    } catch (error) {
      toast.error('Failed to export to Linear');
      console.error(error);
    }
    setLoading(false);
  };

  const handleExportToJira = async () => {
    if (!jiraProjectKey) {
      toast.error('Select a Jira project');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('jiraIntegration', {
        action: 'exportNextSteps',
        nextSteps: simulation.next_steps,
        projectKey: jiraProjectKey
      });

      toast.success(`Created ${data.createdIssues.length} Jira tasks`);
    } catch (error) {
      toast.error('Failed to export to Jira');
      console.error(error);
    }
    setLoading(false);
  };

  const handlePostToSlack = async () => {
    if (!slackChannelId) {
      toast.error('Select a Slack channel');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('slackIntegration', {
        action: 'postSummary',
        channelId: slackChannelId,
        simulation
      });

      toast.success('Posted to Slack');
    } catch (error) {
      toast.error('Failed to post to Slack');
      console.error(error);
    }
    setLoading(false);
  };

  const handleExportToNotion = async () => {
    if (!notionPageId) {
      toast.error('Select a Notion page');
      return;
    }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('notionIntegration', {
        action: 'createSimulationPage',
        simulation,
        pageId: notionPageId
      });

      toast.success('Exported to Notion');
      window.open(data.url, '_blank');
    } catch (error) {
      toast.error('Failed to export to Notion');
      console.error(error);
    }
    setLoading(false);
  };

  const handleImportFromLinear = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('linearIntegration', {
        action: 'importADRs'
      });

      toast.success(`Found ${data.adrs.length} ADRs from Linear`);
      // You could then display these or use them to create simulations
    } catch (error) {
      toast.error('Failed to import from Linear');
      console.error(error);
    }
    setLoading(false);
  };

  const handleImportFromJira = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('jiraIntegration', {
        action: 'importADRs'
      });

      toast.success(`Found ${data.adrs.length} ADRs from Jira`);
    } catch (error) {
      toast.error('Failed to import from Jira');
      console.error(error);
    }
    setLoading(false);
  };

  if (!simulation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export & Integrations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={activeIntegration} onValueChange={setActiveIntegration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="jira">Jira</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="notion">Notion</SelectItem>
            </SelectContent>
          </Select>

          {/* Linear */}
          {activeIntegration === 'linear' && (
            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Linear Team
                </label>
                <Select value={linearTeamId} onValueChange={setLinearTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {linearTeams?.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImportFromLinear} variant="outline" className="flex-1 gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import ADRs
                </Button>
                <Button onClick={handleExportToLinear} className="flex-1 gap-2" disabled={loading || !linearTeamId}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Next Steps
                </Button>
              </div>
            </Card>
          )}

          {/* Jira */}
          {activeIntegration === 'jira' && (
            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Jira Project
                </label>
                <Select value={jiraProjectKey} onValueChange={setJiraProjectKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jiraProjects?.map(project => (
                      <SelectItem key={project.key} value={project.key}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImportFromJira} variant="outline" className="flex-1 gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import ADRs
                </Button>
                <Button onClick={handleExportToJira} className="flex-1 gap-2" disabled={loading || !jiraProjectKey}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Next Steps
                </Button>
              </div>
            </Card>
          )}

          {/* Slack */}
          {activeIntegration === 'slack' && (
            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Slack Channel
                </label>
                <Select value={slackChannelId} onValueChange={setSlackChannelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose channel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {slackChannels?.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handlePostToSlack} className="w-full gap-2" disabled={loading || !slackChannelId}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Summary to Channel
              </Button>
            </Card>
          )}

          {/* Notion */}
          {activeIntegration === 'notion' && (
            <Card className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Notion Parent Page
                </label>
                <Select value={notionPageId} onValueChange={setNotionPageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {notionPages?.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.properties?.title?.title?.[0]?.text?.content || 'Untitled'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleExportToNotion} className="w-full gap-2" disabled={loading || !notionPageId}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Create Notion Page
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}