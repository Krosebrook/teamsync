import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Upload, User, Mail, Briefcase, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const seniorities = ['junior', 'mid', 'senior', 'executive'];
const comStyles = ['direct', 'diplomatic', 'analytical', 'collaborative', 'assertive'];

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    primary_role: '',
    department: '',
    seniority_level: 'mid',
    communication_style: 'balanced',
    key_skills: [],
    personality_traits: [],
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list('-updated_date', 50),
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setOpenDialog(false);
      resetForm();
      toast.success('Team member added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setOpenDialog(false);
      setDetailMember(null);
      resetForm();
      toast.success('Team member updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setDetailMember(null);
      toast.success('Team member deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      primary_role: '',
      department: '',
      seniority_level: 'mid',
      communication_style: 'balanced',
      key_skills: [],
      personality_traits: [],
    });
    setEditingMember(null);
  };

  const handleOpenDialog = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.primary_role.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingMember) {
      await updateMutation.mutateAsync({
        id: editingMember.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header
    const newMembers = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const [full_name, email, primary_role, department, seniority_level] = line.split(',').map(s => s.trim());
      if (full_name && email && primary_role) {
        newMembers.push({
          full_name,
          email,
          primary_role,
          department: department || '',
          seniority_level: seniority_level || 'mid',
        });
      }
    });

    for (const member of newMembers) {
      try {
        await base44.entities.TeamMember.create(member);
      } catch (err) {
        console.error('Failed to create member:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    toast.success(`Imported ${newMembers.length} team members`);
    e.target.value = '';
  };

  const getSimulationsForMember = (memberEmail) => {
    // This would need additional query logic to find simulations mapped to this person
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Members</h1>
            <p className="text-slate-600 mt-1">Manage your organization's team profiles and expertise</p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <Button variant="outline" className="cursor-pointer gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </label>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-3">No team members yet</p>
            <Button onClick={() => handleOpenDialog()} variant="outline">
              Add your first team member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <div
                key={member.id}
                onClick={() => setDetailMember(member)}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                      {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate">{member.full_name}</h3>
                      <p className="text-sm text-slate-500 truncate">{member.primary_role}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.department && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{member.department}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {member.seniority_level && (
                    <Badge variant="outline" className="text-xs">{member.seniority_level}</Badge>
                  )}
                  {member.communication_style && (
                    <Badge variant="outline" className="text-xs">{member.communication_style}</Badge>
                  )}
                  {member.availability && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        member.availability === 'available' ? 'border-green-200 text-green-700' :
                        member.availability === 'limited' ? 'border-yellow-200 text-yellow-700' :
                        'border-red-200 text-red-700'
                      }`}
                    >
                      {member.availability}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {detailMember && (
          <Dialog open={!!detailMember} onOpenChange={() => setDetailMember(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{detailMember.full_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Profile Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Email</label>
                    <p className="text-sm text-slate-900">{detailMember.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Primary Role</label>
                    <p className="text-sm text-slate-900">{detailMember.primary_role}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Department</label>
                    <p className="text-sm text-slate-900">{detailMember.department || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Seniority Level</label>
                    <p className="text-sm text-slate-900">{detailMember.seniority_level || '—'}</p>
                  </div>
                </div>

                {/* Performance History */}
                {detailMember.historical_performance && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Performance History</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {detailMember.historical_performance.decision_quality_score !== undefined && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-xs text-slate-600">Decision Quality</p>
                          <p className="text-lg font-semibold text-blue-700">{detailMember.historical_performance.decision_quality_score}/100</p>
                        </div>
                      )}
                      {detailMember.historical_performance.collaboration_score !== undefined && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-xs text-slate-600">Collaboration</p>
                          <p className="text-lg font-semibold text-green-700">{detailMember.historical_performance.collaboration_score}/100</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Domain Expertise */}
                {detailMember.domain_expertise_detailed && detailMember.domain_expertise_detailed.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Domain Expertise</h4>
                    <div className="space-y-2">
                      {detailMember.domain_expertise_detailed.map((exp, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{exp.area}</span>
                          <Badge variant="outline">{exp.proficiency_level}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulations */}
                {detailMember.historical_performance?.past_simulations?.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Past Simulations</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      {detailMember.historical_performance.past_simulations.length} simulations
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleOpenDialog(detailMember);
                    setDetailMember(null);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    deleteMutation.mutate(detailMember.id);
                  }}
                  variant="destructive"
                  className="gap-2 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Full Name *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Primary Role *</label>
                <Input
                  value={formData.primary_role}
                  onChange={(e) => setFormData({ ...formData, primary_role: e.target.value })}
                  placeholder="Product Manager"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Product, Engineering, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Seniority</label>
                  <select
                    value={formData.seniority_level}
                    onChange={(e) => setFormData({ ...formData, seniority_level: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm"
                  >
                    {seniorities.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Communication Style</label>
                  <select
                    value={formData.communication_style}
                    onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm"
                  >
                    {comStyles.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingMember ? 'Update' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}