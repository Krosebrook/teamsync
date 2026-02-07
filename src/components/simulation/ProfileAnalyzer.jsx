import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Brain, TrendingUp, Users } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProfileAnalyzer({ open, onClose, onProfileExtracted }) {
  const [loading, setLoading] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [extractedProfile, setExtractedProfile] = useState(null);

  const analyzeProfile = async () => {
    if (!freeText.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert in organizational psychology and decision-making analysis. Analyze the following free-text description about a person (could be performance reviews, communication notes, meeting observations, etc.) and extract structured data about their professional profile.

FREE-TEXT DESCRIPTION:
${freeText}

Extract and structure the following information:

1. DECISION-MAKING BIASES:
   - Identify cognitive biases they tend to exhibit (e.g., confirmation bias, status quo bias, optimism bias)
   - How these biases manifest in their decision-making
   - Situations where these biases are most pronounced

2. CONFLICT RESOLUTION TENDENCIES:
   - Primary conflict resolution style (avoiding, accommodating, competing, compromising, collaborating)
   - How they handle disagreements with peers vs superiors vs subordinates
   - Emotional regulation during conflicts
   - Past conflict patterns and outcomes

3. COMMUNICATION STYLE:
   - Direct vs diplomatic
   - Data-driven vs intuitive
   - Formal vs casual
   - Written vs verbal preference
   - How they give and receive feedback

4. DOMAIN EXPERTISE:
   - Specific technical skills mentioned
   - Areas of deep knowledge
   - Learning agility and knowledge gaps
   - Certifications or specialized training

5. COLLABORATION PATTERNS:
   - Team player vs independent worker
   - How they work with different personality types
   - Influence style (authoritative, collaborative, consultative)
   - Cross-functional collaboration effectiveness

6. PERFORMANCE CHARACTERISTICS:
   - Strengths and growth areas
   - Work under pressure tendencies
   - Quality vs speed orientation
   - Innovation vs execution focus
   - Past performance trends

7. RISK PROFILE:
   - Risk tolerance level (low, medium, high)
   - When they advocate for bold moves vs caution
   - How they handle uncertainty and ambiguity

8. PERSONALITY TRAITS (relevant to decision-making):
   - Extraversion vs introversion
   - Analytical vs intuitive
   - Detail-oriented vs big picture
   - Pragmatic vs visionary

Be specific and evidence-based. Quote relevant parts of the text to support your analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            decision_making_biases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bias_name: { type: "string" },
                  manifestation: { type: "string" },
                  situations: { type: "string" },
                  evidence_from_text: { type: "string" }
                }
              }
            },
            conflict_resolution: {
              type: "object",
              properties: {
                primary_style: { 
                  type: "string",
                  enum: ["avoiding", "accommodating", "competing", "compromising", "collaborating"]
                },
                peer_handling: { type: "string" },
                authority_handling: { type: "string" },
                emotional_regulation: { type: "string" },
                past_patterns: { type: "array", items: { type: "string" } }
              }
            },
            communication_style: {
              type: "object",
              properties: {
                directness: { type: "string", enum: ["direct", "diplomatic", "balanced"] },
                decision_basis: { type: "string", enum: ["data-driven", "intuitive", "balanced"] },
                formality: { type: "string", enum: ["formal", "casual", "adaptive"] },
                medium_preference: { type: "string", enum: ["written", "verbal", "no preference"] },
                feedback_style: { type: "string" }
              }
            },
            domain_expertise: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  proficiency_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
                  evidence: { type: "string" }
                }
              }
            },
            collaboration_patterns: {
              type: "object",
              properties: {
                team_orientation: { type: "string", enum: ["team player", "independent", "balanced"] },
                cross_functional_effectiveness: { type: "string" },
                influence_style: { type: "string", enum: ["authoritative", "collaborative", "consultative"] },
                personality_adaptability: { type: "string" }
              }
            },
            performance_characteristics: {
              type: "object",
              properties: {
                key_strengths: { type: "array", items: { type: "string" } },
                growth_areas: { type: "array", items: { type: "string" } },
                pressure_response: { type: "string" },
                quality_vs_speed: { type: "string", enum: ["quality-focused", "speed-focused", "balanced"] },
                innovation_vs_execution: { type: "string", enum: ["innovation-focused", "execution-focused", "balanced"] },
                trends: { type: "string" }
              }
            },
            risk_profile: {
              type: "object",
              properties: {
                risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
                bold_vs_cautious: { type: "string" },
                uncertainty_handling: { type: "string" }
              }
            },
            personality_traits: {
              type: "array",
              items: { type: "string" }
            },
            summary: { type: "string", description: "2-3 sentence summary of this person's profile" },
            recommended_roles: { 
              type: "array", 
              items: { type: "string" },
              description: "Simulation roles they'd excel at based on this profile"
            }
          }
        }
      });

      setExtractedProfile(result);
      toast.success('Profile analyzed successfully');
    } catch (error) {
      toast.error('Failed to analyze profile');
      console.error(error);
    }
    setLoading(false);
  };

  const applyProfile = () => {
    if (extractedProfile) {
      onProfileExtracted(extractedProfile);
      onClose();
      toast.success('Profile data extracted');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            AI Profile Analyzer
          </DialogTitle>
          <DialogDescription>
            Paste performance reviews, communication notes, or observations to extract structured profile data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!extractedProfile ? (
            <>
              <div>
                <Label>Free-Text Description</Label>
                <Textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Paste performance reviews, manager notes, peer feedback, communication observations, or any text describing this person's work style, decision-making patterns, and collaboration approach...

Example: 'Sarah consistently demonstrates strong analytical skills in her approach to product decisions. She tends to dig deep into data before making calls, sometimes to the point of analysis paralysis. In recent sprint planning meetings, she's shown a preference for conservative estimates and has pushed back on aggressive timelines. Her code reviews are thorough but can be quite direct, which has occasionally created tension with junior engineers. She works best with structured processes and clear requirements...'"
                  className="min-h-[200px] resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  The AI will extract: decision biases, conflict resolution style, communication patterns, domain expertise, and more
                </p>
              </div>

              <Button
                onClick={analyzeProfile}
                disabled={loading || !freeText.trim()}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Structured Profile Data
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-200">
                <h4 className="font-semibold text-sm text-violet-900 mb-2">Profile Summary</h4>
                <p className="text-sm text-slate-700">{extractedProfile.summary}</p>
                {extractedProfile.recommended_roles && extractedProfile.recommended_roles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-violet-800 mb-1">Recommended Simulation Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {extractedProfile.recommended_roles.map((role, i) => (
                        <Badge key={i} className="text-xs bg-violet-100 text-violet-700">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Decision-Making Biases */}
              {extractedProfile.decision_making_biases && extractedProfile.decision_making_biases.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    Decision-Making Biases
                  </h4>
                  <div className="space-y-3">
                    {extractedProfile.decision_making_biases.map((bias, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">{bias.bias_name}</p>
                        <p className="text-xs text-slate-700 mb-1">{bias.manifestation}</p>
                        <p className="text-xs text-slate-600 mb-2">Context: {bias.situations}</p>
                        <p className="text-xs text-slate-500 italic">Evidence: "{bias.evidence_from_text}"</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Conflict Resolution */}
              {extractedProfile.conflict_resolution && (
                <Card className="p-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-600" />
                    Conflict Resolution Tendencies
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-100 text-rose-700">
                        {extractedProfile.conflict_resolution.primary_style}
                      </Badge>
                      <span className="text-xs text-slate-600">Primary Style</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded">
                        <strong>With Peers:</strong> {extractedProfile.conflict_resolution.peer_handling}
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <strong>With Authority:</strong> {extractedProfile.conflict_resolution.authority_handling}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong>Emotional Regulation:</strong> {extractedProfile.conflict_resolution.emotional_regulation}
                    </p>
                    {extractedProfile.conflict_resolution.past_patterns && (
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Past Patterns:</p>
                        <ul className="space-y-0.5">
                          {extractedProfile.conflict_resolution.past_patterns.map((pattern, i) => (
                            <li key={i} className="text-xs text-slate-600">• {pattern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Communication Style */}
              {extractedProfile.communication_style && (
                <Card className="p-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Communication Style</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-cyan-50 rounded">
                      <strong>Directness:</strong> {extractedProfile.communication_style.directness}
                    </div>
                    <div className="p-2 bg-cyan-50 rounded">
                      <strong>Decision Basis:</strong> {extractedProfile.communication_style.decision_basis}
                    </div>
                    <div className="p-2 bg-cyan-50 rounded">
                      <strong>Formality:</strong> {extractedProfile.communication_style.formality}
                    </div>
                    <div className="p-2 bg-cyan-50 rounded">
                      <strong>Medium:</strong> {extractedProfile.communication_style.medium_preference}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 mt-2">
                    <strong>Feedback Style:</strong> {extractedProfile.communication_style.feedback_style}
                  </p>
                </Card>
              )}

              {/* Domain Expertise */}
              {extractedProfile.domain_expertise && extractedProfile.domain_expertise.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-3">Domain Expertise</h4>
                  <div className="space-y-2">
                    {extractedProfile.domain_expertise.map((expertise, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-800">{expertise.area}</span>
                          <p className="text-xs text-slate-600 mt-0.5">{expertise.evidence}</p>
                        </div>
                        <Badge className="ml-2 bg-emerald-600 text-white text-xs">
                          {expertise.proficiency_level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Performance & Risk */}
              <div className="grid grid-cols-2 gap-4">
                {extractedProfile.performance_characteristics && (
                  <Card className="p-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      Performance
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Strengths:</strong>
                        <ul className="mt-1 space-y-0.5">
                          {extractedProfile.performance_characteristics.key_strengths?.map((s, i) => (
                            <li key={i} className="text-emerald-700">✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Growth Areas:</strong>
                        <ul className="mt-1 space-y-0.5">
                          {extractedProfile.performance_characteristics.growth_areas?.map((g, i) => (
                            <li key={i} className="text-amber-700">→ {g}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t">
                        <Badge className="text-xs bg-amber-100 text-amber-700">
                          {extractedProfile.performance_characteristics.quality_vs_speed}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}

                {extractedProfile.risk_profile && (
                  <Card className="p-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">Risk Profile</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <strong>Risk Tolerance:</strong>
                        <Badge className={`text-xs ${
                          extractedProfile.risk_profile.risk_tolerance === 'high' ? 'bg-rose-600' :
                          extractedProfile.risk_profile.risk_tolerance === 'medium' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        } text-white`}>
                          {extractedProfile.risk_profile.risk_tolerance}
                        </Badge>
                      </div>
                      <p className="text-slate-700">
                        <strong>Tendency:</strong> {extractedProfile.risk_profile.bold_vs_cautious}
                      </p>
                      <p className="text-slate-700">
                        <strong>Uncertainty:</strong> {extractedProfile.risk_profile.uncertainty_handling}
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Personality Traits */}
              {extractedProfile.personality_traits && extractedProfile.personality_traits.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Personality Traits</h4>
                  <div className="flex flex-wrap gap-1">
                    {extractedProfile.personality_traits.map((trait, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={applyProfile} className="flex-1 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Use This Profile Data
                </Button>
                <Button onClick={() => setExtractedProfile(null)} variant="outline">
                  Analyze Different Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}