import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function AICoach({ scenario, selectedRoles, phase = 'setup' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (phase === 'setup' && scenario && scenario.length > 50) {
      const timer = setTimeout(() => {
        fetchSuggestions();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scenario, selectedRoles]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('aiDecisionCoach', {
        scenario,
        selected_roles: selectedRoles,
        phase
      });
      setSuggestions(result.data.suggestions || []);
    } catch (error) {
      console.error('AI Coach error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-3 border border-violet-200 bg-violet-50">
        <div className="flex items-center gap-2 text-xs text-violet-600">
          <Sparkles className="w-3 h-3 animate-pulse" />
          Analyzing scenario...
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="p-3 border border-violet-200 bg-violet-50 space-y-2"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-3 h-3 text-violet-600" />
          <span className="text-xs font-medium text-violet-900">AI Suggestions</span>
        </div>
        
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="text-xs text-violet-700 leading-relaxed">
            <Badge variant="outline" className="text-[10px] h-4 mb-1 bg-white">
              {suggestion.type}
            </Badge>
            <p>{suggestion.message}</p>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}