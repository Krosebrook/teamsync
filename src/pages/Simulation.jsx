import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  GitCompare,
  FileText,
  BarChart3,
  FolderOpen,
  Link as LinkIcon,
  PlayCircle,
  Users as UsersIcon,
  Brain,
  BookOpen,
  Zap,
  Wand2,
  Flame,
  ClipboardList,
  MessageSquare,
  FileDown,
  GitBranch,
  Share2,
  History,
  AlertTriangle,
  Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

import { ROLES } from '../components/simulation/RoleSelector';
import RolePills from '../components/simulation/RolePills';
import DecisionCanvas from '../components/simulation/DecisionCanvas';
import ContextPanel from '../components/simulation/ContextPanel';
import ProfessionalTemplates from '../components/simulation/ProfessionalTemplates';
import TensionMap from '../components/simulation/TensionMap';
import ResponseCard from '../components/simulation/ResponseCard';
import SimulationHistory from '../components/simulation/SimulationHistory';
import ComparisonView from '../components/simulation/ComparisonView';
import NextSteps from '../components/simulation/NextSteps';
import TradeOffs from '../components/simulation/TradeOffs';
import TemplateGenerator from '../components/simulation/TemplateGenerator';
import AnalyticsDashboard from '../components/simulation/AnalyticsDashboard';
import SavedTemplates from '../components/simulation/SavedTemplates';
import PlaybooksDialog from '../components/simulation/PlaybooksDialog';
import IntegrationPanel from '../components/simulation/IntegrationPanel';
import EnhancedNextSteps from '../components/simulation/EnhancedNextSteps';
import SimulationPlayback from '../components/simulation/SimulationPlayback';
import CollaborationPanel from '../components/simulation/CollaborationPanel';
import RealTimeSync from '../components/simulation/RealTimeSync';
import ScenarioBuilder from '../components/simulation/ScenarioBuilder';
import ProfileAnalyzer from '../components/simulation/ProfileAnalyzer';
import SimulationRunner from '../components/simulation/SimulationRunner';
import TeamMemberMatcher from '../components/simulation/TeamMemberMatcher';
import PlaybookGenerator from '../components/simulation/PlaybookGenerator';
import PlaybookSelector from '../components/simulation/PlaybookSelector';
import PlaybookTemplatesManager from '../components/simulation/PlaybookTemplatesManager';
import ScenarioLibrary from '../components/simulation/ScenarioLibrary';
import RoleInteractionSimulator from '../components/simulation/RoleInteractionSimulator';
import OutcomePrediction from '../components/simulation/OutcomePrediction';
import AITemplateWizard from '../components/simulation/AITemplateWizard';
import StressTestLibrary from '../components/simulation/StressTestLibrary';
import DebriefBoard from '../components/simulation/DebriefBoard';
import PersonaChat from '../components/simulation/PersonaChat';
import SimulationPDFExport from '../components/simulation/SimulationPDFExport';
import DecisionTreeBuilder from '../components/simulation/DecisionTreeBuilder';
import ForkSimulationButton from '../components/simulation/ForkSimulationButton';
import StressTestRunner from '../components/simulation/StressTestRunner';
import CollaborationCursors from '../components/simulation/CollaborationCursors';
import WebhookManager from '../components/simulation/WebhookManager';
import WhatIfBranch from '../components/simulation/WhatIfBranch';
import NetworkGraph from '../components/simulation/NetworkGraph';
import MultiStageSimulation from '../components/simulation/MultiStageSimulation';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import OutcomeLogger from '../components/simulation/OutcomeLogger';
import EmptyDashboard from '../components/simulation/EmptyDashboard';
import ShareSimulationModal from '../components/simulation/ShareSimulationModal';
import VersionHistoryPanel from '../components/simulation/VersionHistoryPanel';
import SimulationSearchFilter, { applyFilters } from '../components/simulation/SimulationSearchFilter';
import SimulationCard from '../components/simulation/SimulationCard';
import TagsInput from '../components/simulation/TagsInput';
import PlaybookStepsPanel from '../components/simulation/PlaybookStepsPanel';
import DecisionTreeCanvas from '../components/simulation/DecisionTreeCanvas';
import SimulationCommentsPanel from '../components/simulation/SimulationCommentsPanel';

