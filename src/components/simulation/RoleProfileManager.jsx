import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Save, Sparkles, Loader2, Trash2, Brain, User, AlertTriangle, Zap } from "lucide-react";

const EMPTY_PROFILE = {
  strengths: [],
  weaknesses: [],
  communication_style: '',
  typical_motivations: [],
  decision_making_approach: '',
  risk_tolerance: 'medium',
  backstory: '',
  personality_traits: [],
  cognitive_biases: [],
  emotional_triggers: [],
  conflict_style: 'compromising',
  signature_phrases: [],
  relationship_dynamics: { allies: [], friction_with: [], influenced_by: [] }
};

export default function RoleProfileManager({ open, onClose, roleId, roleName, allRoles }) {
  const queryClient = useQueryClient();
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [tagInputs, setTagInputs] = useState({
    strength: '', weakness: '', motivation: '', trait: '', trigger: '', phrase: '',
    ally: '', friction: '', influenced: ''
  });
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);

  const { data: existingProfile } = useQuery({
    queryKey: ['roleProfile', roleId],
    queryFn: async () => {
      const profiles = await base44.entities.RoleProfile.filter({ role_id: roleId });
      return profiles[0] || null;
    },
    enabled: !!roleId && open
  });

  React.useEffect(() => {
    if (existingProfile) {
      setProfileData({
        ...EMPTY_PROFILE,
        ...existingProfile,
        relationship_dynamics: existingProfile.relationship_dynamics || { allies: [], friction_with: [], influenced_by: [] }
      });
    } else {
      setProfileData(EMPTY_PROFILE);
    }
  }, [existingProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return base44.entities.RoleProfile.update(existingProfile.id, data);
      }
      return base44.entities.RoleProfile.create({ role_id: roleId, role_name: roleName, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleProfile'] });
      queryClient.invalidateQueries({ queryKey: ['roleProfiles'] });
      toast.success('Profile saved');
      onClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.RoleProfile.delete(existingProfile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleProfile'] });
      queryClient.invalidateQueries({ queryKey: ['roleProfiles'] });
      toast.success('Profile deleted');
      onClose();
    }
  });

  const generateCoreProfile = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed decision-making profile for: "${roleName}".

Generate:
1. 4-6 key strengths in decision-making contexts
2. 3-5 weaknesses or blind spots
3. Communication style (2-3 sentences)
4. 4-6 typical motivations
5. Decision-making approach (1-2 sentences)
6. Risk tolerance (low/medium/high)`,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            communication_style: { type: "string" },
            typical_motivations: { type: "array", items: { type: "string" } },
            decision_making_approach: { type: "string" },
            risk_tolerance: { type: "string" }
          }
        }
      });
      setProfileData(prev => ({ ...prev, ...result }));
      toast.success('Core profile generated');
    } catch (error) {
      toast.error('Failed to generate profile');
    } finally {
      setLoadingAI(false);
    }
  };

  const generatePersona = async () => {
    setLoadingPersona(true);
    try {
      const otherRoleNames = allRoles?.filter(r => r.id !== roleId).map(r => r.name).slice(0, 10) || [];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a character designer for team dynamics simulations. Create a rich, psychologically realistic persona for the role: "${roleName}".

Existing profile context:
- Strengths: ${profileData.strengths.join(', ') || 'not set'}
- Weaknesses: ${profileData.weaknesses.join(', ') || 'not set'}
- Communication style: ${profileData.communication_style || 'not set'}
- Motivations: ${profileData.typical_motivations.join(', ') || 'not set'}

Other roles in simulations they interact with: ${otherRoleNames.join(', ')}

Generate a VIVID, REALISTIC persona with:

1. BACKSTORY (3-4 sentences): A compelling origin story explaining how they came to hold their views — career path, formative experiences, defining moments that shaped their perspective on risk, collaboration, and decision-making. Make it specific and human.

2. PERSONALITY TRAITS (5-7 traits): Specific behavioral traits visible in team settings. Not generic (like "analytical") but nuanced (e.g., "Becomes terse and defensive when their technical estimates are questioned", "Frequently uses sports metaphors to explain complex concepts").

3. COGNITIVE BIASES (3-5): Specific biases with concrete examples of how they manifest in this role's decisions. Pick from real cognitive biases.

4. EMOTIONAL TRIGGERS (3-5): Specific situations, phrases, or dynamics that cause this persona to become reactive, defensive, dismissive, or unusually persuasive.

5. CONFLICT STYLE: One of: avoiding, accommodating, competing, compromising, collaborating

6. SIGNATURE PHRASES (3-5): Characteristic things this persona says in meetings — specific, slightly cliché, authentic to the role.

7. RELATIONSHIP DYNAMICS:
   - Allies: which of these roles they naturally align with and why
   - Friction with: which roles they clash with most
   - Influenced by: which roles/authorities shift their thinking`,
        response_json_schema: {
          type: "object",
          properties: {
            backstory: { type: "string" },
            personality_traits: { type: "array", items: { type: "string" } },
            cognitive_biases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bias: { type: "string" },
                  description: { type: "string" },
                  example: { type: "string" }
                }
              }
            },
            emotional_triggers: { type: "array", items: { type: "string" } },
            conflict_style: { type: "string" },
            signature_phrases: { type: "array", items: { type: "string" } },
            relationship_dynamics: {
              type: "object",
              properties: {
                allies: { type: "array", items: { type: "string" } },
                friction_with: { type: "array", items: { type: "string" } },
                influenced_by: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });
      setProfileData(prev => ({ ...prev, ...result }));
      toast.success('Persona generated');
    } catch (error) {
      toast.error('Failed to generate persona');
    } finally {
      setLoadingPersona(false);
    }
  };

  const addTag = (field, subfield) => {
    const key = subfield || field;
    const val = tagInputs[key]?.trim();
    if (!val) return;
    if (subfield) {
      setProfileData(prev => ({
        ...prev,
        relationship_dynamics: {
          ...prev.relationship_dynamics,
          [field]: [...(prev.relationship_dynamics[field] || []), val]
        }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: [...(prev[field] || []), val] }));
    }
    setTagInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeTag = (field, idx, subfield) => {
    if (subfield) {
      setProfileData(prev => ({
        ...prev,
        relationship_dynamics: {
          ...prev.relationship_dynamics,
          [field]: prev.relationship_dynamics[field].filter((_, i) => i !== idx)
        }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
    }
  };

  const TagInput = ({ fieldKey, placeholder, field, subfield, color = 'slate' }) => {
    const colorMap = {
      green: 'bg-green-50 border-green-200',
      amber: 'bg-amber-50 border-amber-200',
      violet: 'bg-violet-50 border-violet-200',
      rose: 'bg-rose-50 border-rose-200',
      blue: 'bg-blue-50 border-blue-200',
      slate: 'bg-slate-50 border-slate-200'
    };
    const tags = subfield
      ? (profileData.relationship_dynamics?.[field] || [])
      : (profileData[field] || []);

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={tagInputs[fieldKey] || ''}
            onChange={(e) => setTagInputs(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(field, subfield))}
            className="text-sm"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => addTag(field, subfield)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, idx) => (
            <Badge key={idx} variant="outline" className={`gap-1 text-xs ${colorMap[color]}`}>
              {t}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => removeTag(field, idx, subfield)} />
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-violet-600" />
            Role Profile — {roleName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="core" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core" className="gap-2">
              <Brain className="w-4 h-4" />
              Core Profile
            </TabsTrigger>
            <TabsTrigger value="persona" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Persona
            </TabsTrigger>
          </TabsList>

          {/* CORE PROFILE TAB */}
          <TabsContent value="core" className="space-y-5 mt-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={generateCoreProfile} disabled={loadingAI} className="gap-2">
                {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingAI ? 'Generating...' : 'AI Generate Core'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Strengths</Label>
              <TagInput fieldKey="strength" field="strengths" placeholder="e.g., Strategic thinking" color="green" />
            </div>

            <div className="space-y-2">
              <Label>Weaknesses / Blind Spots</Label>
              <TagInput fieldKey="weakness" field="weaknesses" placeholder="e.g., Overlooks technical complexity" color="amber" />
            </div>

            <div className="space-y-2">
              <Label>Communication Style</Label>
              <Textarea
                value={profileData.communication_style}
                onChange={(e) => setProfileData({ ...profileData, communication_style: e.target.value })}
                placeholder="Tone, directness, data vs intuition preference..."
                className="min-h-[70px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Decision-Making Approach</Label>
              <Textarea
                value={profileData.decision_making_approach}
                onChange={(e) => setProfileData({ ...profileData, decision_making_approach: e.target.value })}
                placeholder="Data-driven, collaborative, decisive, cautious..."
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Tolerance</Label>
              <Select value={profileData.risk_tolerance} onValueChange={(val) => setProfileData({ ...profileData, risk_tolerance: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — Prefers safe, proven approaches</SelectItem>
                  <SelectItem value="medium">Medium — Balanced risk assessment</SelectItem>
                  <SelectItem value="high">High — Embraces calculated risks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Core Motivations</Label>
              <TagInput fieldKey="motivation" field="typical_motivations" placeholder="e.g., Revenue growth" color="violet" />
            </div>
          </TabsContent>

          {/* PERSONA TAB */}
          <TabsContent value="persona" className="space-y-5 mt-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-500">
                AI-generated character dynamics that enrich simulation realism — backstory, biases, triggers, and relationship patterns.
              </p>
              <Button onClick={generatePersona} disabled={loadingPersona} className="gap-2 shrink-0">
                {loadingPersona ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingPersona ? 'Generating...' : 'Generate Persona'}
              </Button>
            </div>

            {/* Backstory */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Backstory
              </Label>
              <Textarea
                value={profileData.backstory}
                onChange={(e) => setProfileData({ ...profileData, backstory: e.target.value })}
                placeholder="Career path, formative experiences, defining moments that shaped their perspective..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Personality Traits */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                Personality Traits
              </Label>
              <TagInput fieldKey="trait" field="personality_traits" placeholder="e.g., Gets defensive when estimates questioned" color="violet" />
            </div>

            {/* Cognitive Biases */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cognitive Biases
              </Label>
              {profileData.cognitive_biases?.length > 0 ? (
                <div className="space-y-2">
                  {profileData.cognitive_biases.map((b, idx) => (
                    <Card key={idx} className="border-amber-200 bg-amber-50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-amber-900">{b.bias}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{b.description}</p>
                            {b.example && (
                              <p className="text-xs text-amber-700 mt-1 italic">"{b.example}"</p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                            onClick={() => setProfileData(prev => ({
                              ...prev,
                              cognitive_biases: prev.cognitive_biases.filter((_, i) => i !== idx)
                            }))}>
                            <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Generate persona to populate cognitive biases with examples.</p>
              )}
            </div>

            {/* Emotional Triggers */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-500" />
                Emotional Triggers
              </Label>
              <TagInput fieldKey="trigger" field="emotional_triggers" placeholder="e.g., When their timeline is challenged" color="rose" />
            </div>

            {/* Conflict Style */}
            <div className="space-y-2">
              <Label>Conflict Style</Label>
              <Select value={profileData.conflict_style} onValueChange={(val) => setProfileData({ ...profileData, conflict_style: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conflict style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avoiding">Avoiding — Sidesteps conflict</SelectItem>
                  <SelectItem value="accommodating">Accommodating — Yields to others</SelectItem>
                  <SelectItem value="competing">Competing — Stands firm, pushes hard</SelectItem>
                  <SelectItem value="compromising">Compromising — Finds middle ground</SelectItem>
                  <SelectItem value="collaborating">Collaborating — Seeks win-win</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signature Phrases */}
            <div className="space-y-2">
              <Label>Signature Phrases</Label>
              <TagInput fieldKey="phrase" field="signature_phrases" placeholder='e.g., "Have we validated this with users?"' color="blue" />
            </div>

            {/* Relationship Dynamics */}
            <div className="space-y-3">
              <Label className="block font-semibold">Relationship Dynamics</Label>
              <div>
                <p className="text-xs text-slate-500 mb-1">Naturally aligns with</p>
                <TagInput fieldKey="ally" field="allies" subfield="allies" placeholder="e.g., Product Manager" color="green" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Friction with</p>
                <TagInput fieldKey="friction" field="friction_with" subfield="friction_with" placeholder="e.g., Security Engineer" color="rose" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Influenced by</p>
                <TagInput fieldKey="influenced" field="influenced_by" subfield="influenced_by" placeholder="e.g., CEO, data from analytics" color="blue" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          {existingProfile && (
            <Button variant="outline" onClick={() => deleteMutation.mutate()} className="mr-auto text-rose-600 hover:text-rose-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate(profileData)} className="gap-2">
            <Save className="w-4 h-4" />
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}