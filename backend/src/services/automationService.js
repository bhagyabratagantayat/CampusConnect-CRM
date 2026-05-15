const db = require('../config/db');
const emailService = require('./emailService');

/**
 * Automation Service

 * Triggers: LEAD_CREATED, LEAD_STATUS_CHANGED, FOLLOWUP_CREATED, FOLLOWUP_MISSED, LEAD_UNRESPONSIVE
 */
const trigger = async (event, payload) => {
  console.log(`[Automation] Triggering event: ${event}`);
  
  try {
    // 1. Fetch active rules for this event
    const rules = await db.query(
      'SELECT * FROM automation_rules WHERE trigger_event = $1 AND is_active = true',
      [event]
    );

    for (const rule of rules.rows) {
      await executeRule(rule, payload);
    }
  } catch (error) {
    console.error(`[Automation] Error triggering rules for ${event}:`, error.message);
  }
};

const executeRule = async (rule, payload) => {
  const { id: ruleId, action_type, action_config } = rule;
  const leadId = payload.leadId || payload.id;

  console.log(`[Automation] Executing rule ${ruleId} (${action_type}) for lead ${leadId}`);

  try {
    let result = '';
    
    switch (action_type) {
      case 'CREATE_ACTIVITY':
        const description = action_config.template || `Automation triggered: ${rule.name}`;
        await db.query(
          'INSERT INTO activities (lead_id, activity_type, description) VALUES ($1, $2, $3)',
          [leadId, 'AUTOMATION', description]
        );
        result = 'Activity created';
        break;

      case 'AUTO_ASSIGN':
        // If status matches config, assign to first available admin/manager if not assigned
        if (payload.status === action_config.status) {
          const admins = await db.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
          if (admins.rows.length > 0) {
            await db.query('UPDATE leads SET counselor_id = $1 WHERE id = $2', [admins.rows[0].id, leadId]);
            result = `Auto-assigned to Admin (ID: ${admins.rows[0].id})`;
          }
        }
        break;

      case 'CHANGE_STATUS':
        if (!action_config.new_status) break;
        await db.query('UPDATE leads SET status = $1 WHERE id = $2', [action_config.new_status, leadId]);
        result = `Status changed to ${action_config.new_status}`;
        break;

      case 'SEND_EMAIL':
        if (!action_config.template) break;
        const toEmail = action_config.to_admin ? process.env.GMAIL_USER : null;
        const emailResult = await emailService.sendEmail(leadId, action_config.template, toEmail);
        result = emailResult.success ? `Email sent (${action_config.template})` : `Email failed: ${emailResult.error}`;
        break;

      case 'ENQUEUE_CALL':
        // If status matches config (optional filter)
        if (action_config.status && payload.status !== action_config.status) {
          result = 'Skipped: status mismatch';
          break;
        }
        const priority = action_config.priority || 1;
        await db.query(
          'INSERT INTO call_queue (lead_id, priority, call_status) VALUES ($1, $2, $3)',
          [leadId, priority, 'PENDING']
        );
        result = `Lead enqueued for AI Call (Priority: ${priority})`;
        break;




      default:
        result = 'Action type not supported';
    }

    // Log execution
    await db.query(
      'INSERT INTO automation_logs (lead_id, trigger_event, action_type, execution_status, execution_result) VALUES ($1, $2, $3, $4, $5)',
      [leadId, rule.trigger_event, action_type, 'SUCCESS', result]
    );

  } catch (error) {
    console.error(`[Automation] Rule ${ruleId} failed:`, error.message);
    await db.query(
      'INSERT INTO automation_logs (lead_id, trigger_event, action_type, execution_status, execution_result) VALUES ($1, $2, $3, $4, $5)',
      [leadId, rule.trigger_event, action_type, 'FAILED', error.message]
    );
  }
};

const getAllRules = async () => {
  const result = await db.query('SELECT * FROM automation_rules ORDER BY created_at DESC');
  return result.rows;
};

const toggleRule = async (id, isActive) => {
  const result = await db.query(
    'UPDATE automation_rules SET is_active = $1 WHERE id = $2 RETURNING *',
    [isActive, id]
  );
  return result.rows[0];
};

const getLogs = async (limit = 50) => {
  const result = await db.query(
    'SELECT al.*, l.full_name as lead_name FROM automation_logs al LEFT JOIN leads l ON al.lead_id = l.id ORDER BY al.created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
};

module.exports = {
  trigger,
  getAllRules,
  toggleRule,
  getLogs
};
