import React from 'react';
import { motion } from "framer-motion";
import { Clock, ChevronRight, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  running: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function SimulationHistory({ simulations, onSelect, selectedId, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin mb-2" />
        <p className="text-sm text-slate-500">Loading history...</p>
      </div>
    );
  }

  if (!simulations || simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">No simulations yet</p>
        <p className="text-xs text-slate-400 mt-1">Create your first simulation above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 tracking-tight">History</h3>
      
      <div className="space-y-2">
        {simulations.map((sim, index) => (
          <motion.button
            key={sim.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(sim)}
            className={`
              w-full p-3 rounded-xl border text-left transition-all duration-200
              ${selectedId === sim.id 
                ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200' 
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-800 text-sm truncate">
                  {sim.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {sim.scenario}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`text-[10px] ${statusColors[sim.status]}`}>
                {sim.status}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                {format(new Date(sim.created_date), 'MMM d, h:mm a')}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}