import React from 'react';
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, User, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const priorityConfig = {
  high: { color: "text-rose-600", bg: "bg-rose-50", badge: "bg-rose-100 text-rose-700" },
  medium: { color: "text-amber-600", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  low: { color: "text-blue-600", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
};

export default function NextSteps({ steps, onToggleComplete }) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const config = priorityConfig[step.priority] || priorityConfig.medium;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-4 rounded-xl border transition-all duration-200",
              step.completed 
                ? "bg-slate-50 border-slate-200 opacity-60" 
                : "bg-white border-slate-200 hover:border-violet-200 hover:shadow-sm"
            )}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleComplete(index)}
                className={cn(
                  "mt-0.5 flex-shrink-0 transition-colors",
                  step.completed ? "text-emerald-500" : "text-slate-300 hover:text-violet-500"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm leading-relaxed",
                  step.completed ? "text-slate-500 line-through" : "text-slate-700"
                )}>
                  {step.action}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={`text-[10px] ${config.badge}`}>
                    {step.priority} priority
                  </Badge>
                  
                  {step.owner_role && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span className="capitalize">
                        {step.owner_role.replace(/_/g, ' ').replace('custom ', '')}
                      </span>
                    </div>
                  )}

                  {step.confidence !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className={cn(
                        "w-3 h-3",
                        step.confidence >= 80 ? "text-emerald-600" :
                        step.confidence >= 60 ? "text-amber-600" :
                        "text-slate-400"
                      )} />
                      <span className="text-xs text-slate-500">
                        {step.confidence}% confidence
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}