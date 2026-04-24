export function mergeGasTemperatureHistory(gasHistory, tempHistory) {
  if (!gasHistory.length) return [];
  if (!tempHistory.length) {
    return gasHistory.map((item, index) => ({ x: index + 1, y: item.gasValue || 0 }));
  }

  return gasHistory.slice(-12).map((gasItem, index) => {
    const tempItem = tempHistory[Math.min(index, tempHistory.length - 1)] || {};
    return {
      x: Number(tempItem.temperature || 0),
      y: Number(gasItem.gasValue || 0),
    };
  });
}
