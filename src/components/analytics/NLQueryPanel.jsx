/**
 * NLQueryPanel — natural language query interface over the simulation corpus.
 *
 * Architecture:
 *   1. User types a question (or picks a preset)
 *   2. We aggregate a compact summary of the corpus (no full JSON dump)
 *   3. We send the question + summary to InvokeLLM with a structured response schema
 *   4. The LLM returns: answer text, supporting_data (table rows), chart_data, confidence
 *   5. We render the structured answer with inline visualizations
 *
 * Extension guide:
 *   - Add more preset queries to PRESETS array
 *   - Change `MAX_SIMS_IN_CONTEXT` to include more simulation history in each query
 *   - Add `file_urls` to the LLM call to attach exported PDF reports as additional context
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { MessageSquare, Send, Loader2, Sparkles, Info, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MAX_SIMS_IN_CONTEXT = 50;

const COLORS = ['#8b5cf6','#3b82f6','#06b6d4','#f43f5e','#f59e0b','#10b981','#ec4899','#6366f1'];

const PRESETS = [
  "Which roles are most frequently in conflict?",
  "What decision types produce the most critical tensions?",
  "Which team compositions have the highest average confidence scores?",
  "What environmental factors appear most in high-tension simulations?",
  "Which roles tend to be outliers in recommendations?",
  "What are the most common next steps recommended across all simulations?",
  "Which role pairs have the most friction and in what contexts?",
];

function buildCorpusSummary(simulations, outcomes) {
  const sims = simulations.slice(0, MAX_SIMS_IN_CONTEXT);

  // Role frequency and tension map
  const roleFreq = {};
  const rolePairConflicts = {};
  const useCaseTensions = {};
  const allNextSteps = [];
  let totalTensions = 0;
  let criticalTensions = 0;

  sims.forEach(s => {
    const roles = s.selected_roles?.map(r => r.role) || [];
    roles.forEach(r => { roleFreq[r] = (roleFreq[r] || 0) + 1; });

    s.tensions?.forEach(t => {
      totalTensions++;
      if (t.severity === 'critical') criticalTensions++;
      const pair = [...(t.between || [])].sort().join(' ↔ ');
      rolePairConflicts[pair] = (rolePairConflicts[pair] || 0) + 1;
      const uc = s.use_case_type || 'custom';
      if (!useCaseTensions[uc]) useCaseTensions[uc] = { total: 0, critical: 0 };
      useCaseTensions[uc].total++;
      if (t.severity === 'critical') useCaseTensions[uc].critical++;
    });

    s.next_steps?.forEach(ns => {
      allNextSteps.push({ action: ns.action?.slice(0, 80), owner: ns.owner_role, confidence: ns.confidence });
    });
  });

  return {
    simulation_count: sims.length,
    total_tensions: totalTensions,
    critical_tensions: criticalTensions,
    top_roles_by_frequency: Object.entries(roleFreq).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([r,c])=>({ role: r, count: c })),
    top_conflict_pairs: Object.entries(rolePairConflicts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([pair,count])=>({ pair, count })),
    tension_by_use_case: Object.entries(useCaseTensions).map(([uc, d])=>({ use_case: uc, ...d })).sort((a,b)=>b.total-a.total),
    sample_next_steps: allNextSteps.slice(0, 30),
    outcome_summary: outcomes.slice(0, 30).map(o=>({ outcome: o.actual_outcome, notes: o.outcome_notes?.slice(0, 60) })),
    sim_details: sims.slice(0, 20).map(s => ({
      title: s.title?.slice(0, 60),
      use_case: s.use_case_type,
      roles: s.selected_roles?.map(r => `${r.role}(${r.influence})`),
      tension_count: s.tensions?.length || 0,
      critical_count: s.tensions?.filter(t => t.severity === 'critical').length || 0,
      avg_confidence: s.next_steps?.length
        ? Math.round(s.next_steps.reduce((a, ns) => a + (ns.confidence || 0), 0) / s.next_steps.length) : null,
    })),
  };
}

function AnswerBlock({ answer }) {
  if (!answer) return null;
  const hasChart = answer.chart_data?.length > 0;
  const hasTable = answer.supporting_data?.length > 0;

  return (
    <div className="space-y-4">
      {/* Confidence */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${answer.confidence >= 70 ? 'bg-emerald-500' : answer.confidence >= 40 ? 'bg-amber-500' : 'bg-rose-400'}`}
            style={{ width: `${answer.confidence || 0}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 flex-shrink-0">
          {answer.confidence}% confidence
        </span>
      </div>

      {/* Main answer */}
      <div className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed">
        <ReactMarkdown>{answer.answer}</ReactMarkdown>
      </div>

      {/* Chart */}
      {hasChart && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">{answer.chart_title || 'Supporting Data'}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={answer.chart_data} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" name={answer.chart_metric || 'Count'} radius={[3, 3, 0, 0]}>
                {answer.chart_data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {hasTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {Object.keys(answer.supporting_data[0]).map(k => (
                  <th key={k} className="text-left px-3 py-2 text-slate-500 font-medium capitalize">
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answer.supporting_data.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Key insights */}
      {answer.key_insights?.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {answer.key_insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <ChevronRight className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NLQueryPanel({ simulations, outcomes }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  const corpusSummary = useMemo(() => buildCorpusSummary(simulations, outcomes), [simulations, outcomes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const ask = async (q) => {
    const question = (q || query).trim();
    if (!question) return;

    setHistory(h => [...h, { role: 'user', content: question }]);
    setQuery('');
    setLoading(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert analyst for a team decision simulation platform. Answer the user's question using ONLY the data provided in the corpus summary below. Be specific, cite numbers, and identify patterns.

USER QUESTION: "${question}"

CORPUS SUMMARY (${corpusSummary.simulation_count} simulations):
${JSON.stringify(corpusSummary, null, 2)}

Instructions:
- Answer directly and concisely using markdown
- If the question asks "which roles", rank them with counts
- If the question asks "what patterns", describe frequency and context
- Include a confidence score based on how much relevant data exists
- If you can produce a chart (bar chart showing ranks/counts), populate chart_data
- If you can produce a table with ranked results, populate supporting_data (array of objects with consistent keys)
- Provide 2-3 key insights as bullet points`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string", description: "Markdown-formatted direct answer to the question" },
            confidence: { type: "number", description: "0-100 confidence based on available data" },
            chart_title: { type: "string" },
            chart_metric: { type: "string" },
            chart_data: {
              type: "array",
              items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } } },
              description: "Bar chart data if applicable, max 10 items"
            },
            supporting_data: {
              type: "array",
              items: { type: "object" },
              description: "Table data with consistent keys across rows, max 10 rows"
            },
            key_insights: {
              type: "array",
              items: { type: "string" },
              description: "2-3 key insight bullet points"
            }
          }
        }
      });

      setHistory(h => [...h, { role: 'assistant', content: result }]);
    } catch (e) {
      toast.error('Query failed');
      setHistory(h => h.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-lg">
        <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-violet-700">
          <span className="font-semibold">Natural language queries</span> over your simulation corpus ({corpusSummary.simulation_count} simulations, {corpusSummary.total_tensions} tensions). Ask anything about patterns, roles, conflicts, or outcomes.
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => ask(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <Card className="p-0 overflow-hidden">
        <div className="min-h-[300px] max-h-[600px] overflow-y-auto p-5 space-y-6 bg-slate-50">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium text-sm">Ask a question about your simulation data</p>
              <p className="text-slate-400 text-xs mt-1">Use the presets above or type your own question</p>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="bg-slate-800 text-white rounded-2xl px-4 py-2.5 text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <AnswerBlock answer={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                <span className="text-xs text-slate-500">Analyzing corpus…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your simulations…"
            className="text-sm"
            disabled={loading}
          />
          <Button
            onClick={() => ask()}
            disabled={loading || !query.trim()}
            size="icon"
            className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}