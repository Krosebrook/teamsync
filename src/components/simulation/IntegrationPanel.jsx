import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Upload, Download, Send, FileText, Loader2,
  CheckCircle2, ExternalLink, ArrowRight, Users, Zap, Hash
} from "lucide-react";

const PRIORITY_MAP_LINEAR = { high: 1, medium: 2, low: 3 };
const PRIORITY_MAP_JIRA = { high: 'High', medium: 'Medium', low: 'Low' };
const STATUS_MAP_OPTIONS = [
  { simStatus: 'pending', label: 'Pending (not started)' },
  { simStatus: 'completed', label: 'Completed' },
];

// ─── Role → Assignee Mapper ──────────────────────────────────────────────────

function RoleAssigneeMapper({ roles = [], members = [], roleMappings, onMappingsChange, memberDisplayKey = 'name' }) {
  if (!roles.length) return <p className="text-xs text-slate-500">No roles in this simulation.</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
        <Users className="w-3 h-3" /> Map simulation roles to team members (optional)
      </p>
      {roles.map(r => (
        <div key={r.role} className="flex items-center gap-3">
          <span className="text-xs text-slate-700 w-36 truncate font-medium capitalize">
            {r.role.replace(/_/g, ' ')}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <Select
            value={roleMappings[r.role] || ''}
            onValueChange={val => onMappingsChange({ ...roleMappings, [r.role]: val })}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null} className="text-xs">Unassigned</SelectItem>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m[memberDisplayKey] || m.name || m.displayName || m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

// ─── Per-step selection list ─────────────────────────────────────────────────

function StepSelector({ steps = [], selectedIndices, onToggle, onToggleAll }) {
  if (!steps.length) return <p className="text-xs text-slate-500">No next steps in this simulation.</p>;
  const allSelected = selectedIndices.length === steps.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-600">Select steps to push</p>
        <button onClick={() => onToggleAll(allSelected)} className="text-xs text-violet-600 hover:underline">
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <ScrollArea className="h-48">
        <div className="space-y-1.5 pr-2">
          {steps.map((step, idx) => (
            <label key={idx} className="flex items-start gap-2.5 cursor-pointer group">
              <Checkbox
                checked={selectedIndices.includes(idx)}
                onCheckedChange={() => onToggle(idx)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 group-hover:text-slate-900 leading-snug">{step.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${
                    step.priority === 'high' ? 'text-rose-600 border-rose-200' :
                    step.priority === 'medium' ? 'text-amber-600 border-amber-200' :
                    'text-slate-500 border-slate-200'
                  }`}>
                    {step.priority}
                  </Badge>
                  {step.confidence && (
                    <span className="text-[10px] text-slate-400">{step.confidence}% confidence</span>
                  )}
                  {step.completed && (
                    <span className="text-[10px] text-emerald-600">✓ completed</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IntegrationPanel({ simulation, open, onOpenChange }) {
  const [activeIntegration, setActiveIntegration] = useState('linear');
  const [loading, setLoading] = useState(false);
  const [pushedItems, setPushedItems] = useState([]); // [{index, url}]

  // Linear state
  const [linearTeamId, setLinearTeamId] = useState('');
  const [linearMembers, setLinearMembers] = useState([]);
  const [linearRoleMappings, setLinearRoleMappings] = useState({});
  const [linearSelectedSteps, setLinearSelectedSteps] = useState([]);

  // Jira state
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [jiraMembers, setJiraMembers] = useState([]);
  const [jiraRoleMappings, setJiraRoleMappings] = useState({});
  const [jiraSelectedSteps, setJiraSelectedSteps] = useState([]);

  // Slack / Notion
  const [slackChannelId, setSlackChannelId] = useState('');
  const [notionPageId, setNotionPageId] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: linearTeams } = useQuery({
    queryKey: ['linearTeams'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('linearIntegration', { action: 'getTeams' });
      return data.teams || [];
    },
    enabled: activeIntegration === 'linear',
  });

  const { data: jiraProjects } = useQuery({
    queryKey: ['jiraProjects'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('jiraIntegration', { action: 'getProjects' });
      return data.projects || [];
    },
    enabled: activeIntegration === 'jira',
  });

  const { data: slackChannels } = useQuery({
    queryKey: ['slackChannels'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('slackIntegration', { action: 'getChannels' });
      return data.channels || [];
    },
    enabled: activeIntegration === 'slack',
  });

  const { data: notionPages } = useQuery({
    queryKey: ['notionPages'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('notionIntegration', { action: 'searchPages' });
      return data.pages || [];
    },
    enabled: activeIntegration === 'notion',
  });

  // Fetch team members when a Linear team is selected
  const loadLinearMembers = async (teamId) => {
    setLinearTeamId(teamId);
    try {
      const { data } = await base44.functions.invoke('linearIntegration', { action: 'getMembers', teamId });
      setLinearMembers(data.members || []);
    } catch { /* members are optional */ }
  };

  // Fetch Jira project members when project is selected
  const loadJiraMembers = async (projectKey) => {
    setJiraProjectKey(projectKey);
    try {
      const { data } = await base44.functions.invoke('jiraIntegration', { action: 'getProjectMembers', projectKey });
      setJiraMembers(data.members || []);
    } catch { /* members are optional */ }
  };

  // ── Step selection helpers ───────────────────────────────────────────────

  const toggleLinearStep = (idx) =>
    setLinearSelectedSteps(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);

  const toggleAllLinear = (allSelected) =>
    setLinearSelectedSteps(allSelected ? [] : simulation.next_steps.map((_, i) => i));

  const toggleJiraStep = (idx) =>
    setJiraSelectedSteps(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);

  const toggleAllJira = (allSelected) =>
    setJiraSelectedSteps(allSelected ? [] : simulation.next_steps.map((_, i) => i));

  // ── Export handlers ──────────────────────────────────────────────────────

  const handleExportToLinear = async () => {
    if (!linearTeamId) { toast.error('Select a Linear team'); return; }
    const indices = linearSelectedSteps.length ? linearSelectedSteps : simulation.next_steps.map((_, i) => i);
    const steps = indices.map(i => simulation.next_steps[i]);
    if (!steps.length) { toast.error('No steps to push'); return; }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('linearIntegration', {
        action: 'exportNextSteps',
        nextSteps: steps.map(step => ({
          ...step,
          // Inject assignee if role is mapped
          assigneeId: linearRoleMappings[step.owner_role] || undefined,
          // Inject simulation context into description
          description: [
            `**Simulation:** ${simulation.title}`,
            `**Owner Role:** ${(step.owner_role || '').replace(/_/g, ' ')}`,
            `**Priority:** ${step.priority}   |   **Confidence:** ${step.confidence}%`,
            '',
            step.action,
            '',
            simulation.summary ? `**Context:**\n${simulation.summary.slice(0, 400)}` : '',
          ].filter(Boolean).join('\n'),
        })),
        teamId: linearTeamId,
      });

      const created = data.createdIssues || [];
      toast.success(`Created ${created.length} Linear issue${created.length !== 1 ? 's' : ''}`);
      setPushedItems(prev => [
        ...prev,
        ...created.map((issue, i) => ({ index: indices[i], url: issue.url, tool: 'linear', title: issue.title })),
      ]);
    } catch {
      toast.error('Failed to export to Linear');
    }
    setLoading(false);
  };

  const handleExportToJira = async () => {
    if (!jiraProjectKey) { toast.error('Select a Jira project'); return; }
    const indices = jiraSelectedSteps.length ? jiraSelectedSteps : simulation.next_steps.map((_, i) => i);
    const steps = indices.map(i => simulation.next_steps[i]);
    if (!steps.length) { toast.error('No steps to push'); return; }

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('jiraIntegration', {
        action: 'exportNextSteps',
        nextSteps: steps.map(step => ({
          ...step,
          assigneeAccountId: jiraRoleMappings[step.owner_role] || undefined,
          description: [
            `*Simulation:* ${simulation.title}`,
            `*Owner Role:* ${(step.owner_role || '').replace(/_/g, ' ')}`,
            `*Priority:* ${step.priority}   |   *Confidence:* ${step.confidence}%`,
            '',
            step.action,
            '',
            simulation.summary ? `*Context:*\n${simulation.summary.slice(0, 400)}` : '',
          ].filter(Boolean).join('\n'),
        })),
        projectKey: jiraProjectKey,
      });

      const created = data.createdIssues || [];
      toast.success(`Created ${created.length} Jira ticket${created.length !== 1 ? 's' : ''}`);
      setPushedItems(prev => [
        ...prev,
        ...created.map((issue, i) => ({ index: indices[i], url: issue.url, tool: 'jira', title: issue.key })),
      ]);
    } catch {
      toast.error('Failed to export to Jira');
    }
    setLoading(false);
  };

  const handlePostToSlack = async () => {
    if (!slackChannelId) { toast.error('Select a Slack channel'); return; }
    setLoading(true);
    try {
      await base44.functions.invoke('slackIntegration', { action: 'postSummary', channelId: slackChannelId, simulation });
      toast.success('Posted to Slack');
    } catch { toast.error('Failed to post to Slack'); }
    setLoading(false);
  };

  const handleExportToNotion = async () => {
    if (!notionPageId) { toast.error('Select a Notion page'); return; }
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('notionIntegration', { action: 'createSimulationPage', simulation, pageId: notionPageId });
      toast.success('Exported to Notion');
      if (data?.url) window.open(data.url, '_blank');
    } catch { toast.error('Failed to export to Notion'); }
    setLoading(false);
  };

  const handleImportFromLinear = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('linearIntegration', { action: 'importADRs' });
      toast.success(`Found ${data.adrs.length} ADRs from Linear`);
    } catch { toast.error('Failed to import from Linear'); }
    setLoading(false);
  };

  const handleImportFromJira = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('jiraIntegration', { action: 'importADRs' });
      toast.success(`Found ${data.adrs.length} ADRs from Jira`);
    } catch { toast.error('Failed to import from Jira'); }
    setLoading(false);
  };

  if (!simulation) return null;

  const roles = simulation.selected_roles || [];
  const steps = simulation.next_steps || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" />
            Export & Integrations
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="space-y-4 pb-2">
            {/* Integration selector */}
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

            {/* ── LINEAR ─────────────────────────────────────────────────────── */}
            {activeIntegration === 'linear' && (
              <Card className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1.5 block">Linear Team</label>
                  <Select value={linearTeamId} onValueChange={loadLinearMembers}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose team…" />
                    </SelectTrigger>
                    <SelectContent>
                      {linearTeams?.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {linearTeamId && (
                  <Tabs defaultValue="steps" className="w-full">
                    <TabsList className="h-7 text-xs">
                      <TabsTrigger value="steps" className="text-xs px-3 py-1">Select Steps</TabsTrigger>
                      <TabsTrigger value="mapping" className="text-xs px-3 py-1">Role → Assignee</TabsTrigger>
                    </TabsList>
                    <TabsContent value="steps" className="mt-3">
                      <StepSelector
                        steps={steps}
                        selectedIndices={linearSelectedSteps}
                        onToggle={toggleLinearStep}
                        onToggleAll={toggleAllLinear}
                      />
                    </TabsContent>
                    <TabsContent value="mapping" className="mt-3">
                      <RoleAssigneeMapper
                        roles={roles}
                        members={linearMembers}
                        roleMappings={linearRoleMappings}
                        onMappingsChange={setLinearRoleMappings}
                        memberDisplayKey="name"
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {/* Pushed items */}
                {pushedItems.filter(p => p.tool === 'linear').map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.title}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleImportFromLinear} variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" disabled={loading}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Import ADRs
                  </Button>
                  <Button onClick={handleExportToLinear} size="sm" className="flex-1 gap-1.5 text-xs" disabled={loading || !linearTeamId}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Push {linearSelectedSteps.length > 0 ? `${linearSelectedSteps.length} Steps` : 'All Steps'}
                  </Button>
                </div>
              </Card>
            )}

            {/* ── JIRA ───────────────────────────────────────────────────────── */}
            {activeIntegration === 'jira' && (
              <Card className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1.5 block">Jira Project</label>
                  <Select value={jiraProjectKey} onValueChange={loadJiraMembers}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose project…" />
                    </SelectTrigger>
                    <SelectContent>
                      {jiraProjects?.map(p => <SelectItem key={p.key} value={p.key} className="text-xs">{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {jiraProjectKey && (
                  <Tabs defaultValue="steps" className="w-full">
                    <TabsList className="h-7 text-xs">
                      <TabsTrigger value="steps" className="text-xs px-3 py-1">Select Steps</TabsTrigger>
                      <TabsTrigger value="mapping" className="text-xs px-3 py-1">Role → Assignee</TabsTrigger>
                    </TabsList>
                    <TabsContent value="steps" className="mt-3">
                      <StepSelector
                        steps={steps}
                        selectedIndices={jiraSelectedSteps}
                        onToggle={toggleJiraStep}
                        onToggleAll={toggleAllJira}
                      />
                    </TabsContent>
                    <TabsContent value="mapping" className="mt-3">
                      <RoleAssigneeMapper
                        roles={roles}
                        members={jiraMembers}
                        roleMappings={jiraRoleMappings}
                        onMappingsChange={setJiraRoleMappings}
                        memberDisplayKey="displayName"
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {pushedItems.filter(p => p.tool === 'jira').map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.title}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleImportFromJira} variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" disabled={loading}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Import ADRs
                  </Button>
                  <Button onClick={handleExportToJira} size="sm" className="flex-1 gap-1.5 text-xs" disabled={loading || !jiraProjectKey}>
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Push {jiraSelectedSteps.length > 0 ? `${jiraSelectedSteps.length} Tickets` : 'All Tickets'}
                  </Button>
                </div>
              </Card>
            )}

            {/* ── SLACK ──────────────────────────────────────────────────────── */}
            {activeIntegration === 'slack' && (
              <Card className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1.5 block">Slack Channel</label>
                  <Select value={slackChannelId} onValueChange={setSlackChannelId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose channel…" />
                    </SelectTrigger>
                    <SelectContent>
                      {slackChannels?.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">#{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePostToSlack} size="sm" className="w-full gap-2 text-xs" disabled={loading || !slackChannelId}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Post Summary to Channel
                </Button>
              </Card>
            )}

            {/* ── NOTION ─────────────────────────────────────────────────────── */}
            {activeIntegration === 'notion' && (
              <Card className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1.5 block">Notion Parent Page</label>
                  <Select value={notionPageId} onValueChange={setNotionPageId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose page…" />
                    </SelectTrigger>
                    <SelectContent>
                      {notionPages?.map(page => (
                        <SelectItem key={page.id} value={page.id} className="text-xs">
                          {page.properties?.title?.title?.[0]?.text?.content || 'Untitled'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExportToNotion} size="sm" className="w-full gap-2 text-xs" disabled={loading || !notionPageId}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Create Notion Page
                </Button>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}