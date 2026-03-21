import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus, Edit2, Trash2, ArrowLeft, Search, Users,
  Mail, Briefcase, BarChart2, Star
} from 'lucide-react';
import { toast } from 'sonner';

const SENIORITIES = ['junior', 'mid', 'senior', 'executive'];
const COM_STYLES = ['direct', 'diplomatic', 'analytical', 'collaborative', 'assertive'];
const AVAILABILITIES = ['available', 'limited', 'unavailable'];
const PROFICIENCIES = ['beginner', 'intermediate', 'advanced', 'expert'];

const AVAIL_STYLES = {
  available: 'bg-green-100 text-green-700 border-green-200',
  limited: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
};

const SENIORITY_STYLES = {
  junior: 'bg-slate-100 text-slate-600',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-violet-100 text-violet-700',
  executive: 'bg-amber-100 text-amber-700',
};

const PROFICIENCY_STYLES = {
  beginner: 'bg-slate-100 text-slate-600',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-violet-100 text-violet-700',
  expert: 'bg-emerald-100 text-emerald-700',
};

function initials(name) {
  return (name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ScoreBar({ label, value, color = 'bg-blue-500' }) {
  if (value == null) return null;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-medium text-slate-700">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TagInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <Label className="text-xs mb-1 block">{label}</Label>
      <div className="flex gap-1 flex-wrap mb-1.5">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
            {v}
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          className="h-7 text-xs"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  full_name: '', email: '', primary_role: '', department: '',
  seniority_level: 'mid', communication_style: 'collaborative',
  availability: 'available', key_skills: [], personality_traits: [],
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [detailMember, setDetailMember] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list('-updated_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setFormOpen(false);
      setForm(EMPTY_FORM);
      toast.success('Member added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setFormOpen(false);
      setEditingMember(null);
      setDetailMember(updated);
      toast.success('Member updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setDetailMember(null);
      toast.success('Member deleted');
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.full_name?.toLowerCase().includes(q) ||
      m.primary_role?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const openAdd = () => { setEditingMember(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (m) => { setEditingMember(m); setForm({ ...EMPTY_FORM, ...m }); setFormOpen(true); };

  const handleSave = () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.primary_role.trim()) {
      toast.error('Full name, email, and primary role are required');
      return;
    }
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // — Detail view —
  if (detailMember) {
    const m = members.find(x => x.id === detailMember.id) || detailMember;
    const hp = m.historical_performance || {};
    const pastSimCount = hp.past_simulations?.length || 0;

    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setDetailMember(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to team
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {initials(m.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900">{m.full_name}</h2>
                <p className="text-sm text-slate-500">{m.primary_role}{m.department ? ` · ${m.department}` : ''}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.seniority_level && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENIORITY_STYLES[m.seniority_level] || 'bg-slate-100 text-slate-600'}`}>
                      {m.seniority_level}
                    </span>
                  )}
                  {m.availability && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${AVAIL_STYLES[m.availability] || ''}`}>
                      {m.availability}
                    </span>
                  )}
                  {m.communication_style && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.communication_style}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(m)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(m.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="w-4 h-4" />
              <span>{m.email}</span>
            </div>

            {/* Performance */}
            {(hp.decision_quality_score != null || hp.collaboration_score != null || hp.risk_tolerance || hp.conflict_resolution_style) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Performance</h3>
                <div className="space-y-3">
                  <ScoreBar label="Decision Quality" value={hp.decision_quality_score} color="bg-blue-500" />
                  <ScoreBar label="Collaboration" value={hp.collaboration_score} color="bg-emerald-500" />
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {hp.risk_tolerance && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">risk: {hp.risk_tolerance}</span>
                  )}
                  {hp.conflict_resolution_style && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{hp.conflict_resolution_style}</span>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {m.key_skills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Key Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {m.key_skills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality traits */}
            {m.personality_traits?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Personality Traits</h3>
                <div className="flex flex-wrap gap-1.5">
                  {m.personality_traits.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Domain expertise */}
            {m.domain_expertise_detailed?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Domain Expertise</h3>
                <div className="space-y-1.5">
                  {m.domain_expertise_detailed.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{d.area}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROFICIENCY_STYLES[d.proficiency_level] || 'bg-slate-100 text-slate-600'}`}>
                        {d.proficiency_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulations count */}
            {pastSimCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500 border-t pt-4">
                <BarChart2 className="w-4 h-4" />
                <span>{pastSimCount} past simulation{pastSimCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit dialog reuse */}
        <MemberFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          form={form}
          setForm={setForm}
          editingMember={editingMember}
          onSave={handleSave}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  // — List view —
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Team</h1>
            <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, role or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">No team members yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Add your team to map real people to simulation roles.</p>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Add first member
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No members match "{search}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(m => (
              <div
                key={m.id}
                onClick={() => setDetailMember(m)}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials(m.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{m.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{m.primary_role}</p>
                  </div>
                </div>

                {m.department && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <Briefcase className="w-3 h-3" />
                    {m.department}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {m.seniority_level && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENIORITY_STYLES[m.seniority_level] || 'bg-slate-100 text-slate-600'}`}>
                      {m.seniority_level}
                    </span>
                  )}
                  {m.availability && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${AVAIL_STYLES[m.availability] || ''}`}>
                      {m.availability}
                    </span>
                  )}
                  {m.communication_style && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      {m.communication_style}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MemberFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingMember(null); }}
        form={form}
        setForm={setForm}
        editingMember={editingMember}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function MemberFormDialog({ open, onClose, form, setForm, editingMember, onSave, isPending }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMember ? 'Edit Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Required */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Full Name *</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Email *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Primary Role *</Label>
              <Input value={form.primary_role} onChange={e => set('primary_role', e.target.value)} placeholder="Product Manager" />
            </div>
          </div>

          {/* Optional */}
          <div>
            <Label className="text-xs mb-1 block">Department</Label>
            <Input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Product, Engineering…" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Seniority</Label>
              <select value={form.seniority_level} onChange={e => set('seniority_level', e.target.value)}
                className="w-full h-9 px-2 border border-input rounded-md text-sm bg-background">
                {SENIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Comm. Style</Label>
              <select value={form.communication_style} onChange={e => set('communication_style', e.target.value)}
                className="w-full h-9 px-2 border border-input rounded-md text-sm bg-background">
                {COM_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Availability</Label>
              <select value={form.availability} onChange={e => set('availability', e.target.value)}
                className="w-full h-9 px-2 border border-input rounded-md text-sm bg-background">
                {AVAILABILITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <TagInput
            label="Key Skills"
            values={form.key_skills || []}
            onChange={v => set('key_skills', v)}
            placeholder="e.g. React, data analysis…"
          />

          <TagInput
            label="Personality Traits"
            values={form.personality_traits || []}
            onChange={v => set('personality_traits', v)}
            placeholder="e.g. analytical, empathetic…"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? 'Saving…' : editingMember ? 'Update' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}