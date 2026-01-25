import React from 'react';
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const severityConfig = {
  low: { 
    icon: Info, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700"
  },
  medium: { 
    icon: AlertCircle, 
    color: "text-amber-600", 
    bg: "bg-amber-50", 
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700"
  },
  high: { 
    icon: AlertTriangle, 
    color: "text-orange-600", 
    bg: "bg-orange-50", 
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700"
  },
  critical: { 
    icon: XCircle, 
    color: "text-rose-600", 
    bg: "bg-rose-50", 
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700"
  },
};

export default function TensionMap({ tensions }) {
  if (!tensions || tensions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Info className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">No tensions identified yet</p>
        <p className="text-xs text-slate-400 mt-1">Run a simulation to see conflicts</p>
      </div>
    );
  }

  const sortedTensions = [...tensions].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Tension Map</h3>
        <Badge variant="outline" className="text-xs">
          {tensions.length} conflict{tensions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedTensions.map((tension, index) => {
          const config = severityConfig[tension.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-white/80`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {tension.between.map((role, i) => (
                      <React.Fragment key={role}>
                        <span className="text-xs font-semibold text-slate-700 capitalize">
                          {role.replace(/_/g, ' ')}
                        </span>
                        {i < tension.between.length - 1 && (
                          <span className="text-slate-400">vs</span>
                        )}
                      </React.Fragment>
                    ))}
                    <Badge className={`ml-auto text-[10px] ${config.badge}`}>
                      {tension.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tension.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}