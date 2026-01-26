import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Code, Users, Zap, FileText, Database, Wrench } from "lucide-react";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Documentation</h1>
              <p className="text-sm text-slate-500">Team Decision Simulation Platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="entities">Data Model</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="guides">User Guides</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="prose prose-slate max-w-none">
            <OverviewDoc />
          </TabsContent>

          <TabsContent value="features" className="prose prose-slate max-w-none">
            <FeaturesDoc />
          </TabsContent>

          <TabsContent value="entities" className="prose prose-slate max-w-none">
            <EntitiesDoc />
          </TabsContent>

          <TabsContent value="api" className="prose prose-slate max-w-none">
            <APIDoc />
          </TabsContent>

          <TabsContent value="guides" className="prose prose-slate max-w-none">
            <GuidesDoc />
          </TabsContent>

          <TabsContent value="technical" className="prose prose-slate max-w-none">
            <TechnicalDoc />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OverviewDoc() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Team Decision Simulation Platform</h1>
        <p className="text-lg text-slate-600">Enterprise-grade decision intelligence for cross-functional teams</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Overview</h2>
        <p className="text-slate-700 leading-relaxed">
          The Team Decision Simulation Platform is a professional SaaS application that uses AI to simulate 
          how different team roles will react to product and business decisions before they're made. Built for 
          founders, engineering managers, and executives who need to understand organizational dynamics and 
          predict team alignment issues.
        </p>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Core Value Proposition</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-slate-700 mb-2">🎯 Predict Tensions</h3>
            <p className="text-sm text-slate-600">Surface conflicts between roles before building</p>
          </div>
          <div>
            <h3 className="font-medium text-slate-700 mb-2">🤝 Build Consensus</h3>
            <p className="text-sm text-slate-600">Understand each stakeholder's perspective</p>
          </div>
          <div>
            <h3 className="font-medium text-slate-700 mb-2">⚡ Decide Faster</h3>
            <p className="text-sm text-slate-600">Compare scenarios and track outcomes</p>
          </div>
          <div>
            <h3 className="font-medium text-slate-700 mb-2">📊 Executive Reports</h3>
            <p className="text-sm text-slate-600">Export polished reports for leadership</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Quick Start</h2>
        <ol className="space-y-3 text-slate-700">
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900">1.</span>
            <div>
              <strong>Select Decision Type</strong> - Choose from 9 pre-built templates or create custom
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900">2.</span>
            <div>
              <strong>Define Scenario</strong> - Describe your decision context (3-4 sentences)
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900">3.</span>
            <div>
              <strong>Choose Participants</strong> - Select 2-10 team roles with influence weights
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900">4.</span>
            <div>
              <strong>Run Simulation</strong> - AI analyzes each role's perspective in ~30 seconds
            </div>
          </li>
        </ol>
      </section>

      <section className="bg-slate-100 border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Platform Architecture</h2>
        <pre className="text-xs text-slate-700 font-mono bg-white p-4 border border-slate-200 overflow-x-auto">
{`┌─────────────┬──────────────────────┬─────────────────┐
│   ROLES     │   DECISION CANVAS    │  CONTEXT PANEL  │
│   (Left)    │      (Center)        │    (Right)      │
├─────────────┼──────────────────────┼─────────────────┤
│ • Drag-drop │  Step 1: Type       │  Impact preview │
│   pills     │  Step 2: Scenario   │  Risk factors   │
│ • Influence │  Step 3: Execute    │  Trade-offs     │
│   weights   │                      │  History        │
│ • Templates │  [Run Simulation]   │  Comments       │
└─────────────┴──────────────────────┴─────────────────┘`}
        </pre>
      </section>
    </div>
  );
}

