export function canViewProject(user, project) {
    if (!project) return false;
    if (user.role === 'admin') return true;
    const uid = String(user._id);
    if (String(project.createdBy) === uid) return true;
    return (project.members || []).some((m) => String(m) === uid);
}

export function canManageProject(user, project) {
    if (!project) return false;
    if (user.role === 'admin') return true;
    return String(project.createdBy) === String(user._id);
}
