import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Users, Building2, Globe, ChevronRight, Zap, Brain, 
  Target, Layers, ArrowRight, CheckCircle2, AlertTriangle, 
  BarChart3, FileText, Settings, Play, Sparkles, Shield, 
  TrendingUp, Clock, MessageSquare, GitBranch, Cpu, HeartHandshake,
  Map, Lightbulb, UserCheck, Building, Rocket, Eye, Sliders
} from "lucide-react";
import { createPageUrl } from '@/utils';

const INNER_USE_CASES = [
  {
    icon: Brain,
    color: "violet",
    title: "Pre-Mortem Risk Analysis",
    subtitle: "Before you build — stress-test the plan",
    description: "Run a simulation before committing to a roadmap item or feature. Surface the objections your CTO, legal, and sales will raise before you're in the room.",
    workflow: [
      "Write the scenario (1-2 paragraphs describing the proposed decision)",
      "Add 4–6 roles reflecting your actual org chart",
      "Run simulation → get role perspectives + tensions",
      "Identify the 2–3 critical blockers before the real meeting",
      "Prepare responses and playbook for the live discussion"
    ],
    outcomes: ["Fewer meeting surprises", "Faster stakeholder buy-in", "Pre-identified risk owners"],
    tags: ["Product", "Engineering", "Strategy"],
    frequency: "Before every major decision"
  },
  {
    icon: GitBranch,
    color: "blue",
    title: "Architecture Decision Records (ADRs)",
    subtitle: "Validate technical decisions across stakeholder perspectives",
    description: "Before finalizing an ADR, simulate how your CTO, frontend lead, backend lead, and security engineer would respond. Capture the tensions and embed them in the ADR itself.",
    workflow: [
      "Describe the architecture decision and trade-offs",
      "Select technical roles (CTO, Backend Dev, Security Eng, DevOps)",
      "Run simulation to surface technical tensions",
      "Generate playbook → embed insights into the ADR",
      "Use signature phrases output to anticipate real objections in review"
    ],
    outcomes: ["Higher quality ADRs", "Documented dissent captured upfront", "Faster engineering consensus"],
    tags: ["Engineering", "Architecture", "Documentation"],
    frequency: "Every ADR / RFC"
  },
  {
    icon: Map,
    color: "cyan",
    title: "Roadmap Prioritization",
    subtitle: "Align product, eng, sales, and customer success before the planning meeting",
    description: "Roadmap debates are slow because each function arrives with different priorities. Simulate the debate first so you come prepared with data, not opinions.",
    workflow: [
      "Define 2–3 competing roadmap options in the scenario",
      "Add product, engineering, sales, customer success, and finance roles",
      "Set environmental factors (market conditions, competitor moves)",
      "Run simulation → capture trade-offs and decision matrix",
      "Walk into the real meeting with a consensus-ready proposal"
    ],
    outcomes: ["Shorter planning cycles", "Balanced roadmaps", "Sales and CS buy-in from day one"],
    tags: ["Product", "Cross-functional", "Planning"],
    frequency: "Each planning cycle"
  },
  {
    icon: Cpu,
    color: "emerald",
    title: "Build vs. Buy Decisions",
    subtitle: "Get every function's true take before the vendor meeting",
    description: "Build vs. buy debates drag on because finance, engineering, and product each have hidden agendas. Simulate it — watch where the real tensions emerge.",
    workflow: [
      "Describe the capability being evaluated (build vs buy vs partner)",
      "Include finance, eng lead, product, infra/ops roles",
      "Set context: timeline pressure, budget constraints, team capacity",
      "Run simulation → identify the swing factors",
      "Generate a playbook with evaluation criteria for the committee"
    ],
    outcomes: ["Faster vendor evaluation", "Hidden cost objections surfaced early", "Cross-functional ownership clarity"],
    tags: ["Engineering", "Finance", "Product"],
    frequency: "Major infrastructure / tooling decisions"
  },
  {
    icon: AlertTriangle,
    color: "amber",
    title: "Tech Debt Triage",
    subtitle: "Make the business case for engineering investment",
    description: "Engineering always struggles to get budget for tech debt. Simulate how business stakeholders react to different framings — find the narrative that lands.",
    workflow: [
      "Describe the tech debt and its impact on velocity/reliability",
      "Include eng manager, product, CFO, and a skeptical business stakeholder",
      "Run simulation → see where the resistance concentrates",
      "Refine the business framing using role insights",
      "Build a playbook for the budget conversation"
    ],
    outcomes: ["Better internal buy-in for eng investment", "Clearer business value framing", "Faster approval cycles"],
    tags: ["Engineering", "Finance", "Internal Advocacy"],
    frequency: "Quarterly planning / budget cycles"
  },
  {
    icon: UserCheck,
    color: "rose",
    title: "Hiring Decision Alignment",
    subtitle: "Align hiring bar and team fit before the committee",
    description: "Hiring committees often diverge on what 'good' looks like. Simulate the debrief before it happens — surface divergent criteria and standardize the evaluation rubric.",
    workflow: [
      "Describe the role, candidate profile, and team context",
      "Add hiring manager, skip-level, and peer interviewers as roles",
      "Run simulation → surface alignment gaps on hiring criteria",
      "Use output to build a shared rubric before the debrief",
      "Track actual outcome vs prediction for calibration"
    ],
    outcomes: ["More consistent hiring decisions", "Faster debriefs", "Reduced bias in evaluation"],
    tags: ["HR", "Engineering", "Leadership"],
    frequency: "Senior hires / new role definitions"
  }
];

