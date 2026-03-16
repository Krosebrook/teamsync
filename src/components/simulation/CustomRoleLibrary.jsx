import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, Edit2, Trash2, User, ChevronDown, ChevronRight,
  Zap, Search, BookOpen, GripVertical, CheckCircle2, Star
} from "lucide-react";
import CustomRoleDialog from './CustomRoleDialog';

const COLOR_CLASSES = {
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  lime: "bg-lime-100 text-lime-700 border-lime-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const DOT_CLASSES = {
  violet: "bg-violet-500", blue: "bg-blue-500", cyan: "bg-cyan-500",
  rose: "bg-rose-500", amber: "bg-amber-500", slate: "bg-slate-500",
  pink: "bg-pink-500", emerald: "bg-emerald-500", orange: "bg-orange-500",
  indigo: "bg-indigo-500", purple: "bg-purple-500", lime: "bg-lime-500",
  teal: "bg-teal-500", fuchsia: "bg-fuchsia-500",
};

function RoleLibraryCard({ role, isAdded, onAdd, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = COLOR_CLASSES[role.color] || COLOR_CLASSES.slate;
  const dotClass = DOT_CLASSES[role.color] || DOT_CLASSES.slate;

  const hasTraits = (role.strengths?.length > 0) || (role.weaknesses?.length > 0) ||
    role.communication_style || (role.typical_motivations?.length > 0) || role.backstory;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl overflow-hidden bg-white transition-shadow ${isAdded ? 'border-violet-300 shadow-sm' : 'border-slate-200'}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{role.name}</p>
            {isAdded && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 truncate">{role.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="outline" className="text-[10px] px-1.5">
            {role.default_influence || 5}/10
          </Badge>
          {hasTraits && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded traits */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3 border-t border-slate-100 pt-3">
              {role.backstory && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Backstory</p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">{role.backstory}</p>
                </div>
              )}
              {role.communication_style && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Communication Style</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{role.communication_style}</p>
                </div>
              )}
              {role.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Strengths</p>
                  <div className="flex flex-wrap gap-1">
                    {role.strengths.map((s, i) => (
                      <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {role.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Blind Spots</p>
                  <div className="flex flex-wrap gap-1">
                    {role.weaknesses.map((w, i) => (
                      <span key={i} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {role.typical_motivations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Motivations</p>
                  <div className="flex flex-wrap gap-1">
                    {role.typical_motivations.map((m, i) => (
                      <span key={i} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Button
          size="sm"
          variant={isAdded ? "secondary" : "default"}
          className={`flex-1 h-7 text-xs gap-1.5 ${isAdded ? '' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
          onClick={() => onAdd(role)}
          disabled={isAdded}
        >
          {isAdded ? (
            <><CheckCircle2 className="w-3 h-3" /> Added</>
          ) : (
            <><Plus className="w-3 h-3" /> Add to Simulation</>
          )}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(role)}>
          <Edit2 className="w-3 h-3 text-slate-400 hover:text-slate-700" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(role.id)}>
          <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function CustomRoleLibrary({ open, onClose, selectedRoles, onAddRole }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: customRoles = [] } = useQuery({
    queryKey: ['customRoles'],
    queryFn: () => base44.entities.CustomRole.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role saved to library');
      setCreateOpen(false);
      setEditingRole(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Role updated');
      setCreateOpen(false);
      setEditingRole(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Role removed from library');
    },
  });

  const handleSave = (data) => {
    if (data.id) {
      updateMutation.mutate({ id: data.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setCreateOpen(true);
  };

  const handleAdd = (role) => {
    const roleId = `custom_${role.id}`;
    const alreadyAdded = selectedRoles?.find(r => r.role === roleId);
    if (alreadyAdded) { toast.info(`${role.name} is already in this simulation`); return; }
    onAddRole({ id: roleId, name: role.name, defaultInfluence: role.default_influence || 5 });
    toast.success(`${role.name} added to simulation`);
  };

  const isAdded = (role) => !!selectedRoles?.find(r => r.role === `custom_${role.id}`);

  const filtered = customRoles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-violet-600" />
              Custom Role Library
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved roles with unique traits, backstories, and communication styles. Click to add to any simulation.
            </p>
          </DialogHeader>

          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => { setEditingRole(null); setCreateOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" /> New Role
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5">
              {customRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No custom roles yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Create your first custom role with unique traits, backstory, and communication style
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => { setEditingRole(null); setCreateOpen(true); }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Role
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No roles match your search</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">{filtered.length} role{filtered.length !== 1 ? 's' : ''} in library</p>
                  {filtered.map(role => (
                    <RoleLibraryCard
                      key={role.id}
                      role={role}
                      isAdded={isAdded(role)}
                      onAdd={handleAdd}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-5 py-3 border-t border-slate-200 flex justify-end flex-shrink-0 bg-white">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CustomRoleDialog
        open={createOpen}
        onOpenChange={(v) => { if (!v) { setCreateOpen(false); setEditingRole(null); } }}
        onSave={handleSave}
        editRole={editingRole}
      />
    </>
  );
}