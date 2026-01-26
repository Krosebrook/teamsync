import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp } from "lucide-react";

export default function ProfessionalTemplates({ templates, onApply }) {
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No saved templates
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {templates.map(template => (
        <button
          key={template.id}
          onClick={() => onApply(template)}
          className="w-full text-left p-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all group"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                {template.name}
              </h4>
              {template.description && (
                <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                  {template.description}
                </p>
              )}
            </div>
            {template.use_count > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                <TrendingUp className="w-2.5 h-2.5 mr-1" />
                {template.use_count}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {template.industry && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {template.industry}
              </Badge>
            )}
            {template.goal && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {template.goal}
              </Badge>
            )}
            {template.suggested_roles && (
              <span className="text-slate-400">
                {template.suggested_roles.length} roles
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
            {template.scenario_template}
          </p>
        </button>
      ))}
    </div>
  );
}