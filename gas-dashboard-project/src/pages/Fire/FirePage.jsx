import Panel from '../../components/common/Panel';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SensorTable from '../../components/common/SensorTable';
import TimelineChart from '../../components/charts/TimelineChart';
import useFireData from '../../hooks/useFireData';

export default function FirePage() {
  const { latest, history, analysis, loading } = useFireData();

  if (loading) return <LoadingState label="Loading fire monitoring data..." />;
  if (!latest) return <EmptyState label="No fire data available." />;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Flame Status" value={latest.flame_status || '--'} status={latest.flame_status} />
        <StatCard title="Alert Level" value={latest.alert_level || '--'} status={latest.alert_level} />
        <StatCard title="Fire Count" value={latest.fire_count ?? 0} />
        <StatCard title="Buzzer" value={latest.buzzer_status || 'OFF'} />
      </div>

      <div className="dashboard-grid two-col">
        <Panel title="Flame Intensity Trend">
          <TimelineChart data={history} xKey="date_time" yKey="intensity_percent" />
        </Panel>
        <Panel title="Fire Analysis Summary">
          <div className="summary-list">
            <div><strong>Predicted Risk:</strong> {analysis?.predicted_risk || 'SAFE'}</div>
            <div><strong>Anomaly Detected:</strong> {analysis?.anomaly_detected ? 'YES' : 'NO'}</div>
            <div><strong>Confidence:</strong> {analysis?.confidence ?? '--'}</div>
            <div><strong>LED Status:</strong> {latest.fire_led_status || 'OFF'}</div>
            <div><strong>ESP32 Status:</strong> {latest.esp32_status || 'ONLINE'}</div>
          </div>
        </Panel>
      </div>

      <Panel title="Fire Monitoring Records">
        <SensorTable
          columns={[
            { key: 'date_time', label: 'date_time' },
            { key: 'flame_status', label: 'flame_status', type: 'status' },
            { key: 'intensity_percent', label: 'intensity_percent' },
            { key: 'alert_triggered', label: 'alert_triggered' },
          ]}
          rows={[...history].reverse().slice(0, 12)}
        />
      </Panel>
    </div>
  );
}
