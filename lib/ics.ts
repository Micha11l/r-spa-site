export function makeICS(summary: string, description: string, location: string, startISO: string, endISO: string) {
  const uid = Math.random().toString(36).slice(2);
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtstart = startISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtend = endISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//R Spa//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@r-spa`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g,'\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  return ics;
}
