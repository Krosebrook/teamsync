import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Sparkles, Loader2 } from "lucide-react";
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
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (editRole) {
      setName(editRole.name);
      setDescription(editRole.description);
      setInfluence(editRole.default_influence);
      setIconName(editRole.icon_name);
      setColor(editRole.color);
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

Be specific and practical. Consider what this role typically cares about in product/business decisions.`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            icon: { type: "string" },
            color: { type: "string" },
            influence: { type: "number" }
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
      color
    });
    
    // Reset form
    setName('');
    setDescription('');
    setInfluence(5);
    setIconName('User');
    setColor('slate');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editRole ? 'Edit Custom Role' : 'Create Custom Role'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

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