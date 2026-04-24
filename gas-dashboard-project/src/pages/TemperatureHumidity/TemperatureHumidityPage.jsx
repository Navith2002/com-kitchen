import { AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SensorTable from '../../components/common/SensorTable';
import useTempHumData from '../../hooks/useTempHumData';
import { formatChartTime, formatShortTime } from '../../utils/formatters';

function MiniGauge({ label, value = 0, min = 0, max = 100, unit = '%', subtitle = '' }) {
  const clamped = Math.max(min, Math.min(max, Number(value) || 0));
  const angle = -90 + ((clamped - min) / (max - min || 1)) * 180;

  return (
    <div className="mini-gauge">
      <div className="mini-gauge-title">{label}</div>
      <div className="mini-gauge-visual">
        <div className="mini-gauge-arc safe" />
        <div className="mini-gauge-arc warning" />
        <div className="mini-gauge-arc danger" />
        <div className="mini-gauge-needle" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
        <div className="mini-gauge-dot" />
      </div>
      <div className="mini-gauge-value">{clamped}{unit}</div>
      <div className="mini-gauge-subtitle">{subtitle}</div>
    </div>
  );
}

function ZonedTrendChart({ data = [], yKey, maxY, safeMax, warnMax }) {
  const chartData = data.map((item) => ({
    ...item,
    chartTime: formatChartTime(item.timestamp),
  }));

  return (
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={chartData}>
        <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
        <XAxis dataKey="chartTime" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, maxY]} tick={{ fontSize: 10 }} />
        <Tooltip />
        <ReferenceArea y1={0} y2={safeMax} fill="#c7dfc0" fillOpacity={0.95} />
        <ReferenceArea y1={safeMax} y2={warnMax} fill="#ddd2b3" fillOpacity={0.9} />
        <ReferenceArea y1={warnMax} y2={maxY} fill="#e4c4c4" fillOpacity={0.9} />
        <Line type="monotone" dataKey={yKey} stroke="#333" strokeWidth={1.2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function buildTempForecast(history = [], latestTemperature = 0) {
  const steps = [10, 20, 30, 35, 39];
  const recent = history.slice(-5);
  const slope = recent.length > 1
    ? (Number(recent[recent.length - 1]?.temperature || latestTemperature) - Number(recent[0]?.temperature || latestTemperature)) / (recent.length - 1)
    : 0.8;

  return steps.map((minute, index) => ({
    minute,
    temperature: Number(latestTemperature || 0) + slope * (index + 1) * 1.25,
  }));
}

export default function TemperatureHumidityPage() {
  const { latest, history, analysis, loading } = useTempHumData();

  if (loading) return <LoadingState label="Loading temperature and humidity dashboard..." />;
  if (!latest) return <EmptyState label="No temperature and humidity data available." />;

  const latestTemp = Number(latest.temperature || 0);
  const latestHumidity = Number(latest.humidity || 0);
  const recentRows = [...history].reverse().slice(0, 4);
  const forecastRows = buildTempForecast(history, latestTemp);
  const crossing = forecastRows.find((row) => row.temperature >= 38);

  const generatedAlerts = [
    ...(latestTemp >= 36
      ? [{ title: 'High Temperature warning', level: 'danger', time: latest.timestamp }]
      : []),
    ...(latestHumidity <= 25 || latestHumidity >= 75
      ? [{ title: 'Humidity out of optimal range', level: 'warning', time: latest.timestamp }]
      : []),
  ].slice(0, 2);

  return (
    <div className="page-grid">
      <div className="th-banner-row">
        <div className="th-banner success">
          <ShieldCheck size={16} />
          <span>Current System status : {latest.status || 'Normal'}</span>
        </div>
        <div className="th-banner danger">
          <AlertTriangle size={16} />
          <span>
            Next Hour Temperature: {crossing ? `reach 38°C within ${crossing.minute} minutes` : 'below 38°C trend'}
          </span>
        </div>
      </div>

      <div className="dashboard-grid top-row">
        <Panel title="Humidity / Temperature Meter">
          <div className="mini-gauge-grid">
            <MiniGauge label="Humidity" value={latestHumidity} max={100} unit="%" subtitle="flame_intensity (%)" />
            <MiniGauge label="Temperature Meter" value={latestTemp} max={50} unit="°C" subtitle="flame_intensity (%)" />
          </div>
        </Panel>

        <Panel title="Next Hour Temperature Forecast">
          <div className="th-forecast-wrap">
            <div className="th-forecast-chart">
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart
                  data={forecastRows.map((row) => ({
                    ...row,
                    timeLabel: `12.${String(row.minute).padStart(2, '0')}`,
                  }))}
                >
                  <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 45]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <ReferenceArea y1={0} y2={25} fill="#c7dfc0" fillOpacity={0.95} />
                  <ReferenceArea y1={25} y2={35} fill="#ddd2b3" fillOpacity={0.9} />
                  <ReferenceArea y1={35} y2={45} fill="#e4c4c4" fillOpacity={0.9} />
                  <Line type="monotone" dataKey="temperature" stroke="#333" strokeWidth={1.3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="th-forecast-list">
              {forecastRows.map((row) => (
                <div key={row.minute} className="th-forecast-item">
                  <span>{row.minute} min</span>
                  <strong>{row.temperature.toFixed(0)} °C</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="th-forecast-note">
            <AlertTriangle size={16} />
            Temperature may reach 38°C within {crossing?.minute ?? 45} minutes if current trend continues
          </div>
        </Panel>

        <Panel title="Recent alerts">
          <div className="alerts-panel">
            {generatedAlerts.length ? generatedAlerts.map((alert, index) => (
              <div className="alert-chip" key={`${alert.title}-${index}`}>
                <AlertTriangle size={16} className={alert.level === 'danger' ? 'danger-icon' : 'warning-icon'} />
                <div>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-time">{formatShortTime(alert.time)}</div>
                </div>
              </div>
            )) : <div className="alerts-empty">No recent alerts.</div>}
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid two-col">
        <Panel title="Humidity Trend">
          <ZonedTrendChart data={history} yKey="humidity" maxY={100} safeMax={40} warnMax={70} />
        </Panel>
        <Panel title="Temperature Trend in last 24 hours">
          <ZonedTrendChart data={history} yKey="temperature" maxY={50} safeMax={20} warnMax={32} />
        </Panel>
      </div>

      <div className="dashboard-grid middle-row">
        <Panel title="Humidity and Temperature Sensor Live Data">
          <SensorTable
            columns={[
              { key: 'timestamp', label: 'time' },
              { key: 'humidity', label: 'humidity' },
              { key: 'temperature', label: 'temperature' },
              { key: 'status', label: 'status', type: 'status' },
              { key: 'alert', label: 'alert_triggered' },
              { key: 'alertLevel', label: 'alert_level' },
            ]}
            rows={recentRows.map((row) => ({
              ...row,
              alert: Number(row.temperature || 0) >= 36 ? 'true' : 'false',
              alertLevel: Number(row.temperature || 0) >= 38 ? 'HIGH' : 'NONE',
            }))}
          />
        </Panel>

        <Panel title="Filter Date">
          <div className="filter-box">
            <select className="filter-select"><option>Month</option></select>
            <select className="filter-select"><option>Date</option></select>
          </div>
        </Panel>
      </div>

      <div className="footer-strip">
        <span>ESP32 : ONLINE</span>
        <span>Last Update : 1 min ago</span>
        <span>Wifi strength : Strong</span>
        <span>Date/Time : Live from Firebase</span>
      </div>

      <div className="th-cloud-strip">Cloud Connection : <strong>Connected</strong></div>
    </div>
  );
}
