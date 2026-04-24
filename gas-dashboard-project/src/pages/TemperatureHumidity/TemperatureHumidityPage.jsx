import Panel from '../../components/common/Panel';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SensorTable from '../../components/common/SensorTable';
import TimelineChart from '../../components/charts/TimelineChart';
import useTempHumData from '../../hooks/useTempHumData';

export default function TemperatureHumidityPage() {
  const { latest, history, analysis, loading } = useTempHumData();

  if (loading) return <LoadingState label="Loading temperature and humidity..." />;
  if (!latest) return <EmptyState label="No temperature and humidity data available." />;

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard title="Temperature" value={`${latest.temperature ?? '--'} °C`} status={latest.status} />
        <StatCard title="Humidity" value={`${latest.humidity ?? '--'} %`} subtitle={latest.warning || 'Stable condition'} />
        <StatCard title="Trend" value={analysis?.trend || 'Stable'} />
        <StatCard title="Predicted Risk" value={analysis?.predicted_risk || latest.status || 'SAFE'} />
      </div>

      <div className="dashboard-grid two-col">
        <Panel title="Temperature Trend">
          <TimelineChart data={history} xKey="timestamp" yKey="temperature" />
        </Panel>
        <Panel title="Humidity Trend">
          <TimelineChart data={history} xKey="timestamp" yKey="humidity" />
        </Panel>
      </div>

      <Panel title="Recent Temperature / Humidity Records">
        <SensorTable
          columns={[
            { key: 'date', label: 'date' },
            { key: 'time', label: 'time' },
            { key: 'temperature', label: 'temperature' },
            { key: 'humidity', label: 'humidity' },
            { key: 'status', label: 'status', type: 'status' },
          ]}
          rows={[...history].reverse().slice(0, 10)}
        />
      </Panel>
    </div>
  );
}
