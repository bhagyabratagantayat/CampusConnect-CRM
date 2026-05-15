const db = require('../config/db');

const getAllLeads = async (user) => {
  let query = 'SELECT * FROM leads';
  let params = [];

  // If user is a COUNSELOR, only show assigned leads
  if (user.role === 'COUNSELOR') {
    query += ' WHERE counselor_id = $1';
    params.push(user.id);
  }

  query += ' ORDER BY created_at DESC';
  
  const result = await db.query(query, params);
  return result.rows;
};

const getLeadById = async (id, user) => {
  const result = await db.query('SELECT * FROM leads WHERE id = $1', [id]);
  const lead = result.rows[0];

  if (!lead) return null;

  // Security: Counselors can only view their assigned leads
  if (user.role === 'COUNSELOR' && lead.counselor_id !== user.id) {
    throw new Error('Access denied: You can only view your assigned leads');
  }

  return lead;
};

const createLead = async (leadData, user) => {
  const {
    fullName, phone, email, parentPhone, courseInterested,
    city, state, source, notes, status, assignedCounselor, counselorId
  } = leadData;

  // Auto-assign to current user if they are a COUNSELOR
  const finalCounselorId = user.role === 'COUNSELOR' ? user.id : counselorId;

  const query = `
    INSERT INTO leads (
      full_name, phone, email, parent_phone, course_interested,
      city, state, source, notes, status, assigned_counselor, counselor_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    fullName, phone, email, parentPhone, courseInterested,
    city, state, source, notes, status || 'NEW', assignedCounselor, finalCounselorId
  ];

  const result = await db.query(query, values);
  
  // Log activity
  await db.query(
    'INSERT INTO activities (lead_id, activity_type, description) VALUES ($1, $2, $3)',
    [result.rows[0].id, 'LEAD_CREATED', `Lead created by ${user.fullName} (${user.role})`]
  );

  return result.rows[0];
};

const updateLead = async (id, leadData, user) => {
  const currentLead = await getLeadById(id, user); // Check permission
  if (!currentLead) throw new Error('Lead not found');

  const {
    fullName, phone, email, parentPhone, courseInterested,
    city, state, source, notes, status, assignedCounselor, counselorId
  } = leadData;

  const query = `
    UPDATE leads SET
      full_name = $1, phone = $2, email = $3, parent_phone = $4,
      course_interested = $5, city = $6, state = $7, source = $8,
      notes = $9, status = $10, assigned_counselor = $11, counselor_id = $12
    WHERE id = $13
    RETURNING *
  `;

  const values = [
    fullName, phone, email, parentPhone, courseInterested,
    city, state, source, notes, status, assignedCounselor, counselorId || currentLead.counselor_id, id
  ];

  const result = await db.query(query, values);

  // Log activity
  await db.query(
    'INSERT INTO activities (lead_id, activity_type, description) VALUES ($1, $2, $3)',
    [id, 'LEAD_UPDATED', `Lead updated by ${user.fullName}`]
  );

  return result.rows[0];
};

const deleteLead = async (id, user) => {
  // Only ADMIN/MANAGER can delete (already handled by roleMiddleware, but good to have here)
  await db.query('DELETE FROM leads WHERE id = $1', [id]);
  return { message: 'Lead deleted successfully' };
};

const getFollowupsByLeadId = async (leadId) => {
  const result = await db.query('SELECT * FROM followups WHERE lead_id = $1 ORDER BY followup_date ASC', [leadId]);
  return result.rows;
};

const createFollowup = async (followupData, user) => {
  const { leadId, followupDate, remarks, status } = followupData;
  
  // Verify permission
  await getLeadById(leadId, user);

  const result = await db.query(
    'INSERT INTO followups (lead_id, followup_date, remarks, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [leadId, followupDate, remarks, status || 'PENDING']
  );

  await db.query(
    'INSERT INTO activities (lead_id, activity_type, description) VALUES ($1, $2, $3)',
    [leadId, 'FOLLOWUP_CREATED', `Followup scheduled by ${user.fullName}`]
  );

  return result.rows[0];
};

const getActivitiesByLeadId = async (leadId) => {
  const result = await db.query('SELECT * FROM activities WHERE lead_id = $1 ORDER BY created_at DESC', [leadId]);
  return result.rows;
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getFollowupsByLeadId,
  createFollowup,
  getActivitiesByLeadId
};
