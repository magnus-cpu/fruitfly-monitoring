export const getOwnerUserId = (user) => {
  if (!user) return null;
  return user.role === 'viewer' ? user.manager_user_id : user.id;
};
