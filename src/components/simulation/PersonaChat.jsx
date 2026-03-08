import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  X, Send, ChevronDown, ChevronUp, MessageSquare, User,
  Sparkles, Loader2, AlertCircle, Clock, Scale, Lightbulb,
  HelpCircle, BookOpen, RefreshCw, Copy, Check
} from "lucide-react";
import { ROLES } from './RoleSelector';

const QUESTION_TEMPLATES = [
  { label: "Why this stance?",    text: "What was the core reason behind your position in this discussion?" },
  { label: "Key trade-offs",      text: "What trade-offs did you consider most important, and why?" },
  { label: "What influenced you?",text: "What information or factors most influenced your decision?" },
  { label: "Biggest concern",     text: "What was your biggest concern that others seemed to overlook?" },
  { label: "Alternative path",    text: "How would you have acted differently if the main constraint was removed?" },
  { label: "Agree with who?",     text: "Which other role did you find yourself most aligned with, and why?" },
  { label: "Hidden agenda",       text: "Were there any unstated priorities or motivations shaping your view?" },
  { label: "Change your mind?",   text: "What would it take to change your position on this decision?" },
];

function getRoleDisplayName(roleId, allRoles) {
  const found = allRoles?.find(r => r.id === roleId);
  return found?.name || roleId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || roleId;
}

