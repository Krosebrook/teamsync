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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

import RoleSelector, { ROLES } from '../components/simulation/RoleSelector';
import UseCaseTemplates, { USE_CASES } from '../components/simulation/UseCaseTemplates';
import TensionMap from '../components/simulation/TensionMap';
import ResponseCard from '../components/simulation/ResponseCard';
import SimulationHistory from '../components/simulation/SimulationHistory';

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

  const { data: simulations = [], isLoading: loadingSimulations } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 20),
  });

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

    const roleNames = selectedRoles.map(r => {
      const roleData = ROLES.find(rd => rd.id === r.role);
      return `${roleData?.name || r.role} (Influence: ${r.influence}/10)`;
    }).join(', ');

    const prompt = `You are simulating a cross-functional product team discussion. 

SCENARIO: ${scenario}

PARTICIPATING ROLES:
${roleNames}

For each role, provide their perspective on this scenario. Consider their typical priorities, concerns, and risk tolerance.

Return a JSON object with this exact structure:
{
  "responses": [
    {
      "role": "role_id (e.g., founder, backend_dev, security, etc.)",
      "position": "2-3 sentence summary of their stance",
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "risk_tolerance": "low | medium | high",
      "recommendation": "Their specific recommendation"
    }
  ],
  "tensions": [
    {
      "between": ["role1_id", "role2_id"],
      "description": "Description of the conflict between these roles",
      "severity": "low | medium | high | critical"
    }
  ],
  "summary": "A 2-3 paragraph synthesis of the discussion, key takeaways, and recommended path forward"
}

IMPORTANT: 
- Use these exact role IDs: founder, backend_dev, frontend_dev, security, qa, eng_manager, ux_designer, product_manager, devrel, analytics
- Identify real tensions - don't smooth over conflicts
- Be specific and actionable in recommendations
- Consider the influence levels when weighing perspectives`;

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
                  recommendation: { type: "string" }
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
            summary: { type: "string" }
          }
        }
      });

      await updateMutation.mutateAsync({
        id: simulation.id,
        data: {
          responses: result.responses,
          tensions: result.tensions,
          summary: result.summary,
          status: 'completed',
        }
      });

      setCurrentSimulation({
        ...simulation,
        responses: result.responses,
        tensions: result.tensions,
        summary: result.summary,
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetForm}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New
              </Button>
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
                onSelect={loadSimulation}
                selectedId={currentSimulation?.id}
                isLoading={loadingSimulations}
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
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Setup
                </TabsTrigger>
                <TabsTrigger 
                  value="results"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  disabled={!currentSimulation}
                >
                  <List className="w-4 h-4 mr-2" />
                  Results
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
                    {/* Summary */}
                    {currentSimulation.summary && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-200 p-6 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-5 h-5 text-violet-600" />
                          <h3 className="text-sm font-semibold text-violet-900">
                            Synthesis & Recommendations
                          </h3>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {currentSimulation.summary}
                        </p>
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
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}