const OUTER_USE_CASES = [
  {
    icon: Building,
    color: "indigo",
    title: "Organizational Change Management",
    subtitle: "Test restructuring or process changes before announcing them",
    description: "Before rolling out a reorg, policy change, or new process, simulate how different levels of the org will respond. Surface the resistance vectors and communication gaps.",
    workflow: [
      "Describe the change (reorg, new process, policy update)",
      "Add roles representing all affected groups (ICs, managers, execs, HR)",
      "Set environmental context (recent layoffs, cultural dynamics)",
      "Run simulation → identify where morale risk is highest",
      "Generate a change management playbook with communication strategy"
    ],
    outcomes: ["Faster org adoption", "Fewer surprise escalations", "Targeted change communication"],
    tags: ["HR", "Leadership", "Operations"],
    audience: "Directors, VPs, Chief People Officers"
  },
  {
    icon: TrendingUp,
    color: "emerald",
    title: "Go-to-Market Strategy Alignment",
    subtitle: "Align product, sales, and marketing on launch sequencing",
    description: "GTM failures often happen because product, sales, and marketing have incompatible assumptions. Simulate the launch readiness review before it's too late to pivot.",
    workflow: [
      "Define the product launch, target segment, and proposed GTM motion",
      "Include product, sales lead, marketing, RevOps, and customer success",
      "Set market environmental factors (competitors, seasonality)",
      "Run simulation → find alignment gaps and sequencing risks",
      "Create a GTM playbook with role-specific accountability"
    ],
    outcomes: ["Smoother launches", "Sales readiness confidence", "Marketing-product alignment"],
    tags: ["GTM", "Sales", "Product Marketing"],
    audience: "Product leaders, CMOs, VP Sales"
  },
  {
    icon: Shield,
    color: "slate",
    title: "Compliance & Risk Governance",
    subtitle: "Model regulatory risk decisions across legal, product, and engineering",
    description: "Compliance decisions require legal, product, and eng to agree on trade-offs they rarely frame the same way. Simulate it — find the interpretation gaps before auditors do.",
    workflow: [
      "Describe the compliance decision (data residency, GDPR, SOC2 scope)",
      "Include legal counsel, security engineer, product, and CFO roles",
      "Run simulation → surface legal vs product trade-off tensions",
      "Generate compliance decision playbook with risk ownership",
      "Track actual regulatory outcomes vs simulated predictions"
    ],
    outcomes: ["Cleaner audit trails", "Faster compliance sign-off", "Risk ownership clarity"],
    tags: ["Legal", "Security", "Compliance"],
    audience: "GC, CISO, VP Engineering"
  },
  {
    icon: HeartHandshake,
    color: "pink",
    title: "Partnership & M&A Evaluation",
    subtitle: "Stress-test strategic partnerships before due diligence begins",
    description: "M&A and partnerships fail when integration assumptions go unexamined. Simulate the integration decision before committing resources — expose the cultural and operational friction.",
    workflow: [
      "Describe the proposed partnership / acquisition thesis",
      "Include corp dev, product, engineering, finance, and legal",
      "Add environmental factors (market timing, competitive pressure)",
      "Run simulation → surface integration risk and cultural friction",
      "Build a due diligence playbook with role-specific questions"
    ],
    outcomes: ["Better-structured due diligence", "Integration risk mapped before term sheet", "Faster deal team alignment"],
    tags: ["Corp Dev", "Finance", "Strategy"],
    audience: "CEOs, Corp Dev, CFOs"
  },
  {
    icon: Layers,
    color: "amber",
    title: "Platform Migration Planning",
    subtitle: "Model the human side of technical migrations",
    description: "Platform migrations stall not because of technology — but because of competing stakeholder priorities. Simulate the migration committee to find the blocking voices.",
    workflow: [
      "Define the migration: current state, target state, timeline, constraints",
      "Add infra, product, customer success, sales, and finance roles",
      "Set factors: customer commitments, SLA obligations, team capacity",
      "Run simulation → identify the critical path blockers by role",
      "Generate a migration playbook with phased approach and owner map"
    ],
    outcomes: ["Realistic migration timelines", "Customer impact scope scoped early", "Finance alignment on cost"],
    tags: ["Infrastructure", "Product", "Operations"],
    audience: "CTOs, Engineering Directors, Program Managers"
  },
  {
    icon: Globe,
    color: "cyan",
    title: "International Expansion Decisions",
    subtitle: "Model market entry decisions across all functional lenses",
    description: "Entering a new market requires legal, product, ops, and sales to agree on 50 things simultaneously. Simulate the expansion committee to find the sequencing conflicts.",
    workflow: [
      "Describe the target market, go/no-go framing, and entry strategy",
      "Include product, legal, finance, sales, and ops roles",
      "Set environmental factors (regulatory landscape, competitive density)",
      "Run simulation → capture the critical dependencies and blockers",
      "Generate an expansion playbook with market-specific risk mapping"
    ],
    outcomes: ["Staged entry with realistic timelines", "Legal and ops readiness confirmed early", "Sequenced market entry plan"],
    tags: ["International", "Strategy", "Legal"],
    audience: "CEOs, COOs, VP International"
  }
];

