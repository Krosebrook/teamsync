import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulation_id, field, line, char, is_editing } = await req.json();

    if (!simulation_id || !field) {
      return Response.json({ error: 'simulation_id and field required' }, { status: 400 });
    }

    // Assign random color on first activity
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const colorHash = user.email.charCodeAt(0) + user.email.charCodeAt(user.email.length - 1);
    const color = colors[colorHash % colors.length];

    // Find or create active session
    const sessions = await base44.entities.ActiveSession.filter({
      simulation_id,
      user_email: user.email,
    });

    if (sessions && sessions.length > 0) {
      const session = sessions[0];
      await base44.entities.ActiveSession.update(session.id, {
        cursor_position: { field, line: line || 0, char: char || 0 },
        last_activity: new Date().toISOString(),
        is_editing: is_editing || false,
      });
    } else {
      await base44.entities.ActiveSession.create({
        simulation_id,
        user_email: user.email,
        cursor_position: { field, line: line || 0, char: char || 0 },
        color,
        last_activity: new Date().toISOString(),
        is_editing: is_editing || false,
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});