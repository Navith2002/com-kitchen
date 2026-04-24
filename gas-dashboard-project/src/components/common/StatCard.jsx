import StatusBadge from './StatusBadge';

export default function StatCard({ title, value, subtitle, status }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {status ? <StatusBadge value={status} /> : null}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle ? <div className="stat-card-subtitle">{subtitle}</div> : null}
    </div>
  );
}