const END_USER_USE_CASES = [
  {
    icon: Target,
    color: "violet",
    title: "Individual Decision Preparation",
    subtitle: "Prepare for the hard conversation you're about to have",
    description: "Before your next 1:1, all-hands, or stakeholder review — simulate it. Know how your audience will react before you walk in the door.",
    personas: ["New PMs preparing for roadmap reviews", "Engineers making a case for refactoring", "Designers defending UX decisions to business stakeholders"],
    howItHelps: "Acts as a personal decision coach — run the scenario privately, understand the objections you'll face, and rehearse the best response.",
    keyFeatures: ["Role personas with signature phrases", "Emotional triggers surfaced for each role", "AI Coach guidance on delivery"]
  },
  {
    icon: Rocket,
    color: "rose",
    title: "Founder / Startup Decision-Making",
    subtitle: "Simulate your leadership team before you hire them",
    description: "Solo founders and small teams can simulate the full leadership team perspective — get CFO-level financial caution, CTO-level technical depth, and sales-level market pressure without the headcount.",
    personas: ["Solo founders making early product decisions", "Seed-stage teams without a full executive bench", "First-time founders navigating investor pressure"],
    howItHelps: "Gives early-stage companies access to a simulated exec team for strategic decision-making — reduces expensive mistakes made in echo chambers.",
    keyFeatures: ["Custom role creation for niche domains", "Environmental factors for startup context", "Outcome prediction before committing resources"]
  },
  {
    icon: Eye,
    color: "blue",
    title: "Team Retrospectives & Post-Mortems",
    subtitle: "Learn from decisions that already happened",
    description: "Run a simulation of the exact same decision from 6 months ago. Compare the simulated tensions to what actually happened — calibrate your team's mental models over time.",
    personas: ["Engineering teams after an incident", "Product teams after a failed launch", "Leadership teams after a missed quarter"],
    howItHelps: "Turns the post-mortem from blame assignment into model calibration — teams improve their ability to predict outcomes over time.",
    keyFeatures: ["Simulation history and versioning", "Outcome tracker (predicted vs actual)", "Playbook generation from lessons learned"]
  },
  {
    icon: Lightbulb,
    color: "amber",
    title: "Learning & Leadership Development",
    subtitle: "Train decision-making skills without real stakes",
    description: "New managers and future leaders can run safe simulations of difficult decisions — experience the full range of stakeholder dynamics before managing a real cross-functional team.",
    personas: ["New engineering managers learning to navigate product/business", "High-potential ICs preparing for leadership roles", "Management training programs and L&D teams"],
    howItHelps: "Provides a practice field for decision-making — run the same scenario multiple times with different role compositions to develop intuition for stakeholder dynamics.",
    keyFeatures: ["Role profile depth (biases, conflict styles)", "Simulation playback for replay and review", "Analytics dashboard for pattern recognition"]
  },
  {
    icon: MessageSquare,
    color: "emerald",
    title: "Consulting & Client Facilitation",
    subtitle: "Run client workshops with AI-backed scenario modeling",
    description: "Consultants and facilitators can use simulations as a workshop tool — show clients how their decisions look from all angles in real time, building consensus visually.",
    personas: ["Management consultants facilitating strategy workshops", "Executive coaches running leadership programs", "Agile coaches helping teams improve decision velocity"],
    howItHelps: "Replaces whiteboard exercises with a structured, AI-powered simulation that generates instant, credible output clients can act on immediately.",
    keyFeatures: ["Playbook generation for client deliverables", "PDF/Markdown export", "Custom templates per engagement"]
  },
  {
    icon: Clock,
    color: "slate",
    title: "Async Decision-Making for Remote Teams",
    subtitle: "Replace the 60-minute alignment meeting with a simulation",
    description: "Remote and distributed teams lose enormous time to alignment meetings. Run a simulation asynchronously — share the results, collect comments, and make the decision without a call.",
    personas: ["Remote-first product and engineering teams", "Teams distributed across 4+ time zones", "Managers trying to reduce meeting load"],
    howItHelps: "Externalizes the alignment process — the simulation does the facilitation work asynchronously, so teams can review, comment, and decide on their own schedule.",
    keyFeatures: ["Collaboration panel with threaded comments", "Real-time sync for shared simulations", "Next steps with ownership assignment"]
  }
];

