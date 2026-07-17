const ROLES = {
  CUSTOMER: 'Customer',
  AGENT: 'Agent',
  ADMIN: 'Admin'
};

const COMPLAINT_STATUS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_CUSTOMER: 'Waiting For Customer',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

const COMPLAINT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

const SUPPORT_TYPE = {
  REQUEST: 'Request',
  INQUIRY: 'Inquiry'
};

const TICKET_PREFIX = {
  COMPLAINT: 'COM-',
  REQUEST: 'REQ-',
  INQUIRY: 'INQ-'
};

module.exports = {
  ROLES,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  SUPPORT_TYPE,
  TICKET_PREFIX
};
