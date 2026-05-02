export function canManageProject(user, project) {
  if (!user || !project) return false
  if (user.role === 'admin') return true
  const creator = project.createdBy?._id ?? project.createdBy
  return String(creator) === String(user._id)
}

export function userId(u) {
  return u?._id != null ? String(u._id) : ''
}
