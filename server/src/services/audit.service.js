export const logAuditEvent = async (
  db,
  {
    actorUserId = null,
    action,
    entityType,
    entityId = null,
    details = null
  }
) => {
  await db.execute(
    `
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      actorUserId,
      action,
      entityType,
      entityId === null || entityId === undefined ? null : String(entityId),
      details ? JSON.stringify(details) : null
    ]
  );
};

export const parseAuditDetails = (value) => {
  if (!value) return null;

  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return { raw: value };
  }
};
