import { useMemo } from 'react';
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
import AlertsPanel from '../../components/alerts/AlertsPanel';
import SensorTable from '../../components/common/SensorTable';
import CorrelationChart from '../../components/charts/CorrelationChart';
import ForecastChart from '../../components/charts/ForecastChart';
import useGasData from '../../hooks/useGasData';
import useTempHumData from '../../hooks/useTempHumData';
import { mergeGasTemperatureHistory } from '../../utils/correlation';
import { formatChartTime } from '../../utils/formatters';

function startOfHour(dateValue) {
  const date = new Date(dateValue);
  date.setMinutes(0, 0, 0);
  return date;
}

function buildGasTimeSeriesForecast(history = [], latestGasValue = 0) {
  const now = new Date();
  const latestHour = startOfHour(now);
  const recent = history.slice(-8).map((item) => Number(item.gasValue || 0));
  const baseline = Number(latestGasValue || 0);

  const deltas = recent.slice(1).map((value, idx) => value - recent[idx]);
  const avgDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
  const smoothTrend = Math.max(-25, Math.min(25, avgDelta));

  return Array.from({ length: 7 }, (_, step) => {
    const pointTime = new Date(latestHour);
    pointTime.setMinutes(pointTime.getMinutes() + step * 10);

    const swing = Math.sin((step / 6) * Math.PI) * 12;
    const projected = Math.max(0, baseline + smoothTrend * step + swing);

    return {
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: pointTime.toISOString(),
      gasValue: Number(projected.toFixed(0)),
      minutesAhead: step * 10,
    };
  });
}

export default function GasPage() {
  const { latest, history, analysis, alerts, loading } = useGasData();
  const tempHum = useTempHumData();
  const forecastRows = useMemo(() => buildGasTimeSeriesForecast(history, latest?.gasValue), [history, latest?.gasValue]);

  if (loading) return <LoadingState label="Loading gas dashboard..." />;
  if (!latest) return <EmptyState label="No gas data available." />;

  const mergedCorrelation = mergeGasTemperatureHistory(history, tempHum.history);
  const systemSafe = (analysis?.final_risk || analysis?.predicted_risk || latest.status) !== 'DANGER';
  const crossing = forecastRows.find((row) => row.gasValue >= 500);

  return (
    <div className="page-grid">
      <div className={`system-banner ${systemSafe ? 'success' : 'danger'}`}>
        System status : {systemSafe ? 'No Gas Leakage Detected' : 'Gas Leakage Warning'}
      </div>

      <div className="dashboard-grid top-row">
        <Panel title="Gas Level">
          <GaugeCard value={latest.gasValue || 0} />
        </Panel>

        <Panel title="Gas Detection in last 24 hours">
          <div className="th-forecast-wrap">
            <div className="th-forecast-chart">
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={forecastRows}>
                  <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 700]} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(label) => `Time: ${label}`} />
                  <ReferenceArea y1={0} y2={330} fill="#c7dfc0" fillOpacity={0.95} />
                  <ReferenceArea y1={330} y2={500} fill="#ddd2b3" fillOpacity={0.9} />
                  <ReferenceArea y1={500} y2={700} fill="#e4c4c4" fillOpacity={0.9} />
                  <Line type="monotone" dataKey="gasValue" stroke="#333" strokeWidth={1.3} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="th-forecast-list">
              {forecastRows.map((row) => (
                <div key={row.timeLabel} className="th-forecast-item">
                  <span>{row.timeLabel}</span>
                  <strong>{row.gasValue.toFixed(0)} ppm</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="th-forecast-note">
            Gas time-series forecast for the next hour from current time ({formatChartTime(new Date())}) ·
            {crossing ? ` predicted to reach 500+ ppm in ${crossing.minutesAhead} minutes` : ' predicted to remain below 500 ppm'}
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

        <Panel title="Filter Date">
          <div className="filter-box">
            <select className="filter-select"><option>Month</option></select>
            <select className="filter-select"><option>Date</option></select>
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid bottom-row">
        <Panel title="Gas Level With Temperature">
          <CorrelationChart data={mergedCorrelation} />
        </Panel>

        <Panel title="Gas Level in Next 03 hours">
          <ForecastChart data={history} sourceKey="gasValue" />
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
