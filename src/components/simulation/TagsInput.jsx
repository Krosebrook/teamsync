import React, { useState } from 'react';
import { X } from 'lucide-react';

const USE_CASE_SUGGESTIONS = {
  roadmap: ['roadmap', 'q-planning', 'strategy'],
  pre_mortem: ['risk', 'pre-mortem', 'planning'],
  build_buy: ['build-vs-buy', 'vendor', 'make-or-buy'],
  tech_debt: ['tech-debt', 'refactor', 'engineering'],
  hiring: ['hiring', 'headcount', 'team'],
  adr: ['architecture', 'adr', 'technical-decision'],
  migration: ['migration', 'infrastructure', 'platform'],
  post_mortem: ['post-mortem', 'retrospective', 'lessons-learned'],
  pmf_validation: ['pmf', 'market-fit', 'validation'],
  customer_escalation: ['customer', 'escalation', 'crisis'],
};

export default function TagsInput({ tags = [], onChange, useCaseType }) {
  const [input, setInput] = useState('');
  const suggestions = useCaseType ? (USE_CASE_SUGGESTIONS[useCaseType] || []) : [];
  const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 rounded-md min-h-[36px] bg-white focus-within:ring-1 focus-within:ring-slate-400">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags… (Enter or comma to add)' : ''}
          className="flex-1 min-w-[120px] text-xs outline-none bg-transparent placeholder-slate-400 px-1"
        />
      </div>
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unusedSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs text-slate-500 border border-dashed border-slate-300 px-2 py-0.5 rounded-full hover:border-slate-500 hover:text-slate-700 transition-all"
            >
              + #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}