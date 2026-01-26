import React from 'react';
import { motion } from "framer-motion";
import { Clock, ChevronRight, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  running: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function SimulationHistory({ simulations, onSelect, selectedId, isLoading, compareMode = false, compareSelected = [] }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin mb-2" />
        <p className="text-xs text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!simulations || simulations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-slate-400">No simulations yet</p>
      </div>
    );
  }

  const isCompareSelected = (simId) => compareSelected.includes(simId);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {simulations.map((sim, index) => {
          const isSelected = compareMode ? isCompareSelected(sim.id) : selectedId === sim.id;
          
          return (
            <button
              key={sim.id}
              onClick={() => onSelect(sim)}
              className={`
                w-full p-2 border text-left transition-all
                ${isSelected 
                  ? 'bg-slate-100 border-slate-300' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <div className="flex items-start gap-2">
                {compareMode && (
                  <Checkbox 
                    checked={isSelected}
                    className="mt-0.5 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 text-xs truncate">
                    {sim.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {sim.scenario}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="outline" className={`text-[10px] h-4 px-1 ${statusColors[sim.status]}`}>
                      {sim.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(sim.created_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}