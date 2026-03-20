import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const STATUS_CHIPS = ['all', 'draft', 'running', 'completed'];
const STATUS_LABELS = { all: 'All', draft: 'Draft', running: 'Running', completed: 'Completed' };

const USE_CASE_LABELS = {
  pre_mortem: 'Pre-Mortem', roadmap: 'Roadmap', adr: 'Architecture',
  pmf_validation: 'PMF', tech_debt: 'Tech Debt', post_mortem: 'Post-Mortem',
  hiring: 'Hiring', build_buy: 'Build/Buy', migration: 'Migration',
  customer_escalation: 'Customer', custom: 'Custom',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'tensions', label: 'Most tensions' },
  { value: 'alpha', label: 'Alphabetical' },
];

export default function SimulationSearchFilter({ simulations = [], filters, onChange }) {
  const { search, status, useCase, sort } = filters;

  // Build use case counts
  const useCaseCounts = simulations.reduce((acc, s) => {
    if (s.use_case_type) acc[s.use_case_type] = (acc[s.use_case_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input
          value={search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Search simulations..."
          className="pl-8 h-8 text-xs border-slate-200"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_CHIPS.map(s => (
          <button
            key={s}
            onClick={() => onChange({ ...filters, status: s })}
            className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-all ${
              status === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Use case + sort */}
      <div className="flex gap-2">
        <Select value={useCase} onValueChange={v => onChange({ ...filters, useCase: v })}>
          <SelectTrigger className="h-7 text-xs flex-1 border-slate-200">
            <SelectValue placeholder="Use case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All use cases</SelectItem>
            {Object.entries(useCaseCounts).map(([uc, count]) => (
              <SelectItem key={uc} value={uc}>
                {USE_CASE_LABELS[uc] || uc} ({count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={v => onChange({ ...filters, sort: v })}>
          <SelectTrigger className="h-7 text-xs flex-1 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function applyFilters(simulations, filters) {
  let result = [...simulations];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(s =>
      s.title?.toLowerCase().includes(q) || s.scenario?.toLowerCase().includes(q)
    );
  }
  if (filters.status && filters.status !== 'all') {
    result = result.filter(s => s.status === filters.status);
  }
  if (filters.useCase && filters.useCase !== 'all') {
    result = result.filter(s => s.use_case_type === filters.useCase);
  }

  switch (filters.sort) {
    case 'oldest':
      result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      break;
    case 'tensions':
      result.sort((a, b) => (b.tensions?.length || 0) - (a.tensions?.length || 0));
      break;
    case 'alpha':
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    default: // newest
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  return result;
}