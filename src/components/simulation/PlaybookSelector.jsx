import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Search, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { toast } from 'sonner';

export default function PlaybookSelector({ open, onClose, onSelect, onEdit }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playbooks = [], refetch } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => base44.entities.DecisionPlaybook.list(),
    enabled: open
  });

  const filteredPlaybooks = playbooks.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this playbook?')) return;
    
    try {
      await base44.entities.DecisionPlaybook.delete(id);
      toast.success('Playbook deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete playbook');
    }
  };

  const handleEdit = (playbook, e) => {
    e.stopPropagation();
    onEdit(playbook);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Select a Playbook
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search playbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredPlaybooks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No playbooks found</p>
                <p className="text-sm">Generate one from a completed simulation</p>
              </div>
            ) : (
              filteredPlaybooks.map((playbook) => (
                <Card
                  key={playbook.id}
                  className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                  onClick={() => {
                    onSelect(playbook);
                    onClose();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">
                          {playbook.name}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {playbook.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {playbook.framework}
                          </Badge>
                          {playbook.required_roles?.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {playbook.required_roles.length} roles
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleEdit(playbook, e)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleDelete(playbook.id, e)}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                        </Button>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}