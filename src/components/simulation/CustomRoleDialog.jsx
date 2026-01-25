import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save } from "lucide-react";

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
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chief Compliance Officer"
            />
          </div>

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