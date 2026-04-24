import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ShieldCheck } from 'lucide-react';
import useFireData from '../../hooks/useFireData';
import { formatChartTime, formatShortTime } from '../../utils/formatters';

const SAMPLE_ALERTS = [
  'Gas Leak Detected',
  'High Temperature Warning',
  '12.49 P.M',
];

function FireGauge({ title, value = 0, subtitle }) {
  const safe = '#acef99';
  const warning = '#f4b840';
  const danger = '#f53d00';
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const rotation = -90 + (clamped / 100) * 180;

  return (
    <article className="fire-gauge-card">
      <h3>{title}</h3>
      <div className="fire-gauge">
        <div className="fire-gauge-ring" style={{ '--safe': safe, '--warning': warning, '--danger': danger }} />
        <div className="fire-gauge-needle" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
        <div className="fire-gauge-dot" />
      </div>
      <div className="fire-gauge-value">{clamped}%</div>
      <div className="fire-gauge-subtitle">{subtitle}</div>
    </article>
  );
}

function FireTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={205}>
      <AreaChart data={data} margin={{ left: -16, right: 12, top: 6 }}>
        <CartesianGrid stroke="#d8d8d8" vertical={false} />
        <XAxis dataKey="chartTime" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#bbb' }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 16]} tickCount={5} tickLine={false} axisLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="intensity" stroke="#f4f4f4" fillOpacity={0} strokeWidth={1.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function FirePage() {
  const { latest, history } = useFireData();

  const flameIntensity = latest?.intensity_percent ?? latest?.flame_intensity ?? 18;
  const sensorSignal = latest?.sensor_signal ?? latest?.fire_sensor_strength ?? 18;

  const chartData = useMemo(() => {
    if (history.length) {
      return history.slice(-15).map((item, index) => ({
        index,
        chartTime: formatChartTime(item.date_time || item.timestamp),
        intensity: Number(item.intensity_percent ?? item.flame_intensity ?? 0),
      }));
    }

    return [
      { index: 0, chartTime: '12.00', intensity: 5 },
      { index: 1, chartTime: '12.01', intensity: 5.5 },
      { index: 2, chartTime: '12.02', intensity: 2.4 },
      { index: 3, chartTime: '12.03', intensity: 3 },
      { index: 4, chartTime: '12.04', intensity: 4 },
      { index: 5, chartTime: '12.05', intensity: 6 },
      { index: 6, chartTime: '12.06', intensity: 6.2 },
      { index: 7, chartTime: '12.07', intensity: 6.5 },
      { index: 8, chartTime: '12.08', intensity: 11 },
      { index: 9, chartTime: '12.09', intensity: 11.2 },
      { index: 10, chartTime: '12.10', intensity: 13 },
      { index: 11, chartTime: '12.11', intensity: 10 },
      { index: 12, chartTime: '12.12', intensity: 10.2 },
      { index: 13, chartTime: '12.13', intensity: 8.7 },
      { index: 14, chartTime: '12.14', intensity: 11 },
    ];
  }, [history]);

  const tableRows = useMemo(() => {
    if (history.length) {
      return [...history].reverse().slice(0, 4).map((item, idx) => ({
        key: `${item.timestamp || item.date_time || idx}`,
        timestamp: formatShortTime(item.date_time || item.timestamp),
        flame_raw_value: item.flame_raw_value ?? item.raw_value ?? 18,
        flame_intensity: item.intensity_percent ?? item.flame_intensity ?? 18,
        fire_status: (item.flame_status || item.fire_status || 'SAFE').toUpperCase(),
        alert_triggered: String(item.alert_triggered ?? false),
        alert_level: (item.alert_level || 'NONE').toUpperCase(),
      }));
    }

    return Array.from({ length: 4 }).map((_, idx) => ({
      key: `default-${idx}`,
      timestamp: '2026-02-14 14:40:05',
      flame_raw_value: 18,
      flame_intensity: 18,
      fire_status: 'SAFE',
      alert_triggered: 'false',
      alert_level: 'NONE',
    }));
  }, [history]);

  return (
    <div className="fire-page">
      <h2 className="fire-page-title">Fire Level Monitoring</h2>

      <div className="fire-status-banner">
        <ShieldCheck size={18} />
        <span>System status : No fire Detected</span>
      </div>

      <section className="fire-filter-row">
        <input type="text" placeholder="Search status, level, value..." />
        <select defaultValue="all">
          <option value="all">All Status</option>
          <option value="safe">Safe</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
        <select defaultValue="live">
          <option value="live">Live</option>
          <option value="24h">Last 24 Hours</option>
        </select>
        <button type="button">Reset</button>
      </section>

      <section className="fire-top-grid">
        <FireGauge title="Flame Indicator" value={flameIntensity} subtitle="flame_intensity (%)" />
        <FireGauge title="Sensor Signal Strength Indicator" value={sensorSignal} subtitle="sensor_signal" />

        <article className="fire-trend-card">
          <h3>Fire Detection in last 24 hours</h3>
          <div className="fire-trend-wrap">
            <div className="fire-trend-zones" />
            <FireTrendChart data={chartData} />
            <div className="fire-zone-label safe">Safe</div>
            <div className="fire-zone-label warning">Warning</div>
            <div className="fire-zone-label danger">Danger</div>
          </div>
        </article>

        <article className="fire-alert-card">
          <h3>Recent alerts</h3>
          {SAMPLE_ALERTS.map((alert) => (
            <p key={alert}>{alert}</p>
          ))}
        </article>
      </section>

      <section className="fire-table-panel">
        <h3>Fire Detecting Sensor Live Data</h3>
        <table>
          <thead>
            <tr>
              <th>timestamp</th>
              <th>flame_raw_value</th>
              <th>flame_intensity (%)</th>
              <th>fire_status</th>
              <th>alert_triggered</th>
              <th>alert_level</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.key}>
                <td>{row.timestamp}</td>
                <td>{row.flame_raw_value}</td>
                <td>{row.flame_intensity}</td>
                <td>{row.fire_status}</td>
                <td>{row.alert_triggered}</td>
                <td>{row.alert_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fire-history-panel">
        <h3>Past Fire Detection History</h3>
        <p>No History.</p>
      </section>

      <footer className="fire-footer">
        <span>ESP32 : ONLINE</span>
        <span>Last Update : 1 min ago</span>
        <span>Wifi strength : Strong</span>
        <span>Date/Time : {formatShortTime(latest?.date_time || latest?.timestamp || Date.now())}</span>
        <span>
          Cloud Connection : <strong>Connected</strong>
        </span>
      </footer>
    </div>
  );
}
