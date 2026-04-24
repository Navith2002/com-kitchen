import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatChartTime } from '../../utils/formatters';

export default function TimelineChart({ data, xKey, yKey, color = '#111111' }) {
  const chartData = data.map((item) => ({
    ...item,
    chartTime: formatChartTime(item[xKey]),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData}>
        <CartesianGrid stroke="#d8d8d8" strokeDasharray="3 3" />
        <XAxis dataKey="chartTime" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey={yKey} stroke={color} fill="#dfe5d9" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
