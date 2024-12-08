import { Card } from "@/components/ui/card";
import { MetricsChart } from "@/components/MetricsChart";
import { ModbusRegisterData } from "@/types/modbus";
import { formatOPCUAValue } from "@/utils/opcua/dataFormatting";

interface OPCUAMetricCardProps {
  title: string;
  value: number;
  chartData: ModbusRegisterData[];
}

export function OPCUAMetricCard({ title, value, chartData }: OPCUAMetricCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold capitalize">{title}</h3>
        <p className="text-2xl font-bold">{formatOPCUAValue(value)}</p>
      </div>
      <div className="h-[200px]">
        <MetricsChart
          title={`${title} History`}
          data={chartData}
          registerType="input"
          className="h-full"
        />
      </div>
    </Card>
  );
}