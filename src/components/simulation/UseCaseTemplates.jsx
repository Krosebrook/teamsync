import React from 'react';
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Map, 
  GitBranch, 
  Target, 
  Wrench, 
  Siren,
  UserPlus,
  ShoppingCart,
  ArrowRightLeft,
  PhoneCall
} from "lucide-react";

const USE_CASES = [
  {
    id: "pre_mortem",
    name: "Pre-Mortem",
    description: "Surface failure modes before committing to high-risk features",
    icon: AlertTriangle,
    color: "rose",
    example: "Simulate launching real-time video collaboration in our AI code editor"
  },
  {
    id: "roadmap",
    name: "Roadmap Prioritization",
    description: "When you have 20 ideas and budget for 3",
    icon: Map,
    color: "violet",
    example: "Deciding between AI-powered testing, multiplayer editing, or cost optimization"
  },
  {
    id: "adr",
    name: "Architecture Decision",
    description: "Choose between competing technical approaches",
    icon: GitBranch,
    color: "blue",
    example: "Should we use WebSockets or Server-Sent Events for real-time collaboration?"
  },
  {
    id: "pmf_validation",
    name: "Product-Market Fit",
    description: "Understand why adoption is slow from multiple perspectives",
    icon: Target,
    color: "emerald",
    example: "Why aren't developers adopting our AI code generation platform?"
  },
  {
    id: "tech_debt",
    name: "Technical Debt Triage",
    description: "Force explicit trade-off discussions between refactor vs ship",
    icon: Wrench,
    color: "amber",
    example: "Should we rewrite our authentication system or add OAuth providers?"
  },
  {
    id: "post_mortem",
    name: "Incident Post-Mortem",
    description: "Surface organizational failures beyond proximate causes",
    icon: Siren,
    color: "red",
    example: "Our AI platform leaked 10,000 API keys. What went wrong?"
  },
  {
    id: "hiring",
    name: "Hiring Decisions",
    description: "See which tensions get resolved with specific roles",
    icon: UserPlus,
    color: "cyan",
    example: "Should we hire a dedicated Observability Lead?"
  },
  {
    id: "build_buy",
    name: "Build vs Buy",
    description: "Make trade-offs explicit between speed, control, and cost",
    icon: ShoppingCart,
    color: "pink",
    example: "Build our own AI fine-tuning pipeline or use OpenAI's?"
  },
  {
    id: "migration",
    name: "Platform Migration",
    description: "Surface hidden dependencies before they break you",
    icon: ArrowRightLeft,
    color: "indigo",
    example: "We're migrating from Postgres to DynamoDB. What breaks?"
  },
  {
    id: "customer_escalation",
    name: "Customer Escalation",
    description: "Force rational decisions under emotional pressure",
    icon: PhoneCall,
    color: "orange",
    example: "Enterprise customer demands on-premise deployment. Can we do it?"
  },
];

const colorClasses = {
  rose: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600", hover: "hover:border-rose-300" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", hover: "hover:border-violet-300" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", hover: "hover:border-blue-300" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", hover: "hover:border-emerald-300" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", hover: "hover:border-amber-300" },
  red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", hover: "hover:border-red-300" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-600", hover: "hover:border-cyan-300" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-600", hover: "hover:border-pink-300" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", icon: "text-indigo-600", hover: "hover:border-indigo-300" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600", hover: "hover:border-orange-300" },
};

export default function UseCaseTemplates({ onSelect, selectedId }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Quick Start Templates</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {USE_CASES.map((useCase, index) => {
          const Icon = useCase.icon;
          const colors = colorClasses[useCase.color];
          const isSelected = selectedId === useCase.id;
          
          return (
            <motion.button
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(useCase)}
              className={`
                group relative p-4 rounded-xl border text-left transition-all duration-200
                ${isSelected 
                  ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-violet-400` 
                  : `bg-white border-slate-200 ${colors.hover} hover:shadow-sm`
                }
              `}
            >
              <div className={`inline-flex p-2 rounded-lg ${colors.bg} mb-3`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              
              <h4 className="font-medium text-slate-800 text-sm mb-1">
                {useCase.name}
              </h4>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                {useCase.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export { USE_CASES };