export default function GaugeCard({ value = 0, min = 0, max = 800, unit = 'gas_level_ppm' }) {
  const safeEnd = 330;
  const warnEnd = 500;
  const clamped = Math.max(min, Math.min(max, value));

  const data = [
    { name: 'value', value: clamped, fill: '#111111' },
  ];

  return (
    <div className="gauge-card">
      <div className="gauge-visual">
        <div className="gauge-arc safe" />
        <div className="gauge-arc warning" />
        <div className="gauge-arc danger" />
        <div
          className="gauge-needle"
          style={{ transform: `translateX(-50%) rotate(${(-90 + ((clamped - min) / (max - min)) * 180)}deg)` }}
        />
        <div className="gauge-center-dot" />
      </div>
      <div className="gauge-value">{value}</div>
      <div className="gauge-unit">{unit}</div>
      <div className="gauge-thresholds">Safe ≤ {safeEnd} | Warning ≤ {warnEnd} | Danger &gt; {warnEnd}</div>
    </div>
  );
}
