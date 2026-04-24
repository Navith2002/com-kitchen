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

function parseTimestamp(value) {
  if (value == null) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    return new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
  return (
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={data}>
        <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
        <XAxis dataKey="chartTime" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, maxY]} tick={{ fontSize: 10 }} />
        <Tooltip />
        <ReferenceArea y1={0} y2={safeMax} fill="#c7dfc0" fillOpacity={0.95} />
        <ReferenceArea y1={safeMax} y2={warnMax} fill="#ddd2b3" fillOpacity={0.9} />
        <ReferenceArea y1={warnMax} y2={maxY} fill="#e4c4c4" fillOpacity={0.9} />
        <Line type="monotone" dataKey={yKey} stroke="#333" strokeWidth={1.2} dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function buildHourlyAverages(history = [], selectedMonth = 'all', selectedDate = 'all') {
  const rowsByHour = new Map();
  history.forEach((item) => {
    const parsedDate = parseTimestamp(item.timestamp);
    if (!parsedDate) return;

    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    if (selectedMonth !== 'all' && month !== Number(selectedMonth)) return;
    if (selectedDate !== 'all' && day !== Number(selectedDate)) return;

    const hour = parsedDate.getHours();
    if (!rowsByHour.has(hour)) {
      rowsByHour.set(hour, { humidity: 0, temperature: 0, count: 0 });
    }
    const current = rowsByHour.get(hour);
    current.humidity += Number(item.humidity || 0);
    current.temperature += Number(item.temperature || 0);
    current.count += 1;
  });

  return Array.from({ length: 24 }, (_, hour) => {
    const current = rowsByHour.get(hour);
    return {
      chartTime: `${String(hour).padStart(2, '0')}:00`,
      humidity: current?.count ? Number((current.humidity / current.count).toFixed(2)) : null,
      temperature: current?.count ? Number((current.temperature / current.count).toFixed(2)) : null,
    };
  });
}

function TrendFilterControls({
  selectedMonth,
  selectedDate,
  availableMonths,
  availableDates,
  onMonthChange,
  onDateChange,
}) {
  return (
    <div className="trend-filter-inline">
      <select className="filter-select filter-select-small" value={selectedMonth} onChange={onMonthChange}>
        <option value="all">All Months</option>
        {availableMonths.map((month) => <option key={month} value={month}>{String(month).padStart(2, '0')}</option>)}
      </select>
      <select className="filter-select filter-select-small" value={selectedDate} onChange={onDateChange}>
        <option value="all">All Dates</option>
        {availableDates.map((date) => <option key={date} value={date}>{String(date).padStart(2, '0')}</option>)}
      </select>
    </div>
  );
}

function buildTempForecast(history = [], latestTemperature = 0) {
  const latestSample = history[history.length - 1];
  const startTime = new Date(latestSample?.timestamp || Date.now());
  const seedTemp = Number(latestTemperature || latestSample?.temperature || 0);
  const recent = history
    .slice(-12)
    .map((item) => Number(item.temperature || seedTemp))
    .filter((item) => Number.isFinite(item));

  const deltas = recent.slice(1).map((value, index) => value - recent[index]);
  const avgDelta = deltas.length
    ? deltas.reduce((acc, item) => acc + item, 0) / deltas.length
    : 0;
  const avgAcceleration = deltas.length > 1
    ? deltas.slice(1).reduce((acc, item, index) => acc + (item - deltas[index]), 0) / (deltas.length - 1)
    : 0;

  const points = [];
  let projectedTemp = seedTemp;
  for (let step = 1; step <= 6; step += 1) {
    const momentum = avgDelta * Math.exp(-step / 3);
    const curvature = avgAcceleration * Math.sin((step / 6) * Math.PI) * 0.8;
    projectedTemp += momentum + curvature;

    const pointTime = new Date(startTime.getTime() + step * 10 * 60 * 1000);
    points.push({
      minute: step * 10,
      timestamp: pointTime.toISOString(),
      timeLabel: formatChartTime(pointTime),
      temperature: Number(projectedTemp.toFixed(2)),
    });
  }

  return points;
}

export default function TemperatureHumidityPage() {
  const { latest, history, analysis, loading } = useTempHumData();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  if (loading) return <LoadingState label="Loading temperature and humidity dashboard..." />;
  if (!latest) return <EmptyState label="No temperature and humidity data available." />;

  const latestTemp = Number(latest.temperature || 0);
  const latestHumidity = Number(latest.humidity || 0);
  const historyData = Array.isArray(history) ? history : [];
  const recentRows = [...historyData].reverse().slice(0, 4);
  const forecastRows = buildTempForecast(historyData, latestTemp);
  const forecastRows = buildTempForecast(historyData, latestTemp);
  const crossing = forecastRows.find((row) => row.temperature >= 38);
  const availableMonths = useMemo(
    () => [...new Set(history.map((item) => parseTimestamp(item.timestamp)?.getMonth() + 1).filter(Boolean))].sort((a, b) => a - b),
    [history],
  );
  const availableDates = useMemo(
    () => [...new Set(history
      .map((item) => parseTimestamp(item.timestamp))
      .filter((date) => date && (selectedMonth === 'all' || date.getMonth() + 1 === Number(selectedMonth)))
      .map((date) => date.getDate()))].sort((a, b) => a - b),
    [history, selectedMonth],
  );
  const hourlyAverages = useMemo(
    () => buildHourlyAverages(history, selectedMonth, selectedDate),
    [history, selectedMonth, selectedDate],
  );

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
                <ComposedChart data={forecastRows}>
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
        <Panel
          title="Humidity Trend (24h AVG)"
          action={(
            <TrendFilterControls
              selectedMonth={selectedMonth}
              selectedDate={selectedDate}
              availableMonths={availableMonths}
              availableDates={availableDates}
              onMonthChange={(event) => {
                const nextMonth = event.target.value;
                setSelectedMonth(nextMonth);
                setSelectedDate('all');
              }}
              onDateChange={(event) => setSelectedDate(event.target.value)}
            />
          )}
        >
          <div className="th-trend-chart-narrow">
            <ZonedTrendChart data={hourlyAverages} yKey="humidity" maxY={100} safeMax={40} warnMax={70} />
          </div>
        </Panel>
        <Panel
          title="Temperature Trend in last 24 hours (AVG)"
          action={(
            <TrendFilterControls
              selectedMonth={selectedMonth}
              selectedDate={selectedDate}
              availableMonths={availableMonths}
              availableDates={availableDates}
              onMonthChange={(event) => {
                const nextMonth = event.target.value;
                setSelectedMonth(nextMonth);
                setSelectedDate('all');
              }}
              onDateChange={(event) => setSelectedDate(event.target.value)}
            />
          )}
        >
          <div className="th-trend-chart-narrow">
            <ZonedTrendChart data={hourlyAverages} yKey="temperature" maxY={50} safeMax={20} warnMax={32} />
          </div>
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