function getRoleColor(roleId) {
  const palette = [
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
  ];
  let hash = 0;
  for (let c of (roleId || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[hash % palette.length];
}

function ConfidenceDot({ score }) {
  const color = score >= 80 ? 'bg-emerald-400' : score >= 55 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {score}% confidence
    </span>
  );
}

function MessageBubble({ msg, allRoles }) {
  const [copied, setCopied] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.fullText || msg.summary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-slate-800 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {msg.text}
        </div>
      </div>
    );
  }

  // Structured persona response
  return (
    <div className="flex gap-2.5 items-start">
      <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${getRoleColor(msg.personaId)}`}>
        {getRoleDisplayName(msg.personaId, allRoles).slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            {getRoleDisplayName(msg.personaId, allRoles)}
          </span>
          {msg.confidence != null && <ConfidenceDot score={msg.confidence} />}
          {msg.loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </div>

        {msg.loading ? (
          <div className="text-xs text-slate-400 italic">Thinking in character...</div>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed shadow-sm">
              {msg.summary}
            </div>

            {(msg.rationale || msg.evidence || msg.alternatives) && (
              <div>
                <button
                  onClick={() => setShowDetail(d => !d)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors mt-1"
                >
                  {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showDetail ? 'Hide details' : 'Show rationale & evidence'}
                </button>

                {showDetail && (
                  <div className="space-y-2 mt-2">
                    {msg.rationale && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Scale className="w-3 h-3" /> Rationale
                        </p>
                        <p className="text-xs text-slate-700">{msg.rationale}</p>
                      </div>
                    )}
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Evidence
                        </p>
                        <ul className="space-y-1">
                          {msg.evidence.map((e, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-blue-400 mt-0.5">▪</span>{e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {msg.alternatives && (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Alternatives Considered
                        </p>
                        <p className="text-xs text-slate-700">{msg.alternatives}</p>
                      </div>
                    )}
                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Suggested Follow-ups
                        </p>
                        <ul className="space-y-0.5">
                          {msg.followUps.map((f, i) => (
                            <li key={i} className="text-xs text-slate-500 flex items-start gap-1">
                              <span className="text-slate-300 mt-0.5">→</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={copy} className="text-[10px] text-slate-300 hover:text-slate-500 flex items-center gap-1 transition-colors">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PersonaChat({ simulation, allRoles, open, onClose, onTranscriptsChange }) {
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [messages, setMessages] = useState({});  // keyed by personaId
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const personas = simulation?.responses?.map(r => r.role) || [];
  const activePersonaId = selectedPersonaId || personas[0] || null;
  const activeMessages = messages[activePersonaId] || [];

  useEffect(() => {
    if (open && personas.length > 0 && !selectedPersonaId) {
      setSelectedPersonaId(personas[0]);
    }
  }, [open, personas.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, loading]);

  const activeResponse = simulation?.responses?.find(r => r.role === activePersonaId);

  const buildSystemPrompt = () => {
    const roleDisplay = getRoleDisplayName(activePersonaId, allRoles);
    const resp = activeResponse;

    return `You are roleplaying as the ${roleDisplay} persona from a completed team decision simulation.

SIMULATION CONTEXT:
- Scenario: ${simulation?.scenario || 'Not available'}
- Your position: ${resp?.position || 'Not recorded'}
- Your recommendation: ${resp?.recommendation || 'Not recorded'}
- Your primary driver: ${resp?.primary_driver || 'Not recorded'}
- Your stated concerns: ${resp?.concerns?.join('; ') || 'None recorded'}
- Your risk tolerance: ${resp?.risk_tolerance || 'Not specified'}

TEAM SUMMARY: ${simulation?.summary?.slice(0, 500) || 'Not available'}

KEY TENSIONS (involving you or your team): ${simulation?.tensions?.filter(t => t.between?.includes(activePersonaId)).map(t => t.description).join('; ') || 'None directly involving you'}

RULES:
1. Always respond IN CHARACTER as the ${roleDisplay}.
2. Base ALL claims on the simulation data above. If something is not in your data, say clearly: "I don't have evidence for that in the simulation."
3. Be candid about motivations, concerns, and trade-offs.
4. Do NOT invent facts not present in the simulation data.
5. Structure your response as JSON with these fields:
   - summary: 1-2 sentence in-character answer
   - rationale: deeper explanation of your thinking (2-4 sentences)
   - evidence: array of 1-3 strings citing specific simulation facts
   - alternatives: what other path you considered (1-2 sentences, or null)
   - follow_ups: array of 2 suggested follow-up questions the user could ask
   - confidence: integer 0-100 reflecting how certain you are (based on how much simulation data supports your answer)`;
  };

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || !activePersonaId || loading) return;

    setInput('');
    setLoading(true);

    const userMsg = { role: 'user', text: msgText, id: Date.now() };
    const loadingMsg = { role: 'persona', personaId: activePersonaId, loading: true, id: Date.now() + 1 };

    setMessages(prev => ({
      ...prev,
      [activePersonaId]: [...(prev[activePersonaId] || []), userMsg, loadingMsg],
    }));

    try {
      const history = (messages[activePersonaId] || [])
        .filter(m => !m.loading)
        .slice(-6)
        .map(m => m.role === 'user'
          ? `User: ${m.text}`
          : `${getRoleDisplayName(m.personaId, allRoles)}: ${m.summary}`
        ).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${buildSystemPrompt()}

CONVERSATION HISTORY:
${history || '(first message)'}

USER QUESTION: ${msgText}

Respond as the ${getRoleDisplayName(activePersonaId, allRoles)} persona with a JSON object.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary:     { type: "string" },
            rationale:   { type: "string" },
            evidence:    { type: "array", items: { type: "string" } },
            alternatives:{ type: "string" },
            follow_ups:  { type: "array", items: { type: "string" } },
            confidence:  { type: "number" },
          }
        }
      });

      const personaMsg = {
        role: 'persona',
        personaId: activePersonaId,
        id: Date.now() + 2,
        summary:     result.summary || '(No response)',
        rationale:   result.rationale,
        evidence:    result.evidence,
        alternatives:result.alternatives,
        followUps:   result.follow_ups,
        confidence:  result.confidence,
        fullText:    result.summary,
      };

      setMessages(prev => ({
        ...prev,
        [activePersonaId]: [
          ...(prev[activePersonaId] || []).filter(m => !m.loading),
          personaMsg,
        ],
      }));
    } catch (err) {
      setMessages(prev => ({
        ...prev,
        [activePersonaId]: (prev[activePersonaId] || []).filter(m => !m.loading),
      }));
      toast.error('Failed to get persona response');
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages(prev => ({ ...prev, [activePersonaId]: [] }));
  };

  if (!open) return null;

  return (
    <div className="flex flex-col h-full border-l border-slate-200 bg-white w-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-800">Persona Interview</span>
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {personas.length} roles
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!simulation || personas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">No simulation data</p>
          <p className="text-xs text-slate-400">Run a simulation first to interview the personas that participated.</p>
        </div>
      ) : (
        <>
          {/* Persona Selector */}
          <div className="shrink-0 px-3 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto">
            {personas.map(pId => {
              const colorCls = getRoleColor(pId);
              const isActive = pId === activePersonaId;
              return (
                <button
                  key={pId}
                  onClick={() => setSelectedPersonaId(pId)}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                    isActive
                      ? colorCls + ' shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <User className="w-3 h-3" />
                  {getRoleDisplayName(pId, allRoles)}
                </button>
              );
            })}
          </div>

          {/* Active persona context strip */}
          {activeResponse && (
            <div className="shrink-0 px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                <span className="font-semibold text-slate-600">Stance: </span>
                {activeResponse.position}
              </p>
              {activeResponse.primary_driver && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <span className="font-medium">Driver: </span>{activeResponse.primary_driver}
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-base font-bold ${getRoleColor(activePersonaId)}`}>
                  {getRoleDisplayName(activePersonaId, allRoles).slice(0, 2).toUpperCase()}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-700">
                    Interview the {getRoleDisplayName(activePersonaId, allRoles)}
                  </p>
                  <p className="text-xs text-slate-400 max-w-[200px]">
                    Ask about their decision logic, motivations, trade-offs, and what they'd do differently.
                  </p>
                </div>
                {/* Quick-start templates */}
                <div className="w-full space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide text-center">Quick questions</p>
                  {QUESTION_TEMPLATES.slice(0, 4).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeMessages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} allRoles={allRoles} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick templates (compact, only when messages exist) */}
          {activeMessages.length > 0 && (
            <div className="shrink-0 px-3 pb-2 flex gap-1.5 overflow-x-auto">
              {QUESTION_TEMPLATES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  disabled={loading}
                  className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all whitespace-nowrap disabled:opacity-40"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 pb-4 pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Ask the ${getRoleDisplayName(activePersonaId, allRoles)}...`}
                className="text-sm h-9"
                disabled={loading}
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0 shrink-0 bg-slate-800 hover:bg-slate-700"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[10px] text-slate-300 mt-1.5 text-center">
              Responses grounded in simulation data · Persona speaks in-character
            </p>
          </div>
        </>
      )}
    </div>
  );
}