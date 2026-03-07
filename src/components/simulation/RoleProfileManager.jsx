import React, { useState, useEffect } from 'react';
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
import { Plus, X, Save, Sparkles, Loader2, Trash2, Brain, User, AlertTriangle, Zap, MessageSquare, Swords, BookOpen, TrendingUp, Settings2, PenLine } from "lucide-react";

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
  relationship_dynamics: { allies: [], friction_with: [], influenced_by: [] },
  domain_expertise_detailed: [],
  performance_patterns: '',
  // Advanced fields
  communication_preferences: {
    directness: 'balanced',
    decision_basis: 'balanced',
    formality: 'adaptive',
    medium_preference: 'no preference',
  },
  conflict_preferences: {
    de_escalation_tactics: [],
    negotiation_style: '',
    escalation_threshold: 'medium',
    post_conflict_behavior: '',
  },
  custom_fields: [], // [{ key: string, value: string }]
};

const DIRECTNESS_OPTIONS = ['direct', 'diplomatic', 'balanced'];
const DECISION_BASIS_OPTIONS = ['data-driven', 'intuitive', 'balanced'];
const FORMALITY_OPTIONS = ['formal', 'casual', 'adaptive'];
const MEDIUM_OPTIONS = ['written', 'verbal', 'no preference'];
const ESCALATION_THRESHOLD_OPTIONS = ['low', 'medium', 'high'];
const NEGOTIATION_STYLES = [
  'Principled negotiation — focuses on interests not positions',
  'Competitive — aims to win as much as possible',
  'Collaborative — seeks creative win-win outcomes',
  'Avoidant — defers or delays confrontation',
  'Accommodating — concedes readily to preserve harmony',
];

