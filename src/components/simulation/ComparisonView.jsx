import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, AlertCircle, Users, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComparisonView({ simulations, onRemove }) {
  if (!simulations || simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No simulations to compare</p>
        <p className="text-sm text-slate-400 mt-1">
          Select 2 or more simulations from the history
        </p>
      </div>
    );
  }

  // Get all unique roles across simulations
  const allRoles = new Set();
  simulations.forEach(sim => {
    sim.responses?.forEach(r => allRoles.add(r.role));
  });

  // Get all unique tension pairs
  const allTensionPairs = new Map();
  simulations.forEach((sim, simIdx) => {
    sim.tensions?.forEach(t => {
      const key = t.between.sort().join('-');
      if (!allTensionPairs.has(key)) {
        allTensionPairs.set(key, []);
      }
      allTensionPairs.get(key).push({ simIdx, tension: t });
    });
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Comparing {simulations.length} Simulations
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Side-by-side analysis of perspectives and tensions
          </p>
        </div>
      </div>

      {/* Simulation Headers */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
        {simulations.map((sim, idx) => (
          <Card key={sim.id} className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm truncate">
                  {sim.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {sim.scenario}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {sim.responses?.length || 0} roles
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {sim.tensions?.length || 0} tensions
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onRemove(sim.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Role Perspectives Comparison */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-slate-800">Role Perspectives</h3>
        </div>

        <div className="space-y-3">
          {Array.from(allRoles).map(roleId => {
            const perspectives = simulations.map(sim => 
              sim.responses?.find(r => r.role === roleId)
            );

            // Only show if at least one simulation has this role
            if (perspectives.every(p => !p)) return null;

            return (
              <motion.div
                key={roleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-medium text-slate-800 text-sm capitalize">
                    {roleId.replace(/_/g, ' ').replace('custom ', '')}
                  </h4>
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
                  {perspectives.map((perspective, idx) => (
                    <div
                      key={idx}
                      className={`p-4 ${idx < perspectives.length - 1 ? 'border-r border-slate-200' : ''}`}
                    >
                      {perspective ? (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {perspective.position}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                perspective.risk_tolerance === 'high' ? 'bg-rose-50 text-rose-700' :
                                perspective.risk_tolerance === 'medium' ? 'bg-amber-50 text-amber-700' :
                                'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {perspective.risk_tolerance} risk
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          Role not included
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tensions Comparison */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-slate-800">Tensions Evolution</h3>
        </div>

        <div className="space-y-3">
          {Array.from(allTensionPairs.entries()).map(([pairKey, occurrences]) => {
            const roles = pairKey.split('-');
            
            return (
              <motion.div
                key={pairKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-800 text-sm capitalize">
                      {roles[0].replace(/_/g, ' ')}
                    </h4>
                    <span className="text-slate-400 text-xs">vs</span>
                    <h4 className="font-medium text-slate-800 text-sm capitalize">
                      {roles[1].replace(/_/g, ' ')}
                    </h4>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {occurrences.length}/{simulations.length} simulations
                    </Badge>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
                  {simulations.map((sim, simIdx) => {
                    const occurrence = occurrences.find(o => o.simIdx === simIdx);
                    
                    return (
                      <div
                        key={simIdx}
                        className={`p-4 ${simIdx < simulations.length - 1 ? 'border-r border-slate-200' : ''}`}
                      >
                        {occurrence ? (
                          <div className="space-y-2">
                            <Badge
                              className={`text-[10px] ${
                                occurrence.tension.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                                occurrence.tension.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                occurrence.tension.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {occurrence.tension.severity}
                            </Badge>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {occurrence.tension.description}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">
                            No tension detected
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendations Comparison */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-slate-800">Recommended Actions</h3>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${simulations.length}, 1fr)` }}>
          {simulations.map((sim, idx) => (
            <Card key={sim.id} className="p-4">
              <div className="space-y-3">
                {sim.responses?.map((response, rIdx) => response.recommendation && (
                  <div key={rIdx} className="text-sm">
                    <p className="font-medium text-slate-700 capitalize mb-1">
                      {response.role.replace(/_/g, ' ')}:
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {response.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}