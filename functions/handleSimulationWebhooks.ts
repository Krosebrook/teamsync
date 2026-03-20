import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!event?.entity_name || !data?.id) {
      return Response.json({ skipped: true });
    }

    // Handle simulation completion
    if (event.entity_name === 'Simulation' && event.type === 'update' && data.status === 'completed') {
      const webhooks = await base44.asServiceRole.entities.Webhook.filter({});
      const activeWebhooks = webhooks.filter(w => 
        w.active !== false && w.events?.includes('simulation.completed')
      );

      if (activeWebhooks.length > 0) {
        const payload = {
          event: 'simulation.completed',
          simulation_id: data.id,
          title: data.title,
          use_case_type: data.use_case_type,
          roles_count: data.selected_roles?.length || 0,
          tensions_count: data.tensions?.length || 0,
          has_critical_tension: (data.tensions || []).some(t => t.severity === 'critical'),
          timestamp: new Date().toISOString()
        };

        for (const webhook of activeWebhooks) {
          fireWebhook(webhook, payload);
        }
      }
    }

    // Handle simulation started
    if (event.entity_name === 'Simulation' && event.type === 'create') {
      const webhooks = await base44.asServiceRole.entities.Webhook.filter({});
      const activeWebhooks = webhooks.filter(w => 
        w.active !== false && w.events?.includes('simulation.started')
      );

      if (activeWebhooks.length > 0) {
        const payload = {
          event: 'simulation.started',
          simulation_id: data.id,
          title: data.title,
          scenario_preview: (data.scenario || '').substring(0, 100),
          roles: data.selected_roles || [],
          timestamp: new Date().toISOString()
        };

        for (const webhook of activeWebhooks) {
          fireWebhook(webhook, payload);
        }
      }
    }

    return Response.json({ processed: true });
  } catch (error) {
    console.error('handleSimulationWebhooks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fireWebhook(webhook, payload) {
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

    const base44 = createClientFromRequest({ headers: { 'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}` } });
    const updateData = {
      ...(response.ok && { success_count: (webhook.success_count || 0) + 1 }),
      ...(!response.ok && { failure_count: (webhook.failure_count || 0) + 1 }),
      last_triggered: new Date().toISOString()
    };

    await fetch(`${Deno.env.get('BASE44_API_URL')}/entities/Webhook/${webhook.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}`
      },
      body: JSON.stringify(updateData)
    });
  } catch (error) {
    console.error(`Failed to fire webhook ${webhook.id}:`, error);
  }
}