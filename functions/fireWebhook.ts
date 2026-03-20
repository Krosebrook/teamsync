import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId, payload } = await req.json();
    
    if (!webhookId || !payload) {
      return Response.json({ error: 'Missing webhookId or payload' }, { status: 400 });
    }

    // Get webhook record
    const webhook = await base44.entities.Webhook.filter({ id: webhookId });
    if (!webhook || webhook.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhookRecord = webhook[0];
    
    // Fire the webhook
    let success = false;
    try {
      const response = await fetch(webhookRecord.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookRecord.secret && { 'X-Webhook-Secret': webhookRecord.secret })
        },
        body: JSON.stringify(payload)
      });

      success = response.ok;
    } catch (error) {
      console.error('Webhook fire error:', error);
      success = false;
    }

    // Update webhook metrics
    const updateData = {
      ...(success && { success_count: (webhookRecord.success_count || 0) + 1 }),
      ...(!success && { failure_count: (webhookRecord.failure_count || 0) + 1 }),
      last_triggered: new Date().toISOString()
    };

    await base44.entities.Webhook.update(webhookRecord.id, updateData);

    return Response.json({ success, webhookId });
  } catch (error) {
    console.error('fireWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});