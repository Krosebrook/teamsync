import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileDown, CheckSquare, Lightbulb, MessageSquare, AlertTriangle, FileJson } from "lucide-react";
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

// ─── Helpers ────────────────────────────────────────────────────────────────

function roleName(roleId) {
  return (roleId || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function wrapText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function sectionHeading(doc, text, y, color = [30, 30, 30]) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(text, 14, y);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y + 2, 196, y + 2);
  return y + 8;
}

function checkPageBreak(doc, y, needed = 20) {
  if (y + needed > 275) {
    doc.addPage();
    return 18;
  }
  return y;
}

function buildDebriefData(simulation) {
  const cards = { key_insights: [], lessons_learned: [], action_items: [] };
  if (!simulation) return cards;

  if (simulation.summary) {
    const sentences = simulation.summary.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
    sentences.slice(0, 3).forEach(s => cards.key_insights.push(s.trim()));
  }
  simulation.tensions?.forEach(t => {
    if (t.severity === 'high' || t.severity === 'critical') {
      cards.key_insights.push(t.description);
    }
  });
  simulation.responses?.slice(0, 4).forEach(r => {
    if (r.primary_driver) cards.lessons_learned.push(`${roleName(r.role)}: ${r.primary_driver}`);
  });
  simulation.decision_trade_offs?.forEach(t => {
    cards.lessons_learned.push(`Trade-off — ${t.trade_off}: ${t.option_a} vs. ${t.option_b}`);
  });
  simulation.next_steps?.forEach(s => {
    cards.action_items.push({ text: s.action, priority: s.priority, owner: s.owner_role, completed: s.completed });
  });
  return cards;
}

// ─── PDF Builder ─────────────────────────────────────────────────────────────

