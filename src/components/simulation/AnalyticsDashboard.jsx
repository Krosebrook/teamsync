import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Target,
  Sparkles,
  Loader2,
  BarChart3,
  Activity,
  Download,
  Flame
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import NetworkGraph from './NetworkGraph';

export default function AnalyticsDashboard({ simulations }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (!simulations || simulations.length < 3) {
      toast.error('Need at least 3 simulations for meaningful insights');
      return;
    }

    setLoading(true);
    try {
      const historicalData = simulations.slice(0, 20).map(sim => ({
        title: sim.title,
        scenario: sim.scenario,
        roles: sim.selected_roles?.map(r => r.role) || [],
        tensions: sim.tensions || [],
        decision_trade_offs: sim.decision_trade_offs || []
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert decision analyst providing advanced insights on team decision-making patterns.

HISTORICAL SIMULATIONS:
${JSON.stringify(historicalData, null, 2)}

Provide comprehensive analytical insights:

1. DECISION TRADE-OFFS ANALYSIS:
   - Identify and summarize the key trade-offs across all simulations
   - For each trade-off, explain the implications and long-term consequences
   - Highlight any recurring patterns in how teams approach trade-offs

2. PROACTIVE RISK FLAGGING:
   - Identify potential risks or overlooked factors based on patterns
   - Flag blindspots: what critical perspectives or concerns are consistently missing?
   - Highlight any concerning trends in decision quality or team dynamics

3. FUTURE SIMULATION SUGGESTIONS:
   - Suggest specific simulation parameters to test hypotheses
   - Recommend roles to include that would provide missing perspectives
   - Suggest scenario modifications to explore edge cases or stress-test decisions
   - Propose simulations that could mitigate identified risks

4. ROLE SENTIMENT TRENDS: Which roles consistently take similar positions? Any evolving patterns?

5. RECURRING TENSIONS: What conflicts appear repeatedly? Are they getting better or worse?

6. PREDICTIVE INSIGHTS: Based on patterns, what outcomes are likely for different decision types?

7. RECOMMENDATIONS: What process improvements would reduce friction and improve decisions?`,
        response_json_schema: {
          type: "object",
          properties: {
            trade_off_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trade_off: { type: "string" },
                  frequency: { type: "string" },
                  implications: { type: "string" },
                  pattern: { type: "string" }
                }
              },
              description: "Key trade-offs identified across simulations"
            },
            risk_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk_type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  overlooked_factor: { type: "string" }
                }
              },
              description: "Proactive risk identification"
            },
            future_simulations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  suggestion_type: { type: "string" },
                  scenario_description: { type: "string" },
                  recommended_roles: { type: "array", items: { type: "string" } },
                  hypothesis_to_test: { type: "string" },
                  expected_insight: { type: "string" }
                }
              },
              description: "Suggested future simulation parameters"
            },
            role_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  trend: { type: "string" },
                  sentiment: { type: "string" }
                }
              }
            },
            recurring_tensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  between: { type: "array", items: { type: "string" } },
                  pattern: { type: "string" },
                  frequency: { type: "string" },
                  severity_trend: { type: "string" }
                }
              }
            },
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario_type: { type: "string" },
                  predicted_outcome: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(result);
    } catch (error) {
      toast.error('Failed to generate insights');
      console.error(error);
    }
    setLoading(false);
  };

  const exportAnalyticsPDF = async () => {
    if (!insights) {
      toast.error('Generate insights first');
      return;
    }

    try {
      const { data } = await base44.functions.invoke('exportAnalyticsPDF', {
        insights,
        stats
      });

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Analytics report exported');
    } catch (error) {
      toast.error('Failed to export analytics');
      console.error(error);
    }
  };

  const exportToPowerPoint = async () => {
    if (!insights) {
      toast.error('Generate insights first');
      return;
    }

    setLoading(true);
    try {
      const latestSim = simulations[0];
      const { data } = await base44.functions.invoke('exportSimulationPPTX', {
        simulation: latestSim,
        insights,
        stats
      });

      const blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${latestSim.title.replace(/[^a-z0-9]/gi, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PowerPoint report exported');
    } catch (error) {
      toast.error('Failed to export PowerPoint');
      console.error(error);
    }
    setLoading(false);
  };

  const stats = useMemo(() => {
    if (!simulations || simulations.length === 0) return null;

    const totalSimulations = simulations.length;
    const allTensions = simulations.flatMap(s => s.tensions || []);
    const criticalTensions = allTensions.filter(t => t.severity === 'critical').length;
    const uniqueRoles = new Set(simulations.flatMap(s => 
      s.selected_roles?.map(r => r.role) || []
    )).size;

    return {
      totalSimulations,
      criticalTensions,
      uniqueRoles,
      avgRolesPerSim: (simulations.reduce((acc, s) => 
        acc + (s.selected_roles?.length || 0), 0) / totalSimulations).toFixed(1)
    };
  }, [simulations]);

  // Role sentiment over time
  const roleSentimentData = useMemo(() => {
    if (!simulations || simulations.length === 0) return [];

    const roleMap = {};
    simulations.slice().reverse().forEach((sim, idx) => {
      sim.responses?.forEach(resp => {
        if (!roleMap[resp.role]) {
          roleMap[resp.role] = [];
        }
        const sentimentScore = resp.risk_tolerance === 'low' ? 3 : resp.risk_tolerance === 'medium' ? 2 : 1;
        roleMap[resp.role].push({ index: idx + 1, score: sentimentScore });
      });
    });

    const chartData = [];
    const maxIndex = Math.max(...Object.values(roleMap).flatMap(arr => arr.map(d => d.index)));
    
    for (let i = 1; i <= maxIndex; i++) {
      const dataPoint = { simulation: i };
      Object.keys(roleMap).forEach(role => {
        const point = roleMap[role].find(d => d.index === i);
        if (point) dataPoint[role] = point.score;
      });
      chartData.push(dataPoint);
    }

    return { chartData, roles: Object.keys(roleMap).slice(0, 5) };
  }, [simulations]);

  // Tension heatmap data
  const tensionHeatmapData = useMemo(() => {
    if (!simulations || simulations.length === 0) return [];

    const tensionMap = {};
    simulations.forEach(sim => {
      sim.tensions?.forEach(tension => {
        const key = tension.between.sort().join(' vs ');
        if (!tensionMap[key]) {
          tensionMap[key] = { between: tension.between, count: 0, severities: [] };
        }
        tensionMap[key].count++;
        tensionMap[key].severities.push(tension.severity);
      });
    });

    return Object.values(tensionMap).map(t => ({
      ...t,
      avgSeverity: t.severities.filter(s => s === 'critical').length > t.count / 2 ? 'critical' :
                   t.severities.filter(s => s === 'high').length > t.count / 2 ? 'high' : 'medium'
    })).sort((a, b) => b.count - a.count);
  }, [simulations]);

  if (!simulations || simulations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Run some simulations to see analytics</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.totalSimulations}</p>
              <p className="text-xs text-slate-500">Total Simulations</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.criticalTensions}</p>
              <p className="text-xs text-slate-500">Critical Tensions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.uniqueRoles}</p>
              <p className="text-xs text-slate-500">Unique Roles</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats?.avgRolesPerSim}</p>
              <p className="text-xs text-slate-500">Avg Roles/Sim</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={generateInsights}
          disabled={loading || simulations.length < 3}
          className="flex-1 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Patterns...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Insights
            </>
          )}
        </Button>
        {insights && (
          <>
            <Button
              onClick={exportAnalyticsPDF}
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button
              onClick={exportToPowerPoint}
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              PowerPoint
            </Button>
          </>
        )}
      </div>

      {/* Network Graph */}
      {simulations.length > 0 && simulations[0]?.responses && (
        <NetworkGraph simulation={simulations[0]} />
      )}

      {/* Role Sentiment Trends Chart */}
      {simulations.length >= 3 && roleSentimentData.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Role Sentiment Trends Over Time
          </h3>
          <p className="text-xs text-slate-500 mb-4">Risk tolerance by role across simulations (3=Low risk, 2=Medium, 1=High risk)</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={roleSentimentData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="simulation" 
                label={{ value: 'Simulation #', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                domain={[0.5, 3.5]}
                ticks={[1, 2, 3]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                formatter={(value) => {
                  if (value === 3) return 'Low risk';
                  if (value === 2) return 'Medium risk';
                  if (value === 1) return 'High risk';
                  return value;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {roleSentimentData.roles.map((role, idx) => (
                <Line 
                  key={role}
                  type="monotone" 
                  dataKey={role} 
                  stroke={ROLE_COLORS[idx % ROLE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={role.replace(/_/g, ' ')}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tension Heatmap */}
      {tensionHeatmapData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            Recurring Tension Heatmap
          </h3>
          <p className="text-xs text-slate-500 mb-4">Frequency and severity of role conflicts</p>
          <div className="space-y-2">
            {tensionHeatmapData.slice(0, 10).map((tension, idx) => {
              const severityColors = {
                critical: 'bg-rose-600',
                high: 'bg-orange-500',
                medium: 'bg-amber-400',
                low: 'bg-emerald-400'
              };
              const maxCount = Math.max(...tensionHeatmapData.map(t => t.count));
              const intensity = (tension.count / maxCount) * 100;

              return (
                <div key={idx} className="relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-rose-100 transition-all"
                    style={{ width: `${intensity}%` }}
                  />
                  <div className="relative p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${severityColors[tension.avgSeverity]}`} />
                      <span className="text-sm font-medium text-slate-800">
                        {tension.between.map(r => r.replace(/_/g, ' ')).join(' vs ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {tension.count}x
                      </Badge>
                      <Badge className={`text-xs ${severityColors[tension.avgSeverity]} text-white`}>
                        {tension.avgSeverity}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Insights Display */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Role Trends */}
          {insights.role_trends && insights.role_trends.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Role Sentiment Trends
              </h3>
              <div className="space-y-3">
                {insights.role_trends.map((trend, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-800 capitalize">
                        {trend.role.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {trend.sentiment}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{trend.trend}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recurring Tensions */}
          {insights.recurring_tensions && insights.recurring_tensions.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Recurring Tensions
              </h3>
              <div className="space-y-3">
                {insights.recurring_tensions.map((tension, idx) => (
                  <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {tension.between.map((role, i) => (
                        <React.Fragment key={role}>
                          <span className="text-sm font-medium text-slate-800 capitalize">
                            {role.replace(/_/g, ' ')}
                          </span>
                          {i < tension.between.length - 1 && (
                            <span className="text-slate-400">vs</span>
                          )}
                        </React.Fragment>
                      ))}
                      <Badge className="ml-auto text-xs bg-rose-100 text-rose-700">
                        {tension.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{tension.pattern}</p>
                    <p className="text-xs text-slate-500">Trend: {tension.severity_trend}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Predictive Analysis */}
          {insights.predictions && insights.predictions.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-violet-50 to-white border-violet-200">
              <h3 className="font-semibold text-violet-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Predictive Analysis - Potential Outcomes
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Based on historical patterns, here are likely outcomes for different decision paths
              </p>
              <div className="space-y-3">
                {insights.predictions.map((pred, idx) => {
                  const confidence = pred.confidence || 0;
                  const confidenceColor = confidence >= 75 ? 'emerald' : confidence >= 50 ? 'amber' : 'rose';
                  
                  return (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-violet-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm text-slate-800">
                          {pred.scenario_type}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-${confidenceColor}-500 transition-all`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <Badge variant="outline" className={`text-xs text-${confidenceColor}-700`}>
                            {confidence}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{pred.predicted_outcome}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Trade-Off Analysis */}
          {insights.trade_off_analysis && insights.trade_off_analysis.length > 0 && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Decision Trade-Offs Analysis
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Key trade-offs identified across simulations and their implications
              </p>
              <div className="space-y-3">
                {insights.trade_off_analysis.map((tradeoff, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-slate-800">{tradeoff.trade_off}</span>
                      <Badge variant="outline" className="text-xs">{tradeoff.frequency}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{tradeoff.implications}</p>
                    <p className="text-xs text-slate-500 italic">Pattern: {tradeoff.pattern}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risk Flags */}
          {insights.risk_flags && insights.risk_flags.length > 0 && (
            <Card className="p-6 bg-orange-50 border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Proactive Risk Flags
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Potential risks and overlooked factors identified from patterns
              </p>
              <div className="space-y-3">
                {insights.risk_flags.map((risk, idx) => {
                  const severityColors = {
                    critical: 'bg-rose-600',
                    high: 'bg-orange-500',
                    medium: 'bg-amber-400',
                    low: 'bg-blue-400'
                  };
                  return (
                    <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-slate-800">{risk.risk_type}</span>
                        <div className={`w-2 h-2 rounded-full ${severityColors[risk.severity]}`} />
                        <Badge className={`text-xs ${severityColors[risk.severity]} text-white`}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                      <div className="p-2 bg-amber-50 rounded border border-amber-200">
                        <p className="text-xs font-medium text-amber-900 mb-1">Overlooked Factor:</p>
                        <p className="text-xs text-amber-800">{risk.overlooked_factor}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Future Simulation Suggestions */}
          {insights.future_simulations && insights.future_simulations.length > 0 && (
            <Card className="p-6 bg-purple-50 border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Suggested Future Simulations
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Recommended simulation parameters to test hypotheses and mitigate risks
              </p>
              <div className="space-y-4">
                {insights.future_simulations.map((suggestion, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="text-xs bg-purple-100 text-purple-700">
                        {suggestion.suggestion_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-2">
                      {suggestion.scenario_description}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Recommended Roles:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.recommended_roles.map((role, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {role.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <p className="text-xs font-medium text-purple-900 mb-1">Hypothesis:</p>
                        <p className="text-xs text-purple-800">{suggestion.hypothesis_to_test}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <p className="text-xs font-medium text-slate-700 mb-1">Expected Insight:</p>
                        <p className="text-xs text-slate-600">{suggestion.expected_insight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card className="p-6 bg-emerald-50 border-emerald-200">
              <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Process Recommendations
              </h3>
              <ul className="space-y-2">
                {insights.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

const ROLE_COLORS = [
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ec4899', // pink
  '#6366f1', // indigo
];