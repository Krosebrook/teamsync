import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Save, Sparkles, Loader2, Edit2, Trash2 } from "lucide-react";
import { motion } from 'framer-motion';

export default function RoleProfileManager({ open, onClose, roleId, roleName, allRoles }) {
  const queryClient = useQueryClient();
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newMotivation, setNewMotivation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: existingProfile } = useQuery({
    queryKey: ['roleProfile', roleId],
    queryFn: async () => {
      const profiles = await base44.entities.RoleProfile.filter({ role_id: roleId });
      return profiles[0] || null;
    },
    enabled: !!roleId
  });

  const [profileData, setProfileData] = useState({
    strengths: [],
    weaknesses: [],
    communication_style: '',
    typical_motivations: [],
    decision_making_approach: '',
    risk_tolerance: 'medium'
  });

  React.useEffect(() => {
    if (existingProfile) {
      setProfileData({
        strengths: existingProfile.strengths || [],
        weaknesses: existingProfile.weaknesses || [],
        communication_style: existingProfile.communication_style || '',
        typical_motivations: existingProfile.typical_motivations || [],
        decision_making_approach: existingProfile.decision_making_approach || '',
        risk_tolerance: existingProfile.risk_tolerance || 'medium'
      });
    }
  }, [existingProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return base44.entities.RoleProfile.update(existingProfile.id, data);
      } else {
        return base44.entities.RoleProfile.create({
          role_id: roleId,
          role_name: roleName,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleProfile'] });
      toast.success('Profile saved');
      onClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.RoleProfile.delete(existingProfile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleProfile'] });
      toast.success('Profile deleted');
      onClose();
    }
  });

  const generateAIProfile = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping create a detailed decision-making profile for the role: "${roleName}".

Generate a comprehensive profile including:
1. 4-6 key strengths this role brings to decision-making
2. 3-5 potential weaknesses or blind spots
3. Communication style (2-3 sentences describing how they typically communicate)
4. 4-6 typical motivations that drive their decisions
5. Decision-making approach (1-2 sentences)
6. Risk tolerance (low/medium/high)

Be specific and realistic based on what this role typically does in organizations.`,
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

      setProfileData(result);
      toast.success('AI profile generated');
    } catch (error) {
      toast.error('Failed to generate profile');
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(profileData);
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setProfileData({ ...profileData, strengths: [...profileData.strengths, newStrength.trim()] });
      setNewStrength('');
    }
  };

  const addWeakness = () => {
    if (newWeakness.trim()) {
      setProfileData({ ...profileData, weaknesses: [...profileData.weaknesses, newWeakness.trim()] });
      setNewWeakness('');
    }
  };

  const addMotivation = () => {
    if (newMotivation.trim()) {
      setProfileData({ ...profileData, typical_motivations: [...profileData.typical_motivations, newMotivation.trim()] });
      setNewMotivation('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Profile for {roleName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAIProfile}
              disabled={loadingAI}
              className="gap-2"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Generate
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Strengths */}
          <div className="space-y-2">
            <Label>Strengths</Label>
            <div className="flex gap-2">
              <Input
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="e.g., Strategic thinking, Data analysis, Stakeholder management"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
              />
              <Button type="button" size="sm" onClick={addStrength}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileData.strengths.map((s, idx) => (
                <Badge key={idx} variant="outline" className="gap-1 bg-green-50">
                  {s}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setProfileData({ 
                      ...profileData, 
                      strengths: profileData.strengths.filter((_, i) => i !== idx) 
                    })}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label>Weaknesses / Blind Spots</Label>
            <div className="flex gap-2">
              <Input
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                placeholder="e.g., Overlooking technical complexity, Over-optimism"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWeakness())}
              />
              <Button type="button" size="sm" onClick={addWeakness}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileData.weaknesses.map((w, idx) => (
                <Badge key={idx} variant="outline" className="gap-1 bg-amber-50">
                  {w}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setProfileData({ 
                      ...profileData, 
                      weaknesses: profileData.weaknesses.filter((_, i) => i !== idx) 
                    })}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Communication Style */}
          <div className="space-y-2">
            <Label htmlFor="comm-style">Communication Style</Label>
            <Textarea
              id="comm-style"
              value={profileData.communication_style}
              onChange={(e) => setProfileData({ ...profileData, communication_style: e.target.value })}
              placeholder="Describe how this role typically communicates - tone, directness, preference for data vs intuition, formality..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Decision Making Approach */}
          <div className="space-y-2">
            <Label htmlFor="decision-approach">Decision-Making Approach</Label>
            <Textarea
              id="decision-approach"
              value={profileData.decision_making_approach}
              onChange={(e) => setProfileData({ ...profileData, decision_making_approach: e.target.value })}
              placeholder="How does this role typically approach decisions? Data-driven, collaborative, decisive, cautious..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Risk Tolerance */}
          <div className="space-y-2">
            <Label>Risk Tolerance</Label>
            <Select
              value={profileData.risk_tolerance}
              onValueChange={(val) => setProfileData({ ...profileData, risk_tolerance: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Prefers safe, proven approaches</SelectItem>
                <SelectItem value="medium">Medium - Balanced risk assessment</SelectItem>
                <SelectItem value="high">High - Embraces calculated risks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Typical Motivations */}
          <div className="space-y-2">
            <Label>Typical Motivations</Label>
            <div className="flex gap-2">
              <Input
                value={newMotivation}
                onChange={(e) => setNewMotivation(e.target.value)}
                placeholder="e.g., Revenue growth, User satisfaction, Technical excellence"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMotivation())}
              />
              <Button type="button" size="sm" onClick={addMotivation}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileData.typical_motivations.map((m, idx) => (
                <Badge key={idx} variant="outline" className="gap-1 bg-violet-50">
                  {m}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setProfileData({ 
                      ...profileData, 
                      typical_motivations: profileData.typical_motivations.filter((_, i) => i !== idx) 
                    })}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingProfile && (
            <Button
              variant="outline"
              onClick={() => deleteMutation.mutate()}
              className="mr-auto text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Profile
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}