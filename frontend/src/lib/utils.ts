export function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

export function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
}
