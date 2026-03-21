import React from 'react';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, GitBranch, Zap, GitMerge, FileDown,
  Share2, ClipboardList, Edit2
} from 'lucide-react';

/**
 * Props:
 *  simulation          — current simulation object
 *  hasOutcome          — boolean, whether a SimulationOutcome record exists
 *  onReRun             — fn()
 *  onFork              — fn()
 *  onStressTest        — fn()
 *  onWhatIfTree        — fn()
 *  onExportPDF         — fn()
 *  onShare             — fn()
 *  onLogOutcome        — fn()
 *  onEdit              — fn()
 */
export default function SimulationActionBar({
  simulation,
  hasOutcome,
  onReRun,
  onFork,
  onStressTest,
  onWhatIfTree,
  onExportPDF,
  onShare,
  onLogOutcome,
  onEdit,
}) {
  if (!simulation) return null;

  const isCompleted = simulation.status === 'completed';

  if (isCompleted) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onReRun}>
          <RefreshCw className="w-3 h-3" /> Re-run
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onFork}>
          <GitBranch className="w-3 h-3" /> Fork
        </Button>
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
          onClick={onStressTest}
        >
          <Zap className="w-3 h-3" /> Stress Test
        </Button>
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50"
          onClick={onWhatIfTree}
        >
          <GitMerge className="w-3 h-3" /> What-If Tree
        </Button>
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          onClick={onExportPDF}
        >
          <FileDown className="w-3 h-3" /> Export PDF
        </Button>
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={onShare}
        >
          <Share2 className="w-3 h-3" /> Share
        </Button>
        {!hasOutcome && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onLogOutcome}>
            <ClipboardList className="w-3 h-3" /> Log Outcome
          </Button>
        )}
      </div>
    );
  }

  // draft or running
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onEdit}>
        <Edit2 className="w-3 h-3" /> Edit
      </Button>
      <Button
        variant="outline" size="sm"
        className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
        onClick={onShare}
      >
        <Share2 className="w-3 h-3" /> Share
      </Button>
    </div>
  );
}