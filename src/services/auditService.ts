import db from '../config/database';

export const logAudit = async (userId: string | null, action: string, resourceName: string, recordId: string) => {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      resource_name: resourceName,
      record_id: recordId,
      timestamp: db.fn.now()
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
