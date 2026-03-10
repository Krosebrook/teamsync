import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Play, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function StressTestRunner({ open, onOpenChange, template, simulation }) {
  const [iterations, setIterations] = useState(50);
  const [activeTestId, setActiveTestId] = useState(null);
  const queryClient = useQueryClient();

  const { data: stressTests = [], refetch: refetchTests } = useQuery({
    queryKey: ['stressTests', template?.id],
    queryFn: () => template?.id ? base44.entities.StressTestResult.filter({ template_id: template.id }) : Promise.resolve([]),
    enabled: !!template?.id,
  });

  const runTestMutation = useMutation({
    mutationFn: (iterCount) => base44.functions.invoke('runStressTest', {
      template_id: template.id,
      iterations: iterCount,
      simulation_id: simulation?.id,
    }),
    onSuccess: (res) => {
      setActiveTestId(res.stress_test_id);
      toast.success('Stress test started');
      // Poll for completion
      const interval = setInterval(() => {
        refetchTests();
      }, 1000);
      return () => clearInterval(interval);
    },
    onError: (error) => toast.error(error.message),
  });

  const activeTest = stressTests.find(t => t.id === activeTestId);

  useEffect(() => {
    if (!open) setActiveTestId(null);
  }, [open]);

  // Auto-poll active test
  useEffect(() => {
    if (!activeTestId) return;
    const timer = setInterval(() => refetchTests(), 2000);
    return () => clearInterval(timer);
  }, [activeTestId, refetchTests]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Stress Test Runner
          </DialogTitle>
          <DialogDescription>
            Run {template?.name} multiple times with randomized environmental factors
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList>
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="results" disabled={!stressTests.length}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {!activeTest || activeTest.status === 'completed' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Iterations (1-1000)</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={iterations}
                    onChange={(e) => setIterations(parseInt(e.target.value) || 10)}
                    disabled={activeTest && activeTest.status === 'running'}
                  />
                </div>
                <Button
                  onClick={() => runTestMutation.mutate(iterations)}
                  disabled={runTestMutation.isPending || (activeTest && activeTest.status === 'running')}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {runTestMutation.isPending ? 'Starting...' : 'Start Test'}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="text-slate-500">
                      {activeTest.iterations_completed} / {activeTest.iterations_requested}
                    </span>
                  </div>
                  <Progress
                    value={(activeTest.iterations_completed / activeTest.iterations_requested) * 100}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {stressTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900">{test.iterations_completed} / {test.iterations_requested} iterations</h4>
                    <p className="text-sm text-slate-500">{test.status}</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    {test.aggregate_stats?.success_rate || 0}%
                  </span>
                </div>

                {test.aggregate_stats && (
                  <>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-500">Avg Tensions</p>
                        <p className="text-lg font-semibold">{test.aggregate_stats.avg_tensions.toFixed(1)}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-500">Avg Quality</p>
                        <p className="text-lg font-semibold">{test.aggregate_stats.avg_decision_quality}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-500">Resilience</p>
                        <p className="text-lg font-semibold">{test.aggregate_stats.resilience_score}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-500">Failures</p>
                        <p className="text-lg font-semibold">
                          {Object.values(test.aggregate_stats.failure_modes).reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                    </div>

                    {test.results?.length > 0 && (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={test.results.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="iteration" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="decision_quality_score" stroke="#10b981" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}