import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import AlertsPanel from '../../components/alerts/AlertsPanel';
import { Shield, Flame, AlertTriangle } from 'lucide-react';
import useOverviewData from '../../hooks/useOverviewData';

const metricRows = [
  { label: '10 min', value: '36 °C' },
  { label: '20 min', value: '38 °C' },
  { label: '30 min', value: '39 °C' },
  { label: '35 min', value: '40 °C' },
  { label: '39 min', value: '45 °C' },
];

export default function OverviewPage() {
  const { gas, temp, fridge, fire, loading } = useOverviewData();

  if (loading) return <LoadingState label="Loading overview..." />;
  if (!gas.latest && !temp.latest && !fridge.latest && !fire.latest) {
    return <EmptyState label="No overview data available." />;
  }

  const alerts = [
    ...gas.alerts,
    ...(fire.latest?.alert_triggered ? [{ title: 'Fire alert triggered', time: fire.latest.date_time, level: fire.latest.alert_level || 'danger' }] : []),
    ...(temp.latest?.status && temp.latest.status !== 'SAFE' ? [{ title: temp.latest.warning || 'High Temperature Warning', time: `${temp.latest.date} ${temp.latest.time}`, level: temp.latest.status }] : []),
  ].slice(0, 2);

  return (
    <div className="page-grid overview-mock">
      <div className="overview-top-label">Overall DashBoard</div>
      <div className="system-banner">
        <Shield size={14} /> Kitchen Risk status : <strong>SAFE</strong>
        <span className="system-banner-meta">Last alert Shook : 2 hrs ago</span>
      </div>

      <div className="overview-kpi-row">
        {[
          { title: 'Humidity', value: `${Math.round(Number(temp.latest?.humidity || 8))}%`, badge: 'OPTIMAL' },
          { title: 'Temperature', value: `${Math.round(Number(temp.latest?.temperature || 34))}°C`, badge: 'AVERAGE HEAT' },
          { title: 'Gas Detection', value: (gas.analysis?.final_risk || gas.latest?.status || 'SAFE').toUpperCase(), badge: 'SAFE' },
          { title: 'Fire Detection', value: fire.latest?.alert_triggered ? 'YES' : 'NO', badge: 'SAFE' },
          { title: 'Fridge Status', value: fridge.latest?.status === 'OPEN' ? 'Closed' : 'Closed', badge: 'CLOSED' },
        ].map((card) => (
          <div className="overview-kpi" key={card.title}>
            <div className="overview-kpi-title">{card.title}</div>
            <div className="overview-kpi-value">{card.value}</div>
            <div className="overview-kpi-badge">{card.badge}</div>
          </div>
        ))}

        <Panel title="Alerts and Event Logs">
          <div className="overview-log-list">
            {(alerts.length ? alerts : [{ title: 'Gas Leak Detected', time: '12.46 P.M' }, { title: 'High Temperature Warning', time: '12.49 P.M' }]).map((a) => (
              <div key={`${a.title}-${a.time}`} className="overview-log-item">
                <strong>{a.title}</strong>
                <span>{a.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="overview-mid-row">
        <Panel title="Next Hour Temperature Forecast">
          <div className="forecast-box">
            <div className="forecast-graph" />
            <div className="forecast-metrics">{metricRows.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          </div>
          <div className="overview-pill warning"><AlertTriangle size={16} /> Temperature may reach 38°C within 45 minutes if current trend continuous</div>
        </Panel>

        <Panel title="Device and System Health">
          <div className="summary-list compact">
            <div><strong>ESP32 Connection Status</strong> <span className="chip-tiny">Connected</span></div>
            <div>Temperature and Humidity Sensor : Normal</div>
            <div>Gas Detection Sensor : Normal</div>
            <div>Flame Detection Sensor : Normal</div>
            <div>Fridge Open/Close Sensor : Normal</div>
          </div>
          <div className="panel-foot-text">Wifi strength : Strong</div>
        </Panel>

        <div className="stack-panels">
          <Panel title="Current Status">
            <div className="overview-pill danger"><Flame size={14} /> High Temperature Detected in 45 mins</div>
            <div className="overview-pill danger"><Flame size={14} /> High Temperature Detected in 45 mins</div>
          </Panel>
          <Panel title="Environmental Control Recommendations">
            <div className="overview-pill warn"><AlertTriangle size={16} /> Increase exhaust fan speed</div>
            <div className="overview-pill warn"><AlertTriangle size={16} /> Turn on kitchen ventilation system</div>
          </Panel>
        </div>
      </div>

      <div className="overview-bottom-row">
        <Panel title="Correlation"><strong>🔥 High Temperature and Rising Gas Levels combined pose a fire Hazard</strong></Panel>
        <Panel title="Refrigerator Events"><div className="big-number">12m 40s</div></Panel>
        <Panel title="Data Insights">Fridge opened 15 times today.<br />Gas Level Peaked 350 ppm.<br />High Temperature and Gas detected twice last week.</Panel>
      </div>

      <div className="footer-strip"><span>ESP32 : ONLINE</span><span>Last Update : 1 min ago</span><span>Wifi strength : Strong</span><span>Date/Time : 14/02/2026 00:12</span></div>
    </div>
  );
}
