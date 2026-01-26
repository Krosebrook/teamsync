import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Zap,
  LayoutGrid,
  List,
  Download,
  RefreshCw,
  GitCompare,
  ListChecks,
  FileText,
  BarChart3,
  FolderOpen,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

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

  const { data: simulations = [], isLoading: loadingSimulations } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 20),
  });

  const { data: customRoles = [] } = useQuery({
    queryKey: ['customRoles'],
    queryFn: () => base44.entities.CustomRole.list(),
  });

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

    // Build role descriptions including custom roles
    const allRoles = [
      ...ROLES,
      ...customRoles.map(cr => ({
        id: `custom_${cr.id}`,
        name: cr.name,
        description: cr.description,
      }))
    ];

    const roleDescriptions = selectedRoles.map(r => {
      const roleData = allRoles.find(rd => rd.id === r.role);
      let desc = `${roleData?.name || r.role} (Influence: ${r.influence}/10)`;
      if (roleData?.description) {
        desc += `\n  Typical concerns: ${roleData.description}`;
      }
      return desc;
    }).join('\n\n');

    const prompt = `You are simulating a cross-functional team discussion for a critical product/business decision.

SCENARIO: ${scenario}

PARTICIPATING ROLES:
${roleDescriptions}

For each role, deeply analyze their perspective considering their typical priorities, concerns, and risk tolerance. For custom roles, use the "Typical concerns" description as guidance.

Return a JSON object with this EXACT structure:
{
  "responses": [
    {
      "role": "role_id (exact role ID from above)",
      "position": "2-3 sentence summary of their stance",
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "risk_tolerance": "low | medium | high",
      "recommendation": "Their specific recommendation",
      "primary_driver": "The core motivation/principle driving their position (1 sentence)"
    }
  ],
  "tensions": [
    {
      "between": ["role1_id", "role2_id"],
      "description": "Description of the conflict",
      "severity": "low | medium | high | critical"
    }
  ],
  "decision_trade_offs": [
    {
      "trade_off": "Name of the trade-off",
      "option_a": "Description of one path",
      "option_b": "Description of alternative path"
    }
  ],
  "summary": "2-3 paragraphs synthesizing the discussion. Include: (1) Main areas of consensus (2) Key points of contention (3) Decision-making framework based on the primary drivers identified",
  "next_steps": [
    {
      "action": "Specific, actionable step",
      "owner_role": "role_id best suited to own this",
      "priority": "low | medium | high",
      "confidence": 85
    }
  ]
}

CRITICAL INSTRUCTIONS:
- PRIMARY DRIVER: For each role's response, identify the ONE core principle/motivation driving their position
- TRADE-OFFS: Extract 2-4 major decision trade-offs implicit in the scenario
- SUMMARY: Don't just summarize - explicitly call out what's driving each role and where the fundamental tensions lie
- NEXT STEPS: 
  * Extract 3-5 concrete, specific actions
  * Confidence score (0-100) based on: alignment across roles, clarity of action, likelihood of success
  * Higher confidence = more agreement + clearer path
  * Lower confidence = controversial + needs more research
- Consider influence levels when weighing perspectives
- Identify REAL tensions - don't smooth over conflicts`;

    try {
      const simulation = await createMutation.mutateAsync({
        title,
        scenario,
        use_case_type: selectedUseCase?.id || 'custom',
        selected_roles: selectedRoles,
        status: 'running',
      });

      setCurrentSimulation(simulation);

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
                  primary_driver: { type: "string" }
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
                  severity: { type: "string" }
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
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });

      const nextSteps = (result.next_steps || []).map(step => ({
        ...step,
        completed: false
      }));

      await updateMutation.mutateAsync({
        id: simulation.id,
        data: {
          responses: result.responses,
          tensions: result.tensions,
          summary: result.summary,
          decision_trade_offs: result.decision_trade_offs || [],
          next_steps: nextSteps,
          status: 'completed',
        }
      });

      setCurrentSimulation({
        ...simulation,
        responses: result.responses,
        tensions: result.tensions,
        summary: result.summary,
        decision_trade_offs: result.decision_trade_offs || [],
        next_steps: nextSteps,
        status: 'completed',
      });

      toast.success('Simulation complete!');
    } catch (error) {
      toast.error('Failed to run simulation');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const loadSimulation = (sim) => {
    setCurrentSimulation(sim);
    setTitle(sim.title);
    setScenario(sim.scenario);
    setSelectedRoles(sim.selected_roles || []);
    setSelectedUseCase(USE_CASES.find(uc => uc.id === sim.use_case_type) || null);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
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
                  >
                    <GitCompare className="w-3 h-3" />
                    Compare
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTemplateDialogOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSavedTemplatesOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Templates
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPlaybooksOpen(true)}
                    className="gap-2 h-7 text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    Playbooks
                  </Button>
                  {currentSimulation?.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIntegrationsOpen(true)}
                      className="gap-2 h-7 text-xs"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Export
                    </Button>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
        onApplyPlaybook={handleApplyPlaybook}
        allRoles={allRolesWithCustom}
      />

      <IntegrationPanel
        simulation={currentSimulation}
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
      />

      <main className="h-[calc(100vh-57px)] flex">
        {/* Three Column Layout */}
        <div className="flex-1 flex">
          
          {/* LEFT: Role Selection */}
          {!leftPanelCollapsed && (
            <div className="w-72 border-r border-slate-200 bg-white p-4 overflow-y-auto">
              <RolePills
                selectedRoles={selectedRoles}
                onRolesChange={setSelectedRoles}
                allRoles={allRolesWithCustom}
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
                  />
                </TabsContent>

                <TabsContent value="results" className="p-6 mt-0 space-y-4">
                  {currentSimulation && currentSimulation.status === 'completed' && (
                    <>
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

                      {/* Tensions */}
                      {currentSimulation.tensions && currentSimulation.tensions.length > 0 && (
                        <div className="border-b border-slate-200 pb-6">
                          <TensionMap tensions={currentSimulation.tensions} />
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
                                key={response.role}
                                response={response}
                                influence={roleConfig?.influence}
                                index={index}
                              />
                            );
                          })}
                        </div>
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

          {/* RIGHT: Context / Impact Panel */}
          <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
            <ContextPanel 
              simulation={currentSimulation}
            />

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                History
              </h3>
              <SimulationHistory 
                simulations={simulations}
                onSelect={compareMode ? toggleCompareSimulation : loadSimulation}
                selectedId={currentSimulation?.id}
                isLoading={loadingSimulations}
                compareMode={compareMode}
                compareSelected={compareSimulations.map(s => s.id)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}