export default function RoleProfileManager({ open, onClose, roleId, roleName, allRoles }) {
  const queryClient = useQueryClient();
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [loadingTriggers, setLoadingTriggers] = useState(false);
  const [loadingConflict, setLoadingConflict] = useState(false);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [loadingExpertise, setLoadingExpertise] = useState(false);
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

  const profileContext = () => `
Role: "${roleName}"
Strengths: ${profileData.strengths.join(', ') || 'not set'}
Weaknesses: ${profileData.weaknesses.join(', ') || 'not set'}
Communication style: ${profileData.communication_style || 'not set'}
Motivations: ${profileData.typical_motivations.join(', ') || 'not set'}
Decision approach: ${profileData.decision_making_approach || 'not set'}
Risk tolerance: ${profileData.risk_tolerance}
Personality traits: ${profileData.personality_traits?.join(', ') || 'not set'}
Current conflict style: ${profileData.conflict_style || 'not set'}
  `.trim();

  const suggestTriggers = async () => {
    setLoadingTriggers(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a team psychology expert. Based on this role profile, suggest 3–5 specific emotional triggers — situations, phrases, or dynamics that would make this persona reactive, defensive, or unusually persuasive in a team decision meeting.

${profileContext()}

Return triggers as short, vivid, specific statements (not generic). Each should start with a trigger context like "When...", "If...", or "Being told...".`,
        response_json_schema: {
          type: "object",
          properties: { triggers: { type: "array", items: { type: "string" } } }
        }
      });
      if (result.triggers?.length) {
        const newTriggers = result.triggers.filter(t => !profileData.emotional_triggers.includes(t));
        setProfileData(prev => ({ ...prev, emotional_triggers: [...prev.emotional_triggers, ...newTriggers] }));
        toast.success(`Added ${newTriggers.length} emotional trigger(s)`);
      }
    } catch { toast.error('Failed to suggest triggers'); }
    setLoadingTriggers(false);
  };

  const suggestConflictStyle = async () => {
    setLoadingConflict(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this role profile, determine the most realistic conflict style for this persona in team decision-making. Choose exactly one from: avoiding, accommodating, competing, compromising, collaborating.

${profileContext()}

Return the single best-fit conflict style and a 1-sentence rationale.`,
        response_json_schema: {
          type: "object",
          properties: {
            conflict_style: { type: "string" },
            rationale: { type: "string" }
          }
        }
      });
      if (result.conflict_style) {
        setProfileData(prev => ({ ...prev, conflict_style: result.conflict_style }));
        toast.success(`Conflict style set to "${result.conflict_style}"${result.rationale ? ' — ' + result.rationale : ''}`);
      }
    } catch { toast.error('Failed to suggest conflict style'); }
    setLoadingConflict(false);
  };

  const suggestPhrases = async () => {
    setLoadingPhrases(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a screenwriter for corporate drama. Based on this role profile, write 4–6 signature phrases this persona characteristically says in team decision meetings. Make them specific, slightly cliché, and instantly recognizable as this role.

${profileContext()}

Examples of good signature phrases:
- "Have we stress-tested this with real users yet?"
- "I need to see the numbers before I can sign off on this."
- "This feels like we're solving the wrong problem."

Return only the phrases as an array of strings.`,
        response_json_schema: {
          type: "object",
          properties: { phrases: { type: "array", items: { type: "string" } } }
        }
      });
      if (result.phrases?.length) {
        const newPhrases = result.phrases.filter(p => !profileData.signature_phrases.includes(p));
        setProfileData(prev => ({ ...prev, signature_phrases: [...prev.signature_phrases, ...newPhrases] }));
        toast.success(`Added ${newPhrases.length} signature phrase(s)`);
      }
    } catch { toast.error('Failed to suggest phrases'); }
    setLoadingPhrases(false);
  };

  const inferDomainExpertise = async () => {
    setLoadingExpertise(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in organizational roles and professional development. Based on the role name, description, and existing profile data below, infer realistic domain expertise areas and past performance patterns.

${profileContext()}
Existing domain expertise: ${profileData.domain_expertise_detailed?.map(d => `${d.area} (${d.proficiency_level})`).join(', ') || 'none set'}

TASK 1 — DOMAIN EXPERTISE:
Infer 4–7 specific domain expertise areas this role would realistically have. For each, assign a proficiency level (beginner/intermediate/advanced/expert) based on how central that domain is to the role. Be specific — not "programming" but "distributed systems design" or "query optimization".

TASK 2 — PERFORMANCE PATTERNS:
Write 2–4 sentences describing this role's typical past performance patterns in team settings — what they tend to do well consistently, where they struggle, how they show up under pressure, and any notable behavioral tendencies that would be visible in simulations. Make it vivid and specific to the role, not generic.`,
        response_json_schema: {
          type: "object",
          properties: {
            domain_expertise_detailed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  proficiency_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] }
                }
              }
            },
            performance_patterns: { type: "string" }
          }
        }
      });

      if (result.domain_expertise_detailed?.length) {
        // Merge with existing, avoiding duplicates by area name
        const existingAreas = new Set((profileData.domain_expertise_detailed || []).map(d => d.area.toLowerCase()));
        const newExpertise = result.domain_expertise_detailed.filter(d => !existingAreas.has(d.area.toLowerCase()));
        setProfileData(prev => ({
          ...prev,
          domain_expertise_detailed: [...(prev.domain_expertise_detailed || []), ...newExpertise],
          performance_patterns: prev.performance_patterns || result.performance_patterns || ''
        }));
        if (!profileData.performance_patterns && result.performance_patterns) {
          setProfileData(prev => ({ ...prev, performance_patterns: result.performance_patterns }));
        }
        toast.success(`Inferred ${newExpertise.length} expertise area(s)`);
      }
    } catch { toast.error('Failed to infer domain expertise'); }
    setLoadingExpertise(false);
  };

  const generateCoreProfile = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an organizational psychologist specializing in team decision-making dynamics. Create a comprehensive decision-making profile for the role: "${roleName}".

