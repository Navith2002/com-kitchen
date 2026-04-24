import {
  CartesianGrid,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
} from 'recharts';
import { buildSimpleForecast } from '../../utils/forecast';

export default function ForecastChart({ data, sourceKey = 'gasValue' }) {
  const forecastData = buildSimpleForecast(data, sourceKey);

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={forecastData}>
          <CartesianGrid stroke="#d8d8d8" />
          <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 700]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <ReferenceArea y1={0} y2={330} fill="#cfe7ca" fillOpacity={0.9} />
          <ReferenceArea y1={330} y2={500} fill="#dcccae" fillOpacity={0.8} />
          <ReferenceArea y1={500} y2={700} fill="#e7caca" fillOpacity={0.85} />
          <Line type="monotone" dataKey="value" stroke="#111111" strokeWidth={1.3} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-zone-labels">
        <span className="danger-text">Danger</span>
        <span className="warning-text">Warning</span>
        <span className="safe-text">Safe</span>
      </div>
    </div>
  );
}
