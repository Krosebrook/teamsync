import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Clock } from "lucide-react";

export default function ContextPanel({ simulation, stats }) {
  if (!simulation || simulation.status !== 'completed') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Impact Preview
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p>Run a simulation to see predicted impacts and tensions</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalTensions = simulation.tensions?.filter(t => t.severity === 'critical') || [];
  const highTensions = simulation.tensions?.filter(t => t.severity === 'high') || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          Impact Summary
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Total Responses</span>
            <span className="text-sm font-semibold text-slate-800">
              {simulation.responses?.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Tensions Identified</span>
            <span className="text-sm font-semibold text-slate-800">
              {simulation.tensions?.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Action Items</span>
            <span className="text-sm font-semibold text-slate-800">
              {simulation.next_steps?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Tensions */}
      {(criticalTensions.length > 0 || highTensions.length > 0) && (
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Risk Factors
          </h3>
          <div className="space-y-2">
            {criticalTensions.map((tension, idx) => (
              <div key={idx} className="p-2 bg-rose-50 border border-rose-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-rose-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-rose-900 mb-0.5">
                      {tension.between?.join(' vs ') || 'Unknown'}
                    </p>
                    <p className="text-xs text-rose-700 line-clamp-2">
                      {tension.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {highTensions.map((tension, idx) => (
              <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-900 mb-0.5">
                      {tension.between?.join(' vs ') || 'Unknown'}
                    </p>
                    <p className="text-xs text-amber-700 line-clamp-2">
                      {tension.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade-offs */}
      {simulation.decision_trade_offs && simulation.decision_trade_offs.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Key Trade-offs
          </h3>
          <div className="space-y-3">
            {simulation.decision_trade_offs.slice(0, 3).map((tradeoff, idx) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">
                  {tradeoff.trade_off}
                </p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] px-1 h-4">A</Badge>
                    <span className="text-slate-600">{tradeoff.option_a}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] px-1 h-4">B</Badge>
                    <span className="text-slate-600">{tradeoff.option_b}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}