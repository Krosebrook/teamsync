import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SimilarDecisions({ scenario, onLoadSimulation }) {
  const [open, setOpen] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSimilar = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('findSimilarSimulations', {
        scenario,
        limit: 5
      });
      setSimilar(result.data.similar || []);
    } catch (error) {
      console.error('Error finding similar:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSimilar}
          className="h-7 text-xs gap-2"
        >
          <History className="w-3 h-3" />
          Find Similar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Similar Past Decisions</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Analyzing...</p>
          ) : similar.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No similar decisions found</p>
          ) : (
            similar.map((match, idx) => (
              <div key={idx} className="p-3 border border-slate-200 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-800">
                    {match.simulation?.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(match.similarity_score * 100)}% match
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{match.reason}</p>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {match.simulation?.scenario}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLoadSimulation(match.simulation);
                    setOpen(false);
                  }}
                  className="mt-2 h-6 text-xs gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Details
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}