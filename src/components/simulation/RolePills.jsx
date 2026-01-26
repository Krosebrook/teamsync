import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export default function RolePills({ selectedRoles, onRolesChange, allRoles }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedRoles);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onRolesChange(items);
  };

  const handleRemoveRole = (roleId) => {
    onRolesChange(selectedRoles.filter(r => r.role !== roleId));
  };

  const handleAddRole = (role) => {
    const exists = selectedRoles.find(r => r.role === role.id);
    if (exists) return;
    
    onRolesChange([...selectedRoles, { 
      role: role.id, 
      influence: role.defaultInfluence || 5 
    }]);
    setPopoverOpen(false);
    setSearchQuery('');
  };

  const handleUpdateInfluence = (roleId, newInfluence) => {
    onRolesChange(selectedRoles.map(r => 
      r.role === roleId ? { ...r, influence: newInfluence } : r
    ));
  };

  const getRoleData = (roleId) => allRoles?.find(r => r.id === roleId);

  const filteredAvailableRoles = allRoles?.filter(r => 
    !selectedRoles.find(sr => sr.role === r.id) &&
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Participants
        </span>
        <Badge variant="outline" className="text-xs font-normal">
          {selectedRoles.length} selected
        </Badge>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="roles">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1"
            >
              {selectedRoles.map((selectedRole, index) => {
                const roleData = getRoleData(selectedRole.role);
                if (!roleData) return null;

                return (
                  <Draggable key={selectedRole.role} draggableId={selectedRole.role} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          group flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-200 
                          ${snapshot.isDragging ? 'shadow-md' : 'hover:border-slate-300'}
                          transition-all
                        `}
                      >
                        <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500">
                          <GripVertical className="w-3 h-3" />
                        </div>
                        
                        <span className="flex-1 text-sm text-slate-700 font-medium">
                          {roleData.name}
                        </span>

                        <Input
                          type="number"
                          value={selectedRole.influence}
                          onChange={(e) => handleUpdateInfluence(selectedRole.role, parseInt(e.target.value) || 1)}
                          className="w-12 h-6 text-xs text-center border-slate-200 px-1"
                          min="1"
                          max="10"
                        />

                        <button
                          onClick={() => handleRemoveRole(selectedRole.role)}
                          className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 h-8 border-dashed text-slate-600"
          >
            <Plus className="w-3 h-3" />
            Add role
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm mb-2"
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredAvailableRoles.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                No roles found
              </div>
            ) : (
              filteredAvailableRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleAddRole(role)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 rounded transition-colors"
                >
                  {role.name}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}