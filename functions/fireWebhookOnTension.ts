import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { simulationId, tensions } = await req.json();

    if (!simulationId || !tensions) {
      return Response.json({ skipped: true });
    }

    // Check for critical tensions
    const criticalTensions = tensions.filter(t => t.severity === 'critical');
    
    if (criticalTensions.length === 0) {
      return Response.json({ fired: 0 });
    }

    // Get all active webhooks
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({});
    const activeWebhooks = webhooks.filter(w => 
      w.active !== false && w.events?.includes('tension.critical')
    );

    if (activeWebhooks.length === 0) {
      return Response.json({ fired: 0 });
    }

    const simulation = await base44.entities.Simulation.filter({ id: simulationId });
    const sim = simulation[0];

    // Fire webhook for each critical tension
    let fired = 0;
    for (const tension of criticalTensions) {
      const payload = {
        event: 'tension.critical',
        simulation_id: simulationId,
        simulation_title: sim?.title,
        tension: {
          between: tension.between,
          description: tension.description,
          severity: tension.severity,
          root_cause: tension.root_cause
        },
        timestamp: new Date().toISOString()
      };

      for (const webhook of activeWebhooks) {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret })
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000)
          });

          const updateData = {
            ...(response.ok && { success_count: (webhook.success_count || 0) + 1 }),
            ...(!response.ok && { failure_count: (webhook.failure_count || 0) + 1 }),
            last_triggered: new Date().toISOString()
          };

          await base44.asServiceRole.entities.Webhook.update(webhook.id, updateData);
          if (response.ok) fired++;
        } catch (error) {
          console.error(`Failed to fire webhook ${webhook.id}:`, error);
          await base44.asServiceRole.entities.Webhook.update(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1,
            last_triggered: new Date().toISOString()
          });
        }
      }
    }

    return Response.json({ fired });
  } catch (error) {
    console.error('fireWebhookOnTension error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});