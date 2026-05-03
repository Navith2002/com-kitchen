import { useMemo } from 'react';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import GaugeCard from '../../components/charts/GaugeCard';
import useOverviewData from '../../hooks/useOverviewData';
import useTempHumData from '../../hooks/useTempHumData';

function FlameGauge({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const rotation = -90 + (clamped / 100) * 180;

  return (
    <div className="fire-gauge-card">
      <h3>Flame Gauge</h3>
      <div className="fire-gauge">
        <div className="fire-gauge-ring" />
        <div className="fire-gauge-needle" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
        <div className="fire-gauge-dot" />
      </div>
      <div className="fire-gauge-value">{clamped}%</div>
      <div className="fire-gauge-subtitle">flame_intensity (%)</div>
    </div>
  );
}

function parseDurationSeconds(value) {
  if (value == null) return 0;
  const n = Number(value);
  if (!Number.isNaN(n)) return n;
  const t = String(value).toLowerCase();
  const m = [...t.matchAll(/(\d+)\s*(h|m|s)/g)];
  return m.reduce((acc, x) => acc + Number(x[1]) * (x[2] === 'h' ? 3600 : x[2] === 'm' ? 60 : 1), 0);
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function OverviewPage() {
  const { gas, temp, fridge, fire, loading } = useOverviewData();
  const { history = [] } = useTempHumData();

  if (loading) return <LoadingState label="Loading overview..." />;
  if (!gas.latest && !temp.latest && !fridge.latest && !fire.latest) return <EmptyState label="No overview data available." />;

  const flameIntensity = fire.latest?.intensity_percent ?? fire.latest?.flame_intensity ?? 18;
  const doorDuration = useMemo(() => {
    const seconds = parseDurationSeconds(fridge.latest?.Duration ?? fridge.latest?.duration ?? fridge.analysis?.door_open_duration_sec ?? 0);
    return formatClock(seconds);
  }, [fridge]);

  const forecastRows = useMemo(() => {
    const base = Number(temp.latest?.temperature || 34);
    return Array.from({ length: 5 }, (_, i) => ({
      min: `${(i + 1) * 10} min`,
      value: `${Math.round(base + i + (i > 2 ? 1 : 0))} °C`,
    }));
  }, [temp.latest]);

  return (
    <div className="page-grid overview-focus">
      <div className="dashboard-grid overview-main-cards">
        <Panel title="Gas Dashboard Gauge">
          <GaugeCard value={gas.latest?.gasValue || 0} />
        </Panel>

        <Panel title="Temperature Dashboard Gauge">
          <div className="gauge-card"><div className="gauge-value">{temp.latest?.temperature ?? '--'}°C</div><div className="gauge-thresholds">Safe &lt; 28 | Warning &lt; 35 | Danger ≥ 35</div></div>
        </Panel>

        <Panel title="Flame Gauge">
          <FlameGauge value={flameIntensity} />
        </Panel>

        <Panel title="Door Opened Duration">
          <div className="overview-duration-card">
            <div className="big-number">{doorDuration}</div>
            <div className="stat-card-subtitle">CURRENT SESSION ELAPSED</div>
          </div>
        </Panel>
      </div>

      <Panel title="Next Hour Temperature Forecast">
        <div className="forecast-box">
          <div className="forecast-graph" />
          <div className="forecast-metrics">{forecastRows.map((r) => <div key={r.min}><span>{r.min}</span><strong>{r.value}</strong></div>)}</div>
        </div>
      </Panel>
    </div>
  );
}
