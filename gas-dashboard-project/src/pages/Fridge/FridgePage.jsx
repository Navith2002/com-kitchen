import { AlertTriangle } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import SensorTable from '../../components/common/SensorTable';
import TimelineChart from '../../components/charts/TimelineChart';
import useFridgeData from '../../hooks/useFridgeData';

function getFirstValid(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toMilliseconds(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber)) {
    return asNumber > 1e12 ? asNumber : asNumber * 1000;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatTimeDisplay(raw) {
  const millis = toMilliseconds(raw);
  if (!millis) return '--';
  return new Date(millis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function extractSeconds(rawDuration) {
  if (rawDuration === undefined || rawDuration === null) return null;
  if (typeof rawDuration === 'number') return rawDuration;
  const text = String(rawDuration).toLowerCase();
  const matches = [...text.matchAll(/(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g)];
  if (!matches.length) {
    const numberOnly = Number(rawDuration);
    return Number.isNaN(numberOnly) ? null : numberOnly;
  }
  return matches.reduce((total, match) => {
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith('h')) return total + amount * 3600;
    if (unit.startsWith('m')) return total + amount * 60;
    return total + amount;
  }, 0);
}

function formatAsClock(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '--:--:--';
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function getHourAndDay(ts) {
  const millis = toMilliseconds(ts);
  if (!millis) return null;
  const date = new Date(millis);
  return { hour: date.getHours(), day: date.getDay() };
}

export default function FridgePage() {
  const { latest, history, analysis, loading } = useFridgeData();

  if (loading) return <LoadingState label="Loading fridge data..." />;
  if (!latest) return <EmptyState label="No fridge data available." />;

  const rawDuration =
    latest?.Duration ??
    latest?.duration ??
    analysis?.Duration ??
    analysis?.door_open_duration ??
    analysis?.door_open_duration_sec ??
    0;
  const durationSeconds = getFirstValid(extractSeconds(rawDuration), analysis?.door_open_duration_sec, 0);
  const durationClock = formatAsClock(durationSeconds);
  const durationLabel = typeof rawDuration === 'string' ? rawDuration : `${Math.floor(durationSeconds)} sec`;

  const doorStatus = String(getFirstValid(latest?.status, latest?.doorStatus, 'UNKNOWN')).toUpperCase();
  const openCountToday = Number(getFirstValid(analysis?.open_count_today, analysis?.open_count, 0));
  const openCountYesterday = Number(getFirstValid(analysis?.open_count_yesterday, Math.max(openCountToday - 2, 0)));
  const batteryLevel = Math.min(100, Math.max(0, Number(getFirstValid(latest?.battery, analysis?.battery_level, 98))));
  const lastSignal = getFirstValid(latest?.last_signal, analysis?.last_signal, '--');
  const signalStrength = getFirstValid(latest?.signal_strength, analysis?.signal_strength, '-42 dBm');
  const location = getFirstValid(latest?.location, 'Kitchen Fridge');
  const deviceId = getFirstValid(latest?.device_id, latest?.deviceId, 'FRI-01');
  const lastOpened = formatTimeDisplay(getFirstValid(latest?.last_opened, analysis?.last_opened, latest?.timestamp));

  const timelineData = history.map((item) => ({ ...item, value: String(item.status).toUpperCase() === 'OPEN' ? 1 : 0 }));
  const openEvents = history.filter((item) => String(item.status).toUpperCase() === 'OPEN');
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  openEvents.forEach((event) => {
    const point = getHourAndDay(event.timestamp);
    if (!point) return;
    heatmap[point.day][point.hour] += 1;
  });
  const maxHeat = Math.max(1, ...heatmap.flat());
  const heatColor = (value) => {
    const score = value / maxHeat;
    if (score > 0.66) return '#1f6c3a';
    if (score > 0.33) return '#d08c1f';
    if (score > 0) return '#7ec26e';
    return '#d5ddd3';
  };

  return (
    <div className="fridge-design">
      <div className="fridge-page-title">Fridge Open/Close Monitoring</div>

      <div className="fridge-system-row">
        <div className="fridge-system-pill">System status : {doorStatus === 'OPEN' ? 'Warning' : 'Safe'}</div>
        <div className="fridge-system-status">Status : {doorStatus}</div>
      </div>

      <div className="fridge-top-grid">
        <div className="fridge-card">
          <h3>Fridge Door Status</h3>
          <div className="fridge-hero-status">{doorStatus}</div>
          <div className="fridge-meta-grid">
            <div>
              <span>Location</span>
              <strong>{location}</strong>
            </div>
            <div>
              <span>Device ID</span>
              <strong>{deviceId}</strong>
            </div>
            <div>
              <span>Last opened</span>
              <strong>{lastOpened}</strong>
            </div>
            <div>
              <span>Duration opened</span>
              <strong>{durationLabel}</strong>
            </div>
          </div>
        </div>

        <div className="fridge-card">
          <h3>Door Opened Duration</h3>
          <div className="fridge-duration">{durationClock}</div>
          <div className="fridge-subtitle">CURRENT SESSION ELAPSED</div>
          <div className="fridge-threshold-row">
            <span className="fridge-threshold normal">Normal &lt;30s</span>
            <span className="fridge-threshold warning">Warning &gt;90s</span>
            <span className="fridge-threshold critical">Critical</span>
          </div>
        </div>

        <div className="fridge-card">
          <h3>Open Count Today</h3>
          <div className="fridge-count">{openCountToday}</div>
          <div className="fridge-subtitle">times</div>
          <div className="fridge-count-compare">
            <div>
              <span>today</span>
              <strong>{openCountToday}</strong>
            </div>
            <div>
              <span>yesterday</span>
              <strong>{openCountYesterday}</strong>
            </div>
          </div>
        </div>

        <div className="fridge-card">
          <h3>Sensor Health</h3>
          <div className="fridge-battery-ring">
            <strong>{batteryLevel}%</strong>
            <span>Battery Level</span>
          </div>
          <div className="fridge-signal-text">Last Signal : {lastSignal}</div>
          <div className="fridge-signal-text">Signal Strength : {signalStrength}</div>
        </div>
      </div>

      <div className="fridge-mid-grid">
        <div className="fridge-card">
          <h3>Refrigerator Usage Analysis</h3>
          <TimelineChart data={timelineData} xKey="timestamp" yKey="value" />
        </div>

        <div className="fridge-card">
          <h3>Active Alert</h3>
          <div className="fridge-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Fridge Door Open for {durationLabel}</strong>
              <div>{lastOpened}</div>
            </div>
          </div>
          <button type="button" className="fridge-alert-btn">Notify Staffs</button>
        </div>
      </div>

      <div className="fridge-bottom-grid">
        <div className="fridge-card">
          <h3>Magnetic Reed switch Sensor Live Data</h3>
          <SensorTable
            columns={[
              { key: 'timestamp', label: 'timestamp' },
              { key: 'status', label: 'Door Status' },
              { key: 'Duration', label: 'Duration' },
              { key: 'Alert', label: 'Alert' },
              { key: 'PowerImpact', label: 'Power Impact' },
            ]}
            rows={[...history].reverse().slice(0, 8).map((row) => ({
              ...row,
              Duration: getFirstValid(row.Duration, row.duration, '--'),
              Alert: getFirstValid(row.Alert, row.alert, doorStatus === 'OPEN' ? 'High Open' : 'false'),
              PowerImpact: getFirstValid(row.PowerImpact, row.power_impact, String(row.status).toUpperCase() === 'OPEN' ? 'Power Loss' : 'Efficient'),
            }))}
          />
        </div>

        <div className="fridge-card">
          <h3>Fridge Usage Heatmap by Hour</h3>
          <div className="fridge-heatmap">
            {heatmap.map((dayRow, dayIndex) => (
              <div className="fridge-heatmap-row" key={`d-${dayIndex}`}>
                {dayRow.map((value, hourIndex) => (
                  <span key={`h-${dayIndex}-${hourIndex}`} style={{ background: heatColor(value) }} />
                ))}
              </div>
            ))}
          </div>
          <div className="fridge-heatmap-labels">
            <span>LOW</span>
            <span>HIGH</span>
          </div>
        </div>
      </div>

      <div className="fridge-footer-strip">
        <span>ESP32 : ONLINE</span>
        <span>Last Update : 1 min ago</span>
        <span>Wifi strength : Strong</span>
        <span>Date/Time : {new Date().toLocaleString()}</span>
      </div>
      <div className="fridge-cloud-status">
        Cloud Connection : <strong>Connected</strong>
      </div>
    </div>
  );
}
