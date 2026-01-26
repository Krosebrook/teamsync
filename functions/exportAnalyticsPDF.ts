import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { insights, stats } = await req.json();

    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Analytics Report', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    doc.text(`User: ${user.email}`, 20, y + 5);
    y += 20;

    // Stats Overview
    doc.setFontSize(14);
    doc.text('Overview', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Total Simulations: ${stats.totalSimulations}`, 20, y);
    doc.text(`Critical Tensions: ${stats.criticalTensions}`, 100, y);
    y += 6;
    doc.text(`Unique Roles: ${stats.uniqueRoles}`, 20, y);
    doc.text(`Avg Roles/Sim: ${stats.avgRolesPerSim}`, 100, y);
    y += 15;

    // Role Trends
    if (insights.role_trends && insights.role_trends.length > 0) {
      doc.setFontSize(14);
      doc.text('Role Sentiment Trends', 20, y);
      y += 8;

      doc.setFontSize(9);
      insights.role_trends.forEach(trend => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(trend.role.replace(/_/g, ' ').toUpperCase(), 20, y);
        doc.setFont(undefined, 'normal');
        y += 5;
        doc.text(`Sentiment: ${trend.sentiment}`, 25, y);
        y += 4;
        const trendLines = doc.splitTextToSize(trend.trend, 160);
        doc.text(trendLines, 25, y);
        y += trendLines.length * 4 + 5;
      });
      y += 5;
    }

    // Recurring Tensions
    if (insights.recurring_tensions && insights.recurring_tensions.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Recurring Tensions', 20, y);
      y += 8;

      doc.setFontSize(9);
      insights.recurring_tensions.forEach(tension => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(tension.between.join(' vs '), 20, y);
        doc.setFont(undefined, 'normal');
        y += 5;
        doc.text(`Frequency: ${tension.frequency} | Trend: ${tension.severity_trend}`, 25, y);
        y += 4;
        const patternLines = doc.splitTextToSize(tension.pattern, 160);
        doc.text(patternLines, 25, y);
        y += patternLines.length * 4 + 5;
      });
      y += 5;
    }

    // Predictive Insights
    if (insights.predictions && insights.predictions.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Predictive Analysis', 20, y);
      y += 8;

      doc.setFontSize(9);
      insights.predictions.forEach(pred => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${pred.scenario_type} (${pred.confidence}% confidence)`, 20, y);
        doc.setFont(undefined, 'normal');
        y += 5;
        const outcomeLines = doc.splitTextToSize(pred.predicted_outcome, 160);
        doc.text(outcomeLines, 25, y);
        y += outcomeLines.length * 4 + 5;
      });
      y += 5;
    }

    // Recommendations
    if (insights.recommendations && insights.recommendations.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Process Recommendations', 20, y);
      y += 8;

      doc.setFontSize(9);
      insights.recommendations.forEach((rec, idx) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 160);
        doc.text(recLines, 20, y);
        y += recLines.length * 4 + 2;
      });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});