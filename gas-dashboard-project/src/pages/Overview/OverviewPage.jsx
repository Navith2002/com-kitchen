import StatCard from '../../components/common/StatCard';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import AlertsPanel from '../../components/alerts/AlertsPanel';
import useOverviewData from '../../hooks/useOverviewData';

function getHealthScore({ gas, temp, fridge, fire }) {
  let score = 100;
  if ((gas.analysis?.final_risk || '').toUpperCase() === 'WARNING') score -= 18;
  if ((gas.analysis?.final_risk || '').toUpperCase() === 'DANGER') score -= 34;
  if ((temp.latest?.status || '').toUpperCase() === 'WARNING') score -= 15;
  if ((temp.latest?.status || '').toUpperCase() === 'DANGER') score -= 30;
  if ((fridge.latest?.status || '').toUpperCase() === 'OPEN') score -= 10;
  if (fire.latest?.alert_triggered) score -= 35;
  return Math.max(0, Math.min(100, score));
}

export default function OverviewPage() {
  const { gas, temp, fridge, fire, loading } = useOverviewData();

  if (loading) return <LoadingState label="Loading overview..." />;
  if (!gas.latest && !temp.latest && !fridge.latest && !fire.latest) {
    return <EmptyState label="No overview data available." />;
  }

  const alerts = [
    ...gas.alerts,
    ...(fire.latest?.alert_triggered ? [{ title: 'Fire alert triggered', time: fire.latest.date_time, level: fire.latest.alert_level || 'danger' }] : []),
    ...(temp.latest?.status && temp.latest.status !== 'SAFE' ? [{ title: temp.latest.warning || 'Temperature warning', time: `${temp.latest.date} ${temp.latest.time}`, level: temp.latest.status }] : []),
  ].slice(0, 5);

  const healthScore = getHealthScore({ gas, temp, fridge, fire });
  const gasStatus = (gas.analysis?.final_risk || gas.latest?.status || 'SAFE').toUpperCase();
  const tempStatus = (temp.latest?.status || 'SAFE').toUpperCase();
  const fridgeStatus = (fridge.latest?.status || '--').toUpperCase();
  const fireStatus = (fire.latest?.alert_level || fire.latest?.flame_status || '--').toUpperCase();

  return (
    <div className="page-grid">
      <div className={`system-banner ${healthScore < 70 ? 'danger' : ''}`}>
        Kitchen Risk Status : <strong>{healthScore < 70 ? 'WARNING' : 'SAFE'}</strong>
        <span className="system-banner-meta">Last alert shock: {alerts[0]?.time || 'No recent alerts'}</span>
      </div>

      <div className="stats-grid five-col">
        <StatCard title="Humidity" value={temp.latest?.humidity ? `${temp.latest.humidity}%` : '--'} status={tempStatus} subtitle="Current RH" />
        <StatCard title="Temperature" value={temp.latest?.temperature ? `${temp.latest.temperature} °C` : '--'} status={tempStatus} />
        <StatCard title="Gas Detection" value={gasStatus} status={gasStatus} />
        <StatCard title="Fire Detection" value={fire.latest?.alert_triggered ? 'YES' : 'NO'} status={fireStatus} />
        <StatCard title="Fridge Status" value={fridge.latest?.status || '--'} status={fridgeStatus === 'OPEN' ? 'WARNING' : 'SAFE'} />
      </div>

      <div className="dashboard-grid overview-body-grid">
        <Panel title="Next Hour Snapshot">
          <div className="summary-list">
            <div><strong>Gas Predicted Risk:</strong> {gas.analysis?.predicted_risk || '--'}</div>
            <div><strong>Temperature Trend:</strong> {temp.analysis?.trend || '--'}</div>
            <div><strong>Fridge Behavior:</strong> {fridge.analysis?.predicted_behavior || '--'}</div>
            <div><strong>Fire Confidence:</strong> {fire.analysis?.confidence ?? '--'}</div>
            <div><strong>Health Score:</strong> {healthScore}%</div>
          </div>
        </Panel>

        <Panel title="Current Status">
          <div className="summary-list compact">
            <div>Gas sensor: <strong>{gasStatus}</strong></div>
            <div>Temp sensor: <strong>{tempStatus}</strong></div>
            <div>Fridge door: <strong>{fridgeStatus}</strong></div>
            <div>Flame sensor: <strong>{fireStatus}</strong></div>
          </div>
        </Panel>

        <Panel title="Latest Alerts">
          <AlertsPanel alerts={alerts} />
        </Panel>
      </div>
    </div>
  );
}
