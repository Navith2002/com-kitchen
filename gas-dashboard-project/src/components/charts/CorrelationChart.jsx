import {
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function CorrelationChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="#d8d8d8" />
          <XAxis type="number" dataKey="x" name="Temperature" unit="°C" />
          <YAxis type="number" dataKey="y" name="Gas" unit="ppm" domain={[0, 700]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#111111" />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="chart-zone-labels bottom-space">
        <span className="danger-text">Danger</span>
        <span className="warning-text">Warning</span>
        <span className="safe-text">Safe</span>
      </div>
    </div>
  );
}
