import { normalizeRiskLabel } from '../../utils/normalize';

export default function StatusBadge({ value }) {
  const label = normalizeRiskLabel(value);
  const cls = label.toLowerCase();
  return <span className={`status-badge ${cls}`}>{label}</span>;
}
