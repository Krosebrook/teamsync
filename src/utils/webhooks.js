import { base44 } from '@/api/base44Client';

/**
 * Fire outbound webhooks for a given event type.
 * @param {string} eventType - e.g. "simulation.completed"
 * @param {object} payload - JSON payload to POST
 */
export async function fireWebhooks(eventType, payload) {
  let webhooks = [];
  try {
    webhooks = await base44.entities.Webhook.filter({ active: true });
  } catch (e) {
    console.error('[Webhooks] Failed to fetch webhooks:', e);
    return;
  }

  const targets = webhooks.filter(w => Array.isArray(w.events) && w.events.includes(eventType));
  if (!targets.length) return;

  const fullPayload = { ...payload, timestamp: new Date().toISOString() };

  await Promise.allSettled(
    targets.map(async (webhook) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (webhook.secret) headers['X-Webhook-Secret'] = webhook.secret;

        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(fullPayload),
        });

        if (res.ok) {
          await base44.entities.Webhook.update(webhook.id, {
            success_count: (webhook.success_count || 0) + 1,
            last_triggered: new Date().toISOString(),
          });
        } else {
          await base44.entities.Webhook.update(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1,
          });
        }
      } catch (e) {
        console.error(`[Webhooks] Failed to POST to ${webhook.url}:`, e);
        try {
          await base44.entities.Webhook.update(webhook.id, {
            failure_count: (webhook.failure_count || 0) + 1,
          });
        } catch (_) {}
      }
    })
  );
}