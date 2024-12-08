interface TooltipContentProps {
  active?: boolean;
  payload?: any[];
  title: string;
  address: number;
  registerType: 'coil' | 'discrete' | 'input' | 'holding';
}

export function ChartTooltipContent({ active, payload, title, address, registerType }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const formattedValue = registerType === 'coil' || registerType === 'discrete' ? 
    value.toString() : 
    value.toFixed(2);

  return (
    <div className="bg-white/95 border-none rounded-lg shadow-lg p-3">
      <p className="text-gray-500 mb-1">{payload[0].payload.timestamp}</p>
      <p className="font-medium">{`${title} (Address: ${address})`}</p>
      <p className="text-sm">{formattedValue}</p>
    </div>
  );
}