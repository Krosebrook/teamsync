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
  Activity
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

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
      // Prepare historical data
      const historicalData = simulations.slice(0, 20).map(sim => ({
        title: sim.title,
        scenario: sim.scenario,
        roles: sim.selected_roles?.map(r => r.role) || [],
        tensions: sim.tensions || [],
        decision_trade_offs: sim.decision_trade_offs || []
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are analyzing historical simulation data to identify patterns and provide predictive insights.

HISTORICAL SIMULATIONS:
${JSON.stringify(historicalData, null, 2)}

Provide deep analytical insights:
1. ROLE SENTIMENT TRENDS: Which roles consistently take similar positions? Any evolving patterns?
2. RECURRING TENSIONS: What conflicts appear repeatedly? Are they getting better or worse?
3. DECISION PATTERNS: What types of decisions create the most conflict? What resolves smoothly?
4. PREDICTIVE INSIGHTS: Based on patterns, what should teams watch for in future decisions?
5. RECOMMENDATIONS: What process improvements would reduce friction?`,
        response_json_schema: {
          type: "object",
          properties: {
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
            decision_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern_type: { type: "string" },
                  description: { type: "string" },
                  conflict_level: { type: "string" }
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

      {/* Generate Insights Button */}
      <Button
        onClick={generateInsights}
        disabled={loading || simulations.length < 3}
        className="w-full gap-2"
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

          {/* Predictions */}
          {insights.predictions && insights.predictions.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-violet-50 to-white border-violet-200">
              <h3 className="font-semibold text-violet-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Predictive Insights
              </h3>
              <div className="space-y-3">
                {insights.predictions.map((pred, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-violet-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-slate-800">
                        {pred.scenario_type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {pred.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{pred.predicted_outcome}</p>
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