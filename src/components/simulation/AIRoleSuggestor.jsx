import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function SuggestedRoleCard({ suggestion, onAdd, adding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-800">{suggestion.name}</span>
              <Badge variant="outline" className="text-xs">{suggestion.influence}/10</Badge>
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
              {expanded ? 'Less detail' : 'View fit analysis'}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {suggestion.key_strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Key Strengths for This Scenario</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.key_strengths.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-800">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestion.potential_tensions?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Potential Tensions</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.potential_tensions.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">{t}</Badge>
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

export default function AIRoleSuggestor({
  open,
  onClose,
  scenario,
  selectedRoles,
  allRoles,
  onRolesAdd,
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addingId, setAddingId] = useState(null);

  const selectedRoleNames = selectedRoles
    .map(sr => allRoles.find(r => r.id === sr.role)?.name || sr.role)
    .join(', ');

  const generateSuggestions = async () => {
    if (!scenario.trim()) {
      toast.error('Please enter a scenario first');
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an organizational design expert. Analyze the following decision scenario and suggest 3–5 complementary roles that would enhance the team's decision-making dynamics.

SCENARIO:
${scenario}

CURRENT TEAM ROLES:
${selectedRoleNames || '(None selected yet)'}

TASK: Based on the scenario's nature and complexity, identify roles that:
1. Bring perspectives currently missing in the scenario discussion
2. Balance the team composition for this specific decision
3. Would create constructive tensions and deeper analysis
4. Have appropriate influence levels for this decision type

For each suggested role, explain:
- Why it's valuable for this specific scenario
- What perspectives it adds
- Potential tensions it might create (productive ones)
- A recommended influence level (1-10) based on the decision's nature

Format each suggestion with:
- Role name
- Brief description (1 sentence)
- Rationale for this scenario (1 sentence)
- Key strengths relevant to this scenario
- Potential tensions with existing roles
- Recommended influence level

Avoid suggesting roles already in the team.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  rationale: { type: "string" },
                  influence: { type: "number", minimum: 1, maximum: 10 },
                  key_strengths: { type: "array", items: { type: "string" } },
                  potential_tensions: { type: "array", items: { type: "string" } },
                }
              }
            }
          }
        }
      });

      const enriched = (result.suggestions || []).map((s, i) => ({
        ...s,
        _added: false
      }));
      setSuggestions(enriched);
      toast.success(`Generated ${enriched.length} role recommendations`);
    } catch (err) {
      toast.error('Failed to generate suggestions');
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = (suggestion) => {
    const matchedRole = allRoles.find(r =>
      r.name.toLowerCase().includes(suggestion.name.toLowerCase()) ||
      suggestion.name.toLowerCase().includes(r.name.toLowerCase())
    );

    if (matchedRole) {
      onRolesAdd([{ role: matchedRole.id, influence: suggestion.influence }]);
      setSuggestions(prev =>
        prev.map(s => s.name === suggestion.name ? { ...s, _added: true } : s)
      );
      toast.success(`"${suggestion.name}" added to team`);
    } else {
      toast.error(`Role "${suggestion.name}" not found in available roles`);
    }
    setAddingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Role Recommendations
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Get AI-powered role suggestions tailored to your specific scenario and current team composition.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {suggestions.length === 0 && !loading && (
            <div className="text-center py-10">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {scenario.trim()
                  ? 'Click "Generate Suggestions" to get role recommendations for this scenario.'
                  : 'Enter a scenario above to generate targeted role suggestions.'}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              <span className="text-sm">Analyzing scenario and generating role recommendations...</span>
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
          <Button
            onClick={generateSuggestions}
            disabled={loading || !scenario.trim()}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : suggestions.length ? 'Regenerate' : 'Generate Suggestions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}