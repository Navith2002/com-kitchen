import { AlertTriangle } from 'lucide-react';
import { formatShortTime } from '../../utils/formatters';

export default function AlertsPanel({ alerts }) {
  if (!alerts.length) {
    return <div className="alerts-empty">No recent alerts.</div>;
  }

  return (
    <div className="alerts-panel">
      {alerts.map((alert, index) => (
        <div className="alert-item" key={`${alert.title}-${index}`}>
          <AlertTriangle size={18} className={alert.level === 'danger' || alert.level === 'DANGER' ? 'danger-icon' : 'warning-icon'} />
          <div>
            <div className="alert-title">{alert.title}</div>
            <div className="alert-time">{formatShortTime(alert.time)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