function buildPDF(simulation, personaTranscripts, allRoles) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = 182; // usable page width
  const lh = 5;   // base line height

  // ── Cover Page ──────────────────────────────────────────────────────────────
  doc.setFillColor(20, 20, 30);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(simulation.title || 'Simulation Report', 170);
  titleLines.forEach((line, i) => doc.text(line, 105, 100 + i * 12, { align: 'center' }));

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text('Team Decision Simulation — Summary Report', 105, 100 + titleLines.length * 12 + 12, { align: 'center' });

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 140);
  doc.text(dateStr, 105, 270, { align: 'center' });

  if (simulation.use_case_type) {
    doc.setFontSize(9);
    doc.setTextColor(100, 180, 255);
    doc.text(simulation.use_case_type.replace(/_/g, ' ').toUpperCase(), 105, 280, { align: 'center' });
  }

  // ── Page 2: Scenario & Executive Summary ────────────────────────────────────
  doc.addPage();
  let y = 18;

  // Header bar
  doc.setFillColor(245, 246, 250);
  doc.rect(0, 0, 210, 14, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 140);
  doc.text('Team Decision Simulation Report', 14, 9);
  doc.text(simulation.title || '', 196, 9, { align: 'right' });

  y = sectionHeading(doc, '1. Scenario', y + 6, [40, 60, 120]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  y = wrapText(doc, simulation.scenario || 'N/A', 14, y, pw, lh);
  y += 6;

  // Roles strip
  y = checkPageBreak(doc, y, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 110);
  doc.text('PARTICIPANTS', 14, y);
  y += 4;
  let roleX = 14;
  simulation.selected_roles?.forEach(r => {
    const label = roleName(r.role) + ` (×${r.influence})`;
    const w = doc.getTextWidth(label) + 6;
    doc.setFillColor(235, 237, 245);
    doc.roundedRect(roleX, y - 3.5, w, 5.5, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 90);
    doc.text(label, roleX + 3, y + 0.5);
    roleX += w + 3;
    if (roleX > 180) { roleX = 14; y += 7; }
  });
  y += 10;

  // Executive summary
  y = checkPageBreak(doc, y, 20);
  y = sectionHeading(doc, '2. Executive Summary', y, [40, 60, 120]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  y = wrapText(doc, simulation.summary || 'No summary available.', 14, y, pw, lh);
  y += 8;

  // ── Role Perspectives ────────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 20);
  y = sectionHeading(doc, '3. Role Perspectives', y, [40, 60, 120]);

  simulation.responses?.forEach((resp, i) => {
    y = checkPageBreak(doc, y, 30);

    doc.setFillColor(248, 249, 252);
    const cardStart = y - 1;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text(`${roleName(resp.role)}`, 16, y + 4);

    if (resp.risk_tolerance) {
      const rtColor = { high: [220, 80, 80], medium: [200, 150, 30], low: [40, 140, 80] }[resp.risk_tolerance] || [100, 100, 100];
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...rtColor);
      doc.text(`Risk: ${resp.risk_tolerance}`, 196, y + 4, { align: 'right' });
    }

    y += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(70, 70, 80);
    y = wrapText(doc, resp.position || '', 16, y, pw - 4, lh);

    if (resp.primary_driver) {
      y += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 100);
      y = wrapText(doc, `Driver: ${resp.primary_driver}`, 16, y, pw - 4, lh);
    }

    if (resp.concerns?.length > 0) {
      y += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 110);
      doc.text('Concerns:', 16, y);
      y += 4;
      resp.concerns.slice(0, 3).forEach(c => {
        y = checkPageBreak(doc, y, 8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 90);
        y = wrapText(doc, `  • ${c}`, 16, y, pw - 4, lh);
      });
    }

    const cardEnd = y + 4;
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(220, 222, 235);
    doc.roundedRect(14, cardStart, pw, cardEnd - cardStart, 2, 2, 'FD');

    // Re-draw text on top (jsPDF rect covers text, re-render needed)
    // Re-writing over filled rect
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text(`${roleName(resp.role)}`, 16, cardStart + 5);

    if (resp.risk_tolerance) {
      const rtColor = { high: [220, 80, 80], medium: [200, 150, 30], low: [40, 140, 80] }[resp.risk_tolerance] || [100, 100, 100];
      doc.setTextColor(...rtColor);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Risk: ${resp.risk_tolerance}`, 196, cardStart + 5, { align: 'right' });
    }

    let ty = cardStart + 11;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(70, 70, 80);
    const posLines = doc.splitTextToSize(resp.position || '', pw - 4);
    doc.text(posLines, 16, ty);
    ty += posLines.length * lh;

    if (resp.primary_driver) {
      ty += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 100);
      const dLines = doc.splitTextToSize(`Driver: ${resp.primary_driver}`, pw - 4);
      doc.text(dLines, 16, ty);
      ty += dLines.length * lh;
    }

    if (resp.concerns?.length > 0) {
      ty += 2;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 110);
      doc.text('Concerns:', 16, ty);
      ty += 4;
      resp.concerns.slice(0, 3).forEach(c => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 90);
        const cLines = doc.splitTextToSize(`  • ${c}`, pw - 4);
        doc.text(cLines, 16, ty);
        ty += cLines.length * lh;
      });
    }

    y = ty + 7;
  });

  // ── Tensions ─────────────────────────────────────────────────────────────────
  if (simulation.tensions?.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y = sectionHeading(doc, '4. Identified Tensions', y, [40, 60, 120]);

    simulation.tensions.forEach(t => {
      y = checkPageBreak(doc, y, 14);
      const sevColor = { critical: [200, 50, 50], high: [210, 100, 30], medium: [180, 150, 20], low: [60, 130, 60] }[t.severity] || [100, 100, 100];

      doc.setFillColor(...sevColor, 0.15);
      doc.setDrawColor(...sevColor);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sevColor);
      const rolesLabel = (t.between || []).map(roleName).join(' ↔ ');
      doc.text(`[${(t.severity || '').toUpperCase()}] ${rolesLabel}`, 16, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      doc.setFontSize(8);
      y = wrapText(doc, t.description || '', 16, y, pw - 4, lh);
      y += 5;
    });
  }

  // ── Trade-offs ───────────────────────────────────────────────────────────────
  if (simulation.decision_trade_offs?.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y = sectionHeading(doc, '5. Decision Trade-offs', y, [40, 60, 120]);

    simulation.decision_trade_offs.forEach((t, i) => {
      y = checkPageBreak(doc, y, 22);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 70);
      y = wrapText(doc, `${i + 1}. ${t.trade_off}`, 16, y, pw, lh);
      y += 1;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      doc.setFillColor(220, 240, 220);
      doc.roundedRect(16, y, (pw - 4) / 2 - 2, 14, 1, 1, 'F');
      doc.setTextColor(30, 100, 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Option A', 19, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 80, 40);
      const aLines = doc.splitTextToSize(t.option_a || '', (pw - 4) / 2 - 8);
      doc.text(aLines.slice(0, 2), 19, y + 9);

      const bx = 16 + (pw - 4) / 2 + 2;
      doc.setFillColor(240, 220, 220);
      doc.roundedRect(bx, y, (pw - 4) / 2 - 2, 14, 1, 1, 'F');
      doc.setTextColor(120, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Option B', bx + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 40, 40);
      const bLines = doc.splitTextToSize(t.option_b || '', (pw - 4) / 2 - 8);
      doc.text(bLines.slice(0, 2), bx + 3, y + 9);

      y += 18;
    });
  }

  // ── Debrief Board ────────────────────────────────────────────────────────────
  const debrief = buildDebriefData(simulation);
  const hasDebrief = debrief.key_insights.length + debrief.lessons_learned.length + debrief.action_items.length > 0;

  if (hasDebrief) {
    doc.addPage();
    y = 18;

    // Re-draw header
    doc.setFillColor(245, 246, 250);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 140);
    doc.text('Team Decision Simulation Report', 14, 9);
    doc.text(simulation.title || '', 196, 9, { align: 'right' });

    y = sectionHeading(doc, '6. Debrief Board', y + 6, [40, 60, 120]);

    const sections = [
      { label: 'Key Insights', items: debrief.key_insights, color: [200, 150, 20], bg: [255, 250, 220] },
      { label: 'Lessons Learned', items: debrief.lessons_learned, color: [100, 50, 180], bg: [245, 240, 255] },
      { label: 'Action Items', items: debrief.action_items, color: [30, 130, 80], bg: [230, 250, 240] },
    ];

    sections.forEach(sec => {
      if (!sec.items.length) return;
      y = checkPageBreak(doc, y, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sec.color);
      doc.text(sec.label, 14, y);
      y += 5;

      sec.items.forEach(item => {
        const text = typeof item === 'string' ? item : item.text;
        const completed = typeof item === 'object' ? item.completed : false;
        const priority = typeof item === 'object' ? item.priority : null;
        const owner = typeof item === 'object' ? item.owner : null;

        y = checkPageBreak(doc, y, 12);
        doc.setFillColor(...sec.bg);
        const lines = doc.splitTextToSize(`• ${text}`, pw - 10);
        const boxH = Math.max(lines.length * lh + 6, 10);
        doc.roundedRect(14, y - 3, pw, boxH, 1.5, 1.5, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', completed ? 'italic' : 'normal');
        doc.setTextColor(completed ? 120 : 50, completed ? 120 : 55, completed ? 120 : 65);
        doc.text(lines, 18, y + 1);

        if (priority || owner) {
          const meta = [priority && `Priority: ${priority}`, owner && `Owner: ${roleName(owner)}`].filter(Boolean).join('  |  ');
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(130, 130, 140);
          doc.text(meta, 196, y + 1, { align: 'right' });
        }

        y += boxH + 2;
      });
      y += 4;
    });
  }

  // ── Action Items ─────────────────────────────────────────────────────────────
  if (simulation.next_steps?.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y = sectionHeading(doc, '7. Action Items', y, [40, 60, 120]);

    simulation.next_steps.forEach((step, i) => {
      y = checkPageBreak(doc, y, 12);
      const priColor = { high: [200, 50, 50], medium: [180, 130, 20], low: [60, 130, 60] }[step.priority] || [100, 100, 100];

      doc.setFontSize(8);
      doc.setFont('helvetica', step.completed ? 'italic' : 'bold');
      doc.setTextColor(step.completed ? 150 : 40, step.completed ? 150 : 50, step.completed ? 150 : 70);
      const prefix = step.completed ? `${i + 1}. ✓ ` : `${i + 1}. `;
      const actionLines = doc.splitTextToSize(`${prefix}${step.action}`, pw - 30);
      doc.text(actionLines, 16, y);

      if (step.owner_role) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 110);
        doc.text(`Owner: ${roleName(step.owner_role)}`, 196, y, { align: 'right' });
      }

      y += actionLines.length * lh + 1;

      if (step.priority) {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...priColor);
        doc.text(`  ● ${step.priority} priority`, 16, y);
        y += 4;
      }
    });
    y += 4;
  }

  // ── Persona Interview Transcripts ────────────────────────────────────────────
  if (personaTranscripts && Object.keys(personaTranscripts).length > 0) {
    doc.addPage();
    y = 18;

    doc.setFillColor(245, 246, 250);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 140);
    doc.text('Team Decision Simulation Report', 14, 9);
    doc.text(simulation.title || '', 196, 9, { align: 'right' });

    y = sectionHeading(doc, '8. Persona Interview Transcripts', y + 6, [40, 60, 120]);

    Object.entries(personaTranscripts).forEach(([personaId, msgs]) => {
      const validMsgs = (msgs || []).filter(m => !m.loading && (m.text || m.summary));
      if (!validMsgs.length) return;

      y = checkPageBreak(doc, y, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 120);
      doc.text(`Interview: ${roleName(personaId)}`, 14, y);
      doc.setDrawColor(200, 205, 230);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;

      validMsgs.forEach(msg => {
        y = checkPageBreak(doc, y, 14);

        if (msg.role === 'user') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 60);
          doc.text('Q:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 80);
          const qLines = doc.splitTextToSize(msg.text || '', pw - 10);
          doc.text(qLines, 20, y);
          y += qLines.length * lh + 3;
        } else if (msg.role === 'persona') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 100, 60);
          doc.text('A:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 80, 60);
          const aLines = doc.splitTextToSize(msg.summary || '', pw - 10);
          doc.text(aLines, 20, y);
          y += aLines.length * lh;

          if (msg.rationale) {
            y += 2;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 120);
            const rLines = doc.splitTextToSize(`Rationale: ${msg.rationale}`, pw - 12);
            doc.text(rLines, 22, y);
            y += rLines.length * lh;
          }

          if (msg.confidence != null) {
            y += 1;
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(130, 130, 140);
            doc.text(`Confidence: ${msg.confidence}%`, 22, y);
            y += 4;
          }
          y += 3;
        }
      });
      y += 6;
    });
  }

  // ── Footer on all pages ───────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 190);
    doc.text(`Page ${p} of ${totalPages}`, 105, 291, { align: 'center' });
    doc.text('Generated by Team Decision Simulation', 14, 291);
    doc.text(new Date().toLocaleDateString(), 196, 291, { align: 'right' });
  }

  return doc;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SimulationPDFExport({ simulation, personaTranscripts, allRoles, open, onClose }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    if (!simulation) return;
    setGenerating(true);
    try {
      const doc = buildPDF(simulation, personaTranscripts, allRoles);
      const filename = `simulation-report-${(simulation.title || 'export').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.pdf`;
      doc.save(filename);
      toast.success('PDF report downloaded');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
    setGenerating(false);
  };

  const hasTranscripts = personaTranscripts && Object.values(personaTranscripts).some(msgs => msgs?.length > 0);
  const debrief = buildDebriefData(simulation);
  const totalDebriefItems = debrief.key_insights.length + debrief.lessons_learned.length + debrief.action_items.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileDown className="w-5 h-5 text-slate-700" />
            Export PDF Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            A professional PDF summary report will be generated including:
          </p>

          <div className="space-y-2">
            {[
              { icon: FileDown, label: 'Scenario & Executive Summary', always: true },
              { icon: FileDown, label: `Role Perspectives (${simulation?.responses?.length || 0} roles)`, always: true },
              { icon: AlertTriangle, label: `Tensions (${simulation?.tensions?.length || 0} identified)`, always: true },
              { icon: FileDown, label: `Decision Trade-offs (${simulation?.decision_trade_offs?.length || 0})`, always: true },
              { icon: Lightbulb, label: `Debrief Board (${totalDebriefItems} items)`, active: totalDebriefItems > 0 },
              { icon: CheckSquare, label: `Action Items (${simulation?.next_steps?.length || 0})`, active: (simulation?.next_steps?.length || 0) > 0 },
              { icon: MessageSquare, label: `Persona Interview Transcripts (${Object.values(personaTranscripts || {}).flat().filter(m => !m?.loading).length} messages)`, active: hasTranscripts },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${item.always || item.active ? 'bg-slate-50 text-slate-700' : 'bg-slate-50/50 text-slate-400'}`}>
                <item.icon className={`w-4 h-4 shrink-0 ${item.always || item.active ? 'text-slate-600' : 'text-slate-300'}`} />
                <span>{item.label}</span>
                {(item.always || item.active) && (
                  <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1 text-emerald-600 border-emerald-200">
                    ✓
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {!hasTranscripts && (
            <p className="text-xs text-slate-400 flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Open the Interview panel and chat with personas to include their transcripts in the report.
            </p>
          )}

          <Button
            className="w-full gap-2 bg-slate-800 hover:bg-slate-700"
            onClick={handleExport}
            disabled={generating || !simulation}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}