import StatCard from '../../components/common/StatCard';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import AlertsPanel from '../../components/alerts/AlertsPanel';
import useOverviewData from '../../hooks/useOverviewData';

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

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Temperature" value={temp.latest?.temperature ? `${temp.latest.temperature} °C` : '--'} status={temp.latest?.status} />
        <StatCard title="Gas Value" value={gas.latest?.gasValue ?? '--'} status={gas.analysis?.final_risk || gas.latest?.status} />
        <StatCard title="Fridge" value={fridge.latest?.status || '--'} status={fridge.latest?.status === 'OPEN' ? 'WARNING' : 'SAFE'} />
        <StatCard title="Fire" value={fire.latest?.flame_status || '--'} status={fire.latest?.alert_level || fire.latest?.flame_status} />
      </div>

      <div className="dashboard-grid two-col">
        <Panel title="System Summary">
          <div className="summary-list">
            <div><strong>Gas Predicted Risk:</strong> {gas.analysis?.predicted_risk || '--'}</div>
            <div><strong>Temperature Trend:</strong> {temp.analysis?.trend || '--'}</div>
            <div><strong>Fridge Behavior:</strong> {fridge.analysis?.predicted_behavior || '--'}</div>
            <div><strong>Fire Confidence:</strong> {fire.analysis?.confidence ?? '--'}</div>
          </div>
        </Panel>

        <Panel title="Latest Alerts">
          <AlertsPanel alerts={alerts} />
        </Panel>
      </div>
    </div>
  );
}
