import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartTime } from '../../utils/formatters';

export default function TrendChart({ data, xKey, yKey, safeMax = 330, warnMax = 500, maxY = 700 }) {
  const chartData = data.map((item) => ({
    ...item,
    chartTime: formatChartTime(item[xKey]),
  }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
          <XAxis dataKey="chartTime" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <ReferenceArea y1={0} y2={safeMax} fill="#cfe7ca" fillOpacity={0.9} />
          <ReferenceArea y1={safeMax} y2={warnMax} fill="#dcccae" fillOpacity={0.8} />
          <ReferenceArea y1={warnMax} y2={maxY} fill="#e7caca" fillOpacity={0.85} />
          <Line type="monotone" dataKey={yKey} stroke="#3b3b3b" strokeWidth={1.4} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="chart-zone-labels">
        <span className="danger-text">Danger</span>
        <span className="warning-text">Warning</span>
        <span className="safe-text">Safe</span>
      </div>
    </div>
  );
}