const colorMap = {
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", badge: "bg-violet-100 text-violet-800" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", badge: "bg-blue-100 text-blue-800" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-600", badge: "bg-cyan-100 text-cyan-800" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-800" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", badge: "bg-amber-100 text-amber-800" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600", badge: "bg-rose-100 text-rose-800" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", icon: "text-indigo-600", badge: "bg-indigo-100 text-indigo-800" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-600", badge: "bg-pink-100 text-pink-800" },
  slate: { bg: "bg-slate-50", border: "border-slate-200", icon: "text-slate-600", badge: "bg-slate-100 text-slate-800" },
};

function InnerUseCase({ uc }) {
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[uc.color];
  const Icon = uc.icon;
  return (
    <Card className={`border ${c.border} transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${c.icon}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">{uc.title}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{uc.subtitle}</p>
            </div>
          </div>
          <Badge className={`text-xs shrink-0 ${c.badge} border-0`}>{uc.frequency}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">{uc.description}</p>
        <div className="flex flex-wrap gap-1">
          {uc.tags.map(t => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
        <button
          className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide workflow' : 'Show workflow'}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        {expanded && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">5-Step Workflow</p>
            <ol className="space-y-1.5">
              {uc.workflow.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className={`w-4 h-4 rounded-full ${c.bg} ${c.icon} flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5`}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">Expected Outcomes</p>
              <ul className="space-y-1">
                {uc.outcomes.map((o, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OuterUseCase({ uc }) {
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[uc.color];
  const Icon = uc.icon;
  return (
    <Card className={`border ${c.border} transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold text-slate-900">{uc.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{uc.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">{uc.description}</p>
        <div className={`text-xs px-2 py-1.5 rounded ${c.bg} ${c.icon} font-medium`}>
          👤 Audience: {uc.audience}
        </div>
        <div className="flex flex-wrap gap-1">
          {uc.tags.map(t => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
        <button
          className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide workflow' : 'See how it works'}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        {expanded && (
          <ol className="space-y-1.5 pt-1">
            {uc.workflow.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className={`w-4 h-4 rounded-full ${c.bg} ${c.icon} flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5`}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function EndUserUseCase({ uc }) {
  const [expanded, setExpanded] = useState(false);
  const c = colorMap[uc.color];
  const Icon = uc.icon;
  return (
    <Card className={`border ${c.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">{uc.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{uc.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">{uc.description}</p>
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Who uses this:</p>
          <ul className="space-y-1">
            {uc.personas.map((p, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <ArrowRight className={`w-3 h-3 ${c.icon} shrink-0 mt-0.5`} />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <button
          className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Key features used'}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        {expanded && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2">{uc.howItHelps}</p>
            <div className="flex flex-wrap gap-1">
              {uc.keyFeatures.map((f, i) => (
                <Badge key={i} className={`text-xs ${c.badge} border-0`}>{f}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">Documentation</h1>
              <p className="text-xs text-slate-500">Use Cases & Playbook Guide</p>
            </div>
          </div>
          <a
            href={createPageUrl('Simulation')}
            className="flex items-center gap-2 text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors"
          >
            <Play className="w-3 h-3" />
            Open Simulator
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <Badge className="bg-slate-100 text-slate-700 border-0 px-3 py-1">Team Decision Simulation Platform</Badge>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">
            Who uses this, and how
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
            The platform serves three distinct audiences — those running it for their own decisions (inner loop), 
            those deploying it across their organization (outer loop), and individuals using it for personal 
            development and day-to-day decision preparation (end users).
          </p>
        </div>

        {/* Audience Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              label: "Inner Loop",
              color: "violet",
              desc: "Individual teams and practitioners running simulations for specific decisions in their daily workflow.",
              count: "6 use cases"
            },
            {
              icon: Building2,
              label: "Outer Loop",
              color: "indigo",
              desc: "Organizations deploying simulations across functions, business units, or at the exec/strategy level.",
              count: "6 use cases"
            },
            {
              icon: Users,
              label: "End Users",
              color: "emerald",
              desc: "Individual contributors, leaders, and consultants using simulations for personal and professional growth.",
              count: "6 use cases"
            }
          ].map(({ icon: Icon, label, color, desc, count }) => (
            <Card key={label} className={`border ${colorMap[color].border} ${colorMap[color].bg}`}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-4 h-4 ${colorMap[color].icon}`} />
                  </div>
                  <Badge className={`text-xs ${colorMap[color].badge} border-0`}>{count}</Badge>
                </div>
                <p className={`font-semibold text-slate-900`}>{label}</p>
                <p className="text-xs text-slate-600">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="inner">
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="inner" className="gap-2 text-sm">
              <Zap className="w-3.5 h-3.5" />
              Inner Loop
            </TabsTrigger>
            <TabsTrigger value="outer" className="gap-2 text-sm">
              <Building2 className="w-3.5 h-3.5" />
              Outer Loop
            </TabsTrigger>
            <TabsTrigger value="enduser" className="gap-2 text-sm">
              <Users className="w-3.5 h-3.5" />
              End Users
            </TabsTrigger>
          </TabsList>

          {/* INNER LOOP */}
          <TabsContent value="inner" className="mt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                Inner Loop Use Cases
              </h3>
              <p className="text-sm text-slate-500">
                Day-to-day use by individual teams and practitioners — typically run before a meeting, 
                decision, or planning cycle. High frequency, high specificity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INNER_USE_CASES.map((uc) => (
                <InnerUseCase key={uc.title} uc={uc} />
              ))}
            </div>
          </TabsContent>

          {/* OUTER LOOP */}
          <TabsContent value="outer" className="mt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Outer Loop Use Cases
              </h3>
              <p className="text-sm text-slate-500">
                Organizational-level deployment — used by directors, VPs, and C-suite for cross-functional, 
                strategic, or company-wide decisions. Lower frequency, higher stakes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OUTER_USE_CASES.map((uc) => (
                <OuterUseCase key={uc.title} uc={uc} />
              ))}
            </div>
          </TabsContent>

          {/* END USERS */}
          <TabsContent value="enduser" className="mt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                End User Use Cases
              </h3>
              <p className="text-sm text-slate-500">
                Personal and professional use by individual contributors, founders, consultants, and learners. 
                Focused on individual growth, preparation, and async collaboration.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {END_USER_USE_CASES.map((uc) => (
                <EndUserUseCase key={uc.title} uc={uc} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Map */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Platform Feature Map</h3>
          <p className="text-sm text-slate-500">Which features matter most to each audience.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 font-semibold text-slate-700 border border-slate-200">Feature</th>
                  <th className="text-center p-3 font-semibold text-violet-700 border border-slate-200">Inner Loop</th>
                  <th className="text-center p-3 font-semibold text-indigo-700 border border-slate-200">Outer Loop</th>
                  <th className="text-center p-3 font-semibold text-emerald-700 border border-slate-200">End User</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Role Profiles + AI Personas", "★★★", "★★★", "★★"],
                  ["Environmental Factors", "★★★", "★★★", "★"],
                  ["Outcome Prediction", "★★★", "★★★", "★★"],
                  ["Simulation Playback", "★★", "★", "★★★"],
                  ["Playbook Generator (PDF/MD)", "★★", "★★★", "★★★"],
                  ["Playbook Templates", "★★", "★★★", "★★"],
                  ["Analytics Dashboard", "★★", "★★★", "★"],
                  ["Collaboration Panel", "★★", "★★★", "★★"],
                  ["Scenario Library", "★★★", "★★", "★★"],
                  ["Team Member Matcher", "★★", "★★★", "★"],
                  ["ADR / Pre-mortem Templates", "★★★", "★★", "★★"],
                  ["AI Coach", "★★", "★", "★★★"],
                  ["Version Control / Branching", "★★", "★★★", "★"],
                  ["Webhook / Integration Export", "★", "★★★", "★"],
                  ["Role Interaction Simulator", "★★★", "★★", "★★★"],
                ].map(([feature, inner, outer, end]) => (
                  <tr key={feature} className="even:bg-slate-50">
                    <td className="p-3 text-slate-700 font-medium border border-slate-200">{feature}</td>
                    <td className="p-3 text-center text-violet-600 border border-slate-200">{inner}</td>
                    <td className="p-3 text-center text-indigo-600 border border-slate-200">{outer}</td>
                    <td className="p-3 text-center text-emerald-600 border border-slate-200">{end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">★★★ = Primary use  ★★ = Regular use  ★ = Occasional use</p>
        </div>

        {/* Quick Start */}
        <Card className="border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold">Get Started in 5 Minutes</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {[
                { step: "1", label: "Pick a decision", desc: "Use a template or describe your scenario in 2–3 sentences" },
                { step: "2", label: "Add roles", desc: "Select 3–6 roles that reflect your real stakeholders" },
                { step: "3", label: "Run simulation", desc: "Click Run — get perspectives, tensions, and trade-offs in ~30s" },
                { step: "4", label: "Generate playbook", desc: "Export a playbook with action items and communication strategy" },
              ].map(({ step, label, desc }) => (
                <div key={step} className="space-y-1">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-amber-400">{step}</div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
            <a
              href={createPageUrl('Simulation')}
              className="inline-flex items-center gap-2 bg-white text-slate-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-slate-100 transition-colors mt-2"
            >
              <Play className="w-4 h-4" />
              Open Simulator
              <ArrowRight className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}