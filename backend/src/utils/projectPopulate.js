
export function projectPopulation() {
    return [
        { path: 'createdBy', select: 'username email role' },
        { path: 'members', select: 'username email role' },
    ];
}
