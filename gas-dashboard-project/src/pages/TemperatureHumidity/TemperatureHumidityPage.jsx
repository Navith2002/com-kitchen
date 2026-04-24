import { useMemo, useState } from 'react';
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

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0');
  return { value: day, label: String(index + 1) };
});

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

function ZonedTrendChart({ data = [], yKey, maxY, safeMax, warnMax, lineColor = '#333', dotColor = '#333' }) {
  const zoneGradientId = `${yKey}-zone-gradient`;

  return (
    <div className="th-trend-chart-narrow">
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={zoneGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
          <XAxis dataKey="hourLabel" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value) => [value == null ? '--' : value, yKey]}
            contentStyle={{ borderRadius: 10, borderColor: '#9da2a4', background: '#f8f9fa' }}
          />
          <ReferenceArea y1={0} y2={safeMax} fill="#c7dfc0" fillOpacity={0.95} />
          <ReferenceArea y1={safeMax} y2={warnMax} fill="#ddd2b3" fillOpacity={0.9} />
          <ReferenceArea y1={warnMax} y2={maxY} fill="#e4c4c4" fillOpacity={0.9} />
          <ReferenceArea y1={0} y2={maxY} fill={`url(#${zoneGradientId})`} fillOpacity={1} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 1.6, stroke: '#2f3437', fill: '#ffffff' }}
            activeDot={{ r: 4.6, strokeWidth: 1.8, stroke: '#2f3437', fill: '#ffffff' }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function startOfHour(dateValue) {
  const date = new Date(dateValue);
  date.setMinutes(0, 0, 0);
  return date;
}

function parseTimestampValue(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return new Date(rawValue < 1e12 ? rawValue * 1000 : rawValue);
  }

  if (typeof rawValue === 'string') {
    const numeric = Number(rawValue);
    if (!Number.isNaN(numeric) && rawValue.trim() !== '') {
      return new Date(numeric < 1e12 ? numeric * 1000 : numeric);
    }

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function getHistoryEntryDate(item) {
  const directTimestamp = parseTimestampValue(item?.timestamp);
  if (directTimestamp && !Number.isNaN(directTimestamp.getTime())) return directTimestamp;

  const timeValue = parseTimestampValue(item?.time);
  if (timeValue && !Number.isNaN(timeValue.getTime())) return timeValue;

  if (item?.date && item?.time) {
    const merged = new Date(`${item.date} ${item.time}`);
    if (!Number.isNaN(merged.getTime())) return merged;
  }

  if (item?.date) {
    const parsedDate = new Date(item.date);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }

  return null;
}

function buildTimeSeriesForecast(history = [], latestTemperature = 0) {
  const now = new Date();
  const latestHour = startOfHour(now);
  const recent = history.slice(-8).map((item) => Number(item.temperature || 0));
  const baseline = Number(latestTemperature || 0);

  const deltas = recent.slice(1).map((value, idx) => value - recent[idx]);
  const avgDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
  const smoothTrend = Math.max(-0.8, Math.min(0.8, avgDelta));

  return Array.from({ length: 7 }, (_, step) => {
    const pointTime = new Date(latestHour);
    pointTime.setMinutes(pointTime.getMinutes() + step * 10);

    const swing = Math.sin((step / 6) * Math.PI) * 0.7;
    const projected = baseline + smoothTrend * step + swing;

    return {
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: pointTime.toISOString(),
      temperature: Number(projected.toFixed(2)),
      minutesAhead: step * 10,
    };
  });
}

function buildHourlyAverages(history = [], monthValue, dayValue, yKey) {
  const filtered = history.filter((item) => {
    const date = getHistoryEntryDate(item);
    if (!date) return false;

    const itemMonth = String(date.getMonth() + 1).padStart(2, '0');
    const itemDay = String(date.getDate()).padStart(2, '0');

    return itemMonth === monthValue && itemDay === dayValue;
  });

  const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    sum: 0,
  }));

  filtered.forEach((item) => {
    const date = getHistoryEntryDate(item);
    if (!date) return;
    const value = Number(item[yKey] || 0);
    const hour = date.getHours();
    hourlyBuckets[hour].count += 1;
    hourlyBuckets[hour].sum += value;
  });

  return hourlyBuckets.map((bucket) => ({
    hourLabel: `${String(bucket.hour).padStart(2, '0')}:00`,
    [yKey]: bucket.count ? Number((bucket.sum / bucket.count).toFixed(2)) : null,
  }));
}

