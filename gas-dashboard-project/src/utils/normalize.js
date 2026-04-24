export function normalizeRiskLabel(value) {
  if (!value) return 'UNKNOWN';
  const text = String(value).toUpperCase();
  if (['NORMAL', 'SAFE', 'NONE', 'CLOSED', 'OFF'].includes(text)) return 'SAFE';
  if (['WARNING', 'OPEN', 'MEDIUM'].includes(text)) return 'WARNING';
  if (['DANGER', 'CRITICAL', 'HIGH', 'ALERT'].includes(text)) return 'DANGER';
  return text;
}