export default function SimulationPage() {
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([
    { role: 'founder', influence: 10 },
    { role: 'backend_dev', influence: 6 },
    { role: 'eng_manager', influence: 8 },
  ]);
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSimulations, setCompareSimulations] = useState([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [savedTemplatesOpen, setSavedTemplatesOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [decisionType, setDecisionType] = useState('');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [playbooksOpen, setPlaybooksOpen] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [webhooksOpen, setWebhooksOpen] = useState(false);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [commentTargetRole, setCommentTargetRole] = useState(null);
  const [commentTargetTension, setCommentTargetTension] = useState(null);
  const [scenarioBuilderOpen, setScenarioBuilderOpen] = useState(false);
  const [profileAnalyzerOpen, setProfileAnalyzerOpen] = useState(false);
  const [simulationRunnerOpen, setSimulationRunnerOpen] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [teamMemberProfiles, setTeamMemberProfiles] = useState([]);
  const [playbookGeneratorOpen, setPlaybookGeneratorOpen] = useState(false);
  const [scenarioLibraryOpen, setScenarioLibraryOpen] = useState(false);
  const [playbookSelectorOpen, setPlaybookSelectorOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const [playbookTemplatesOpen, setPlaybookTemplatesOpen] = useState(false);
  const [roleSimulatorOpen, setRoleSimulatorOpen] = useState(false);
  const [simulatorTemplate, setSimulatorTemplate] = useState(null);
  const [environmentalFactors, setEnvironmentalFactors] = useState([]);
  const [outcomePredictionOpen, setOutcomePredictionOpen] = useState(false);
  const [personaTunings, setPersonaTunings] = useState({});
  const [aiWizardOpen, setAiWizardOpen] = useState(false);
  const [stressTestLibraryOpen, setStressTestLibraryOpen] = useState(false);
  const [debriefBoardOpen, setDebriefBoardOpen] = useState(false);
  const [personaChatOpen, setPersonaChatOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [personaTranscripts, setPersonaTranscripts] = useState({});
  const [treeBuilderOpen, setTreeBuilderOpen] = useState(false);
  const [stressTestRunnerOpen, setStressTestRunnerOpen] = useState(false);
  const [webhookManagerOpen, setWebhookManagerOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [multiStageOpen, setMultiStageOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [simFilters, setSimFilters] = useState({ search: '', status: 'all', useCase: 'all', sort: 'newest' });
  const [simTags, setSimTags] = useState([]);
  const [decisionTreeCanvasOpen, setDecisionTreeCanvasOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);

  const { data: simulations = [], isLoading: loadingSimulations } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 20),
  });

  const { data: customRoles = [] } = useQuery({
    queryKey: ['customRoles'],
    queryFn: () => base44.entities.CustomRole.list(),
  });

  const { data: roleProfiles = [] } = useQuery({
    queryKey: ['roleProfiles'],
    queryFn: () => base44.entities.RoleProfile.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Show onboarding for new users
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed && simulations.length === 0) {
      setOnboardingOpen(true);
    }
  }, [currentUser, simulations.length]);

  // Build complete roles list including custom roles
  const allRolesWithCustom = React.useMemo(() => {
    const customRoleObjects = customRoles.map(cr => ({
      id: `custom_${cr.id}`,
      name: cr.name,
      description: cr.description,
      icon: cr.icon_name,
      color: cr.color,
      defaultInfluence: cr.default_influence,
    }));
    return [...ROLES, ...customRoleObjects];
  }, [customRoles]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Simulation.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Simulation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] }),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.SimulationTemplate.list('-use_count', 10),
  });

  const runSimulation = async () => {
    if (!title.trim() || !scenario.trim()) {
      toast.error('Please enter a title and scenario');
      return;
    }
    if (selectedRoles.length < 2) {
      toast.error('Please select at least 2 team roles');
      return;
    }

    setIsRunning(true);
    setActiveTab('results');

    const allRoles = [
      ...ROLES,
      ...customRoles.map(cr => ({ id: `custom_${cr.id}`, name: cr.name, description: cr.description }))
    ];

    const envContext = environmentalFactors.length > 0
      ? `\nENVIRONMENTAL CONTEXT:\n${environmentalFactors.map(f =>
          `- [${f.category.toUpperCase()} | Impact: ${f.impact}] ${f.name}${f.current_state ? `: ${f.current_state}` : ''}`
        ).join('\n')}\n`
      : '';

    const roleRiseBlocks = selectedRoles.map(r => {
      const roleData = allRoles.find(rd => rd.id === r.role);
      const roleProfile = roleProfiles.find(p => p.role_id === r.role);
      const roleName = roleData?.name || r.role.replace(/_/g, ' ');
      const tuning = personaTunings[r.role];

      let block = `--- ROLE: ${roleName} (Influence: ${r.influence}/10) ---
You are simulating ${roleName}.
STEP 1 — SCAN: What does this scenario mean for ${roleName}?
STEP 2 — RISK FILTER: What biases does ${roleName} carry?
STEP 3 — POSITION: What is ${roleName}'s concrete recommendation?
STEP 4 — CONCERNS: Top 2-3 objections.
STEP 5 — TENSION CHECK: Which other roles will ${roleName} clash with?
STEP 6 — COMMUNICATE: Deliver in ${roleName}'s authentic voice.
Profile context:`;

      if (roleData?.description) block += `\n- Typical concerns: ${roleData.description}`;
      const strengths = roleProfile?.strengths || roleData?.strengths;
      const weaknesses = roleProfile?.weaknesses || roleData?.weaknesses;
      const commStyle = roleProfile?.communication_style || roleData?.communication_style;
      const motivations = roleProfile?.typical_motivations || roleData?.typical_motivations;
      if (strengths?.length) block += `\n- Strengths: ${strengths.join(', ')}`;
      if (weaknesses?.length) block += `\n- Blind spots: ${weaknesses.join(', ')}`;
      if (commStyle) block += `\n- Communication style: ${commStyle}`;
      if (motivations?.length) block += `\n- Core motivations: ${motivations.join(', ')}`;
      if (roleProfile?.risk_tolerance) block += `\n- Risk tolerance: ${roleProfile.risk_tolerance}`;
      if (roleProfile?.conflict_style) block += `\n- Conflict style: ${roleProfile.conflict_style}`;

      if (tuning?.enabled) {
        block += `\n--- PERSONA TUNING ---`;
        block += `\n- Directness: ${tuning.directness_level}/10, Contrarianism: ${tuning.contrarianism}/10`;
        block += `\n- Data orientation: ${tuning.data_orientation}/10, Urgency bias: ${tuning.urgency_bias}/10`;
        if (tuning.risk_tolerance_override) block += `\n- Risk tolerance OVERRIDE: ${tuning.risk_tolerance_override}`;
        if (tuning.custom_agenda?.trim()) block += `\n- Hidden agenda: ${tuning.custom_agenda}`;
      }
      return block;
    }).join('\n\n');

    const prompt = `ROLE: You are a simulation engine running a cross-functional team decision discussion.

SCENARIO: ${scenario}
USE CASE TYPE: ${selectedUseCase?.id || 'custom'}
${envContext}

PARTICIPATING ROLES:
${roleRiseBlocks}

TENSION DETECTION: As an organizational psychologist, identify:
1. Role pairs with conflicting positions, severity (low/medium/high/critical), root cause, hidden alignment
2. The single most dangerous tension

DECISION SYNTHESIS: As a senior facilitator:
1. CONSENSUS SCAN: What do most roles agree on?
2. WEDGE ISSUES: 2-3 things the team won't resolve naturally
3. TRADEOFFS: Core decision as A vs B
4. NEXT STEPS: 3-5 specific actions with owner_role, priority (low/medium/high), confidence (0-100), estimated_hours (realistic: low=2-8h, medium=4-16h, high=8-40h)

Return a single JSON object.`;

    let simulation;
    try {
      simulation = await createMutation.mutateAsync({
        title,
        scenario,
        use_case_type: selectedUseCase?.id || 'custom',
        selected_roles: selectedRoles,
        tags: simTags,
        status: 'running',
      });
      setCurrentSimulation(simulation);
    } catch (error) {
      console.error('[Pass 0] Failed to create simulation record:', error);
      toast.error('Failed to start simulation');
      setIsRunning(false);
      return;
    }

    // Pass 1+2+3: single LLM call with graceful partial degradation
    let responses = [];
    let tensions = [];
    let summary = null;
    let decision_trade_offs = [];
    let next_steps = [];
    let tensionsFailed = false;
    let synthesisFailed = false;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            responses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  position: { type: "string" },
                  concerns: { type: "array", items: { type: "string" } },
                  risk_tolerance: { type: "string" },
                  recommendation: { type: "string" },
                  primary_driver: { type: "string" },
                  predicted_tensions_with: { type: "array", items: { type: "string" } },
                  authentic_voice_quote: { type: "string" }
                }
              }
            },
            tensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  between: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  severity: { type: "string" },
                  root_cause: { type: "string" },
                  hidden_alignment: { type: "string" }
                }
              }
            },
            decision_trade_offs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trade_off: { type: "string" },
                  option_a: { type: "string" },
                  option_b: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            next_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  owner_role: { type: "string" },
                  priority: { type: "string" },
                  confidence: { type: "number" },
                  estimated_hours: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Parse Pass 1 (role responses) — per-role fallback
      try {
        responses = (result.responses || []).map(r => {
          if (!r || typeof r !== 'object') {
            console.error('[Pass 1] Malformed role response:', r);
            return { role: 'unknown', position: '⚠ This role failed to respond — retry the simulation', status: 'error', concerns: [], recommendation: '' };
          }
          return r;
        });
        // Ensure every selected role has a response
        selectedRoles.forEach(sr => {
          const roleName = allRoles.find(rd => rd.id === sr.role)?.name || sr.role.replace(/_/g, ' ');
          if (!responses.find(r => r.role?.toLowerCase().includes(sr.role.toLowerCase()) || sr.role.toLowerCase().includes(r.role?.toLowerCase()))) {
            console.error(`[Pass 1] Missing response for role: ${roleName}`);
            responses.push({ role: roleName, position: '⚠ This role failed to respond — retry the simulation', status: 'error', concerns: [], recommendation: '' });
          }
        });
      } catch (e) {
        console.error('[Pass 1] Role response parse error:', e);
        responses = selectedRoles.map(sr => ({
          role: allRoles.find(rd => rd.id === sr.role)?.name || sr.role,
          position: '⚠ This role failed to respond — retry the simulation',
          status: 'error', concerns: [], recommendation: ''
        }));
      }

      // Parse Pass 2 (tension detection)
      try {
        tensions = result.tensions || [];
        if (!Array.isArray(tensions)) throw new Error('tensions not an array');
      } catch (e) {
        console.error('[Pass 2] Tension detection parse error:', e);
        tensionsFailed = true;
        tensions = [];
      }

      // Parse Pass 3 (synthesis)
      try {
        summary = result.summary || null;
        decision_trade_offs = result.decision_trade_offs || [];
        next_steps = (result.next_steps || []).map(s => ({ ...s, completed: false }));
        if (!summary && !next_steps.length) throw new Error('synthesis empty');
      } catch (e) {
        console.error('[Pass 3] Synthesis parse error:', e);
        synthesisFailed = true;
        summary = null;
        next_steps = [];
      }

    } catch (error) {
      console.error('[AI Call] Full simulation API error:', error);
      toast.error('AI analysis failed — partial results may be shown');
      tensionsFailed = true;
      synthesisFailed = true;
    }

    const finalSim = {
      ...simulation,
      responses,
      tensions,
      summary,
      decision_trade_offs,
      next_steps,
      status: 'completed',
      _tensionsFailed: tensionsFailed,
      _synthesisFailed: synthesisFailed,
    };

    try {
      await updateMutation.mutateAsync({
        id: simulation.id,
        data: { responses, tensions, summary, decision_trade_offs, next_steps, status: 'completed' }
      });
    } catch (e) {
      console.error('[Save] Failed to persist simulation results:', e);
    }

    setCurrentSimulation(finalSim);
    setIsRunning(false);
    toast.success('Simulation complete!');
  };

  const loadSimulation = (sim) => {
    setCurrentSimulation(sim);
    setTitle(sim.title);
    setScenario(sim.scenario);
    setSelectedRoles(sim.selected_roles || []);
    setActiveTab('results');
  };

  const resetForm = () => {
    setTitle('');
    setScenario('');
    setSelectedUseCase(null);
    setCurrentSimulation(null);
    setActiveTab('setup');
    setCompareMode(false);
    setCompareSimulations([]);
  };

  const toggleCompareSimulation = (sim) => {
    const exists = compareSimulations.find(s => s.id === sim.id);
    if (exists) {
      setCompareSimulations(compareSimulations.filter(s => s.id !== sim.id));
    } else {
      if (compareSimulations.length >= 4) {
        toast.error('Maximum 4 simulations for comparison');
        return;
      }
      setCompareSimulations([...compareSimulations, sim]);
    }
  };

  const enterCompareMode = () => {
    setCompareMode(true);
    setActiveTab('compare');
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareSimulations([]);
    setActiveTab('setup');
  };

  const handleToggleStepComplete = async (stepIndex) => {
    if (!currentSimulation) return;

    const updatedSteps = [...currentSimulation.next_steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: !updatedSteps[stepIndex].completed
    };

    await updateMutation.mutateAsync({
      id: currentSimulation.id,
      data: { next_steps: updatedSteps }
    });

    setCurrentSimulation({
      ...currentSimulation,
      next_steps: updatedSteps
    });
  };

  const handleApplyTemplate = (template) => {
    setTitle(template.title);
    setScenario(template.scenario);
    setSelectedRoles(template.roles);
    setActiveTab('setup');
    toast.success('Template applied!');
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setSavedTemplatesOpen(false);
    setTemplateDialogOpen(true);
  };

  const handleApplyPlaybook = (playbook) => {
    setSelectedPlaybook(playbook);
    
    // Pre-fill roles based on playbook requirements
    if (playbook.required_roles && playbook.required_roles.length > 0) {
      const roles = playbook.required_roles.map(rr => ({
        role: rr.role,
        influence: 7 // Default influence
      }));
      setSelectedRoles(roles);
    }

    // Set title if framework name exists
    if (playbook.name) {
      setTitle(`${playbook.name} Decision`);
    }

    toast.success(`${playbook.name || 'Playbook'} applied`);
  };

  const handleSelectPlaybook = (playbook) => {
    try {
      const parsed = JSON.parse(playbook.output_template);
      
      // Apply scenario hints from insights
      if (parsed.key_insights?.emergent_tensions?.length > 0) {
        const scenarioHint = `Key considerations: ${parsed.key_insights.emergent_tensions.join(', ')}`;
        setScenario(prev => prev ? `${prev}\n\n${scenarioHint}` : scenarioHint);
      }

      // Apply essential roles
      if (playbook.required_roles?.length > 0) {
        const newRoles = playbook.required_roles.map(r => ({
          role: r.role,
          influence: 7
        }));
        setSelectedRoles(newRoles);
      }

      setTitle(`${playbook.name} - New Simulation`);
      toast.success(`Applied playbook: ${playbook.name}`);
    } catch (e) {
      console.error('Failed to parse playbook', e);
      handleApplyPlaybook(playbook);
    }
  };

  const handleEditPlaybook = (playbook) => {
    setEditingPlaybook(playbook);
    setPlaybookGeneratorOpen(true);
  };

  const handleSimulateTemplate = (template) => {
    // Pre-fill roles from template, then open the role interaction simulator
    if (template.required_roles?.length > 0) {
      setSelectedRoles(template.required_roles.map(r => ({ role: r.role, influence: 7 })));
    }
    if (template.scenario_starter) setScenario(template.scenario_starter);
    setSimulatorTemplate(template);
    setRoleSimulatorOpen(true);
  };

  const handleApplyPlaybookTemplate = (template) => {
    if (template.name) setTitle(template.name.replace(' (Template)', '') + ' Decision');
    if (template.scenario_starter) setScenario(template.scenario_starter);
    if (template.required_roles?.length > 0) {
      setSelectedRoles(template.required_roles.map(r => ({ role: r.role, influence: 7 })));
    }
    if (template.use_case_type) setSelectedUseCase({ id: template.use_case_type });
    toast.success(`Template "${template.name}" applied`);
  };

  const handleCommentOnRole = (roleId) => {
    setCommentTargetRole(roleId);
    setCommentTargetTension(null);
    setCollaborationOpen(true);
  };

  const handleCommentOnTension = (tensionIndex) => {
    setCommentTargetTension(tensionIndex);
    setCommentTargetRole(null);
    setCollaborationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate-900 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Screen reader live region for status updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="status-announcer">
        {isRunning ? `Analyzing ${selectedRoles.length} perspectives...` : ''}
      </div>

      {/* Collaboration cursors */}
      {currentSimulation && currentUser && (
        <CollaborationCursors simulationId={currentSimulation.id} currentUser={currentUser} />
      )}

      {/* Header */}
      <header aria-label="Application header" className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  Team Decision Simulation
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {compareMode ? (
                <>
                  <Badge variant="outline" className="gap-1 text-xs h-7">
                    <GitCompare className="w-3 h-3" />
                    {compareSimulations.length} selected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exitCompareMode}
                    className="h-7 text-xs"
                  >
                    Exit Compare
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                   variant="outline" 
                   size="sm"
                   onClick={enterCompareMode}
                   className="gap-2 h-7 text-xs"
                   disabled={simulations.length < 2}
                   aria-label="Compare simulations"
                  >
                   <GitCompare className="w-3 h-3" aria-hidden="true" />
                   Compare
                  </Button>
                  <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setOnboardingOpen(true)}
                   className="gap-2 h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                   aria-label="Start guided setup"
                  >
                   <Sparkles className="w-3 h-3" aria-hidden="true" />
                   Guided Setup
                  </Button>
                  <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setAiWizardOpen(true)}
                   className="gap-2 h-7 text-xs text-violet-600 border-violet-200 hover:bg-violet-50"
                   aria-label="Open AI Wizard"
                  >
                   <Sparkles className="w-3 h-3" aria-hidden="true" />
                   AI Wizard
                  </Button>
                  <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setScenarioBuilderOpen(true)}
                   className="gap-2 h-7 text-xs"
                   aria-label="Open scenario builder"
                  >
                   <Zap className="w-3 h-3" aria-hidden="true" />
                   Builder
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setProfileAnalyzerOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <Brain className="w-3 h-3" />
                    Analyze
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMatcherOpen(true)}
                    className="gap-2 h-7 text-xs"
                    disabled={!scenario || selectedRoles.length === 0}
                  >
                    <UsersIcon className="w-3 h-3" />
                    Match
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setScenarioLibraryOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Library
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStressTestLibraryOpen(true)}
                    className="gap-2 h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Flame className="w-3 h-3" />
                    Stress Tests
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPlaybookTemplatesOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    Templates
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPlaybookSelectorOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    Playbooks
                  </Button>
                  {currentSimulation?.status === 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareOpen(true)}
                        className="gap-2 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVersionHistoryOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <History className="w-3 h-3" />
                        Versions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWhatIfOpen(true)}
                        className="gap-2 h-7 text-xs text-violet-600 border-violet-200 hover:bg-violet-50"
                      >
                        <GitBranch className="w-3 h-3" />
                        What If
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDebriefBoardOpen(true)}
                        className="gap-2 h-7 text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
                      >
                        <ClipboardList className="w-3 h-3" />
                        Debrief
                      </Button>
                      <Button
                        variant={personaChatOpen ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPersonaChatOpen(p => !p)}
                        className="gap-2 h-7 text-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Interview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await base44.functions.invoke('generateSimulationPDF', {
                              simulationId: currentSimulation.id
                            });
                            // PDF download is handled by the function response
                            toast.success('PDF downloaded');
                          } catch (err) {
                            toast.error('PDF generation failed');
                          }
                        }}
                        className="gap-2 h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        <FileDown className="w-3 h-3" />
                        Export PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPlaybookGeneratorOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <BookOpen className="w-3 h-3" />
                        Playbook
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIntegrationsOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <LinkIcon className="w-3 h-3" />
                        Export
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPlaybackOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <PlayCircle className="w-3 h-3" />
                        Playback
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDecisionTreeCanvasOpen(true)}
                        className="gap-2 h-7 text-xs text-violet-700 border-violet-200 hover:bg-violet-50"
                      >
                        <GitBranch className="w-3 h-3" />
                        Explore What-Ifs →
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMultiStageOpen(true)}
                        className="gap-2 h-7 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      >
                        <GitBranch className="w-3 h-3" />
                        Multi-Stage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setStressTestRunnerOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <Zap className="w-3 h-3" />
                        Stress Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setWebhookManagerOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <LinkIcon className="w-3 h-3" />
                        Webhooks
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCollaborationOpen(true)}
                        className="gap-2 h-7 text-xs"
                      >
                        <UsersIcon className="w-3 h-3" />
                        Team
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetForm}
                    className="gap-2 h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    New
                  </Button>
                  <a
                    href={createPageUrl('Analytics')}
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <BarChart3 className="w-3 h-3" />
                    Analytics
                  </a>
                  <a
                    href="/Team"
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    Team
                  </a>
                  <a
                    href="/Webhooks"
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    Webhooks
                  </a>
                  <a
                    href="/Settings"
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <SettingsIcon className="w-3 h-3" />
                    Settings
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" aria-label="Simulation workspace" className="h-[calc(100vh-57px)] flex">
        {/* Three Column Layout */}
        <div className="flex-1 flex">
          
          {/* LEFT: Role Selection */}
          {!leftPanelCollapsed && (
            <div className="w-72 border-r border-slate-200 bg-white p-4 overflow-y-auto">
              <RolePills
                selectedRoles={selectedRoles}
                onRolesChange={setSelectedRoles}
                allRoles={allRolesWithCustom}
                personaTunings={personaTunings}
                onPersonaTuningsChange={setPersonaTunings}
              />

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                  Templates
                </h3>
                <ProfessionalTemplates
                  templates={templates.slice(0, 5)}
                  onApply={handleApplyTemplate}
                />
                {templates.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs h-7"
                    onClick={() => setSavedTemplatesOpen(true)}
                  >
                    View all {templates.length} templates
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* CENTER: Decision Canvas */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b border-slate-200 bg-white px-6 py-2">
                <TabsList className="bg-transparent p-0 h-auto gap-1">
                  <TabsTrigger 
                    value="setup" 
                    className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded-sm px-3 py-1.5 text-xs"
                    disabled={compareMode}
                  >
                    Setup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="results"
                    className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded-sm px-3 py-1.5 text-xs"
                    disabled={!currentSimulation || compareMode}
                  >
                    Results
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compare"
                    className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded-sm px-3 py-1.5 text-xs"
                    disabled={!compareMode}
                  >
                    Compare
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics"
                    className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none rounded-sm px-3 py-1.5 text-xs"
                    disabled={compareMode}
                  >
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="setup" className="p-6 mt-0">
                  {/* Empty state when user has no simulations */}
                  {!loadingSimulations && simulations.length === 0 && !currentSimulation ? (
                    <EmptyDashboard
                      onRunTemplate={(template) => {
                        setTitle(template.name || '');
                        setScenario(template.scenario_template || '');
                        if (template.suggested_roles?.length > 0) setSelectedRoles(template.suggested_roles);
                        if (template.industry) setSelectedUseCase({ id: template.industry });
                      }}
                      onStartFromScratch={() => {
                        // Just scroll past the empty state — the canvas is below
                      }}
                    />
                  ) : (
                  <>
                  <DecisionCanvas
                    title={title}
                    setTitle={setTitle}
                    scenario={scenario}
                    setScenario={setScenario}
                    decisionType={decisionType}
                    setDecisionType={setDecisionType}
                    selectedRoles={selectedRoles}
                    onRunSimulation={runSimulation}
                    isRunning={isRunning}
                    simulationId={currentSimulation?.id}
                    environmentalFactors={environmentalFactors}
                    onEnvironmentalFactorsChange={setEnvironmentalFactors}
                  />

                  {/* Tags input */}
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-1.5">Tags</p>
                    <TagsInput
                      tags={simTags}
                      onChange={setSimTags}
                      useCaseType={decisionType}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => setOutcomePredictionOpen(true)}
                      disabled={!scenario || selectedRoles.length < 2}
                      variant="outline"
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Predict Outcomes
                    </Button>
                    <Button
                      onClick={() => setSimulationRunnerOpen(true)}
                      disabled={!scenario || selectedRoles.length < 2}
                      variant="outline"
                      className="gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Run AI Simulation
                    </Button>
                  </div>
                  </>
                  )}
                </TabsContent>

                <TabsContent value="results" className="p-6 mt-0 space-y-4">
                  {currentSimulation && currentSimulation.status === 'completed' && (
                    <>
                      {/* Playbook steps sidebar panel */}
                      {selectedPlaybook?.steps?.length > 0 && (
                        <PlaybookStepsPanel playbook={selectedPlaybook} />
                      )}

                      {/* Synthesis failure banner */}
                      {currentSimulation._synthesisFailed && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Decision synthesis unavailable — re-run to retry
                        </div>
                      )}

                      {/* Summary */}
                      {currentSimulation.summary && (
                        <div className="border-b border-slate-200 pb-6">
                          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Executive Summary
                          </h3>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {currentSimulation.summary}
                          </p>
                        </div>
                      )}

                      {/* Next Steps */}
                      {currentSimulation.next_steps && currentSimulation.next_steps.length > 0 && (
                        <div className="border-b border-slate-200 pb-6">
                          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Recommended Actions
                          </h3>
                          <NextSteps 
                            steps={currentSimulation.next_steps}
                            onToggleComplete={handleToggleStepComplete}
                          />
                        </div>
                      )}

                      {/* Tension failure banner */}
                      {currentSimulation._tensionsFailed && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Tension analysis unavailable for this run — re-run to retry
                        </div>
                      )}

                      {/* Tensions */}
                      {currentSimulation.tensions && currentSimulation.tensions.length > 0 && (
                        <div className="border-b border-slate-200 pb-6">
                          <TensionMap 
                            tensions={currentSimulation.tensions}
                            onComment={handleCommentOnTension}
                          />
                        </div>
                      )}

                      {/* Network Graph */}
                      {currentSimulation.tensions?.length > 0 && (
                        <div className="border-b border-slate-200 pb-6">
                          <NetworkGraph simulation={currentSimulation} />
                        </div>
                      )}

                      {/* Role Responses */}
                      <div>
                        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                          Role Perspectives
                        </h3>
                        <div className="space-y-2">
                          {currentSimulation.responses?.map((response, index) => {
                            const roleConfig = currentSimulation.selected_roles?.find(
                              r => r.role === response.role
                            );
                            return (
                              <ResponseCard 
                                key={response.role + index}
                                response={response}
                                influence={roleConfig?.influence}
                                index={index}
                                onComment={handleCommentOnRole}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Outcome Logger */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                          Outcome Tracking
                        </h3>
                        <OutcomeLogger simulation={currentSimulation} onOutcomeLogged={() => {
                          queryClient.invalidateQueries({ queryKey: ['simulations'] });
                        }} />
                      </div>
                    </>
                  )}

                  {isRunning && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
                      <p className="text-sm text-slate-600">
                        Analyzing {selectedRoles.length} perspectives...
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="compare" className="p-6 mt-0">
                  <ComparisonView 
                    simulations={compareSimulations}
                    onRemove={(id) => setCompareSimulations(compareSimulations.filter(s => s.id !== id))}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="p-6 mt-0">
                  <AnalyticsDashboard simulations={simulations} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* RIGHT: Context / Impact Panel OR Persona Chat */}
          {personaChatOpen && currentSimulation?.status === 'completed' ? (
            <div className="w-80 shrink-0 flex flex-col overflow-hidden">
              <PersonaChat
                simulation={currentSimulation}
                allRoles={allRolesWithCustom}
                open={personaChatOpen}
                onClose={() => setPersonaChatOpen(false)}
                onTranscriptsChange={setPersonaTranscripts}
              />
            </div>
          ) : (
            <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
              <ContextPanel 
                simulation={currentSimulation}
              />

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                  History
                </h3>
                <SimulationSearchFilter
                  simulations={simulations}
                  filters={simFilters}
                  onChange={setSimFilters}
                />
                <div className="mt-2 space-y-2">
                  {loadingSimulations ? (
                    <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
                  ) : applyFilters(simulations, simFilters).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No simulations match filters</p>
                  ) : (
                    applyFilters(simulations, simFilters).map(sim => (
                      <SimulationCard
                        key={sim.id}
                        simulation={sim}
                        onSelect={compareMode ? toggleCompareSimulation : loadSimulation}
                        isSelected={currentSimulation?.id === sim.id}
                        compareMode={compareMode}
                      />
                    ))
                  )}
                </div>
                {currentSimulation?.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <ForkSimulationButton
                      simulation={currentSimulation}
                      variant="outline"
                      size="sm"
                      onForkCreated={(fork) => {
                        queryClient.invalidateQueries({ queryKey: ['simulations'] });
                        toast.success(`Fork ready — load it from history to edit`);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <TemplateGenerator
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onApplyTemplate={handleApplyTemplate}
        allRoles={allRolesWithCustom}
      />

      <SavedTemplates
        open={savedTemplatesOpen}
        onOpenChange={setSavedTemplatesOpen}
        onApplyTemplate={handleApplyTemplate}
        onEditTemplate={handleEditTemplate}
      />

      <PlaybooksDialog
        open={playbooksOpen}
        onOpenChange={setPlaybooksOpen}
        onApply={handleApplyPlaybook}
      />

      <IntegrationPanel
        simulation={currentSimulation}
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
      />

      <WebhookManager
         open={webhookManagerOpen}
         onOpenChange={setWebhookManagerOpen}
       />

      <SimulationPlayback
        simulation={currentSimulation}
        open={playbackOpen}
        onOpenChange={setPlaybackOpen}
      />

      <CollaborationPanel
        simulation={currentSimulation}
        open={collaborationOpen}
        onOpenChange={(open) => {
          setCollaborationOpen(open);
          if (!open) {
            setCommentTargetRole(null);
            setCommentTargetTension(null);
          }
        }}
        initialCommentTarget={
          commentTargetRole ? { type: 'role', value: commentTargetRole } :
          commentTargetTension !== null ? { type: 'tension', value: commentTargetTension } :
          null
        }
      />

      {currentSimulation && <RealTimeSync simulationId={currentSimulation.id} />}

      <ScenarioBuilder
        open={scenarioBuilderOpen}
        onOpenChange={setScenarioBuilderOpen}
        onScenarioGenerated={(result) => {
          setTitle(result.title);
          setScenario(result.scenario);
          if (result.recommended_roles) {
            const roles = result.recommended_roles.map(r => ({
              role: r.role_id,
              influence: r.influence || 5
            }));
            setSelectedRoles(roles);
          }
          toast.success('Scenario generated');
        }}
        allRoles={allRolesWithCustom}
      />

      <ProfileAnalyzer
        open={profileAnalyzerOpen}
        onClose={() => setProfileAnalyzerOpen(false)}
        onProfileExtracted={(profile) => {
          toast.success('Profile extracted - use in team member matching');
        }}
      />

      <SimulationRunner
        open={simulationRunnerOpen}
        onClose={() => setSimulationRunnerOpen(false)}
        scenario={scenario}
        selectedRoles={selectedRoles}
        teamMemberProfiles={teamMemberProfiles}
        onSimulationComplete={async (result) => {
          const simulation = await createMutation.mutateAsync({
            title,
            scenario,
            use_case_type: selectedUseCase?.id || 'custom',
            selected_roles: selectedRoles,
            responses: result.responses,
            tensions: result.tensions,
            decision_trade_offs: result.decision_trade_offs,
            summary: result.summary,
            next_steps: result.next_steps.map(s => ({ ...s, completed: false })),
            status: 'completed',
          });
          setCurrentSimulation(simulation);
          setActiveTab('results');
        }}
      />

      <TeamMemberMatcher
        open={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        scenario={scenario}
        selectedRoles={selectedRoles}
        onApplyMatching={(matching) => {
          setTeamMemberProfiles(matching.optimal_matches || []);
          setSimulationRunnerOpen(true);
        }}
      />

      <PlaybookGenerator
        open={playbookGeneratorOpen}
        onClose={() => {
          setPlaybookGeneratorOpen(false);
          setEditingPlaybook(null);
        }}
        simulation={currentSimulation}
        existingPlaybook={editingPlaybook}
      />

      <PlaybookSelector
        open={playbookSelectorOpen}
        onClose={() => setPlaybookSelectorOpen(false)}
        onSelect={handleSelectPlaybook}
        onEdit={handleEditPlaybook}
      />

      <PlaybookTemplatesManager
        open={playbookTemplatesOpen}
        onClose={() => setPlaybookTemplatesOpen(false)}
        onApply={handleApplyPlaybookTemplate}
        onSimulate={handleSimulateTemplate}
      />

      <RoleInteractionSimulator
        open={roleSimulatorOpen}
        onClose={() => { setRoleSimulatorOpen(false); setSimulatorTemplate(null); }}
        template={simulatorTemplate}
        scenario={scenario}
        selectedRoles={selectedRoles}
        onComplete={(result) => {
          toast.success('Interaction simulation complete — results ready in the simulator');
        }}
      />

      <ScenarioLibrary
        open={scenarioLibraryOpen}
        onClose={() => setScenarioLibraryOpen(false)}
        onApplyTemplate={(template) => {
          if (template.name) setTitle(template.name);
          if (template.scenario_template) setScenario(template.scenario_template);
          if (template.suggested_roles) setSelectedRoles(template.suggested_roles);
          setActiveTab('setup');
          toast.success('Scenario applied from library');
        }}
        currentSimulation={currentSimulation}
      />

      <OutcomePrediction
        open={outcomePredictionOpen}
        onClose={() => setOutcomePredictionOpen(false)}
        scenario={scenario}
        selectedRoles={selectedRoles}
        environmentalFactors={environmentalFactors}
        allRoles={allRolesWithCustom}
      />

      <AITemplateWizard
        open={aiWizardOpen}
        onClose={() => setAiWizardOpen(false)}
        allRoles={allRolesWithCustom}
        onApply={(tpl) => {
          setTitle(tpl.title || '');
          setScenario(tpl.scenario || '');
          if (tpl.roles?.length > 0) setSelectedRoles(tpl.roles);
          if (tpl.decisionType) setSelectedUseCase({ id: tpl.decisionType });
          setActiveTab('setup');
        }}
      />

      <DebriefBoard
        open={debriefBoardOpen}
        onClose={() => setDebriefBoardOpen(false)}
        simulation={currentSimulation}
      />

      <SimulationPDFExport
        open={pdfExportOpen}
        onClose={() => setPdfExportOpen(false)}
        simulation={currentSimulation}
        personaTranscripts={personaTranscripts}
        allRoles={allRolesWithCustom}
      />

      <DecisionTreeBuilder
        open={treeBuilderOpen}
        onClose={() => setTreeBuilderOpen(false)}
        simulation={currentSimulation}
        allRoles={allRolesWithCustom}
        environmentalFactors={environmentalFactors}
      />

      <StressTestLibrary
        open={stressTestLibraryOpen}
        onClose={() => setStressTestLibraryOpen(false)}
        currentSimulation={currentSimulation ? { ...currentSimulation, scenario } : { title, scenario, use_case_type: selectedUseCase?.id }}
        selectedRoles={selectedRoles}
        personaTunings={personaTunings}
        environmentalFactors={environmentalFactors}
        onLoadTemplate={(template) => {
          if (template.name) setTitle(template.name);
          if (template.scenario) setScenario(template.scenario);
          if (template.selected_roles?.length > 0) setSelectedRoles(template.selected_roles);
          if (template.persona_tunings) setPersonaTunings(template.persona_tunings);
          if (template.environmental_factors) setEnvironmentalFactors(template.environmental_factors);
          if (template.use_case_type) setSelectedUseCase({ id: template.use_case_type });
          setActiveTab('setup');
        }}
      />

      <StressTestRunner
        open={stressTestRunnerOpen}
        onOpenChange={setStressTestRunnerOpen}
        template={editingTemplate || templates[0]}
        simulation={currentSimulation}
      />

      <WebhookManager
        open={webhookManagerOpen}
        onOpenChange={setWebhookManagerOpen}
      />

      <WhatIfBranch
        simulation={currentSimulation}
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        onBranchCreated={(fork) => {
          queryClient.invalidateQueries({ queryKey: ['simulations'] });
          toast.success(`What If branch ready — load it from history to run`);
        }}
      />

      <MultiStageSimulation
        open={multiStageOpen}
        onClose={() => setMultiStageOpen(false)}
        baseSimulation={currentSimulation}
        selectedRoles={selectedRoles}
        allRoles={allRolesWithCustom}
      />

      <OnboardingWizard
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        allRoles={allRolesWithCustom}
        onLaunchSimulation={({ title: t, scenario: s, selectedRoles: r, useCaseType: u, runImmediately }) => {
          setTitle(t || '');
          setScenario(s || '');
          if (r?.length > 0) setSelectedRoles(r);
          if (u) setSelectedUseCase({ id: u });
          setActiveTab('setup');
          if (runImmediately) {
            setTimeout(() => runSimulation(), 100);
          }
          toast.success(runImmediately ? 'Running simulation…' : 'Simulation saved as draft');
        }}
      />

      {currentSimulation && (
        <ShareSimulationModal
          simulation={currentSimulation}
          open={shareOpen}
          onOpenChange={setShareOpen}
          onSimulationUpdate={(updated) => setCurrentSimulation(prev => ({ ...prev, ...updated }))}
        />
      )}

      {currentSimulation && (
        <VersionHistoryPanel
          simulation={currentSimulation}
          open={versionHistoryOpen}
          onOpenChange={setVersionHistoryOpen}
          onLoadVersion={loadSimulation}
        />
      )}

      <DecisionTreeCanvas
        open={decisionTreeCanvasOpen}
        onOpenChange={setDecisionTreeCanvasOpen}
        simulation={currentSimulation}
      />

      {commentTarget && (
        <SimulationCommentsPanel
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          simulation={currentSimulation}
          targetType={commentTarget.type}
          targetId={commentTarget.id}
        />
      )}
    </div>
  );
}