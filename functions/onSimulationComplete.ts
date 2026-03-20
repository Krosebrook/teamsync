import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update' || !data?.id) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const simulation = data;

    // Only fire if status changed to completed
    if (simulation.status !== 'completed') {
      return Response.json({ skipped: true });
    }

    // Query webhooks for simulation.completed event
    const webhooks = await base44.asServiceRole.entities.Webhook.filter({});
    const activeWebhooks = webhooks.filter(w => 
      w.active !== false && w.events?.includes('simulation.completed')
    );

    if (activeWebhooks.length === 0) {
      return Response.json({ fired: 0 });
    }

    const payload = {
      event: 'simulation.completed',
      simulation_id: simulation.id,
      title: simulation.title,
      use_case_type: simulation.use_case_type,
      roles_count: simulation.selected_roles?.length || 0,
      tensions_count: simulation.tensions?.length || 0,
      has_critical_tension: (simulation.tensions || []).some(t => t.severity === 'critical'),
      timestamp: new Date().toISOString()
    };

    // Fire each webhook
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

        // Update webhook metrics
        await base44.asServiceRole.entities.Webhook.update(webhook.id, {
          ...(response.ok && { success_count: (webhook.success_count || 0) + 1 }),
          ...(!response.ok && { failure_count: (webhook.failure_count || 0) + 1 }),
          last_triggered: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to fire webhook ${webhook.id}:`, error);
        await base44.asServiceRole.entities.Webhook.update(webhook.id, {
          failure_count: (webhook.failure_count || 0) + 1,
          last_triggered: new Date().toISOString()
        });
      }
    }

    return Response.json({ fired: activeWebhooks.length });
  } catch (error) {
    console.error('onSimulationComplete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});