export default function TemperatureHumidityPage() {
  const { latest, history, loading } = useTempHumData();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedDate, setSelectedDate] = useState(String(now.getDate()).padStart(2, '0'));

  const forecastRows = useMemo(() => buildTimeSeriesForecast(history, latest?.temperature), [history, latest?.temperature]);

  const humidityTrendRows = useMemo(
    () => buildHourlyAverages(history, selectedMonth, selectedDate, 'humidity'),
    [history, selectedMonth, selectedDate],
  );

  const temperatureTrendRows = useMemo(
    () => buildHourlyAverages(history, selectedMonth, selectedDate, 'temperature'),
    [history, selectedMonth, selectedDate],
  );

  if (loading) return <LoadingState label="Loading temperature and humidity dashboard..." />;
  if (!latest) return <EmptyState label="No temperature and humidity data available." />;

  const latestTemp = Number(latest.temperature || 0);
  const latestHumidity = Number(latest.humidity || 0);
  const recentRows = [...history].reverse().slice(0, 4);
  const crossing = forecastRows.find((row) => row.temperature >= 38);

  const generatedAlerts = [
    ...(latestTemp >= 36
      ? [{ title: 'High Temperature warning', level: 'danger', time: latest.timestamp }]
      : []),
    ...(latestHumidity <= 25 || latestHumidity >= 75
      ? [{ title: 'Humidity out of optimal range', level: 'warning', time: latest.timestamp }]
      : []),
  ].slice(0, 2);

  const renderTrendFilter = () => (
    <div className="trend-filter-inline">
      <select
        className="filter-select filter-select-small"
        value={selectedMonth}
        onChange={(event) => setSelectedMonth(event.target.value)}
      >
        {MONTH_OPTIONS.map((month) => (
          <option key={month.value} value={month.value}>{month.label}</option>
        ))}
      </select>

      <select
        className="filter-select filter-select-small"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
      >
        {DAY_OPTIONS.map((date) => (
          <option key={date.value} value={date.value}>{date.label}</option>
        ))}
      </select>
    </div>
  );

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
            Next Hour Temperature: {crossing ? `reach 38°C within ${crossing.minutesAhead} minutes` : 'below 38°C trend'}
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
                <ComposedChart data={forecastRows}>
                  <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 45]} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(label) => `Time: ${label}`} />
                  <ReferenceArea y1={0} y2={25} fill="#c7dfc0" fillOpacity={0.95} />
                  <ReferenceArea y1={25} y2={35} fill="#ddd2b3" fillOpacity={0.9} />
                  <ReferenceArea y1={35} y2={45} fill="#e4c4c4" fillOpacity={0.9} />
                  <Line type="monotone" dataKey="temperature" stroke="#333" strokeWidth={1.3} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="th-forecast-list">
              {forecastRows.map((row) => (
                <div key={row.timeLabel} className="th-forecast-item">
                  <span>{row.timeLabel}</span>
                  <strong>{row.temperature.toFixed(1)} °C</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="th-forecast-note">
            <AlertTriangle size={16} />
            Time-series forecast for the next hour from current time ({formatChartTime(new Date())})
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
        <Panel title="Humidity Trend" action={renderTrendFilter()}>
          <ZonedTrendChart
            data={humidityTrendRows}
            yKey="humidity"
            maxY={100}
            safeMax={40}
            warnMax={70}
            lineColor="#155e75"
            dotColor="#0e7490"
          />
        </Panel>
        <Panel title="Temperature Trend in last 24 hours" action={renderTrendFilter()}>
          <ZonedTrendChart
            data={temperatureTrendRows}
            yKey="temperature"
            maxY={50}
            safeMax={20}
            warnMax={32}
            lineColor="#7c2d12"
            dotColor="#c2410c"
          />
        </Panel>
      </div>

      <div className="dashboard-grid middle-row single-col">
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
