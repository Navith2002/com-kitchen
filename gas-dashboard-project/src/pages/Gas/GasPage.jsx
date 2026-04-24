import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import GaugeCard from '../../components/charts/GaugeCard';
import TrendChart from '../../components/charts/TrendChart';
import AlertsPanel from '../../components/alerts/AlertsPanel';
import SensorTable from '../../components/common/SensorTable';
import CorrelationChart from '../../components/charts/CorrelationChart';
import ForecastChart from '../../components/charts/ForecastChart';
import useGasData from '../../hooks/useGasData';
import useTempHumData from '../../hooks/useTempHumData';
import { mergeGasTemperatureHistory } from '../../utils/correlation';

export default function GasPage() {
  const { latest, history, analysis, alerts, loading } = useGasData();
  const tempHum = useTempHumData();

  if (loading) return <LoadingState label="Loading gas dashboard..." />;
  if (!latest) return <EmptyState label="No gas data available." />;

  const mergedCorrelation = mergeGasTemperatureHistory(history, tempHum.history);
  const systemSafe = (analysis?.final_risk || analysis?.predicted_risk || latest.status) !== 'DANGER';

  return (
    <div className="page-grid">
      <div className={`system-banner ${systemSafe ? 'success' : 'danger'}`}>
        System status : {systemSafe ? 'No Gas Leakage Detected' : 'Gas Leakage Warning'}
      </div>

      <div className="dashboard-grid top-row">
        <Panel title="Gas Level">
          <GaugeCard value={latest.gasValue || 0} />
        </Panel>

        <Panel title="Gas Level">
          <TrendChart data={history} xKey="timestamp" yKey="gasValue" />
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
