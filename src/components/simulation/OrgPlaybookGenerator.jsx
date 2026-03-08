import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Download, Loader2, ChevronRight, CheckCircle2,
  Zap, Shield, Target, Users, ArrowRight, FileText, Lightbulb
} from "lucide-react";

// Build a readable path from node IDs
function buildPathDescription(pathNodes, edges) {
  return pathNodes.map((node, i) => {
    const outEdge = i < pathNodes.length - 1
      ? edges.find(e => e.from_node_id === node.id && e.to_node_id === pathNodes[i + 1]?.id)
      : null;
    return { node, edgeTaken: outEdge };
  });
}

function SectionBlock({ icon: Icon, color, title, children }) {
  return (
    <div className={`border rounded-xl p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function OrgPlaybookGenerator({ open, onClose, nodes, edges, selectedPath, simulation, allRoles }) {
  const [playbook, setPlaybook] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const pathNodes = (selectedPath || []).map(id => nodes.find(n => n.id === id)).filter(Boolean);
  const pathSteps = buildPathDescription(pathNodes, edges);

  const generatePlaybook = async () => {
    if (pathNodes.length < 2) {
      toast.error('Select at least 2 nodes in your decision path first');
      return;
    }
    setGenerating(true);
    setPlaybook(null);
    try {
      const pathSummary = pathSteps.map((s, i) =>
        `Step ${i + 1}: [${s.node.type.toUpperCase()}] ${s.node.label}${s.node.description ? ` — ${s.node.description}` : ''}${s.node.condition ? ` (condition: ${s.node.condition})` : ''}${s.edgeTaken?.label ? ` → took path "${s.edgeTaken.label}"` : ''}`
      ).join('\n');

      const tensionsText = (simulation?.tensions || []).map(t =>
        `• ${(t.between || []).join(' vs ')} (${t.severity}): ${t.description}`
      ).join('\n');

      const rolesText = (simulation?.selected_roles || []).map(r => r.role).join(', ');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert organizational consultant synthesizing a formal Organizational Playbook from a simulated decision path.

SIMULATION CONTEXT:
Title: ${simulation?.title || 'Untitled'}
Scenario: ${simulation?.scenario || 'N/A'}
Roles Involved: ${rolesText || 'N/A'}

SELECTED DECISION PATH (${pathNodes.length} steps):
${pathSummary}

TENSIONS IDENTIFIED IN SIMULATION:
${tensionsText || 'None documented'}

SIMULATION SUMMARY:
${simulation?.summary || 'N/A'}

Generate a comprehensive, actionable Organizational Playbook for this decision path. Be specific, practical, and reference the actual roles, decisions, and conflicts from the path above.`,
        response_json_schema: {
          type: "object",
          properties: {
            playbook_title: { type: "string" },
            executive_summary: { type: "string" },
            key_decisions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  rationale: { type: "string" },
                  owner_role: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            conflict_resolution_tactics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  conflict: { type: "string" },
                  tactic: { type: "string" },
                  outcome: { type: "string" }
                }
              }
            },
            action_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  owner: { type: "string" },
                  timeline: { type: "string" }
                }
              }
            },
            lessons_learned: { type: "array", items: { type: "string" } },
            risk_mitigations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            success_metrics: { type: "array", items: { type: "string" } }
          }
        }
      });
      setPlaybook(result);
    } catch (e) {
      toast.error('Failed to generate playbook');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!playbook) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 18;
      const maxW = pageW - margin * 2;
      let y = 20;

      const checkPage = (needed = 10) => {
        if (y + needed > 272) { doc.addPage(); y = 20; }
      };

      const writeLine = (text, size = 10, style = 'normal', color = [30, 30, 30]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxW);
        checkPage(lines.length * (size * 0.4 + 1.5));
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.4 + 1.5) + 1;
      };

      const writeSection = (title, color = [99, 102, 241]) => {
        checkPage(14);
        y += 4;
        doc.setFillColor(...color);
        doc.roundedRect(margin - 2, y - 4, maxW + 4, 9, 1, 1, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin, y + 1.5);
        y += 8;
        doc.setTextColor(30, 30, 30);
      };

      // Cover
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const title = playbook.playbook_title || 'Organizational Playbook';
      doc.splitTextToSize(title, maxW).forEach((line, i) => {
        doc.text(line, margin, 16 + i * 8);
      });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()} · ${simulation?.title || ''}`, margin, 38);
      y = 55;

      // Executive Summary
      writeSection('Executive Summary');
      writeLine(playbook.executive_summary || '', 10);

      // Decision Path
      writeSection('Decision Path', [139, 92, 246]);
      pathSteps.forEach((s, i) => {
        writeLine(`${i + 1}. ${s.node.label}${s.edgeTaken?.label ? ` → ${s.edgeTaken.label}` : ''}`, 10, 'bold');
        if (s.node.description) writeLine(`   ${s.node.description}`, 9, 'normal', [80, 80, 80]);
        y += 1;
      });

      // Key Decisions
      if (playbook.key_decisions?.length) {
        writeSection('Key Decisions', [37, 99, 235]);
        playbook.key_decisions.forEach((d, i) => {
          writeLine(`${i + 1}. ${d.decision}`, 10, 'bold');
          if (d.rationale) writeLine(`   Rationale: ${d.rationale}`, 9, 'normal', [80, 80, 80]);
          if (d.owner_role) writeLine(`   Owner: ${d.owner_role}`, 9, 'normal', [99, 102, 241]);
          if (d.impact) writeLine(`   Impact: ${d.impact}`, 9, 'normal', [80, 80, 80]);
          y += 1.5;
        });
      }

      // Conflict Resolution
      if (playbook.conflict_resolution_tactics?.length) {
        writeSection('Conflict Resolution Tactics', [220, 38, 38]);
        playbook.conflict_resolution_tactics.forEach((c, i) => {
          writeLine(`${i + 1}. ${c.conflict}`, 10, 'bold');
          if (c.tactic) writeLine(`   Tactic: ${c.tactic}`, 9, 'normal', [80, 80, 80]);
          if (c.outcome) writeLine(`   Outcome: ${c.outcome}`, 9, 'normal', [80, 80, 80]);
          y += 1.5;
        });
      }

      // Action Plan
      if (playbook.action_plan?.length) {
        writeSection('Action Plan', [5, 150, 105]);
        playbook.action_plan.forEach((phase) => {
          writeLine(`Phase: ${phase.phase}${phase.timeline ? ` (${phase.timeline})` : ''}${phase.owner ? ` · Owner: ${phase.owner}` : ''}`, 10, 'bold');
          (phase.actions || []).forEach(a => writeLine(`  • ${a}`, 9));
          y += 1.5;
        });
      }

      // Risk Mitigations
      if (playbook.risk_mitigations?.length) {
        writeSection('Risk Mitigations', [245, 158, 11]);
        playbook.risk_mitigations.forEach((r, i) => {
          writeLine(`${i + 1}. Risk: ${r.risk}`, 10, 'bold');
          if (r.mitigation) writeLine(`   Mitigation: ${r.mitigation}`, 9, 'normal', [80, 80, 80]);
          y += 1;
        });
      }

      // Lessons Learned
      if (playbook.lessons_learned?.length) {
        writeSection('Lessons Learned', [16, 185, 129]);
        playbook.lessons_learned.forEach((l, i) => writeLine(`${i + 1}. ${l}`, 10));
      }

      // Success Metrics
      if (playbook.success_metrics?.length) {
        writeSection('Success Metrics', [124, 58, 237]);
        playbook.success_metrics.forEach((m, i) => writeLine(`${i + 1}. ${m}`, 10));
      }

      doc.save(`${(playbook.playbook_title || 'playbook').replace(/\s+/g, '_')}.pdf`);
      toast.success('Playbook PDF downloaded');
    } catch (e) {
      toast.error('PDF export failed');
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b flex-row items-center gap-3 shrink-0">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <DialogTitle className="text-base font-semibold flex-1">Organizational Playbook Generator</DialogTitle>
          {playbook && (
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={downloadPDF} disabled={downloading}>
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download PDF
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-5 space-y-4">
            {/* Path preview */}
            <div className="bg-slate-50 border rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Selected Decision Path ({pathNodes.length} nodes)
              </p>
              {pathNodes.length === 0 ? (
                <p className="text-sm text-slate-400">No path selected. Close this dialog, mark nodes in the tree, then re-open.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {pathSteps.map((s, i) => (
                    <React.Fragment key={s.node.id}>
                      <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                        <span className="text-slate-400">{i + 1}.</span> {s.node.label}
                        {s.node.type === 'outcome' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </Badge>
                      {s.edgeTaken && (
                        <div className="flex items-center gap-0.5 text-xs text-slate-400">
                          <ArrowRight className="w-3 h-3" />
                          {s.edgeTaken.label && <span className="italic">{s.edgeTaken.label}</span>}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Generate button */}
            {!playbook && (
              <Button
                className="w-full gap-2"
                onClick={generatePlaybook}
                disabled={generating || pathNodes.length < 2}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing playbook…</>
                  : <><Zap className="w-4 h-4" /> Generate Organizational Playbook</>
                }
              </Button>
            )}

            {/* Playbook content */}
            <AnimatePresence>
              {playbook && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-indigo-600 rounded-xl p-5 text-white">
                    <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">Organizational Playbook</p>
                    <h2 className="text-lg font-bold">{playbook.playbook_title}</h2>
                    <p className="text-sm opacity-80 mt-2 leading-relaxed">{playbook.executive_summary}</p>
                  </div>

                  {/* Key Decisions */}
                  {playbook.key_decisions?.length > 0 && (
                    <SectionBlock icon={FileText} color="bg-blue-50 border-blue-200 text-blue-900" title="Key Decisions">
                      <div className="space-y-3">
                        {playbook.key_decisions.map((d, i) => (
                          <div key={i} className="border-l-2 border-blue-300 pl-3">
                            <p className="text-sm font-semibold text-blue-900">{i + 1}. {d.decision}</p>
                            {d.rationale && <p className="text-xs text-blue-700 mt-0.5">{d.rationale}</p>}
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {d.owner_role && <Badge className="bg-blue-100 text-blue-700 text-xs">{d.owner_role}</Badge>}
                              {d.impact && <span className="text-xs text-blue-600 italic">{d.impact}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionBlock>
                  )}

                  {/* Conflict Resolution */}
                  {playbook.conflict_resolution_tactics?.length > 0 && (
                    <SectionBlock icon={Shield} color="bg-rose-50 border-rose-200 text-rose-900" title="Conflict Resolution Tactics">
                      <div className="space-y-3">
                        {playbook.conflict_resolution_tactics.map((c, i) => (
                          <div key={i} className="border-l-2 border-rose-300 pl-3">
                            <p className="text-sm font-semibold text-rose-900">{c.conflict}</p>
                            {c.tactic && <p className="text-xs text-rose-700 mt-0.5"><span className="font-medium">Tactic:</span> {c.tactic}</p>}
                            {c.outcome && <p className="text-xs text-rose-600 mt-0.5 italic">{c.outcome}</p>}
                          </div>
                        ))}
                      </div>
                    </SectionBlock>
                  )}

                  {/* Action Plan */}
                  {playbook.action_plan?.length > 0 && (
                    <SectionBlock icon={Target} color="bg-emerald-50 border-emerald-200 text-emerald-900" title="Action Plan">
                      <div className="space-y-4">
                        {playbook.action_plan.map((phase, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-emerald-200 text-emerald-800 text-xs">{phase.phase}</Badge>
                              {phase.timeline && <span className="text-xs text-emerald-600">{phase.timeline}</span>}
                              {phase.owner && <span className="text-xs text-emerald-500 ml-auto">{phase.owner}</span>}
                            </div>
                            <ul className="space-y-1">
                              {(phase.actions || []).map((a, j) => (
                                <li key={j} className="flex items-start gap-2 text-xs text-emerald-800">
                                  <ChevronRight className="w-3 h-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </SectionBlock>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Risk Mitigations */}
                    {playbook.risk_mitigations?.length > 0 && (
                      <SectionBlock icon={Shield} color="bg-amber-50 border-amber-200 text-amber-900" title="Risk Mitigations">
                        <div className="space-y-2">
                          {playbook.risk_mitigations.map((r, i) => (
                            <div key={i}>
                              <p className="text-xs font-semibold text-amber-800">{r.risk}</p>
                              {r.mitigation && <p className="text-xs text-amber-600">{r.mitigation}</p>}
                            </div>
                          ))}
                        </div>
                      </SectionBlock>
                    )}

                    {/* Lessons Learned */}
                    {playbook.lessons_learned?.length > 0 && (
                      <SectionBlock icon={Lightbulb} color="bg-violet-50 border-violet-200 text-violet-900" title="Lessons Learned">
                        <ul className="space-y-1.5">
                          {playbook.lessons_learned.map((l, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-violet-800">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-violet-400 flex-shrink-0" />
                              {l}
                            </li>
                          ))}
                        </ul>
                      </SectionBlock>
                    )}
                  </div>

                  {/* Success Metrics */}
                  {playbook.success_metrics?.length > 0 && (
                    <SectionBlock icon={CheckCircle2} color="bg-slate-50 border-slate-200 text-slate-900" title="Success Metrics">
                      <div className="flex flex-wrap gap-2">
                        {playbook.success_metrics.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </SectionBlock>
                  )}

                  <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2" onClick={() => setPlaybook(null)}>
                    Regenerate Playbook
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}