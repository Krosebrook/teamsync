import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SIGNAL_COLORS = {
  good: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  warn: 'text-amber-700 bg-amber-50 border-amber-200',
  bad: 'text-rose-700 bg-rose-50 border-rose-200',
};

function SignalBar({ label, score }) {
  // score: 0-10
  const pct = Math.min(100, Math.round((score / 10) * 100));
  const color = score >= 7 ? 'bg-emerald-400' : score >= 4 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span className="font-medium">{score}/10</span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LiveCoachOverlay({ text, userRole, scenario, dialogueSoFar, active }) {
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const lastAnalyzed = useRef('');

  useEffect(() => {
    if (!active || !text || text.length < 30) {
      setCoaching(null);
      return;
    }
    // Debounce: only analyze after 1.8s pause in typing
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text === lastAnalyzed.current) return;
      lastAnalyzed.current = text;
      setLoading(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a real-time decision-making coach. Analyze this DRAFT response from the user playing the role of "${userRole}" in a meeting.

SCENARIO: ${scenario}

RECENT DIALOGUE:
${dialogueSoFar.slice(-4).map(t => `${t.role}: ${t.dialogue}`).join('\n')}

USER'S DRAFT: "${text}"

Score the draft on 3 dimensions (0–10 each):
- clarity: Is the position clear and specific?
- stakeholder_awareness: Does it acknowledge other roles' concerns?
- bias_check: Is it free of overconfident, dismissive, or siloed thinking? (10 = no bias detected)

Also provide:
- live_tip: One short (max 15 words) concrete suggestion to improve RIGHT NOW
- bias_flag: null, or briefly name the bias detected (e.g. "confirmation bias", "authority bias")`,
          response_json_schema: {
            type: "object",
            properties: {
              clarity: { type: "number" },
              stakeholder_awareness: { type: "number" },
              bias_check: { type: "number" },
              live_tip: { type: "string" },
              bias_flag: { type: "string" }
            }
          }
        });
        setCoaching(result);
      } catch (_) { /* silently fail */ }
      setLoading(false);
    }, 1800);
    return () => clearTimeout(debounceRef.current);
  }, [text, active]);

  if (!active) return null;

  return (
    <AnimatePresence>
      {(loading || coaching) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 space-y-2"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
            <Brain className="w-3.5 h-3.5" />
            Live Coach
            {loading && <Loader2 className="w-3 h-3 animate-spin ml-auto text-violet-500" />}
          </div>

          {coaching && !loading && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <SignalBar label="Clarity" score={coaching.clarity ?? 0} />
                <SignalBar label="Awareness" score={coaching.stakeholder_awareness ?? 0} />
                <SignalBar label="Bias-free" score={coaching.bias_check ?? 0} />
              </div>

              {coaching.bias_flag && (
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${SIGNAL_COLORS.warn}`}>
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Possible bias: <span className="font-semibold">{coaching.bias_flag}</span>
                </div>
              )}

              {coaching.live_tip && (
                <div className="flex items-start gap-1.5 text-xs text-violet-800">
                  <Eye className="w-3 h-3 shrink-0 mt-0.5 text-violet-500" />
                  <span>{coaching.live_tip}</span>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}