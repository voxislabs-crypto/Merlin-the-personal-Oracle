const OBJECTS = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Lunar Node'];
const ASPECTS = ['Conjunction', 'Sextile', 'Square', 'Trine', 'Opposition'];

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculatePlaceholderTimeTrak(chart) {
  const offset = (chart.name.length + Number(chart.latitude || 0)) % 5;
  const duration = 2 + Math.round(offset);
  const start = addDays(chart.date, Math.round(offset));
  const peak = addDays(start, Math.max(1, Math.floor(duration / 2)));
  const end = addDays(start, duration);
  return {
    start, peak, end,
    duration: `${duration + 1} days`,
    intensity: Math.round(52 + ((chart.name.length * 7 + Math.abs(Number(chart.longitude || 0))) % 43)),
    object: OBJECTS[chart.name.length % OBJECTS.length],
    aspect: ASPECTS[(chart.name.length + Math.round(Number(chart.longitude || 0))) % ASPECTS.length],
    aspectType: 'Major',
    orb: Number((0.8 + (offset / 3)).toFixed(1)),
    direction: chart.name.length % 2 ? 'Applying' : 'Separating',
    quality: 'Exploratory',
    version: 'placeholder-0.1'
  };
}

export function findConvergence(traks) {
  if (traks.length < 2) return null;
  const starts = traks.map((trak) => new Date(`${trak.start}T12:00:00`).getTime());
  const ends = traks.map((trak) => new Date(`${trak.end}T12:00:00`).getTime());
  const start = new Date(Math.max(...starts)).toISOString().slice(0, 10);
  const end = new Date(Math.min(...ends)).toISOString().slice(0, 10);
  if (start > end) return null;
  const peaks = traks.map((trak) => new Date(`${trak.peak}T12:00:00`).getTime());
  const peak = new Date(peaks.sort((a, b) => a - b)[Math.floor(peaks.length / 2)]).toISOString().slice(0, 10);
  return { start, peak, end, count: traks.length, intensity: Math.round(traks.reduce((sum, trak) => sum + trak.intensity, 0) / traks.length), objects: traks.map((trak) => trak.object) };
}
