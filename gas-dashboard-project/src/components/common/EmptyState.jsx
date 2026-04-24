export default function EmptyState({ label = 'No data available.' }) {
  return <div className="empty-state">{label}</div>;
}
