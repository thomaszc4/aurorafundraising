
import { ProjectTask } from '@/hooks/useProjectManagerTasks';

export function generateICS(tasks: ProjectTask[], campaignName: string): string {
    const events = tasks.filter(t => t.due_date).map(t => {
        // ICS Date Format: YYYYMMDD
        const dateStr = t.due_date!.toISOString().replace(/[-:]/g, '').split('T')[0];

        // Create unique ID
        const uid = `${t.id}@aurorafundraising.com`;

        return [
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTSTART;VALUE=DATE:${dateStr}`,
            `SUMMARY:${t.task} (${campaignName})`,
            `DESCRIPTION:${t.description || ''}`,
            'END:VEVENT'
        ].join('\r\n');
    });

    const calendar = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Aurora Fundraising//Project Manager//EN',
        ...events,
        'END:VCALENDAR'
    ].join('\r\n');

    return calendar;
}

export function downloadICS(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
