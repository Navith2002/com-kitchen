import Panel from '../../components/common/Panel';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import SensorTable from '../../components/common/SensorTable';
import TimelineChart from '../../components/charts/TimelineChart';
import useFridgeData from '../../hooks/useFridgeData';
import RecommendationPanel from '../../components/alerts/RecommendationPanel';

export default function FridgePage() {
  const { latest, history, analysis, loading } = useFridgeData();

  if (loading) return <LoadingState label="Loading fridge data..." />;
  if (!latest) return <EmptyState label="No fridge data available." />;

  const recommendations = [];
  if (analysis?.anomaly_detected) recommendations.push('Inspect unusual fridge door activity.');
  if ((analysis?.door_open_duration_sec || 0) > 60) recommendations.push('Door has been open too long. Check cooling efficiency.');
  const latestDuration =
    latest?.Duration ??
    latest?.duration ??
    analysis?.Duration ??
    analysis?.door_open_duration ??
    `${analysis?.door_open_duration_sec ?? 0} sec`;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Door Status" value={latest.status || '--'} status={latest.status === 'OPEN' ? 'WARNING' : 'SAFE'} />
        <StatCard title="Door Open Duration" value={latestDuration} />
        <StatCard title="Predicted Behavior" value={analysis?.predicted_behavior || 'NORMAL'} />
        <StatCard title="Anomaly" value={analysis?.anomaly_detected ? 'YES' : 'NO'} />
      </div>

      <div className="dashboard-grid two-col">
        <Panel title="Fridge Door Activity Timeline">
          <TimelineChart data={history.map((item, index) => ({ ...item, value: item.status === 'OPEN' ? 1 : 0 }))} xKey="timestamp" yKey="value" />
        </Panel>
        <Panel title="Recommendations">
          <RecommendationPanel items={recommendations} />
        </Panel>
      </div>

      <Panel title="Fridge Event Table">
        <SensorTable
          columns={[
            { key: 'timestamp', label: 'timestamp' },
            { key: 'status', label: 'status', type: 'status' },
          ]}
          rows={[...history].reverse().slice(0, 12)}
        />
      </Panel>
    </div>
  );
}
