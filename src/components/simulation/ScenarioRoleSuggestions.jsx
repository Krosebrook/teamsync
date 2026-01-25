import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function ScenarioRoleSuggestions({ 
  scenario, 
  allRoles, 
  selectedRoles, 
  onRolesChange 
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    if (!scenario || scenario.trim().length < 20) return;
    
    setLoading(true);
    try {
      const rolesList = allRoles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping select the most relevant team roles for a product/business decision simulation.

SCENARIO:
${scenario}

AVAILABLE ROLES:
${JSON.stringify(rolesList, null, 2)}

Analyze the scenario and recommend 5-8 roles that would have the most meaningful perspectives on this decision. Consider:
- Who would be most impacted by this decision?
- Who has critical expertise or concerns?
- What perspectives would create productive tension?

For each recommended role, explain in 1 sentence WHY they're relevant to THIS scenario.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_id: { type: "string" },
                  reason: { type: "string" },
                  suggested_influence: { type: "number" }
                }
              }
            }
          }
        }
      });
      
      setSuggestions(result.recommended_roles);
    } catch (error) {
      console.error('Failed to get role suggestions:', error);
    }
    setLoading(false);
  };

  const applyAllSuggestions = () => {
    if (!suggestions) return;
    
    const newRoles = suggestions.map(s => ({
      role: s.role_id,
      influence: s.suggested_influence || 5
    }));
    
    onRolesChange(newRoles);
    setSuggestions(null);
  };

  const toggleSuggestedRole = (suggestion) => {
    const exists = selectedRoles.find(r => r.role === suggestion.role_id);
    if (exists) {
      onRolesChange(selectedRoles.filter(r => r.role !== suggestion.role_id));
    } else {
      onRolesChange([...selectedRoles, { 
        role: suggestion.role_id, 
        influence: suggestion.suggested_influence || 5 
      }]);
    }
  };

  const isRoleSelected = (roleId) => selectedRoles.some(r => r.role === roleId);

  if (!scenario || scenario.trim().length < 20) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={getSuggestions}
        disabled={loading}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing scenario...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI Suggest Roles for This Scenario
          </>
        )}
      </Button>

      <AnimatePresence>
        {suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-900">
                    Recommended for This Scenario
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={applyAllSuggestions}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
              </div>

              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => {
                  const role = allRoles.find(r => r.id === suggestion.role_id);
                  if (!role) return null;

                  const selected = isRoleSelected(suggestion.role_id);
                  const Icon = role.icon;

                  return (
                    <motion.button
                      key={suggestion.role_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleSuggestedRole(suggestion)}
                      className={`
                        w-full p-3 rounded-lg border text-left transition-all
                        ${selected 
                          ? 'bg-white border-violet-300 ring-1 ring-violet-200' 
                          : 'bg-white/60 border-slate-200 hover:border-violet-200'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg bg-${role.color}-100 flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 text-${role.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-800">
                              {role.name}
                            </span>
                            {selected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                            )}
                            <Badge variant="outline" className="ml-auto text-[10px]">
                              ~{suggestion.suggested_influence}/10 influence
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}