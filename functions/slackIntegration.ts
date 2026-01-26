import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

    if (!accessToken) {
      return Response.json({ error: 'Slack not connected' }, { status: 401 });
    }

    const slackRequest = async (endpoint, method = 'POST', body = null) => {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`https://slack.com/api/${endpoint}`, options);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Slack API error');
      }

      return data;
    };

    if (action === 'getChannels') {
      const data = await slackRequest('conversations.list', 'GET');
      return Response.json({ channels: data.channels });
    }

    if (action === 'postSummary') {
      const { channelId, simulation } = params;

      const tensionCount = simulation.tensions?.length || 0;
      const criticalTensions = simulation.tensions?.filter(t => t.severity === 'critical').length || 0;

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎯 ${simulation.title}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Scenario:* ${simulation.scenario}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Roles:* ${simulation.selected_roles?.length || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Tensions:* ${tensionCount} (${criticalTensions} critical)`
            }
          ]
        }
      ];

      if (simulation.summary) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:*\n${simulation.summary.substring(0, 500)}${simulation.summary.length > 500 ? '...' : ''}`
          }
        });
      }

      if (simulation.next_steps && simulation.next_steps.length > 0) {
        const steps = simulation.next_steps.slice(0, 3).map((s, i) => 
          `${i + 1}. ${s.action} (${s.priority})`
        ).join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Actions:*\n${steps}`
          }
        });
      }

      const result = await slackRequest('chat.postMessage', 'POST', {
        channel: channelId,
        blocks,
        text: `Simulation: ${simulation.title}`
      });

      return Response.json({ success: true, messageTs: result.ts });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});