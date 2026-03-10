import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Palette, BarChart3, AlertCircle, Lock } from 'lucide-react';

const Documentation = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sections = [
    {
      id: 'overview',
      title: 'Dashboard Overview',
      icon: BarChart3,
      content: `A production-ready analytics dashboard featuring real-time data visualization with Recharts, interactive filtering, drill-down capabilities, and comprehensive error handling. Includes 3 main charts: Success Rate Trends, Tension Severity Distribution, and Persona Engagement Metrics.`
    },
    {
      id: 'charts',
      title: 'Chart Components',
      icon: BarChart3,
      content: `
1. Success Rate Chart (Area/Line) - Daily simulation completion percentages with blue gradient
2. Tension Severity Chart (Bar/Pie) - Critical tension frequencies with color-coded severity levels
3. Persona Engagement Chart (Multi-line + Table) - Interaction rates, response times, and completion rates per persona with dual Y-axis

All charts include custom tooltips, legends, and drill-down capabilities via click events.`
    },
    {
      id: 'colors',
      title: 'Color Scheme',
      icon: Palette,
      content: `
Primary Palette:
- Blue (#3b82f6): Success rates, primary interactions
- Green (#10b981): Positive outcomes, completion rates
- Amber (#f59e0b): Warnings, response times, medium severity
- Red (#ef4444): Alerts, high tensions
- Dark Red (#991b1b): Critical issues

Tension Severity Colors:
- Low: Green (#10b981)
- Medium: Amber (#f59e0b)
- High: Red (#ef4444)
- Critical: Dark Red (#991b1b)`
    },
    {
      id: 'filtering',
      title: 'Date Filtering',
      icon: Code2,
      content: `
Quick Presets:
- Last 7 Days
- Last 30 Days
- Last 90 Days (default)
- Last 6 Months

Custom Range:
- Dual date pickers for start/end dates
- Apply and Reset buttons
- Automatic data refetch on filter change
- All visualizations update simultaneously`
    },
    {
      id: 'drilldown',
      title: 'Drill-Down Features',
      icon: Code2,
      content: `
Click any data point to reveal detailed breakdown:

Success Rate: Specific date metrics, successful/total count, trend analysis
Tension: Severity level details, occurrence count, risk assessment, mitigation suggestions
Persona: Performance metrics, progress bars, speed classification, engagement levels, personalized recommendations

Modal includes visual indicators, KPI cards, performance breakdowns, and actionable insights.`
    },
    {
      id: 'loading',
      title: 'Loading & Empty States',
      icon: AlertCircle,
      content: `
Loading State:
- Animated spinner icon
- "Loading analytics data..." message
- Centered in viewport with full-height container

Empty Data:
- Dashed border card container
- "No simulation data available for the selected date range"
- Suggestion to adjust date filters

Per-Chart Fallbacks:
- "No data available" message in each chart
- Graceful degradation when specific metrics missing`
    },
    {
      id: 'errors',
      title: 'Error Handling',
      icon: AlertCircle,
      content: `
Error Boundary:
- Catches React component errors
- User-friendly error messages
- Recovery button ("Try Again")
- Console logging for debugging

Query Errors:
- Alert card with error icon
- Specific error message display
- Troubleshooting suggestions
- Refresh button for retry

Data Validation:
- Checks for null/undefined arrays
- Validates date ranges
- Handles malformed data gracefully
- Falls back to safe defaults`
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: Lock,
      content: `
Optimizations:
- React Query with 5-minute stale time prevents over-fetching
- Manual refresh button for user control
- ResponsiveContainer for adaptive sizing
- SVG rendering for chart performance
- Proper key props on all list iterations
- Local state management prevents prop drilling

Data Caching:
- Automatic garbage collection
- Smart refetch triggers on date changes
- No circular references or memory leaks`
    },
    {
      id: 'responsive',
      title: 'Responsive Design',
      icon: Code2,
      content: `
Mobile (< 768px):
- Single column grid for charts
- KPI cards stack vertically
- Dropdown filter menu on header

Tablet (768px - 1024px):
- 2-column grid for main charts
- Full-width persona chart
- Side-by-side KPI cards

Desktop (> 1024px):
- 2-column responsive main grid
- 4-column KPI card grid
- Optimized spacing and padding`
    },
    {
      id: 'kpis',
      title: 'KPI Cards',
      icon: BarChart3,
      content: `
Four high-level metrics displayed:
1. Total Simulations - Count of all simulations in date range
2. Average Success Rate - Mean completion percentage across period
3. Critical Tensions - Count of critical-level tensions
4. Active Personas - Number of unique personas in simulations

Features:
- Color-coded text per metric
- Trend indicators (+/- percentage)
- Hover elevation effect
- Real-time updates with date filter`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Analytics Dashboard Documentation</h1>
          <p className="text-lg text-slate-600">Complete guide to the simulation platform analytics system</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
                    <div className="prose prose-sm max-w-none">
                      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Key Features Summary */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">✨ Key Features</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Real-time data visualization with Recharts</li>
              <li>• Interactive date range filtering</li>
              <li>• Chart type switching (Area/Line, Bar/Pie)</li>
              <li>• Click-to-drill-down detail modals</li>
              <li>• Custom tooltips with rich data</li>
              <li>• Metric visibility toggle (Persona chart)</li>
              <li>• Interactive data tables</li>
              <li>• Comprehensive error handling</li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-emerald-900 mb-3">🎯 Data Aggregation</h3>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li>• Success rates: Daily grouping by completion %</li>
              <li>• Tensions: Aggregated by severity level</li>
              <li>• Personas: Engagement metrics per role</li>
              <li>• KPIs: Real-time metric calculations</li>
              <li>• Trends: Period comparisons with indicators</li>
              <li>• Risk Assessment: Severity-based insights</li>
              <li>• Performance Scoring: Multi-metric analysis</li>
              <li>• Actionable Recommendations: AI-powered tips</li>
            </ul>
          </div>
        </div>

        {/* Integration Notes */}
        <div className="mt-12 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Integration Notes</h3>
          <div className="space-y-4 text-slate-700">
            <p>
              <strong>Data Source:</strong> Uses Base44 SDK to fetch Simulation and SimulationOutcome entities. 
              Date filtering applied client-side for flexibility.
            </p>
            <p>
              <strong>State Management:</strong> React Query for data fetching with 5-minute cache, 
              local component state for UI interactions (filters, chart types, selections).
            </p>
            <p>
              <strong>Performance:</strong> Optimized for 100-1000 simulations with auto-pagination support 
              for larger datasets. Consider implementing server-side pagination for 10K+ records.
            </p>
            <p>
              <strong>Future Enhancements:</strong> Real-time updates via WebSockets, predictive analytics, 
              custom report builder, scheduled exports, and advanced filtering options.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-slate-900 rounded-lg overflow-hidden">
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
            <p className="text-sm font-mono text-slate-300">Usage Example</p>
          </div>
          <pre className="p-6 overflow-x-auto text-sm text-slate-300 font-mono">
{`import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AnalyticsDashboard />
    </ErrorBoundary>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Documentation;