import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  AlertCircle,
  MessageSquare,
  TrendingUp
} from "lucide-react";

export default function SimulationPlayback({ simulation, open, onOpenChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const timeline = simulation ? [
    { 
      type: 'start', 
      title: 'Simulation Started',
      data: { scenario: simulation.scenario, roles: simulation.selected_roles }
    },
    ...(simulation.responses?.map((resp, idx) => ({
      type: 'response',
      title: `${resp.role.replace(/_/g, ' ')} Position`,
      data: resp,
      index: idx
    })) || []),
    ...(simulation.tensions?.map((tension, idx) => ({
      type: 'tension',
      title: 'Tension Identified',
      data: tension,
      index: idx
    })) || []),
    ...(simulation.decision_trade_offs?.map((trade, idx) => ({
      type: 'tradeoff',
      title: 'Trade-off Analysis',
      data: trade,
      index: idx
    })) || []),
    { 
      type: 'summary', 
      title: 'Simulation Complete',
      data: { summary: simulation.summary, next_steps: simulation.next_steps }
    }
  ] : [];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, timeline.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentStep >= timeline.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
    setIsPlaying(false);
  };

  const handleForward = () => {
    setCurrentStep(Math.min(timeline.length - 1, currentStep + 1));
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  if (!simulation) return null;

  const currentEvent = timeline[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-600" />
            Simulation Playback: {simulation.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timeline Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Step {currentStep + 1} of {timeline.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Speed:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlaybackSpeed(playbackSpeed === 2 ? 0.5 : playbackSpeed + 0.5)}
                  className="h-6 text-xs"
                >
                  {playbackSpeed}x
                </Button>
              </div>
            </div>
            <Slider
              value={[currentStep]}
              onValueChange={(val) => {
                setCurrentStep(val[0]);
                setIsPlaying(false);
              }}
              max={timeline.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRewind} className="h-8 w-8">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button onClick={handlePlayPause} className="h-8 px-4 gap-2">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleForward} className="h-8 w-8">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {timeline.map((event, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                const iconMap = {
                  start: Play,
                  response: MessageSquare,
                  tension: AlertCircle,
                  tradeoff: TrendingUp,
                  summary: Play
                };
                const Icon = iconMap[event.type];

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentStep(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                      isActive 
                        ? 'border-violet-600 bg-violet-50 scale-110' 
                        : isPast 
                        ? 'border-slate-300 bg-slate-50' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                      <span className="text-xs mt-1">{idx + 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Event Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">
                  {currentEvent?.title}
                </h3>

                {currentEvent?.type === 'start' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Scenario:</p>
                      <p className="text-sm text-slate-700">{currentEvent.data.scenario}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Participating Roles:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentEvent.data.roles?.map((role, i) => (
                          <Badge key={i} variant="outline">
                            {role.role.replace(/_/g, ' ')} (Influence: {role.influence})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentEvent?.type === 'response' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-violet-100 text-violet-700">
                        {currentEvent.data.role.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline">
                        Risk: {currentEvent.data.risk_tolerance}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Position:</p>
                      <p className="text-sm text-slate-700">{currentEvent.data.position}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Key Concerns:</p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {currentEvent.data.concerns?.map((concern, i) => (
                          <li key={i}>• {concern}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Recommendation:</p>
                      <p className="text-sm text-slate-700">{currentEvent.data.recommendation}</p>
                    </div>
                  </div>
                )}

                {currentEvent?.type === 'tension' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      <Badge className={`${
                        currentEvent.data.severity === 'critical' ? 'bg-rose-600' :
                        currentEvent.data.severity === 'high' ? 'bg-orange-500' :
                        currentEvent.data.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
                      } text-white`}>
                        {currentEvent.data.severity}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Between:</p>
                      <div className="flex items-center gap-2">
                        {currentEvent.data.between?.map((role, i) => (
                          <React.Fragment key={role}>
                            <Badge variant="outline">{role.replace(/_/g, ' ')}</Badge>
                            {i < currentEvent.data.between.length - 1 && (
                              <span className="text-slate-400">vs</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Description:</p>
                      <p className="text-sm text-slate-700">{currentEvent.data.description}</p>
                    </div>
                  </div>
                )}

                {currentEvent?.type === 'tradeoff' && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-800">{currentEvent.data.trade_off}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">Option A</p>
                        <p className="text-sm text-blue-800">{currentEvent.data.option_a}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-medium text-purple-900 mb-1">Option B</p>
                        <p className="text-sm text-purple-800">{currentEvent.data.option_b}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentEvent?.type === 'summary' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Executive Summary:</p>
                      <p className="text-sm text-slate-700">{currentEvent.data.summary}</p>
                    </div>
                    {currentEvent.data.next_steps && currentEvent.data.next_steps.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-2">Next Steps:</p>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {currentEvent.data.next_steps.slice(0, 3).map((step, i) => (
                            <li key={i}>• {step.action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}