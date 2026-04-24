import {
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartTime } from '../../utils/formatters';

function formatGasAxisTime(value) {
  return formatChartTime(value).replace(':', '.');
}

function buildTicks(totalPoints, tickCount = 6) {
  if (totalPoints <= 1) return [0];
  const step = (totalPoints - 1) / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, idx) => Math.round(idx * step));
}

export default function TrendChart({ data, xKey, yKey, maxY = 16 }) {
  const chartData = data.map((item, index) => ({
    ...item,
    index,
    chartTime: formatGasAxisTime(item[xKey]),
  }));

  if (!chartData.length) return null;

  const zoneEdgeOne = Math.max(0, Math.floor((chartData.length - 1) / 3));
  const zoneEdgeTwo = Math.max(zoneEdgeOne, Math.floor(((chartData.length - 1) * 2) / 3));
  const lastIndex = chartData.length - 1;
  const xTicks = buildTicks(chartData.length);

  return (
    <div className="chart-box gas-zone-chart">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: -8, bottom: 14 }}>
          <ReferenceArea x1={0} x2={zoneEdgeOne} fill="#567452" fillOpacity={0.95} />
          <ReferenceArea x1={zoneEdgeOne} x2={zoneEdgeTwo} fill="#d2a068" fillOpacity={0.95} />
          <ReferenceArea x1={zoneEdgeTwo} x2={lastIndex} fill="#b44f4f" fillOpacity={0.95} />

          <XAxis
            dataKey="index"
            type="number"
            domain={[0, lastIndex]}
            ticks={xTicks}
            tickFormatter={(tick) => chartData[Math.min(lastIndex, Math.max(0, Math.round(tick)))]?.chartTime || '--'}
            tick={{ fontSize: 11, fill: '#8b8b8b' }}
            tickLine={false}
            axisLine={{ stroke: '#1f1f1f', strokeWidth: 1.5 }}
            dy={8}
          />

          <YAxis
            domain={[0, maxY]}
            ticks={[0, 5, 10, 15]}
            tick={{ fontSize: 11, fill: '#8b8b8b' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />

          <Tooltip
            formatter={(value) => [`${value}`, 'Gas Value']}
            labelFormatter={(value) => chartData[value]?.chartTime || '--'}
          />

          <Line type="monotone" dataKey={yKey} stroke="#f4f4f4" strokeWidth={1.8} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart-zone-overlay">
        <span className="zone safe">Safe</span>
        <span className="zone warning">Warning</span>
        <span className="zone danger">Danger</span>
      </div>
    </div>
  );
}
