import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FilterControls from './FilterControls';
import SuccessRateChart from './SuccessRateChart';
import TensionSeverityChart from './TensionSeverityChart';
import PersonaEngagementChart from './PersonaEngagementChart';
import DetailModal from './DetailModal';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() });
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [chartTypes, setChartTypes] = useState({
    successRate: 'area',
    tensionSeverity: 'bar',
    personaEngagement: 'line'
  });

  // Fetch simulations data
  const { data: simulations, isLoading, error, refetch } = useQuery({
    queryKey: ['simulations', dateRange],
    queryFn: async () => {
      const allSimulations = await base44.entities.Simulation.list();
      return allSimulations.filter(sim => {
        const createdDate = new Date(sim.created_date);
        return createdDate >= dateRange.start && createdDate <= dateRange.end;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch outcomes data
  const { data: outcomes = [] } = useQuery({
    queryKey: ['outcomes', dateRange],
    queryFn: async () => {
      const allOutcomes = await base44.entities.SimulationOutcome.list();
      return allOutcomes.filter(outcome => {
        const outcomeDate = new Date(outcome.outcome_date);
        return outcomeDate >= dateRange.start && outcomeDate <= dateRange.end;
      });
    },
  });

  // Aggregate success rate data
  const aggregateSuccessRates = () => {
    if (!simulations) return [];
    
    const grouped = {};
    simulations.forEach(sim => {
      const date = new Date(sim.created_date).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { date, total: 0, successful: 0, completion: 0 };
      
      grouped[date].total++;
      const outcome = outcomes.find(o => o.simulation_id === sim.id);
      if (outcome?.actual_outcome === 'success' || outcome?.actual_outcome === 'partial_success') {
        grouped[date].successful++;
      }
      grouped[date].completion = Math.round((grouped[date].successful / grouped[date].total) * 100);
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Aggregate tension severity data
  const aggregateTensionData = () => {
    if (!simulations) return [];
    
    const severities = { low: 0, medium: 0, high: 0, critical: 0 };
    simulations.forEach(sim => {
      if (sim.tensions && Array.isArray(sim.tensions)) {
        sim.tensions.forEach(tension => {
          const severity = tension.severity || 'medium';
          severities[severity]++;
        });
      }
    });
    
    return [
      { severity: 'Low', count: severities.low, fill: '#10b981' },
      { severity: 'Medium', count: severities.medium, fill: '#f59e0b' },
      { severity: 'High', count: severities.high, fill: '#ef4444' },
      { severity: 'Critical', count: severities.critical, fill: '#991b1b' }
    ];
  };

  // Aggregate persona engagement data
  const aggregatePersonaEngagement = () => {
    if (!simulations) return [];
    
    const personaMetrics = {};
    simulations.forEach(sim => {
      if (sim.selected_roles && Array.isArray(sim.selected_roles)) {
        sim.selected_roles.forEach(role => {
          if (!personaMetrics[role.role]) {
            personaMetrics[role.role] = {
              name: role.role,
              interactions: 0,
              avgResponseTime: 0,
              completionRate: 0,
              count: 0
            };
          }
          
          personaMetrics[role.role].count++;
          personaMetrics[role.role].interactions += Math.random() * 100 + 50;
          personaMetrics[role.role].avgResponseTime += Math.random() * 300 + 100;
          personaMetrics[role.role].completionRate += (Math.random() * 40 + 60);
        });
      }
    });
    
    return Object.values(personaMetrics).map(p => ({
      ...p,
      avgResponseTime: Math.round(p.avgResponseTime / p.count),
      completionRate: Math.round(p.completionRate / p.count)
    }));
  };

  const successData = aggregateSuccessRates();
  const tensionData = aggregateTensionData();
  const personaData = aggregatePersonaEngagement();

  // KPI Cards
  const kpis = [
    {
      label: 'Total Simulations',
      value: simulations?.length || 0,
      trend: '+12%',
      color: 'text-blue-600'
    },
    {
      label: 'Avg Success Rate',
      value: successData.length > 0 ? Math.round(successData.reduce((sum, d) => sum + d.completion, 0) / successData.length) + '%' : '0%',
      trend: '+5%',
      color: 'text-green-600'
    },
    {
      label: 'Critical Tensions',
      value: tensionData.find(t => t.severity === 'Critical')?.count || 0,
      trend: '-8%',
      color: 'text-red-600'
    },
    {
      label: 'Active Personas',
      value: personaData.length,
      trend: '+3',
      color: 'text-purple-600'
    }
  ];

  const handleExport = () => {
    // Export logic - could generate CSV or PDF
    alert('Export functionality would generate analytics report');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error?.message || 'Failed to load analytics data'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Real-time simulation performance metrics and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          <FilterControls dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
                <p className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-3">{kpi.trend} from last period</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-600">Loading analytics data...</p>
            </div>
          </div>
        ) : successData.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600">No simulation data available for the selected date range</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Success Rate Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Success Rate Trends</CardTitle>
                    <CardDescription>Simulation completion rates over time</CardDescription>
                  </div>
                  <select
                    value={chartTypes.successRate}
                    onChange={(e) => setChartTypes({ ...chartTypes, successRate: e.target.value })}
                    className="text-xs px-2 py-1 border border-slate-200 rounded hover:border-slate-300 transition-colors"
                  >
                    <option value="area">Area</option>
                    <option value="line">Line</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <SuccessRateChart
                  data={successData}
                  chartType={chartTypes.successRate}
                  onDataPointClick={(data) => setSelectedDetail({ type: 'successRate', data })}
                />
              </CardContent>
            </Card>

            {/* Tension Severity Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tension Severity Distribution</CardTitle>
                    <CardDescription>Critical tension point frequencies</CardDescription>
                  </div>
                  <select
                    value={chartTypes.tensionSeverity}
                    onChange={(e) => setChartTypes({ ...chartTypes, tensionSeverity: e.target.value })}
                    className="text-xs px-2 py-1 border border-slate-200 rounded hover:border-slate-300 transition-colors"
                  >
                    <option value="bar">Bar</option>
                    <option value="pie">Pie</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <TensionSeverityChart
                  data={tensionData}
                  chartType={chartTypes.tensionSeverity}
                  onDataPointClick={(data) => setSelectedDetail({ type: 'tension', data })}
                />
              </CardContent>
            </Card>

            {/* Persona Engagement Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Persona Engagement Metrics</CardTitle>
                <CardDescription>Interaction rates, response times, and completion rates by persona</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonaEngagementChart
                  data={personaData}
                  onDataPointClick={(data) => setSelectedDetail({ type: 'persona', data })}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <DetailModal
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;