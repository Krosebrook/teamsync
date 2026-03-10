import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_LABEL = { critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '🟢 Low' };
const PRIORITY_LABEL = { high: '↑ High', medium: '→ Medium', low: '↓ Low' };

/**
 * Write text with auto page-break.
 * Returns new y position.
 */
function writeText(doc, text, x, y, options = {}) {
  const { maxWidth = 170, fontSize = 10, bold = false, color = [30, 41, 59] } = options;
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  if (y + lines.length * (fontSize * 0.4 + 1) > 280) {
    doc.addPage();
    y = 20;
  }
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 0.4 + 1) + 2;
}

function section(doc, title, y) {
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title, 16, y + 1);
  return y + 10;
}

function divider(doc, y) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  return y + 5;
}

function confidenceBar(doc, confidence, x, y) {
  const barW = 40, barH = 3;
  doc.setFillColor(226, 232, 240);
  doc.rect(x, y, barW, barH, 'F');
  const fill = confidence >= 70 ? [16, 185, 129] : confidence >= 40 ? [245, 158, 11] : [244, 63, 94];
  doc.setFillColor(...fill);
  doc.rect(x, y, barW * (confidence / 100), barH, 'F');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Support both calling styles: { simulation_id } or { simulation: {...} }
    let sim = body.simulation || null;
    if (!sim && body.simulation_id) {
      const results = await base44.entities.Simulation.filter({ id: body.simulation_id });
      if (!results?.length) return Response.json({ error: 'Simulation not found' }, { status: 404 });
      sim = results[0];
    }
    if (!sim) return Response.json({ error: 'simulation or simulation_id required' }, { status: 400 });

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 20;

    // ── Cover Page ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 60, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Decision Simulation Report', 14, 28);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const titleLines = doc.splitTextToSize(sim.title || 'Untitled', 182);
    doc.text(titleLines, 14, 40);

    y = 72;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    const meta = [
      `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `Participants: ${sim.selected_roles?.length || 0} roles`,
      `Status: ${sim.status || 'completed'}`,
      sim.use_case_type ? `Decision type: ${sim.use_case_type.replace(/_/g, ' ')}` : null,
      sim.version_number ? `Version: v${sim.version_number}` : null,
      sim.parent_simulation_id ? `Forked from: ${sim.parent_simulation_id}` : null,
    ].filter(Boolean);

    meta.forEach(line => {
      doc.text(line, 14, y);
      y += 5;
    });

    y = divider(doc, y + 5);

    // ── Executive Summary ───────────────────────────────────────────────────
    if (sim.summary) {
      y = section(doc, 'Executive Summary', y);
      y = writeText(doc, sim.summary, 16, y, { maxWidth: 178, fontSize: 10 });
      y += 4;
    }

    // ── Role Perspectives ───────────────────────────────────────────────────
    if (sim.responses?.length) {
      y = section(doc, 'Role Perspectives', y);

      sim.responses.forEach((resp, i) => {
        if (y > 255) { doc.addPage(); y = 20; }

        const roleConfig = sim.selected_roles?.find(r => r.role === resp.role);
        const influence = roleConfig?.influence || '–';

        // Role name header
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 3, 182, 6, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${resp.role?.replace(/_/g, ' ') || 'Unknown Role'}`, 16, y + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Influence: ${influence}/10  |  Risk: ${resp.risk_tolerance || '–'}`, 130, y + 1);
        y += 8;

        if (resp.position) {
          y = writeText(doc, resp.position, 16, y, { maxWidth: 178, fontSize: 9, color: [51, 65, 85] });
        }

        if (resp.primary_driver) {
          y = writeText(doc, `Primary driver: ${resp.primary_driver}`, 16, y, { maxWidth: 178, fontSize: 8, color: [100, 116, 139] });
        }

        if (resp.concerns?.length) {
          y = writeText(doc, 'Key concerns:', 16, y, { fontSize: 8, bold: true, color: [71, 85, 105] });
          resp.concerns.forEach(c => {
            y = writeText(doc, `• ${c}`, 20, y, { maxWidth: 172, fontSize: 8, color: [71, 85, 105] });
          });
        }

        if (resp.recommendation) {
          y = writeText(doc, `Recommendation: ${resp.recommendation}`, 16, y, { maxWidth: 178, fontSize: 8, color: [79, 70, 229] });
        }

        y += 3;
      });
    }

    // ── Tensions ────────────────────────────────────────────────────────────
    if (sim.tensions?.length) {
      y = section(doc, `Identified Tensions (${sim.tensions.length})`, y);

      sim.tensions.forEach(tension => {
        if (y > 260) { doc.addPage(); y = 20; }

        const label = SEVERITY_LABEL[tension.severity] || tension.severity;
        y = writeText(doc, `${tension.between?.join(' ↔ ') || ''}  —  ${label}`, 16, y, { fontSize: 9, bold: true, color: [30, 41, 59] });
        if (tension.description) {
          y = writeText(doc, tension.description, 20, y, { maxWidth: 170, fontSize: 8.5, color: [71, 85, 105] });
        }
        y += 2;
      });
    }

    // ── Decision Trade-Offs ─────────────────────────────────────────────────
    if (sim.decision_trade_offs?.length) {
      y = section(doc, 'Decision Trade-Offs', y);

      sim.decision_trade_offs.forEach(tradeoff => {
        if (y > 255) { doc.addPage(); y = 20; }

        y = writeText(doc, tradeoff.trade_off, 16, y, { fontSize: 10, bold: true });

        // Two-column option display
        const optW = 84;
        const startY = y;
        doc.setFillColor(240, 253, 244);
        doc.rect(16, startY - 1, optW, 12, 'F');
        doc.setFillColor(255, 241, 242);
        doc.rect(16 + optW + 4, startY - 1, optW, 12, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 128, 61);
        doc.text('Option A', 18, startY + 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(21, 128, 61);
        const aLines = doc.splitTextToSize(tradeoff.option_a || '', optW - 4);
        doc.text(aLines.slice(0, 2), 18, startY + 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(190, 18, 60);
        doc.text('Option B', 16 + optW + 6, startY + 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(190, 18, 60);
        const bLines = doc.splitTextToSize(tradeoff.option_b || '', optW - 4);
        doc.text(bLines.slice(0, 2), 16 + optW + 6, startY + 5);

        y = startY + 15;
      });
    }

    // ── Recommended Actions ─────────────────────────────────────────────────
    if (sim.next_steps?.length) {
      y = section(doc, `Recommended Actions (${sim.next_steps.length})`, y);

      const total = sim.next_steps.length;
      const done = sim.next_steps.filter(s => s.completed).length;
      y = writeText(doc, `Completion: ${done}/${total} actions completed`, 16, y, { fontSize: 8.5, color: [100, 116, 139] });
      y += 2;

      sim.next_steps.forEach((step, idx) => {
        if (y > 262) { doc.addPage(); y = 20; }

        const priorityLabel = PRIORITY_LABEL[step.priority] || step.priority || '—';
        const confidence = step.confidence || 0;
        const checkmark = step.completed ? '✓' : `${idx + 1}.`;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(step.completed ? 100 : 30, step.completed ? 116 : 41, step.completed ? 139 : 59);
        doc.text(`${checkmark}`, 16, y);

        doc.setFont('helvetica', step.completed ? 'normal' : 'bold');
        const actionLines = doc.splitTextToSize(step.action || '', 155);
        doc.text(actionLines, 22, y);
        y += actionLines.length * 4 + 1;

        // Meta row
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const meta = `Owner: ${step.owner_role?.replace(/_/g, ' ') || '—'}  |  Priority: ${priorityLabel}  |  Confidence: ${confidence}%`;
        doc.text(meta, 22, y);

        // Confidence bar
        confidenceBar(doc, confidence, 150, y - 2.5);

        y += 5;

        if (step.subtasks?.length) {
          step.subtasks.forEach(st => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(7);
            doc.setTextColor(st.completed ? 148 : 71, st.completed ? 163 : 85, st.completed ? 184 : 105);
            doc.text(`  ${st.completed ? '✓' : '○'} ${st.title || ''}`, 26, y);
            y += 4;
          });
        }

        y += 1;
      });
    }

    // ── Tags & Metadata Footer ──────────────────────────────────────────────
    if (sim.tags?.length) {
      y += 4;
      y = writeText(doc, `Tags: ${sim.tags.join(', ')}`, 16, y, { fontSize: 8, color: [148, 163, 184] });
    }

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, 196, 290, { align: 'right' });
      doc.text('TeamSync Decision Platform', 14, 290);
    }

    const pdfBytes = doc.output('arraybuffer');
    const safeName = (sim.title || 'simulation').replace(/[^a-z0-9\-_ ]/gi, '_').slice(0, 60);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});