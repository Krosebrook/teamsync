import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, X } from 'lucide-react';

export default function TeamMemberSelector({ roleId, selectedMember, onSelectMember }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const filteredMembers = teamMembers.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (member) => {
    onSelectMember(roleId, member);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelectMember(roleId, null);
  };

  const initials = selectedMember
    ? selectedMember.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()
    : null;

  return (
    <div className="flex items-center gap-2">
      {selectedMember ? (
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded border border-blue-200">
          <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
            {initials}
          </div>
          <span className="text-xs text-blue-700 font-medium truncate max-w-[100px]">
            {selectedMember.full_name}
          </span>
          <button
            onClick={handleClear}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-slate-600 hover:text-blue-600"
            >
              <User className="w-3 h-3 mr-1" />
              Map person
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm mb-2"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">
                  No team members found
                </p>
              ) : (
                filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleSelect(member)}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold">
                      {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-slate-500 truncate">{member.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}