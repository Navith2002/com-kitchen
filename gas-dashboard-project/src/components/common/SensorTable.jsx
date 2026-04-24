import StatusBadge from './StatusBadge';

export default function SensorTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table className="sensor-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">No records available.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.key || index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.type === 'status' ? (
                      <StatusBadge value={row[column.key]} />
                    ) : (
                      row[column.key] ?? '--'
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