Based solely on the role title and common real-world knowledge about this role, generate:
1. 4-6 key strengths specific to this role in cross-functional decision-making contexts (be concrete, not generic)
2. 3-5 blind spots or weaknesses that commonly manifest for this role type in group decisions
3. Communication style: how this role typically communicates in meetings — tone, directness, preferred medium (2-3 specific sentences)
4. 4-6 core motivations that drive this role's decisions and priorities
5. Decision-making approach: their typical framework or process (1-2 sentences)
6. Risk tolerance: low / medium / high with a brief rationale
7. 3-5 domain expertise areas with proficiency level (beginner/intermediate/advanced/expert) — choose areas central to this role
8. Past performance patterns: 2-3 sentences about behavioral tendencies in team settings`,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            communication_style: { type: "string" },
            typical_motivations: { type: "array", items: { type: "string" } },
            decision_making_approach: { type: "string" },
            risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
            domain_expertise_detailed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  proficiency_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] }
                }
              }
            },
            performance_patterns: { type: "string" }
          }
        }
      });
      setProfileData(prev => ({
        ...prev,
        strengths: result.strengths || prev.strengths,
        weaknesses: result.weaknesses || prev.weaknesses,
        communication_style: result.communication_style || prev.communication_style,
        typical_motivations: result.typical_motivations || prev.typical_motivations,
        decision_making_approach: result.decision_making_approach || prev.decision_making_approach,
        risk_tolerance: result.risk_tolerance || prev.risk_tolerance,
        domain_expertise_detailed: result.domain_expertise_detailed?.length ? result.domain_expertise_detailed : prev.domain_expertise_detailed,
        performance_patterns: result.performance_patterns || prev.performance_patterns,
      }));
      toast.success('Core profile generated');
    } catch (error) {
      toast.error('Failed to generate profile');
    } finally {
      setLoadingAI(false);
    }
  };

  const generateFullProfile = async () => {
    // Run core + persona generation together
    setLoadingAI(true);
    setLoadingPersona(true);
    try {
      const otherRoleNames = allRoles?.filter(r => r.id !== roleId).map(r => r.name).slice(0, 10) || [];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert organizational psychologist and team dynamics designer. Generate a COMPLETE, richly detailed decision-making profile for the role: "${roleName}".

Other roles this persona will interact with: ${otherRoleNames.join(', ')}

Generate ALL of the following fields in a single pass:

CORE PROFILE:
- strengths: 5 specific strengths in cross-functional decision-making (avoid generic terms)
- weaknesses: 4 realistic blind spots/weaknesses in group decisions
- communication_style: 3 sentences describing tone, directness, and medium preference
- typical_motivations: 5 core driving motivations
- decision_making_approach: 2 sentences on their framework and process
- risk_tolerance: low/medium/high
- domain_expertise_detailed: 5 key areas with proficiency levels
- performance_patterns: 3 sentences on behavioral tendencies in team settings

PERSONA:
- backstory: 4 vivid sentences — career path + formative experiences that shaped their worldview on risk and collaboration
- personality_traits: 6 specific behavioral traits visible in team meetings (not generic adjectives — behaviors)
- cognitive_biases: 4 biases with name, description, and a concrete example for this role
- emotional_triggers: 4 specific situations/phrases that make this persona reactive or defensive
- conflict_style: one of: avoiding, accommodating, competing, compromising, collaborating
- signature_phrases: 5 characteristic things this persona says in meetings
- relationship_dynamics.allies: role names from the list above they naturally align with
- relationship_dynamics.friction_with: role names they typically clash with
- relationship_dynamics.influenced_by: what/who shifts their thinking`,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            communication_style: { type: "string" },
            typical_motivations: { type: "array", items: { type: "string" } },
            decision_making_approach: { type: "string" },
            risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
            domain_expertise_detailed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  proficiency_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] }
                }
              }
            },
            performance_patterns: { type: "string" },
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

      setProfileData(prev => ({
        ...EMPTY_PROFILE,
        ...prev,
        ...result,
        relationship_dynamics: result.relationship_dynamics || prev.relationship_dynamics || { allies: [], friction_with: [], influenced_by: [] }
      }));
      toast.success('Full profile generated — all fields populated!');
    } catch (error) {
      toast.error('Failed to generate full profile');
    } finally {
      setLoadingAI(false);
      setLoadingPersona(false);
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
            <div className="flex gap-2">
              <Button size="sm" onClick={generateFullProfile} disabled={loadingAI || loadingPersona} className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                {(loadingAI && loadingPersona) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {(loadingAI && loadingPersona) ? 'Generating...' : 'AI Generate Full Profile'}
              </Button>
              <Button variant="outline" size="sm" onClick={generateCoreProfile} disabled={loadingAI} className="gap-2">
                {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Core Only
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

            {/* Domain Expertise */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-600" />
                  Domain Expertise
                </Label>
                <Button variant="outline" size="sm" onClick={inferDomainExpertise} disabled={loadingExpertise} className="gap-1 h-7 text-xs">
                  {loadingExpertise ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Infer
                </Button>
              </div>
              {profileData.domain_expertise_detailed?.length > 0 ? (
                <div className="space-y-1.5">
                  {profileData.domain_expertise_detailed.map((d, idx) => {
                    const proficiencyColor = {
                      expert: 'bg-violet-100 text-violet-800 border-violet-200',
                      advanced: 'bg-blue-100 text-blue-800 border-blue-200',
                      intermediate: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                      beginner: 'bg-slate-100 text-slate-700 border-slate-200',
                    };
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 flex-1">{d.area}</span>
                        <Badge className={`text-xs border ${proficiencyColor[d.proficiency_level] || proficiencyColor.intermediate}`}>
                          {d.proficiency_level}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                          onClick={() => setProfileData(prev => ({
                            ...prev,
                            domain_expertise_detailed: prev.domain_expertise_detailed.filter((_, i) => i !== idx)
                          }))}>
                          <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Click "AI Infer" to automatically suggest domain expertise based on this role.</p>
              )}
            </div>

            {/* Performance Patterns */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Past Performance Patterns
              </Label>
              <Textarea
                value={profileData.performance_patterns}
                onChange={(e) => setProfileData({ ...profileData, performance_patterns: e.target.value })}
                placeholder="Notable behavioral patterns, consistent strengths under pressure, recurring challenges in team settings..."
                className="min-h-[80px] resize-none"
              />
              {!profileData.performance_patterns && (
                <Button variant="ghost" size="sm" onClick={inferDomainExpertise} disabled={loadingExpertise} className="gap-1 h-6 text-xs text-slate-500 p-0">
                  {loadingExpertise ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI infer from role
                </Button>
              )}
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
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-500" />
                  Emotional Triggers
                </Label>
                <Button variant="outline" size="sm" onClick={suggestTriggers} disabled={loadingTriggers} className="gap-1 h-7 text-xs">
                  {loadingTriggers ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest
                </Button>
              </div>
              <TagInput fieldKey="trigger" field="emotional_triggers" placeholder="e.g., When their timeline is challenged" color="rose" />
            </div>

            {/* Conflict Style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-orange-500" />
                  Conflict Style
                </Label>
                <Button variant="outline" size="sm" onClick={suggestConflictStyle} disabled={loadingConflict} className="gap-1 h-7 text-xs">
                  {loadingConflict ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest
                </Button>
              </div>
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
              {profileData.conflict_style && (
                <p className="text-xs text-slate-400 italic">
                  {profileData.conflict_style === 'avoiding' && 'Tends to withdraw from disagreements to preserve harmony.'}
                  {profileData.conflict_style === 'accommodating' && 'Prioritizes others\' needs over their own position.'}
                  {profileData.conflict_style === 'competing' && 'Pursues their own position assertively, even at others\' expense.'}
                  {profileData.conflict_style === 'compromising' && 'Seeks quick, mutually acceptable solutions with partial concessions.'}
                  {profileData.conflict_style === 'collaborating' && 'Works to find creative solutions that fully satisfy all parties.'}
                </p>
              )}
            </div>

            {/* Signature Phrases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Signature Phrases
                </Label>
                <Button variant="outline" size="sm" onClick={suggestPhrases} disabled={loadingPhrases} className="gap-1 h-7 text-xs">
                  {loadingPhrases ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest
                </Button>
              </div>
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