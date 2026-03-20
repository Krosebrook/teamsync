import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Entity trigger: fires when Simulation status changes to 'completed'
 * Sends outbound webhooks to all active webhook endpoints
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only process simulation updates where status is now 'completed'
    if (event.entity_name !== 'Simulation' || event.type !== 'update' || data?.status !== 'completed') {
      return Response.json({ skipped: true });
    }

    const simulationId = data.id;

    // Fetch all active webhooks
    const allWebhooks = await base44.asServiceRole.entities.Webhook.list();
    if (!allWebhooks || allWebhooks.length === 0) {
      return Response.json({ processed: true, webhooks_fired: 0 });
    }

    // Filter webhooks: active AND subscribed to simulation.completed
    const activeWebhooks = allWebhooks.filter(w => 
      w.active !== false && w.events?.includes('simulation.completed')
    );

    if (activeWebhooks.length === 0) {
      return Response.json({ processed: true, webhooks_fired: 0 });
    }

    // Build webhook payload
    const payload = {
      event: 'simulation.completed',
      simulation_id: simulationId,
      title: data.title,
      use_case_type: data.use_case_type,
      roles_count: data.selected_roles?.length || 0,
      tensions_count: data.tensions?.length || 0,
      has_critical_tension: (data.tensions || []).some(t => t.severity === 'critical'),
      timestamp: new Date().toISOString()
    };

    // Fire webhooks in parallel, don't wait for them
    const firePromises = activeWebhooks.map(webhook =>
      fireWebhookAsync(webhook, payload, base44)
    );

    // Fire in background, don't block response
    Promise.allSettled(firePromises).catch(err => {
      console.error('Webhook firing error:', err);
    });

    return Response.json({ processed: true, webhooks_fired: activeWebhooks.length });
  } catch (error) {
    console.error('onSimulationComplete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Async helper to fire a single webhook with retry logic
 */
async function fireWebhookAsync(webhook, payload, base44) {
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

    const isSuccess = response.ok;

    // Update webhook record metrics
    await base44.asServiceRole.entities.Webhook.update(webhook.id, {
      ...(isSuccess && { success_count: (webhook.success_count || 0) + 1 }),
      ...(!isSuccess && { failure_count: (webhook.failure_count || 0) + 1 }),
      last_triggered: new Date().toISOString()
    });

    console.log(`Webhook ${webhook.name} (${webhook.id}): ${isSuccess ? 'success' : `failed with status ${response.status}`}`);
    return { webhookId: webhook.id, success: isSuccess };
  } catch (error) {
    console.error(`Failed to fire webhook ${webhook.id}:`, error);
    
    // Update failure count
    try {
      await base44.asServiceRole.entities.Webhook.update(webhook.id, {
        failure_count: (webhook.failure_count || 0) + 1,
        last_triggered: new Date().toISOString()
      });
    } catch (updateError) {
      console.error(`Failed to update webhook failure count for ${webhook.id}:`, updateError);
    }
    
    return { webhookId: webhook.id, success: false, error: error.message };
  }
}