import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Play, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ENVIRONMENT_FACTORS = {
  budget_pressure: { label: 'Budget Pressure', levels: ['none', 'moderate', 'severe'] },
  time_pressure: { label: 'Time Pressure', levels: ['none', 'tight deadline', 'crisis mode'] },
  team_conflict: { label: 'Team Conflict', levels: ['none', 'existing friction', 'hostile'] },
  market_pressure: { label: 'Market Pressure', levels: ['none', 'competitor threat', 'existential'] },
  regulatory_scrutiny: { label: 'Regulatory Scrutiny', levels: ['none', 'increased', 'investigation'] },
};

function ConfigPanel({ testConfig, setTestConfig, onRun, isRunning }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Test Name</label>
        <Input
          placeholder="e.g., Budget Crunch Scenario"
          value={testConfig.name}
          onChange={(e) => setTestConfig({ ...testConfig, name: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Iterations</label>
        <div className="flex gap-2 mt-2">
          {[3, 5, 10, 25].map((num) => (
            <Button
              key={num}
              variant={testConfig.iterations === num ? 'default' : 'outline'}
              onClick={() => setTestConfig({ ...testConfig, iterations: num })}
              className="flex-1"
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Environmental Factors</h3>
        {Object.entries(ENVIRONMENT_FACTORS).map(([key, { label, levels }]) => (
          <div key={key} className="space-y-2">
            <p className="text-xs text-slate-600">{label}</p>
            <div className="flex gap-1">
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={testConfig.environmental_factors[key] === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setTestConfig({
                      ...testConfig,
                      environmental_factors: { ...testConfig.environmental_factors, [key]: level },
                    })
                  }
                  className="flex-1 text-xs"
                >
                  {level || 'None'}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onRun}
        disabled={!testConfig.name || isRunning}
        className="w-full"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Run Stress Test
          </>
        )}
      </Button>
    </div>
  );
}

function ResultsPanel({ result, onSaveTemplate, onClose }) {
  if (!result.aggregate_stats) return null;

  const stats = result.aggregate_stats;
  const failureModes = stats.failure_modes || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Success Rate</p>
            <p className="text-2xl font-bold">{Math.round(stats.success_rate || 0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Avg Tensions</p>
            <p className="text-2xl font-bold">{Math.round(stats.avg_tensions || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Avg Quality</p>
            <p className="text-2xl font-bold">{Math.round(stats.avg_decision_quality || 0)}/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600">Resilience</p>
            <p className="text-2xl font-bold">{Math.round(stats.resilience_score || 0)}/100</p>
          </CardContent>
        </Card>
      </div>

      {result.results?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Iterations Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium">Iteration</th>
                    <th className="text-left py-2 px-2 font-medium">Outcome</th>
                    <th className="text-left py-2 px-2 font-medium">Tensions</th>
                    <th className="text-left py-2 px-2 font-medium">Consensus</th>
                    <th className="text-left py-2 px-2 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <Badge variant={r.outcome === 'success' ? 'default' : 'outline'}>
                          {r.outcome}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{r.tensions_count || 0}</td>
                      <td className="py-2 px-2">{r.consensus_achieved ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-2">{Math.round(r.decision_quality_score || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(failureModes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Failure Modes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(failureModes).map(([mode, count]) => (
              <div key={mode} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-xs text-slate-700">{mode}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={onSaveTemplate} variant="outline" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save as Template
        </Button>
        <Button onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
}

export default function StressTestRunner({ open, onOpenChange, simulation, selectedRoles, environmentalFactors }) {
  const [step, setStep] = useState('config');
  const [testConfig, setTestConfig] = useState({
    name: `Stress Test - ${simulation?.title || 'Untitled'}`,
    iterations: 5,
    environmental_factors: environmentalFactors || {
      budget_pressure: 'none',
      time_pressure: 'none',
      team_conflict: 'none',
      market_pressure: 'none',
      regulatory_scrutiny: 'none',
    },
  });
  const [testResult, setTestResult] = useState(null);
  const queryClient = useQueryClient();

  const runStressTest = useMutation({
    mutationFn: async () => {
      if (!simulation) throw new Error('No simulation provided');

      const res = await base44.functions.invoke('runStressTest', {
        simulation_id: simulation.id,
        iterations: testConfig.iterations,
        environmental_factors: testConfig.environmental_factors,
      });

      return res.data;
    },
    onSuccess: (data) => {
      setTestResult(data);
      setStep('results');
      toast.success('Stress test completed');
    },
    onError: (error) => {
      toast.error(`Stress test failed: ${error.message}`);
    },
  });

  const saveAsTemplate = useMutation({
    mutationFn: async () => {
      const template = await base44.entities.StressTestTemplate.create({
        name: testConfig.name,
        description: `Stress test with ${testConfig.iterations} iterations`,
        scenario: simulation.scenario,
        selected_roles: simulation.selected_roles,
        environmental_factors: testConfig.environmental_factors,
        use_case_type: simulation.use_case_type,
        source_simulation_id: simulation.id,
        tags: ['stress-test'],
      });
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stress_test_templates'] });
      toast.success('Template saved');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'config' ? 'Configure Stress Test' : 'Stress Test Results'}
          </DialogTitle>
        </DialogHeader>

        {step === 'config' ? (
          <ConfigPanel
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            onRun={() => runStressTest.mutate()}
            isRunning={runStressTest.isPending}
          />
        ) : (
          <ResultsPanel
            result={testResult}
            onSaveTemplate={() => saveAsTemplate.mutate()}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}