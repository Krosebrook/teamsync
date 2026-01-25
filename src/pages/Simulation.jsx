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
  ListChecks
} from "lucide-react";
import { toast } from "sonner";

import RoleSelector, { ROLES } from '../components/simulation/RoleSelector';
import UseCaseTemplates, { USE_CASES } from '../components/simulation/UseCaseTemplates';
import TensionMap from '../components/simulation/TensionMap';
import ResponseCard from '../components/simulation/ResponseCard';
import SimulationHistory from '../components/simulation/SimulationHistory';
import ComparisonView from '../components/simulation/ComparisonView';
import NextSteps from '../components/simulation/NextSteps';
import TradeOffs from '../components/simulation/TradeOffs';
import ScenarioRoleSuggestions from '../components/simulation/ScenarioRoleSuggestions';

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

  const handleUseCaseSelect = (useCase) => {
    setSelectedUseCase(useCase);
    setTitle(`${useCase.name} Analysis`);
    setScenario(useCase.example);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  Team Simulation
                </h1>
                <p className="text-sm text-slate-500">
                  Cross-functional product decision analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {compareMode ? (
                <>
                  <Badge variant="outline" className="gap-1">
                    <GitCompare className="w-3 h-3" />
                    {compareSimulations.length} selected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exitCompareMode}
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
                    className="gap-2"
                    disabled={simulations.length < 2}
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetForm}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Setup */}
          <div className="col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <RoleSelector 
                selectedRoles={selectedRoles}
                onRolesChange={setSelectedRoles}
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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

          {/* Main Content */}
          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                <TabsTrigger 
                  value="setup" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  disabled={compareMode}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Setup
                </TabsTrigger>
                <TabsTrigger 
                  value="results"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  disabled={!currentSimulation || compareMode}
                >
                  <List className="w-4 h-4 mr-2" />
                  Results
                </TabsTrigger>
                <TabsTrigger 
                  value="compare"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  disabled={!compareMode}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-6">
                {/* Templates */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <UseCaseTemplates 
                    onSelect={handleUseCaseSelect}
                    selectedId={selectedUseCase?.id}
                  />
                </div>

                {/* Scenario Input */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 tracking-tight">
                    Scenario Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                        Title
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Real-time Collaboration Architecture"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                        Describe the decision or scenario
                      </label>
                      <Textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="What product decision are you facing? Be specific about the context, constraints, and stakes..."
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={runSimulation}
                      disabled={isRunning || !title.trim() || !scenario.trim() || selectedRoles.length < 2}
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-lg shadow-violet-200 gap-2"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Running Simulation...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Run Simulation
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {currentSimulation && (
                  <>
                    {/* Decision Trade-offs */}
                    {currentSimulation.decision_trade_offs && currentSimulation.decision_trade_offs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <h3 className="text-sm font-semibold text-slate-700">Decision Trade-offs</h3>
                        <TradeOffs tradeOffs={currentSimulation.decision_trade_offs} />
                      </motion.div>
                    )}

                    {/* Summary & Next Steps */}
                    {currentSimulation.summary && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-200 p-6 shadow-sm space-y-6"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            <h3 className="text-sm font-semibold text-violet-900">
                              Synthesis & Recommendations
                            </h3>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {currentSimulation.summary}
                          </p>
                        </div>

                        {currentSimulation.next_steps && currentSimulation.next_steps.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <ListChecks className="w-5 h-5 text-violet-600" />
                              <h3 className="text-sm font-semibold text-violet-900">
                                Next Steps
                              </h3>
                            </div>
                            <NextSteps 
                              steps={currentSimulation.next_steps}
                              onToggleComplete={handleToggleStepComplete}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Tension Map */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <TensionMap tensions={currentSimulation.tensions} />
                    </div>

                    {/* Role Responses */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700 tracking-tight">
                        Team Perspectives
                      </h3>
                      
                      <div className="space-y-3">
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
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-4 rounded-full bg-violet-200/30"
                      />
                    </div>
                    <p className="text-slate-600 mt-6 font-medium">
                      Simulating team discussion...
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Analyzing perspectives from {selectedRoles.length} roles
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compare" className="space-y-6">
                <ComparisonView 
                  simulations={compareSimulations}
                  onRemove={(id) => setCompareSimulations(compareSimulations.filter(s => s.id !== id))}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}