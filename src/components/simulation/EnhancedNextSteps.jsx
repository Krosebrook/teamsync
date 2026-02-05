import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Trash2,
  GitBranch,
  Clock
} from "lucide-react";

const PRIORITY_CONFIG = {
  high: { color: "text-rose-600", bg: "bg-rose-100", label: "High" },
  medium: { color: "text-amber-600", bg: "bg-amber-100", label: "Medium" },
  low: { color: "text-slate-600", bg: "bg-slate-100", label: "Low" },
};

export default function EnhancedNextSteps({ steps = [], onUpdateSteps }) {
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [editingStep, setEditingStep] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleComplete = (index) => {
    const updated = steps.map((step, i) => 
      i === index ? { ...step, completed: !step.completed } : step
    );
    onUpdateSteps(updated);
  };

  const toggleSubtask = (stepIndex, subtaskIndex) => {
    const updated = steps.map((step, i) => {
      if (i === stepIndex) {
        const updatedSubtasks = step.subtasks.map((subtask, si) =>
          si === subtaskIndex ? { ...subtask, completed: !subtask.completed } : subtask
        );
        return { ...step, subtasks: updatedSubtasks };
      }
      return step;
    });
    onUpdateSteps(updated);
  };

  const handleEditStep = (step, index) => {
    setEditingStep({ ...step, index });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingStep) return;
    
    const updated = steps.map((step, i) => 
      i === editingStep.index ? editingStep : step
    );
    onUpdateSteps(updated);
    setEditDialogOpen(false);
    setEditingStep(null);
  };

  const addSubtask = () => {
    if (!editingStep) return;
    
    setEditingStep({
      ...editingStep,
      subtasks: [
        ...(editingStep.subtasks || []),
        { title: '', completed: false }
      ]
    });
  };

  const updateSubtask = (index, value) => {
    if (!editingStep) return;
    
    const updatedSubtasks = editingStep.subtasks.map((subtask, i) =>
      i === index ? { ...subtask, title: value } : subtask
    );
    setEditingStep({ ...editingStep, subtasks: updatedSubtasks });
  };

  const removeSubtask = (index) => {
    if (!editingStep) return;
    
    setEditingStep({
      ...editingStep,
      subtasks: editingStep.subtasks.filter((_, i) => i !== index)
    });
  };

  const getDependencyNames = (dependencies) => {
    if (!dependencies || dependencies.length === 0) return null;
    return dependencies.map(depIndex => {
      const depStep = steps[depIndex];
      return depStep ? depStep.action.substring(0, 30) : 'Unknown';
    });
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(index);
          const hasDetails = (step.subtasks && step.subtasks.length > 0) || step.dependencies?.length > 0 || step.estimated_hours;
          const priorityConfig = PRIORITY_CONFIG[step.priority] || PRIORITY_CONFIG.medium;
          const depNames = getDependencyNames(step.dependencies);

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`p-4 ${step.completed ? 'bg-slate-50' : 'bg-white'}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(index)}
                    className="mt-0.5"
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className={`text-sm font-medium ${step.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {step.action}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${priorityConfig.bg} ${priorityConfig.color} text-xs`}>
                          {priorityConfig.label}
                        </Badge>
                        {step.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {step.confidence}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {step.owner_role && (
                      <p className="text-xs text-slate-500 mb-2">
                        Owner: <span className="font-medium">{step.owner_role.replace(/_/g, ' ')}</span>
                      </p>
                    )}

                    {hasDetails && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                        {step.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimated_hours}h
                          </div>
                        )}
                        {depNames && (
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {depNames.length} dependencies
                          </div>
                        )}
                        {step.subtasks?.length > 0 && (
                          <div>
                            {step.subtasks.filter(s => s.completed).length}/{step.subtasks.length} subtasks
                          </div>
                        )}
                      </div>
                    )}

                    {hasDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(index)}
                        className="h-6 px-2 text-xs -ml-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 mr-1" />
                        ) : (
                          <ChevronRight className="w-3 h-3 mr-1" />
                        )}
                        {isExpanded ? 'Hide' : 'Show'} Details
                      </Button>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pl-4 border-l-2 border-slate-200 space-y-3"
                        >
                          {step.subtasks && step.subtasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-600 mb-2">Subtasks</p>
                              <div className="space-y-1">
                                {step.subtasks.map((subtask, si) => (
                                  <div key={si} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={subtask.completed}
                                      onCheckedChange={() => toggleSubtask(index, si)}
                                      className="h-3 w-3"
                                    />
                                    <span className={`text-xs ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {depNames && (
                            <div>
                              <p className="text-xs font-medium text-slate-600 mb-2">Depends On</p>
                              <div className="space-y-1">
                                {depNames.map((name, i) => (
                                  <div key={i} className="text-xs text-slate-600 pl-2">
                                    • {name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStep(step, index)}
                      className="h-6 px-2 text-xs -ml-2 mt-2"
                    >
                      Edit Details
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task Details</DialogTitle>
          </DialogHeader>

          {editingStep && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estimated Hours</label>
                <Input
                  type="number"
                  value={editingStep.estimated_hours || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, estimated_hours: parseFloat(e.target.value) })}
                  placeholder="e.g., 8"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Subtasks</label>
                  <Button onClick={addSubtask} size="sm" variant="outline" className="gap-1">
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingStep.subtasks?.map((subtask, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={subtask.title}
                        onChange={(e) => updateSubtask(i, e.target.value)}
                        placeholder="Subtask description"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubtask(i)}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}