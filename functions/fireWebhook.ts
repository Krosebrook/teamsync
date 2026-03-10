import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function signPayload(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deliverWebhook(webhook, payload, attempt = 1, maxAttempts = 3) {
  const signature = await signPayload(payload, webhook.secret || '');

  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': new Date().toISOString(),
    },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!response || !response.ok) {
    if (attempt < maxAttempts) {
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return deliverWebhook(webhook, payload, attempt + 1, maxAttempts);
    }
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_type, simulation_id, payload: customPayload } = await req.json();

    if (!event_type) {
      return Response.json({ error: 'event_type required' }, { status: 400 });
    }

    // Fetch webhooks for this simulation
    const webhooks = await base44.entities.Webhook.filter({ events: event_type, active: true });
    if (!webhooks || webhooks.length === 0) {
      return Response.json({ delivered: 0, failed: 0 });
    }

    const fullPayload = {
      event_type,
      timestamp: new Date().toISOString(),
      simulation_id,
      user_id: user.id,
      user_email: user.email,
      ...customPayload,
    };

    let delivered = 0;
    let failed = 0;

    for (const webhook of webhooks) {
      const success = await deliverWebhook(webhook, fullPayload);
      if (success) {
        delivered++;
        await base44.entities.Webhook.update(webhook.id, {
          last_triggered: new Date().toISOString(),
          success_count: (webhook.success_count || 0) + 1,
        }).catch(() => {});
      } else {
        failed++;
        await base44.entities.Webhook.update(webhook.id, {
          failure_count: (webhook.failure_count || 0) + 1,
        }).catch(() => {});
      }
    }

    return Response.json({ delivered, failed, total: webhooks.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});