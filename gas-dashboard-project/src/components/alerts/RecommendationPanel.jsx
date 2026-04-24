export default function RecommendationPanel({ items = [] }) {
  return (
    <div className="recommendation-panel">
      {items.length === 0 ? (
        <div className="alerts-empty">No recommendations right now.</div>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
