import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2, CheckCircle2 } from "lucide-react";

const DECISION_TYPES = [
  { id: "pre_mortem", name: "Pre-Mortem Analysis", description: "Identify risks before launch" },
  { id: "roadmap", name: "Roadmap Planning", description: "Align on product direction" },
  { id: "adr", name: "Architecture Decision", description: "Technical design choices" },
  { id: "pmf_validation", name: "Product-Market Fit", description: "Validate market assumptions" },
  { id: "tech_debt", name: "Tech Debt Resolution", description: "Prioritize technical improvements" },
  { id: "build_buy", name: "Build vs Buy", description: "Make vs purchase decisions" },
  { id: "migration", name: "Migration Planning", description: "System or platform migration" },
  { id: "customer_escalation", name: "Customer Escalation", description: "Handle critical customer issues" },
  { id: "custom", name: "Custom Decision", description: "Define your own scenario" }
];

export default function DecisionCanvas({ 
  title, 
  setTitle,
  scenario,
  setScenario,
  decisionType,
  setDecisionType,
  selectedRoles,
  onRunSimulation,
  isRunning
}) {
  const currentStep = !decisionType ? 1 : !scenario.trim() ? 2 : 3;

  return (
    <div className="space-y-6">
      {/* Step 1: Decision Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
            ${currentStep >= 1 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}
          `}>
            {currentStep > 1 ? <CheckCircle2 className="w-3 h-3" /> : '1'}
          </div>
          <Label className="text-sm font-medium text-slate-700">Decision Type</Label>
        </div>
        
        <Select value={decisionType} onValueChange={setDecisionType}>
          <SelectTrigger className="h-9 border-slate-200">
            <SelectValue placeholder="Select decision type" />
          </SelectTrigger>
          <SelectContent>
            {DECISION_TYPES.map(dt => (
              <SelectItem key={dt.id} value={dt.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{dt.name}</span>
                  <span className="text-xs text-slate-500">{dt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Define Scenario */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
            ${currentStep >= 2 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}
          `}>
            {currentStep > 2 ? <CheckCircle2 className="w-3 h-3" /> : '2'}
          </div>
          <Label className="text-sm font-medium text-slate-700">Define Scenario</Label>
        </div>
        
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Decision title"
            className="h-9 border-slate-200"
            disabled={!decisionType}
          />
          <Textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe the decision context, constraints, and objectives..."
            className="min-h-[160px] resize-none border-slate-200"
            disabled={!decisionType}
          />
        </div>
      </div>

      {/* Step 3: Run */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
            ${currentStep >= 3 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}
          `}>
            3
          </div>
          <Label className="text-sm font-medium text-slate-700">Execute Simulation</Label>
        </div>

        <Button
          onClick={onRunSimulation}
          disabled={!title.trim() || !scenario.trim() || selectedRoles.length < 2 || isRunning}
          className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Simulation
            </>
          )}
        </Button>

        {selectedRoles.length < 2 && (
          <p className="text-xs text-slate-500 text-center">
            Add at least 2 roles to run simulation
          </p>
        )}
      </div>
    </div>
  );
}