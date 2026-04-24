import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatChartTime } from '../../utils/formatters';

export default function TrendChart({ data, xKey, yKey, maxY = 16 }) {
  const chartData = data.map((item) => ({
    ...item,
    chartTime: formatChartTime(item[xKey]),
  }));

  return (
    <div className="gas-trend-wrap">
      <div className="gas-trend-zones" />
      <ResponsiveContainer width="100%" height={205}>
        <AreaChart data={chartData} margin={{ left: -16, right: 12, top: 6 }}>
          <CartesianGrid stroke="#d8d8d8" vertical={false} />
          <XAxis dataKey="chartTime" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#bbb' }} />
          <YAxis domain={[0, maxY]} ticks={[0, 5, 10, 15]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey={yKey} stroke="#f4f4f4" fillOpacity={0} strokeWidth={1.3} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="gas-zone-label safe">Safe</div>
      <div className="gas-zone-label warning">Warning</div>
      <div className="gas-zone-label danger">Danger</div>
    </div>
  );
}
