import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import GaugeCard from '../../components/charts/GaugeCard';
import TrendChart from '../../components/charts/TrendChart';
import AlertsPanel from '../../components/alerts/AlertsPanel';
import SensorTable from '../../components/common/SensorTable';
import CorrelationChart from '../../components/charts/CorrelationChart';
import useGasData from '../../hooks/useGasData';
import useTempHumData from '../../hooks/useTempHumData';
import { mergeGasTemperatureHistory } from '../../utils/correlation';
import { formatChartTime } from '../../utils/formatters';

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

function buildGasTimeSeriesForecast(history = [], latestGasValue = 0) {
  const now = new Date();
  const recent = history.slice(-8).map((item) => Number(item.gasValue || 0));
  const baseline = Number(latestGasValue || 0);

  const deltas = recent.slice(1).map((value, idx) => value - recent[idx]);
  const avgDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
  const smoothTrend = Math.max(-8, Math.min(8, avgDelta));

  return Array.from({ length: 7 }, (_, step) => {
    const pointTime = new Date(now);
    pointTime.setMinutes(pointTime.getMinutes() + step * 10, 0, 0);

    const swing = Math.sin((step / 6) * Math.PI) * 3;
    const projected = Math.max(0, baseline + smoothTrend * step + swing);

    return {
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: pointTime.toISOString(),
      gasValue: Number(projected.toFixed(2)),
      minutesAhead: step * 10,
    };
  });
}

function getHistoryEntryDate(item) {
  const timestamp = new Date(item?.timestamp);
  if (!Number.isNaN(timestamp.getTime())) return timestamp;

  const timeValue = new Date(item?.time);
  if (!Number.isNaN(timeValue.getTime())) return timeValue;

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

export default function GasPage() {
  const { latest, history, analysis, alerts, loading } = useGasData();
  const tempHum = useTempHumData();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedDate, setSelectedDate] = useState(String(now.getDate()).padStart(2, '0'));

  const forecastRows = useMemo(() => buildGasTimeSeriesForecast(history, latest?.gasValue), [history, latest?.gasValue]);
  const filteredTrendRows = useMemo(() => history.filter((item) => {
    const itemDate = getHistoryEntryDate(item);
    if (!itemDate) return false;

    const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
    const itemDay = String(itemDate.getDate()).padStart(2, '0');

    return itemMonth === selectedMonth && itemDay === selectedDate;
  }), [history, selectedMonth, selectedDate]);

  if (loading) return <LoadingState label="Loading gas dashboard..." />;
  if (!latest) return <EmptyState label="No gas data available." />;

  const mergedCorrelation = mergeGasTemperatureHistory(history, tempHum.history);
  const systemSafe = (analysis?.final_risk || analysis?.predicted_risk || latest.status) !== 'DANGER';

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
      <div className={`system-banner ${systemSafe ? 'success' : 'danger'}`}>
        System status : {systemSafe ? 'No Gas Leakage Detected' : 'Gas Leakage Warning'}
      </div>

      <div className="dashboard-grid top-row">
        <Panel title="Gas Level">
          <GaugeCard value={latest.gasValue || 0} />
        </Panel>

        <Panel title="Gas Level in Next hour">
          <div className="th-forecast-wrap">
            <div className="th-forecast-chart">
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={forecastRows}>
                  <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 'dataMax + 20']} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(label) => `Time: ${label}`} />
                  <ReferenceArea y1={0} y2={200} fill="#c7dfc0" fillOpacity={0.95} />
                  <ReferenceArea y1={200} y2={400} fill="#ddd2b3" fillOpacity={0.9} />
                  <ReferenceArea y1={400} y2={800} fill="#e4c4c4" fillOpacity={0.9} />
                  <Line type="monotone" dataKey="gasValue" stroke="#333" strokeWidth={1.3} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="th-forecast-list">
              {forecastRows.map((row) => (
                <div key={row.timeLabel} className="th-forecast-item">
                  <span>{row.timeLabel}</span>
                  <strong>{row.gasValue.toFixed(1)} ppm</strong>
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
          <AlertsPanel alerts={alerts} />
        </Panel>
      </div>

      <div className="dashboard-grid middle-row">
        <Panel title="Fire Detecting Sensor Live Data">
          <SensorTable
            columns={[
              { key: 'timestamp', label: 'times' },
              { key: 'gasValue', label: 'gas_level_ppm' },
              { key: 'status', label: 'gas_status', type: 'status' },
              { key: 'alert', label: 'alert_triggered' },
            ]}
            rows={[...history].reverse().slice(0, 6).map((row) => ({
              ...row,
              alert: row.status?.toLowerCase() === 'normal' ? 'NO' : 'YES',
            }))}
          />
        </Panel>
      </div>

      <div className="dashboard-grid bottom-row">
        <Panel title="Gas Level With Temperature">
          <CorrelationChart data={mergedCorrelation} />
        </Panel>

        <Panel title="Gas Detection in last 24 hours" action={renderTrendFilter()}>
          <TrendChart data={filteredTrendRows} xKey="timestamp" yKey="gasValue" />
        </Panel>
      </div>

      <div className="footer-strip">
        <span>ESP32 : ONLINE</span>
        <span>Last Update : 1 min ago</span>
        <span>Wifi strength : Strong</span>
        <span>Date/Time : Live from Firebase</span>
      </div>
    </div>
  );
}
