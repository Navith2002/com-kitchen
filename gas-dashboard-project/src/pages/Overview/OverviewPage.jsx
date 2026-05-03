import { Shield, AlertTriangle, Flame } from 'lucide-react';
import GaugeCard from '../../components/charts/GaugeCard';
import Panel from '../../components/common/Panel';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import useOverviewData from '../../hooks/useOverviewData';

function FlameGauge({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const rotation = -90 + (clamped / 100) * 180;
  return (
    <div className="ov-fire-gauge">
      <div className="ov-fire-ring" />
      <div className="ov-fire-needle" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
      <div className="ov-fire-dot" />
      <div className="ov-fire-value">{clamped}%</div>
    </div>
  );
}

export default function OverviewPage() {
  const { gas, temp, fridge, fire, loading } = useOverviewData();
  if (loading) return <LoadingState label="Loading overview..." />;
  if (!gas.latest && !temp.latest && !fridge.latest && !fire.latest) return <EmptyState label="No overview data available." />;

  const flame = fire.latest?.intensity_percent ?? fire.latest?.flame_intensity ?? 18;
  const gasValue = Number(gas.latest?.gasValue || 294);
  const tempValue = Number(temp.latest?.temperature || 34);
  const duration = fridge.analysis?.door_open_duration || '12m 40s';

  return (
    <div className="overview-pro">
      <div className="overview-headline">Overall DashBoard</div>
      <div className="overview-safe-banner"><Shield size={14} /> Kitchen Risk status : <b>SAFE</b><span>Last alert Shook : 2 hrs ago</span></div>

      <div className="overview-kpis">
        <div className="kpi-box"><h4>Humidity</h4><p>08%</p><label>OPTIMAL</label></div>
        <div className="kpi-box"><h4>Temperature</h4><p>{Math.round(tempValue)}°C</p><label>AVERAGE HEAT</label></div>
        <div className="kpi-box"><h4>Gas Detection</h4><p>{(gas.analysis?.final_risk || 'SAFE').toUpperCase()}</p><label>SAFE</label></div>
        <div className="kpi-box"><h4>Fire Detection</h4><p>{fire.latest?.alert_triggered ? 'YES' : 'NO'}</p><label>SAFE</label></div>
        <div className="kpi-box"><h4>Fridge Status</h4><p>{fridge.latest?.status === 'OPEN' ? 'Closed' : 'Closed'}</p><label>CLOSED</label></div>
        <Panel title="Alerts and Event Logs"><div className="tiny-log"><b>Gas Leak Detected</b><span>12.46 P.M</span><b>High Temperature Warning</b><span>12.49 P.M</span></div></Panel>
      </div>

      <div className="overview-gauges-row">
        <Panel title="Gas Dashboard's Gas Gauge"><GaugeCard value={gasValue} /></Panel>
        <Panel title="Temperature Dashboard's Gauge"><div className="temp-big-gauge"><div>{tempValue}°C</div><small>Safe &lt;28 | Warning &lt;35 | Danger ≥35</small></div></Panel>
        <Panel title="Flame Gauge"><FlameGauge value={flame} /></Panel>
        <Panel title="Fridge Door Opened Duration"><div className="door-duration"><strong>{duration}</strong><span>Average Door Open Duration</span></div></Panel>
      </div>

      <div className="overview-lower">
        <Panel title="Next Hour Temperature Forecast">
          <div className="forecast-wrap">
            <div className="forecast-chart" />
            <div className="forecast-side">
              <div><span>10 min</span><b>36 °C</b></div><div><span>20 min</span><b>38 °C</b></div><div><span>30 min</span><b>39 °C</b></div><div><span>35 min</span><b>40 °C</b></div><div><span>39 min</span><b>45 °C</b></div>
            </div>
          </div>
          <div className="warn-pill"><AlertTriangle size={15} /> Temperature may reach 38°C within 45 minutes if current trend continuous</div>
        </Panel>
        <Panel title="Current Status">
          <div className="warn-pill soft"><Flame size={14} /> High Temperature Detected in 45 mins</div>
          <div className="warn-pill soft"><Flame size={14} /> High Temperature Detected in 45 mins</div>
        </Panel>
      </div>
    </div>
  );
}
