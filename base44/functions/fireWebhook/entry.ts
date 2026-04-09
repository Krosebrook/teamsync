import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Fire outbound webhook POST request and track success/failure
 * Called during simulation completion and tension detection
 */
Deno.serve(async (req) => {
  try {
    const { webhook, payload } = await req.json();

    if (!webhook || !payload) {
      return Response.json({ error: 'Missing webhook or payload' }, { status: 400 });
    }

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
    const base44 = createClientFromRequest(req);

    // Update webhook record with success/failure metrics
    await base44.asServiceRole.entities.Webhook.update(webhook.id, {
      ...(isSuccess && { success_count: (webhook.success_count || 0) + 1 }),
      ...(!isSuccess && { failure_count: (webhook.failure_count || 0) + 1 }),
      last_triggered: new Date().toISOString()
    });

    return Response.json({ 
      success: isSuccess, 
      status: response.status,
      webhookId: webhook.id 
    });
  } catch (error) {
    console.error('fireWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});