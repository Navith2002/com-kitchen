export function objectToSortedArray(objectValue, sortKey = 'timestamp') {
  return Object.entries(objectValue)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      const aTime = new Date(a[sortKey] || a.timestamp || a.date_time || 0).getTime();
      const bTime = new Date(b[sortKey] || b.timestamp || b.date_time || 0).getTime();
      return aTime - bTime;
    });
}
