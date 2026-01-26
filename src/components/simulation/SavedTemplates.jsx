import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  FileText, 
  Sparkles, 
  User, 
  Trash2, 
  Play,
  TrendingUp,
  Edit2
} from "lucide-react";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SavedTemplates({ open, onOpenChange, onApplyTemplate, onEditTemplate }) {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.SimulationTemplate.list('-created_date', 50),
    enabled: open
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SimulationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SimulationTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleApply = async (template) => {
    // Increment use count
    await updateMutation.mutateAsync({
      id: template.id,
      data: { use_count: (template.use_count || 0) + 1 }
    });

    onApplyTemplate({
      title: template.name,
      scenario: template.scenario_template,
      roles: template.suggested_roles || []
    });
    onOpenChange(false);
  };

  const aiGenerated = templates.filter(t => t.is_ai_generated);
  const userCreated = templates.filter(t => !t.is_ai_generated);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Saved Templates ({templates.length})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="mt-4">
          <TabsList>
            <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
            <TabsTrigger value="ai">AI Generated ({aiGenerated.length})</TabsTrigger>
            <TabsTrigger value="user">User Created ({userCreated.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TemplateList 
              templates={templates} 
              onApply={handleApply}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={onEditTemplate}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <TemplateList 
              templates={aiGenerated} 
              onApply={handleApply}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={onEditTemplate}
            />
          </TabsContent>

          <TabsContent value="user" className="mt-4">
            <TemplateList 
              templates={userCreated} 
              onApply={handleApply}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={onEditTemplate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TemplateList({ templates, onApply, onDelete, onEdit }) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No templates found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {templates.map((template) => (
        <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-slate-800">{template.name}</h3>
                {template.is_ai_generated && (
                  <Sparkles className="w-3 h-3 text-violet-500" />
                )}
                {template.use_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {template.use_count} uses
                  </Badge>
                )}
              </div>
              
              {template.description && (
                <p className="text-sm text-slate-600 mb-2">{template.description}</p>
              )}

              <div className="flex gap-2 mb-2">
                {template.industry && (
                  <Badge variant="outline" className="text-xs">{template.industry}</Badge>
                )}
                {template.goal && (
                  <Badge variant="outline" className="text-xs">{template.goal}</Badge>
                )}
                {template.suggested_roles && (
                  <Badge variant="outline" className="text-xs">
                    {template.suggested_roles.length} roles
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mt-2">
                {template.scenario_template}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => onApply(template)}
                className="gap-2 h-8"
              >
                <Play className="w-3 h-3" />
                Use
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
                className="gap-2 h-8"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(template.id)}
                className="gap-2 h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}