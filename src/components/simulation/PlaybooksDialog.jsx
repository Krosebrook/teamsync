import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Plus, 
  Check, 
  Users, 
  FileText,
  Sparkles,
  Pencil,
  Trash2
} from "lucide-react";

const FRAMEWORK_INFO = {
  daci: {
    name: 'DACI',
    description: 'Driver, Approver, Contributors, Informed - Clear decision ownership',
    positions: ['Driver', 'Approver', 'Contributor', 'Informed']
  },
  raci: {
    name: 'RACI',
    description: 'Responsible, Accountable, Consulted, Informed - Task assignment clarity',
    positions: ['Responsible', 'Accountable', 'Consulted', 'Informed']
  },
  six_thinking_hats: {
    name: 'Six Thinking Hats',
    description: 'Structured parallel thinking - Different perspectives on same problem',
    positions: ['Facts', 'Emotions', 'Caution', 'Benefits', 'Creativity', 'Process']
  },
  pre_mortem: {
    name: 'Pre-Mortem',
    description: 'Imagine failure and work backwards - Identify risks before launch',
    positions: ['Risk Identifier', 'Impact Assessor', 'Mitigation Owner']
  },
  post_mortem: {
    name: 'Post-Mortem',
    description: 'Learn from past decisions - What happened and why',
    positions: ['Observer', 'Analyst', 'Documenter']
  },
  swot: {
    name: 'SWOT',
    description: 'Strengths, Weaknesses, Opportunities, Threats',
    positions: ['Strength Analyst', 'Weakness Analyst', 'Opportunity Scout', 'Threat Assessor']
  },
  cost_benefit: {
    name: 'Cost-Benefit',
    description: 'Quantitative analysis of costs vs benefits',
    positions: ['Cost Analyst', 'Benefit Analyst', 'ROI Calculator']
  },
  ooda: {
    name: 'OODA Loop',
    description: 'Observe, Orient, Decide, Act - Rapid decision making',
    positions: ['Observer', 'Analyst', 'Decision Maker', 'Executor']
  }
};

export default function PlaybooksDialog({ open, onOpenChange, onApplyPlaybook, allRoles }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [editingPlaybook, setEditingPlaybook] = useState(null);

  // Form state for custom playbook
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('custom');
  const [requiredRoles, setRequiredRoles] = useState([]);

  const { data: playbooks = [] } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => base44.entities.DecisionPlaybook.list(),
  });

  const createPlaybookMutation = useMutation({
    mutationFn: (data) => base44.entities.DecisionPlaybook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook saved');
      resetForm();
    },
  });

  const deletePlaybookMutation = useMutation({
    mutationFn: (id) => base44.entities.DecisionPlaybook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook deleted');
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setFramework('custom');
    setRequiredRoles([]);
    setEditingPlaybook(null);
  };

  const handleFrameworkSelect = (fw) => {
    setSelectedFramework(fw);
    const info = FRAMEWORK_INFO[fw];
    
    // Pre-fill with suggested roles based on framework
    const suggestedRoles = [];
    if (fw === 'daci') {
      suggestedRoles.push(
        { role: 'product_manager', framework_position: 'Driver' },
        { role: 'founder', framework_position: 'Approver' },
        { role: 'backend_dev', framework_position: 'Contributor' },
        { role: 'frontend_dev', framework_position: 'Contributor' }
      );
    } else if (fw === 'raci') {
      suggestedRoles.push(
        { role: 'eng_manager', framework_position: 'Responsible' },
        { role: 'founder', framework_position: 'Accountable' },
        { role: 'product_manager', framework_position: 'Consulted' }
      );
    } else if (fw === 'pre_mortem') {
      suggestedRoles.push(
        { role: 'qa', framework_position: 'Risk Identifier' },
        { role: 'security', framework_position: 'Impact Assessor' },
        { role: 'eng_manager', framework_position: 'Mitigation Owner' }
      );
    }

    if (onApplyPlaybook) {
      onApplyPlaybook({
        framework: fw,
        name: info.name,
        required_roles: suggestedRoles
      });
      onOpenChange(false);
    }
  };

  const handleSaveCustomPlaybook = async () => {
    if (!name.trim()) {
      toast.error('Playbook name required');
      return;
    }

    await createPlaybookMutation.mutateAsync({
      name,
      framework,
      description,
      required_roles: requiredRoles
    });
  };

  const addRoleToPlaybook = () => {
    setRequiredRoles([...requiredRoles, { role: '', framework_position: '' }]);
  };

  const updateRequiredRole = (index, field, value) => {
    const updated = [...requiredRoles];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredRoles(updated);
  };

  const removeRequiredRole = (index) => {
    setRequiredRoles(requiredRoles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Decision Playbooks
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Frameworks</TabsTrigger>
            <TabsTrigger value="saved">My Playbooks</TabsTrigger>
            <TabsTrigger value="create">Create Custom</TabsTrigger>
          </TabsList>

          {/* Browse Pre-built Frameworks */}
          <TabsContent value="browse" className="space-y-3 mt-4">
            <p className="text-sm text-slate-600 mb-4">
              Select a proven decision framework to structure your simulation
            </p>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(FRAMEWORK_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleFrameworkSelect(key)}
                  className="p-4 border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-slate-800 mb-1">{info.name}</h3>
                  <p className="text-xs text-slate-600 mb-3">{info.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {info.positions.map(pos => (
                      <Badge key={pos} variant="outline" className="text-[10px]">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Saved Playbooks */}
          <TabsContent value="saved" className="space-y-3 mt-4">
            {playbooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No saved playbooks yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setActiveTab('create')}
                >
                  Create your first playbook
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {playbooks.map(playbook => (
                  <div key={playbook.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">{playbook.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1 capitalize">
                          {playbook.framework}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (onApplyPlaybook) {
                              onApplyPlaybook(playbook);
                              onOpenChange(false);
                            }
                          }}
                          className="h-7 px-2"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlaybookMutation.mutate(playbook.id)}
                          className="h-7 px-2 text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {playbook.description && (
                      <p className="text-xs text-slate-600 mb-2">{playbook.description}</p>
                    )}
                    {playbook.required_roles && playbook.required_roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {playbook.required_roles.map((rr, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {rr.framework_position}: {rr.role?.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Custom Playbook */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Playbook Name
              </label>
              <Input
                placeholder="e.g., Enterprise Security Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Framework Type
              </label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {Object.entries(FRAMEWORK_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="When to use this playbook..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Required Roles
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRoleToPlaybook}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Role
                </Button>
              </div>

              <div className="space-y-2">
                {requiredRoles.map((rr, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-3 border border-slate-200 rounded">
                    <div className="flex-1 space-y-2">
                      <Select 
                        value={rr.role} 
                        onValueChange={(val) => updateRequiredRole(idx, 'role', val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {allRoles.map(role => (
                            <SelectItem key={role.id} value={role.id} className="text-xs">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Framework position (e.g., Driver, Approver)"
                        value={rr.framework_position}
                        onChange={(e) => updateRequiredRole(idx, 'framework_position', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequiredRole(idx)}
                      className="h-8 px-2 text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                {requiredRoles.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No roles added yet
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCustomPlaybook}>
                Save Playbook
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}