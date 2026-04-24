import { formatChartTime } from './formatters';

export function buildSimpleForecast(data, sourceKey) {
  const base = [...data].slice(-6);
  if (base.length === 0) return [];

  const values = base.map((item) => Number(item[sourceKey] || 0));
  const avgStep = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
  const lastValue = values[values.length - 1];
  const lastTime = new Date(base[base.length - 1].timestamp || Date.now());

  const forecast = [];
  for (let i = 1; i <= 6; i++) {
    const next = new Date(lastTime.getTime() + i * 30 * 60 * 1000);
    forecast.push({
      timeLabel: formatChartTime(next.toISOString()),
      value: Math.max(0, Math.round(lastValue + avgStep * i)),
    });
  }
  return forecast;
}
