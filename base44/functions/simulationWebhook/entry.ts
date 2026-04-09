import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Validate webhook secret from query params
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

    if (expectedSecret && secret !== expectedSecret) {
      return Response.json({ error: 'Invalid webhook secret' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle different webhook events
    const { event, data } = payload;

    if (event === 'simulation.completed') {
      // Trigger any post-simulation actions
      // For example, notify team, create tasks, etc.
      
      const simulation = await base44.asServiceRole.entities.Simulation.get(data.simulationId);
      
      // Example: Log completion
      console.log(`Simulation completed: ${simulation.title}`);

      // You can add custom logic here:
      // - Send notifications
      // - Create tasks in external systems
      // - Update related records

      return Response.json({ 
        success: true, 
        message: 'Webhook processed',
        simulationId: data.simulationId 
      });
    }

    if (event === 'task.imported') {
      // Handle imported tasks from external systems
      const { tasks, source } = data;
      
      console.log(`Imported ${tasks.length} tasks from ${source}`);

      return Response.json({ 
        success: true, 
        tasksProcessed: tasks.length 
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Webhook received but no handler defined for this event' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});