function FeaturesDoc() {
  const features = [
    {
      category: "Core Features",
      items: [
        { name: "AI Simulation Engine", desc: "Generate role perspectives in 30 seconds", status: "✅" },
        { name: "Custom Roles", desc: "Define organization-specific roles", status: "✅" },
        { name: "Decision Templates", desc: "9 pre-built + AI-generated templates", status: "✅" },
        { name: "Tension Mapping", desc: "Visual conflict identification", status: "✅" },
        { name: "Next Steps Extraction", desc: "Actionable items with confidence scores", status: "✅" }
      ]
    },
    {
      category: "Collaboration",
      items: [
        { name: "Comments & @Mentions", desc: "Threaded discussions on simulations", status: "✅" },
        { name: "Sharing Controls", desc: "Grant access via email", status: "✅" },
        { name: "Version Control", desc: "Branch and compare scenarios", status: "✅" }
      ]
    },
    {
      category: "Analytics & Intelligence",
      items: [
        { name: "Comparison Mode", desc: "Side-by-side analysis of 2-4 simulations", status: "✅" },
        { name: "Outcome Tracking", desc: "Link to actual results for ML", status: "✅" },
        { name: "Similar Decisions", desc: "Pattern matching from history", status: "✅" },
        { name: "AI Decision Coach", desc: "Real-time scenario guidance", status: "✅" },
        { name: "Analytics Dashboard", desc: "Trends and predictive insights", status: "✅" }
      ]
    },
    {
      category: "Export & Integration",
      items: [
        { name: "PDF Export", desc: "Executive report generation", status: "✅" },
        { name: "Role Persona Library", desc: "Industry-specific role definitions", status: "✅" },
        { name: "Decision Playbooks", desc: "DACI, RACI, Pre-mortem frameworks", status: "✅" }
      ]
    },
    {
      category: "Coming Soon",
      items: [
        { name: "Slack Integration", desc: "Post summaries to channels", status: "🔄" },
        { name: "Linear/Jira Sync", desc: "Import ADRs, export tasks", status: "🔄" },
        { name: "Interactive Visualizations", desc: "Network graphs, heatmaps", status: "🔄" },
        { name: "Public API", desc: "Programmatic access", status: "🔄" }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Feature Reference</h1>
        <p className="text-slate-600">Complete guide to all platform capabilities</p>
      </div>

      {features.map(category => (
        <section key={category.category}>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">{category.category}</h2>
          <div className="space-y-2">
            {category.items.map(item => (
              <div key={item.name} className="border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{item.status}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800">{item.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EntitiesDoc() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Data Model</h1>
        <p className="text-slate-600">Complete entity schema reference</p>
      </div>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Simulation</h2>
        <p className="text-sm text-slate-600 mb-4">Primary entity storing scenarios, roles, and AI results</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Key Fields</h3>
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600">Field</th>
                  <th className="text-left p-2 font-medium text-slate-600">Type</th>
                  <th className="text-left p-2 font-medium text-slate-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-mono">title</td>
                  <td className="p-2">string</td>
                  <td className="p-2">Simulation title</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">scenario</td>
                  <td className="p-2">string</td>
                  <td className="p-2">Decision description</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">selected_roles</td>
                  <td className="p-2">array</td>
                  <td className="p-2">Participating roles with influence</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">responses</td>
                  <td className="p-2">array</td>
                  <td className="p-2">AI-generated role perspectives</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">tensions</td>
                  <td className="p-2">array</td>
                  <td className="p-2">Identified conflicts</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">next_steps</td>
                  <td className="p-2">array</td>
                  <td className="p-2">Actionable recommendations</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">parent_simulation_id</td>
                  <td className="p-2">string</td>
                  <td className="p-2">For versioning/branching</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">CustomRole</h2>
        <p className="text-sm text-slate-600 mb-4">User-defined roles beyond built-in set</p>
        
        <pre className="text-xs bg-slate-900 text-slate-100 p-4 overflow-x-auto font-mono">
{`{
  "name": "Chief Revenue Officer",
  "description": "Revenue growth, sales targets, market expansion",
  "default_influence": 8,
  "icon_name": "TrendingUp",
  "color": "emerald"
}`}
        </pre>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">SimulationTemplate</h2>
        <p className="text-sm text-slate-600 mb-4">Reusable scenario configurations</p>
        
        <pre className="text-xs bg-slate-900 text-slate-100 p-4 overflow-x-auto font-mono">
{`{
  "name": "SaaS Pricing Launch",
  "industry": "b2b_saas",
  "scenario_template": "Launching new pricing tier...",
  "suggested_roles": [
    {"role": "product_manager", "influence": 9},
    {"role": "sales_lead", "influence": 8}
  ],
  "is_ai_generated": true,
  "use_count": 12
}`}
        </pre>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Additional Entities</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-slate-200 p-3">
            <h3 className="font-medium text-slate-800 mb-1">SimulationComment</h3>
            <p className="text-slate-600">Threaded discussions with @mentions</p>
          </div>
          <div className="border border-slate-200 p-3">
            <h3 className="font-medium text-slate-800 mb-1">SimulationOutcome</h3>
            <p className="text-slate-600">Track actual results vs predictions</p>
          </div>
          <div className="border border-slate-200 p-3">
            <h3 className="font-medium text-slate-800 mb-1">RolePersona</h3>
            <p className="text-slate-600">Industry-specific role libraries</p>
          </div>
          <div className="border border-slate-200 p-3">
            <h3 className="font-medium text-slate-800 mb-1">DecisionPlaybook</h3>
            <p className="text-slate-600">Framework templates (DACI, RACI, etc.)</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturesDoc() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Feature Matrix</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">1. Collaboration & Sharing</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Real-time multi-user editing</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Share simulations via email</li>
            <li>• Add comments and annotations</li>
            <li>• @mention team members for notifications</li>
            <li>• Threaded discussions on tensions</li>
            <li>• Mark comments as resolved</li>
          </ul>
          
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Usage Example:</p>
            <code className="text-xs text-slate-700">
              Share → Enter email → Add comment: "@john@company.com what do you think?"
            </code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">2. Export & Presentation</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Executive report generation</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• One-click PDF export</li>
            <li>• Branded templates with logo</li>
            <li>• Executive summary section</li>
            <li>• Tension breakdown with severity</li>
            <li>• Recommended actions list</li>
          </ul>
          
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Function Call:</p>
            <code className="text-xs text-slate-700">
              {`base44.functions.invoke('exportSimulationPDF', { simulation_id })`}
            </code>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">3. Historical Analytics & Patterns</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Decision outcome tracking</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Link simulations to actual outcomes</li>
            <li>• Rate prediction accuracy (0-100%)</li>
            <li>• Document lessons learned</li>
            <li>• Find similar past decisions</li>
            <li>• Pattern detection across outcomes</li>
            <li>• Predictive confidence scores</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">4. Role Persona Library</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Industry-specific personas</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Pre-built personas for Fintech, Healthcare, B2B SaaS</li>
            <li>• Company stage variants (Seed → Public)</li>
            <li>• Typical concerns per industry</li>
            <li>• Risk profiles (Conservative, Moderate, Aggressive)</li>
            <li>• Key metrics each role tracks</li>
            <li>• Common tension patterns</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">5. Simulation Versioning</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Track decision evolution</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Create new versions from existing simulations</li>
            <li>• Label versions (v1, v2, "6-month timeline", etc.)</li>
            <li>• Compare version differences side-by-side</li>
            <li>• "What-if" scenario analysis</li>
            <li>• Track how decisions evolved</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">6. AI Decision Coach</h2>
        <div className="bg-white border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Proactive guidance</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Real-time suggestions while writing scenario</li>
            <li>• Missing role detection</li>
            <li>• Context gap identification</li>
            <li>• Red flag warnings</li>
            <li>• Post-simulation follow-up recommendations</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">7-10. Future Roadmap</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-medium text-slate-700 mb-2">Integration Hub (Q2 2026)</h3>
            <p className="text-sm text-slate-600">Linear, Jira, Notion, Slack connections</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-medium text-slate-700 mb-2">Advanced Viz (Q2 2026)</h3>
            <p className="text-sm text-slate-600">Network graphs, tension heatmaps</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-medium text-slate-700 mb-2">Decision Playbooks (Q3 2026)</h3>
            <p className="text-sm text-slate-600">DACI, RACI, 6-thinking-hats</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-medium text-slate-700 mb-2">API Platform (Q3 2026)</h3>
            <p className="text-sm text-slate-600">REST API, webhooks, CLI tool</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function APIDoc() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">API Reference</h1>
        <p className="text-slate-600">Backend function documentation</p>
      </div>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">exportSimulationPDF</h2>
        <p className="text-sm text-slate-600 mb-4">Generate executive-grade PDF reports</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Request</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`await base44.functions.invoke('exportSimulationPDF', {
  simulation_id: 'sim_abc123'
});`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Response</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`{
  data: ArrayBuffer (PDF binary),
  status: 200,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="report.pdf"'
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">PDF Contents</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Title page with metadata</li>
              <li>• Executive summary</li>
              <li>• Tension breakdown</li>
              <li>• Recommended actions</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">findSimilarSimulations</h2>
        <p className="text-sm text-slate-600 mb-4">AI-powered pattern matching from history</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Request</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`const result = await base44.functions.invoke('findSimilarSimulations', {
  scenario: "Database migration decision",
  limit: 5
});`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Response</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`{
  similar: [
    {
      simulation_id: "sim_xyz",
      similarity_score: 0.87,
      reason: "Both involve database migration...",
      simulation: { full simulation object }
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">aiDecisionCoach</h2>
        <p className="text-sm text-slate-600 mb-4">Real-time scenario guidance</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Request (Setup Phase)</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`const result = await base44.functions.invoke('aiDecisionCoach', {
  scenario: "Launching payment feature",
  selected_roles: [{role: 'product_manager', influence: 8}],
  phase: 'setup'
});`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Response</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`{
  suggestions: [
    {
      type: "missing_role",
      message: "Add Security Engineer for payment features",
      action: "Add Security role with high influence"
    },
    {
      type: "context_gap",
      message: "Consider: PCI compliance requirements",
      action: "Update scenario with regulatory context"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function GuidesDoc() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">User Guides</h1>
        <p className="text-slate-600">Step-by-step instructions for common workflows</p>
      </div>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Creating Your First Simulation</h2>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">1.</span>
            <div className="flex-1">
              <strong className="text-slate-800">Add Team Roles</strong>
              <p className="text-slate-600 mt-1">Click "Add role" in left panel. Select 2-10 roles. Drag to reorder by importance.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">2.</span>
            <div className="flex-1">
              <strong className="text-slate-800">Select Decision Type</strong>
              <p className="text-slate-600 mt-1">Choose from dropdown: Pre-Mortem, Roadmap, ADR, etc.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">3.</span>
            <div className="flex-1">
              <strong className="text-slate-800">Write Scenario</strong>
              <p className="text-slate-600 mt-1">Be specific: include numbers, timelines, constraints, alternatives.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">4.</span>
            <div className="flex-1">
              <strong className="text-slate-800">Run Simulation</strong>
              <p className="text-slate-600 mt-1">Click "Run Simulation". Wait ~30 seconds for AI analysis.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">5.</span>
            <div className="flex-1">
              <strong className="text-slate-800">Review Results</strong>
              <p className="text-slate-600 mt-1">Check summary, tensions, next steps. Export PDF if needed.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Comparing Simulations</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">1.</span>
            <span className="text-slate-700">Click "Compare" in header</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">2.</span>
            <span className="text-slate-700">Select 2-4 simulations from history (checkboxes appear)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">3.</span>
            <span className="text-slate-700">View side-by-side comparison tab</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-slate-900 w-6">4.</span>
            <span className="text-slate-700">Analyze: role differences, tension patterns, action variations</span>
          </li>
        </ol>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Using Templates Effectively</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-slate-700 mb-2">AI-Generated Templates</h3>
            <ol className="text-sm text-slate-600 space-y-1 ml-4">
              <li>1. Click "Generate" → AI Generate tab</li>
              <li>2. Describe: "SaaS pricing launch for mid-market"</li>
              <li>3. AI creates scenario + roles + custom role suggestions</li>
              <li>4. Edit any field as needed</li>
              <li>5. Save template or use immediately</li>
            </ol>
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-slate-700 mb-2">Manual Templates</h3>
            <ol className="text-sm text-slate-600 space-y-1 ml-4">
              <li>1. Click "Generate" → Manual Create tab</li>
              <li>2. Fill in: name, industry, goal, scenario</li>
              <li>3. Add roles manually</li>
              <li>4. Save for team reuse</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Best Practices</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-emerald-700 mb-2">✅ Do</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Be specific with numbers</li>
              <li>• Include diverse perspectives</li>
              <li>• Set realistic influence weights</li>
              <li>• Record actual outcomes</li>
              <li>• Create reusable templates</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-rose-700 mb-2">❌ Don't</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Write one-line scenarios</li>
              <li>• Add only agreeable roles</li>
              <li>• Give everyone 10/10 influence</li>
              <li>• Skip outcome tracking</li>
              <li>• Ignore critical tensions</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function TechnicalDoc() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Technical Documentation</h1>
        <p className="text-slate-600">Architecture and implementation details</p>
      </div>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border-l-2 border-slate-300 pl-3">
            <h3 className="font-medium text-slate-700 mb-2">Frontend</h3>
            <ul className="text-slate-600 space-y-1">
              <li>• React 18</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• TanStack Query</li>
              <li>• Framer Motion</li>
              <li>• shadcn/ui</li>
            </ul>
          </div>
          <div className="border-l-2 border-slate-300 pl-3">
            <h3 className="font-medium text-slate-700 mb-2">Backend</h3>
            <ul className="text-slate-600 space-y-1">
              <li>• Base44 BaaS</li>
              <li>• Deno Deploy</li>
              <li>• Supabase (PostgreSQL)</li>
              <li>• LLM Integration</li>
              <li>• jsPDF</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">State Management</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">React Query Pattern</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`const { data: simulations } = useQuery({
  queryKey: ['simulations'],
  queryFn: () => base44.entities.Simulation.list('-created_date', 20)
});

const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Simulation.create(data),
  onSuccess: () => queryClient.invalidateQueries(['simulations'])
});`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Query Keys Strategy</h3>
            <table className="w-full text-xs mt-2">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-mono">['simulations']</td>
                  <td className="p-2">All user simulations</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">['simulation', id]</td>
                  <td className="p-2">Single simulation</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">['comments', id]</td>
                  <td className="p-2">Comments for simulation</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">['templates']</td>
                  <td className="p-2">Saved templates</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Component Patterns</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Feature Component</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`export default function FeatureComponent({ 
  data, 
  onAction 
}) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (payload) => base44.entities.Entity.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['entity']);
      onAction();
    }
  });
  
  return <div>...</div>;
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Presentation Component</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono">
{`export default function PresentationComponent({ 
  item, 
  onClick 
}) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div onClick={onClick}>
      {/* Pure rendering logic */}
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Performance Optimization</h2>
        
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>React Query caching</strong> - 5 minute staleTime for static data</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Lazy loading</strong> - Templates fetched only when dialog opens</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Debouncing</strong> - AI Coach waits 2s after typing</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Memoization</strong> - useMemo for derived role lists</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><strong>Pagination</strong> - Limit queries to 20-50 records</span>
          </li>
        </ul>
      </section>

      <section className="bg-white border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Security Considerations</h2>
        
        <div className="space-y-3 text-sm">
          <div className="border-l-2 border-emerald-500 pl-3">
            <h3 className="font-medium text-slate-700 mb-1">Authentication</h3>
            <p className="text-slate-600">All functions validate user via base44.auth.me()</p>
          </div>
          <div className="border-l-2 border-emerald-500 pl-3">
            <h3 className="font-medium text-slate-700 mb-1">Authorization</h3>
            <p className="text-slate-600">Users can only access their own simulations unless explicitly shared</p>
          </div>
          <div className="border-l-2 border-emerald-500 pl-3">
            <h3 className="font-medium text-slate-700 mb-1">Input Sanitization</h3>
            <p className="text-slate-600">All user inputs validated before LLM processing</p>
          </div>
        </div>
      </section>
    </div>
  );
}