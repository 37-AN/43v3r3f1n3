export const formatOPCUAValue = (value: number): string => {
  return typeof value === 'number' ? value.toFixed(2) : 'N/A';
};

export const getValueTrend = (currentValue: number, previousValue: number): number => {
  if (!previousValue) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};