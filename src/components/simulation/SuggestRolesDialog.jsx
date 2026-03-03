import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Plus, Check, ChevronDown, ChevronUp, User } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const PROFICIENCY_COLORS = {
  expert: 'bg-violet-100 text-violet-800 border-violet-200',
  advanced: 'bg-blue-100 text-blue-800 border-blue-200',
  intermediate: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  beginner: 'bg-slate-100 text-slate-600 border-slate-200',
};

const COLOR_OPTIONS = ['violet', 'blue', 'cyan', 'rose', 'amber', 'emerald', 'orange', 'indigo', 'purple', 'teal'];

function SuggestedRoleCard({ suggestion, onAdd, adding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-800">{suggestion.name}</span>
              <Badge variant="outline" className="text-xs">{suggestion.seniority_level}</Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{suggestion.description}</p>

            {suggestion.rationale && (
              <p className="text-xs text-violet-700 italic mt-1">"{suggestion.rationale}"</p>
            )}

            <button
              className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-slate-600"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Less detail' : 'View profile preview'}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {suggestion.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.strengths.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-800">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestion.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Blind Spots</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.weaknesses.map((w, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestion.communication_style && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-0.5">Communication Style</p>
                    <p className="text-xs text-slate-600">{suggestion.communication_style}</p>
                  </div>
                )}
                {suggestion.domain_expertise?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Domain Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.domain_expertise.map((d, i) => (
                        <Badge key={i} variant="outline" className={`text-xs border ${PROFICIENCY_COLORS[d.proficiency_level] || ''}`}>
                          {d.area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onAdd(suggestion)}
            disabled={adding || suggestion._added}
            className="shrink-0 gap-1"
          >
            {suggestion._added ? (
              <><Check className="w-3 h-3 text-emerald-600" /> Added</>
            ) : adding ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <><Plus className="w-3 h-3" /> Add</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuggestRolesDialog({ open, onClose, existingRoles = [], existingCustomRoles = [] }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addingId, setAddingId] = useState(null);

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomRole.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customRoles'] }),
  });

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.RoleProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['roleProfile'] });
    }
  });

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    const existingNames = [
      ...existingRoles.map(r => r.name),
      ...existingCustomRoles.map(r => r.name)
    ];

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an organizational design expert. Based on the existing team roles below, suggest 4–6 complementary roles that would make the team more complete for decision simulations.

EXISTING ROLES:
${existingNames.join(', ')}

TASK: Identify gaps in the team structure and suggest roles that:
1. Fill missing perspectives (e.g., if no finance/legal role exists, suggest CFO or Legal Counsel)
2. Balance the team (e.g., add customer-facing roles if the team is too technical)
3. Add depth to underrepresented areas
4. Would create interesting decision-making dynamics in simulations

For each suggested role, provide a full initial profile. Be specific — not just "Manager" but "Customer Experience Manager" or "Data Privacy Officer".

Do NOT suggest roles that already exist in the team.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string", description: "Role's typical concerns and priorities (1-2 sentences)" },
                  seniority_level: { type: "string", enum: ["junior", "mid", "senior", "executive"] },
                  rationale: { type: "string", description: "Why this role fills a gap in the current team (1 sentence)" },
                  default_influence: { type: "number" },
                  color: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  communication_style: { type: "string" },
                  typical_motivations: { type: "array", items: { type: "string" } },
                  decision_making_approach: { type: "string" },
                  risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
                  conflict_style: { type: "string", enum: ["avoiding", "accommodating", "competing", "compromising", "collaborating"] },
                  domain_expertise: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string" },
                        proficiency_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const colorPool = COLOR_OPTIONS;
      const enriched = (result.suggestions || []).map((s, i) => ({
        ...s,
        color: COLOR_OPTIONS[i % COLOR_OPTIONS.length],
        default_influence: s.default_influence || 6,
        _added: false
      }));
      setSuggestions(enriched);
    } catch (err) {
      toast.error('Failed to generate suggestions');
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = async (suggestion) => {
    setAddingId(suggestion.name);
    try {
      const newRole = await createRoleMutation.mutateAsync({
        name: suggestion.name,
        description: suggestion.description,
        seniority_level: suggestion.seniority_level,
        default_influence: suggestion.default_influence,
        color: suggestion.color,
        strengths: suggestion.strengths || [],
        weaknesses: suggestion.weaknesses || [],
        communication_style: suggestion.communication_style || '',
        typical_motivations: suggestion.typical_motivations || [],
      });

      // Also save as a RoleProfile so it enriches simulations
      await createProfileMutation.mutateAsync({
        role_id: `custom_${newRole.id}`,
        role_name: suggestion.name,
        strengths: suggestion.strengths || [],
        weaknesses: suggestion.weaknesses || [],
        communication_style: suggestion.communication_style || '',
        typical_motivations: suggestion.typical_motivations || [],
        decision_making_approach: suggestion.decision_making_approach || '',
        risk_tolerance: suggestion.risk_tolerance || 'medium',
        conflict_style: suggestion.conflict_style || 'compromising',
        domain_expertise_detailed: suggestion.domain_expertise || [],
      });

      setSuggestions(prev => prev.map(s => s.name === suggestion.name ? { ...s, _added: true } : s));
      toast.success(`"${suggestion.name}" added with full profile`);
    } catch (err) {
      toast.error('Failed to add role');
      console.error(err);
    }
    setAddingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Role Suggestions
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Based on your existing {existingRoles.length + existingCustomRoles.length} roles, the AI will identify gaps and suggest complementary roles with pre-built profiles.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {suggestions.length === 0 && !loading && (
            <div className="text-center py-10">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Click "Generate Suggestions" to get AI-powered role recommendations tailored to your current team.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              <span className="text-sm">Analyzing team structure and generating suggestions...</span>
            </div>
          )}

          {suggestions.map((s, i) => (
            <SuggestedRoleCard
              key={i}
              suggestion={s}
              onAdd={handleAdd}
              adding={addingId === s.name}
            />
          ))}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={generateSuggestions} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : suggestions.length ? 'Regenerate' : 'Generate Suggestions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}