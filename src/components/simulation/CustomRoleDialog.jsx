import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Sparkles, Loader2, X } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";

const ICON_OPTIONS = [
  "Briefcase", "User", "Users", "Building", "Award", "Target", 
  "TrendingUp", "Zap", "Star", "Heart", "Crown", "Shield"
];

const COLOR_OPTIONS = [
  "violet", "blue", "cyan", "rose", "amber", "slate", 
  "pink", "emerald", "orange", "indigo", "purple", "lime", "teal", "fuchsia"
];

export default function CustomRoleDialog({ open, onOpenChange, onSave, editRole = null }) {
  const [name, setName] = useState(editRole?.name || '');
  const [description, setDescription] = useState(editRole?.description || '');
  const [influence, setInfluence] = useState(editRole?.default_influence || 5);
  const [iconName, setIconName] = useState(editRole?.icon_name || 'User');
  const [color, setColor] = useState(editRole?.color || 'slate');
  const [strengths, setStrengths] = useState(editRole?.strengths || []);
  const [weaknesses, setWeaknesses] = useState(editRole?.weaknesses || []);
  const [communicationStyle, setCommunicationStyle] = useState(editRole?.communication_style || '');
  const [typicalMotivations, setTypicalMotivations] = useState(editRole?.typical_motivations || []);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newMotivation, setNewMotivation] = useState('');

  useEffect(() => {
    if (editRole) {
      setName(editRole.name);
      setDescription(editRole.description);
      setInfluence(editRole.default_influence);
      setIconName(editRole.icon_name);
      setColor(editRole.color);
      setStrengths(editRole.strengths || []);
      setWeaknesses(editRole.weaknesses || []);
      setCommunicationStyle(editRole.communication_style || '');
      setTypicalMotivations(editRole.typical_motivations || []);
    }
  }, [editRole]);

  const getSuggestions = async () => {
    if (!name.trim() || name.length < 3) return;
    
    setLoadingSuggestions(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping create a custom role for a team simulation tool. Given the role name "${name}", suggest:
1. Detailed description of typical concerns and priorities (2-3 sentences)
2. Most appropriate icon from this list: ${ICON_OPTIONS.join(', ')}
3. Most appropriate color theme from this list: ${COLOR_OPTIONS.join(', ')}
4. Default influence level (1-10, where 10 is highest)
5. 3-5 key strengths this role brings to decision-making
6. 2-4 potential weaknesses or blind spots
7. Communication style description (1-2 sentences)
8. 3-5 typical motivations that drive this role's decisions

Be specific and practical. Consider what this role typically cares about in product/business decisions.`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            icon: { type: "string" },
            color: { type: "string" },
            influence: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            communication_style: { type: "string" },
            typical_motivations: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setAiSuggestions(result);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
    setLoadingSuggestions(false);
  };

  const applySuggestions = () => {
    if (!aiSuggestions) return;
    setDescription(aiSuggestions.description);
    setIconName(aiSuggestions.icon);
    setColor(aiSuggestions.color);
    setInfluence(aiSuggestions.influence);
    setStrengths(aiSuggestions.strengths || []);
    setWeaknesses(aiSuggestions.weaknesses || []);
    setCommunicationStyle(aiSuggestions.communication_style || '');
    setTypicalMotivations(aiSuggestions.typical_motivations || []);
    setAiSuggestions(null);
  };

  const handleSave = () => {
    if (!name.trim() || !description.trim()) return;
    
    onSave({
      ...(editRole?.id && { id: editRole.id }),
      name,
      description,
      default_influence: influence,
      icon_name: iconName,
      color,
      strengths,
      weaknesses,
      communication_style: communicationStyle,
      typical_motivations: typicalMotivations
    });
    
    // Reset form
    setName('');
    setDescription('');
    setInfluence(5);
    setIconName('User');
    setColor('slate');
    setStrengths([]);
    setWeaknesses([]);
    setCommunicationStyle('');
    setTypicalMotivations([]);
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const addWeakness = () => {
    if (newWeakness.trim()) {
      setWeaknesses([...weaknesses, newWeakness.trim()]);
      setNewWeakness('');
    }
  };

  const addMotivation = () => {
    if (newMotivation.trim()) {
      setTypicalMotivations([...typicalMotivations, newMotivation.trim()]);
      setNewMotivation('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editRole ? 'Edit Custom Role' : 'Create Custom Role'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="profile">Role Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="role-name">Role Name</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getSuggestions}
                disabled={!name.trim() || name.length < 3 || loadingSuggestions}
                className="h-7 gap-1.5 text-xs"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    AI Suggest
                  </>
                )}
              </Button>
            </div>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chief Compliance Officer"
            />
          </div>

          {aiSuggestions && (
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-medium text-violet-900">AI Suggestions</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={applySuggestions}
                  className="h-7 text-xs"
                >
                  Apply All
                </Button>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-xs mt-1 text-slate-600">{aiSuggestions.description}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <Badge variant="outline">{aiSuggestions.icon}</Badge>
                  <Badge variant="outline" className="capitalize">{aiSuggestions.color}</Badge>
                  <Badge variant="outline">Influence: {aiSuggestions.influence}/10</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role-description">
              Typical Concerns & Priorities
            </Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role typically cares about, their main concerns, risk tolerance, and decision-making priorities..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-icon">Icon</Label>
              <Select value={iconName} onValueChange={setIconName}>
                <SelectTrigger id="role-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(icon => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="role-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>
                      <span className="capitalize">{c}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-influence">
              Default Influence Level: {influence}
            </Label>
            <Slider
              id="role-influence"
              value={[influence]}
              onValueChange={(val) => setInfluence(val[0])}
              max={10}
              min={1}
              step={1}
            />
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 py-4">
          {/* Strengths */}
          <div className="space-y-2">
            <Label>Strengths</Label>
            <div className="flex gap-2">
              <Input
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="e.g., Strategic thinking, Data analysis"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
              />
              <Button type="button" size="sm" onClick={addStrength}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {s}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setStrengths(strengths.filter((_, i) => i !== idx))}
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
                placeholder="e.g., Overlooking user experience, Risk aversion"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWeakness())}
              />
              <Button type="button" size="sm" onClick={addWeakness}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((w, idx) => (
                <Badge key={idx} variant="outline" className="gap-1 bg-amber-50">
                  {w}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setWeaknesses(weaknesses.filter((_, i) => i !== idx))}
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
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              placeholder="Describe how this role typically communicates in meetings, their tone, directness, preference for data vs intuition, etc."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Typical Motivations */}
          <div className="space-y-2">
            <Label>Typical Motivations</Label>
            <div className="flex gap-2">
              <Input
                value={newMotivation}
                onChange={(e) => setNewMotivation(e.target.value)}
                placeholder="e.g., Revenue growth, Customer satisfaction"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMotivation())}
              />
              <Button type="button" size="sm" onClick={addMotivation}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {typicalMotivations.map((m, idx) => (
                <Badge key={idx} variant="outline" className="gap-1 bg-violet-50">
                  {m}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setTypicalMotivations(typicalMotivations.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || !description.trim()}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}