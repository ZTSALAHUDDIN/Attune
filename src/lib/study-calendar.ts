export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function studyCalendar(sessions: { created_at: string; duration_seconds: number }[], today = new Date(), weeks = 5) {
  const end = new Date(today); end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7) - (weeks - 1) * 7);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    const key = localDateKey(date);
    const matching = sessions.filter(session => localDateKey(new Date(session.created_at)) === key);
    return { key, date, today: key === localDateKey(end), future: date > end, studied: matching.length > 0, minutes: Math.floor(matching.reduce((sum, session) => sum + session.duration_seconds, 0) / 60) };
  });
}