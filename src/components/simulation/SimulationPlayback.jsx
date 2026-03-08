import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  AlertCircle, MessageSquare, TrendingUp, Zap,
  ChevronRight, Flag, Users, Activity, Info,
  ArrowRight, Clock, ThumbsUp, ThumbsDown
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  critical: { color: 'bg-rose-600',   text: 'text-rose-700',   border: 'border-rose-300',   label: 'Critical' },
  high:     { color: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-300', label: 'High' },
  medium:   { color: 'bg-amber-500',  text: 'text-amber-700',  border: 'border-amber-300',  label: 'Medium' },
  low:      { color: 'bg-slate-400',  text: 'text-slate-600',  border: 'border-slate-200',  label: 'Low' },
};

const EVENT_STYLE = {
  start:     { bg: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-500',  icon: Flag,         label: 'Scenario Setup' },
  response:  { bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',    icon: MessageSquare, label: 'Role Feedback' },
  tension:   { bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-500',    icon: AlertCircle,   label: 'Tension' },
  tradeoff:  { bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',   icon: TrendingUp,    label: 'Trade-off' },
  env_shift: { bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500', icon: Zap,           label: 'Env. Shift' },
  summary:   { bg: 'bg-slate-50',  border: 'border-slate-200',  dot: 'bg-slate-600',   icon: Activity,      label: 'Outcome' },
};

function roleName(r = '') { return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

// Build tension delta: for each tension at step `current`, compare severity against same tension at step `prev`
function getTensionDelta(timeline, currentIdx) {
  const current = timeline.slice(0, currentIdx + 1).filter(e => e.type === 'tension');
  const previous = timeline.slice(0, currentIdx).filter(e => e.type === 'tension');
  return current.map(t => {
    const prev = previous.find(p => JSON.stringify(p.data.between) === JSON.stringify(t.data.between));
    if (!prev) return { ...t, delta: 'new' };
    const levels = ['low', 'medium', 'high', 'critical'];
    const diff = levels.indexOf(t.data.severity) - levels.indexOf(prev.data.severity);
    return { ...t, delta: diff > 0 ? 'escalated' : diff < 0 ? 'deescalated' : 'unchanged' };
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TensionEvolutionBar({ timeline, currentIdx }) {
  const severityScore = { low: 1, medium: 2, high: 3, critical: 4 };
  const points = timeline.reduce((acc, event, idx) => {
    if (idx > currentIdx) return acc;
    if (event.type === 'tension') {
      const score = severityScore[event.data.severity] || 0;
      acc.push({ idx, score, event });
    } else {
      acc.push({ idx, score: acc.length ? acc[acc.length - 1].score : 0, event: null });
    }
    return acc;
  }, []);

  const maxScore = 4;
  const width = timeline.length;

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        <Activity className="w-3 h-3" /> Tension Heat
      </p>
      <div className="flex items-end gap-px h-8">
        {timeline.map((_, idx) => {
          const pt = points.find(p => p.idx === idx);
          const score = pt ? pt.score : (idx < currentIdx ? (points.filter(p => p.idx < idx).slice(-1)[0]?.score || 0) : 0);
          const height = `${Math.round((score / maxScore) * 100)}%`;
          const isCurrent = idx === currentIdx;
          const isPast = idx <= currentIdx;
          return (
            <div
              key={idx}
              style={{ height: height || '4px', minHeight: '4px', flex: 1 }}
              className={`rounded-sm transition-all ${
                isCurrent ? 'bg-rose-500' :
                isPast ? (score >= 3 ? 'bg-rose-300' : score >= 2 ? 'bg-amber-300' : 'bg-blue-200') :
                'bg-slate-100'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function RoleTracker({ simulation, currentIdx, timeline }) {
  const visibleResponses = timeline.slice(0, currentIdx + 1).filter(e => e.type === 'response');
  const roles = simulation?.selected_roles || [];
  
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
        <Users className="w-3 h-3" /> Role Status
      </p>
      <div className="flex flex-wrap gap-1">
        {roles.map((r, i) => {
          const responded = visibleResponses.find(e => e.data.role === r.role);
          return (
            <div
              key={i}
              className={`px-2 py-0.5 rounded text-xs border transition-all ${
                responded
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {roleName(r.role)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event, tensionDeltas }) {
  const style = EVENT_STYLE[event.type] || EVENT_STYLE.summary;

  if (event.type === 'start') return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-600">Decision Scenario</p>
      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border">
        {event.data.scenario}
      </p>
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Participating Roles</p>
        <div className="flex flex-wrap gap-2">
          {event.data.roles?.map((r, i) => (
            <Badge key={i} variant="outline" className="gap-1">
              {roleName(r.role)}
              <span className="text-slate-400 font-normal">· {r.influence}x</span>
            </Badge>
          ))}
        </div>
      </div>
      {event.data.env && Object.keys(event.data.env).filter(k => event.data.env[k]).length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-500" /> Environmental Factors
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(event.data.env).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="bg-emerald-50 border border-emerald-100 rounded p-2 text-xs">
                <span className="font-medium text-emerald-800 capitalize">{k.replace(/_/g, ' ')}: </span>
                <span className="text-emerald-700">{typeof v === 'boolean' ? 'Yes' : v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (event.type === 'response') return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">{roleName(event.data.role)}</Badge>
        <Badge variant="outline" className={`text-xs ${
          event.data.risk_tolerance === 'high' ? 'text-rose-600 border-rose-300' :
          event.data.risk_tolerance === 'low' ? 'text-blue-600 border-blue-300' :
          'text-amber-600 border-amber-300'
        }`}>
          Risk: {event.data.risk_tolerance}
        </Badge>
        {event.data.primary_driver && (
          <Badge variant="outline" className="text-xs text-slate-600">
            Driver: {event.data.primary_driver}
          </Badge>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 mb-1">Position</p>
        <p className="text-sm text-blue-900 leading-relaxed">{event.data.position}</p>
      </div>

      {event.data.concerns?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Key Concerns
          </p>
          <ul className="space-y-1">
            {event.data.concerns.map((c, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.data.recommendation && (
        <div className="bg-slate-50 border rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-green-500" /> Recommendation
          </p>
          <p className="text-sm text-slate-700">{event.data.recommendation}</p>
        </div>
      )}
    </div>
  );

  if (event.type === 'tension') {
    const delta = tensionDeltas?.find(d =>
      JSON.stringify(d.data.between) === JSON.stringify(event.data.between)
    );
    const meta = SEVERITY_META[event.data.severity] || SEVERITY_META.low;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${meta.color} text-white`}>{meta.label}</Badge>
          {delta?.delta === 'new' && <Badge className="bg-violet-100 text-violet-700 border-violet-200">New</Badge>}
          {delta?.delta === 'escalated' && <Badge className="bg-rose-100 text-rose-700 border-rose-200">↑ Escalated</Badge>}
          {delta?.delta === 'deescalated' && <Badge className="bg-green-100 text-green-700 border-green-200">↓ De-escalated</Badge>}
        </div>

        <div className={`flex items-center gap-2 flex-wrap p-3 rounded-lg border ${meta.border} bg-white`}>
          {event.data.between?.map((r, i) => (
            <React.Fragment key={r}>
              <Badge variant="outline">{roleName(r)}</Badge>
              {i < event.data.between.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
            </React.Fragment>
          ))}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{event.data.description}</p>
      </div>
    );
  }

  if (event.type === 'tradeoff') return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-800">{event.data.trade_off}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
          <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Option A
          </p>
          <p className="text-sm text-blue-900">{event.data.option_a}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
          <p className="text-xs font-bold text-purple-800 flex items-center gap-1">
            <ThumbsDown className="w-3 h-3" /> Option B
          </p>
          <p className="text-sm text-purple-900">{event.data.option_b}</p>
        </div>
      </div>
    </div>
  );

  if (event.type === 'env_shift') return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-800 font-medium">{event.data.description}</p>
      </div>
      {event.data.affected_roles?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Roles Affected</p>
          <div className="flex gap-2 flex-wrap">
            {event.data.affected_roles.map((r, i) => (
              <Badge key={i} variant="outline" className="text-emerald-700 border-emerald-300">{roleName(r)}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (event.type === 'summary') return (
    <div className="space-y-4">
      <div className="bg-slate-50 border rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-600 mb-2">Executive Summary</p>
        <p className="text-sm text-slate-700 leading-relaxed">{event.data.summary}</p>
      </div>
      {event.data.next_steps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Key Next Steps</p>
          <ul className="space-y-2">
            {event.data.next_steps.slice(0, 4).map((step, i) => (
              <li key={i} className={`flex gap-2 text-sm rounded-lg p-2 border ${
                step.priority === 'high' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                step.priority === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span>{step.action}</span>
                  {step.owner_role && (
                    <span className="ml-1 opacity-60">({roleName(step.owner_role)})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SimulationPlayback({ simulation, open, onOpenChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const intervalRef = useRef(null);

  // Build timeline: interleave env_shift events between responses based on environmental_factors
  const timeline = useMemo(() => {
    if (!simulation) return [];
    const events = [];

    events.push({
      type: 'start',
      title: 'Scenario Setup',
      data: {
        scenario: simulation.scenario,
        roles: simulation.selected_roles,
        env: simulation.environmental_factors || {}
      }
    });

    const responses = simulation.responses || [];
    const totalRoles = responses.length;

    responses.forEach((resp, idx) => {
      // Inject an env shift midway through responses if env factors exist
      if (idx === Math.floor(totalRoles / 2) && simulation.environmental_factors) {
        const envEntries = Object.entries(simulation.environmental_factors).filter(([, v]) => v);
        if (envEntries.length > 0) {
          events.push({
            type: 'env_shift',
            title: 'Environmental Shift',
            data: {
              description: `New context introduced: ${envEntries.map(([k]) => k.replace(/_/g, ' ')).join(', ')}. Subsequent role feedback may reflect updated pressures.`,
              affected_roles: responses.slice(idx).map(r => r.role)
            }
          });
        }
      }
      events.push({
        type: 'response',
        title: `${roleName(resp.role)} Feedback`,
        data: resp,
        index: idx
      });
    });

    (simulation.tensions || []).forEach((tension, idx) => {
      events.push({
        type: 'tension',
        title: 'Tension Surfaced',
        data: tension,
        index: idx
      });
    });

    (simulation.decision_trade_offs || []).forEach((trade, idx) => {
      events.push({
        type: 'tradeoff',
        title: 'Trade-off Identified',
        data: trade,
        index: idx
      });
    });

    events.push({
      type: 'summary',
      title: 'Simulation Outcome',
      data: {
        summary: simulation.summary,
        next_steps: simulation.next_steps
      }
    });

    return events;
  }, [simulation]);

  // Playback ticker
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= timeline.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 2500 / playbackSpeed);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, playbackSpeed, timeline.length]);

  // Reset on open
  useEffect(() => {
    if (open) { setCurrentStep(0); setIsPlaying(false); }
  }, [open]);

  const handlePlayPause = () => {
    if (currentStep >= timeline.length - 1) setCurrentStep(0);
    setIsPlaying(p => !p);
  };

  const tensionDeltas = useMemo(() => getTensionDelta(timeline, currentStep), [timeline, currentStep]);

  if (!simulation) return null;

  const currentEvent = timeline[currentStep];
  const style = EVENT_STYLE[currentEvent?.type] || EVENT_STYLE.summary;
  const Icon = style.icon;

  const speeds = [0.5, 1, 1.5, 2];
  const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Play className="w-4 h-4 text-violet-600" />
            Decision Playback
            <span className="text-slate-400 font-normal text-sm">— {simulation.title}</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 text-slate-500"
                onClick={() => setShowSidebar(s => !s)}
              >
                {showSidebar ? 'Hide' : 'Show'} Timeline
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — step list */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r bg-slate-50 overflow-hidden flex-shrink-0"
              >
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 px-1">Steps</p>
                    {timeline.map((event, idx) => {
                      const s = EVENT_STYLE[event.type] || EVENT_STYLE.summary;
                      const SIcon = s.icon;
                      const isActive = idx === currentStep;
                      const isPast = idx < currentStep;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                          className={`w-full text-left rounded-lg px-2 py-1.5 flex items-center gap-2 transition-all text-xs ${
                            isActive ? `${s.bg} ${s.border} border font-semibold` :
                            isPast ? 'text-slate-500 hover:bg-white' :
                            'text-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPast || isActive ? s.dot : 'bg-slate-200'}`} />
                          <SIcon className={`w-3 h-3 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                          <span className="truncate leading-tight">{event.title}</span>
                          {isActive && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls + progress */}
            <div className="px-5 py-3 border-b bg-white space-y-2 shrink-0">
              {/* Tension heat bar */}
              <TensionEvolutionBar timeline={timeline} currentIdx={currentStep} />

              {/* Slider */}
              <div className="flex items-center gap-3">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <Slider
                  value={[currentStep]}
                  onValueChange={([v]) => { setCurrentStep(v); setIsPlaying(false); }}
                  max={timeline.length - 1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-slate-400 w-16 text-right">
                  {currentStep + 1} / {timeline.length}
                </span>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setCurrentStep(s => Math.max(0, s - 1)); setIsPlaying(false); }}>
                    <SkipBack className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" className="h-7 px-3 gap-1.5" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setCurrentStep(s => Math.min(timeline.length - 1, s + 1)); setIsPlaying(false); }}>
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs w-12"
                    onClick={() => setPlaybackSpeed(nextSpeed)}
                  >
                    {playbackSpeed}×
                  </Button>
                  <RoleTracker simulation={simulation} currentIdx={currentStep} timeline={timeline} />
                </div>
              </div>
            </div>

            {/* Event content */}
            <ScrollArea className="flex-1">
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Event header */}
                    <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl border ${style.bg} ${style.border}`}>
                      <div className={`p-2 rounded-lg ${style.bg} border ${style.border}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{style.label}</p>
                        <p className="text-sm font-semibold text-slate-800">{currentEvent?.title}</p>
                      </div>
                      <div className="ml-auto text-xs text-slate-400">
                        Step {currentStep + 1} of {timeline.length}
                      </div>
                    </div>

                    {/* Event body */}
                    <Card className={`p-5 border ${style.border}`}>
                      <EventCard event={currentEvent} tensionDeltas={tensionDeltas} />
                    </Card>

                    {/* Tension snapshot (if past first response) */}
                    {tensionDeltas.length > 0 && currentEvent?.type !== 'tension' && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Active Tensions at This Point
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tensionDeltas.map((t, i) => {
                            const meta = SEVERITY_META[t.data.severity] || SEVERITY_META.low;
                            return (
                              <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${meta.border} bg-white text-xs`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${meta.color}`} />
                                <span className={meta.text}>
                                  {t.data.between?.map(roleName).join(' · ')}
                                </span>
                                {t.delta === 'escalated' && <span className="text-rose-500">↑</span>}
                                {t.delta === 'deescalated' && <span className="text-green-500">↓</span>}
                                {t.delta === 'new' && <span className="text-violet-500">new</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}