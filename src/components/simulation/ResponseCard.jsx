import React, { useState } from 'react';
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Code2, 
  Shield, 
  Palette, 
  TestTube, 
  Users, 
  BarChart3, 
  Megaphone,
  Settings,
  Eye
} from "lucide-react";

const ROLE_ICONS = {
  founder: Rocket,
  backend_dev: Code2,
  frontend_dev: Palette,
  security: Shield,
  qa: TestTube,
  eng_manager: Settings,
  ux_designer: Eye,
  product_manager: BarChart3,
  devrel: Megaphone,
  analytics: Users,
};

const ROLE_NAMES = {
  founder: "Founder / CEO",
  backend_dev: "Backend Developer",
  frontend_dev: "Frontend Developer",
  security: "Security Engineer",
  qa: "QA Specialist",
  eng_manager: "Engineering Manager",
  ux_designer: "UX Designer",
  product_manager: "Product Manager",
  devrel: "Developer Relations",
  analytics: "Analytics Lead",
};

// Helper to get custom role name from role ID
const getRoleName = (roleId) => {
  if (ROLE_NAMES[roleId]) return ROLE_NAMES[roleId];
  // For custom roles, format the ID nicely
  return roleId.replace(/^custom_/, '').replace(/_/g, ' ');
};

const ROLE_COLORS = {
  founder: "violet",
  backend_dev: "blue",
  frontend_dev: "cyan",
  security: "rose",
  qa: "amber",
  eng_manager: "slate",
  ux_designer: "pink",
  product_manager: "emerald",
  devrel: "orange",
  analytics: "indigo",
};

const colorClasses = {
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const riskIcons = {
  low: { icon: CheckCircle2, color: "text-emerald-500" },
  medium: { icon: MinusCircle, color: "text-amber-500" },
  high: { icon: AlertCircle, color: "text-rose-500" },
};

export default function ResponseCard({ response, influence, index }) {
  const [expanded, setExpanded] = useState(true);
  
  const Icon = ROLE_ICONS[response.role] || Users;
  const roleName = getRoleName(response.role);
  const color = ROLE_COLORS[response.role] || "slate";
  const RiskIcon = riskIcons[response.risk_tolerance?.toLowerCase()]?.icon || MinusCircle;
  const riskColor = riskIcons[response.risk_tolerance?.toLowerCase()]?.color || "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800">{roleName}</h4>
            {influence && (
              <Badge variant="outline" className="text-[10px] font-normal">
                Influence: {influence}/10
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
            {response.position}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <RiskIcon className={`w-4 h-4 ${riskColor}`} />
            <span className="text-xs text-slate-500 capitalize">
              {response.risk_tolerance} risk
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-100"
        >
          <div className="p-4 space-y-4">
            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Position
              </h5>
              <p className="text-sm text-slate-700 leading-relaxed">
                {response.position}
              </p>
            </div>

            {response.concerns && response.concerns.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Key Concerns
                </h5>
                <ul className="space-y-1.5">
                  {response.concerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-300 mt-1">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.recommendation && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Recommendation
                </h5>
                <p className="text-sm text-slate-700">
                  {response.recommendation}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}