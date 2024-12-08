import { MetricsChart } from "@/components/MetricsChart";

interface SimulationChartsProps {
  chartData: {
    [key: string]: {
      timestamp: string;
      value: number;
      registerType: 'input';
      address: number;
    }[];
  };
}

export function SimulationCharts({ chartData }: SimulationChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Object.entries(chartData).map(([dataType, values]) => (
        <MetricsChart
          key={dataType}
          title={`${dataType.replace('_', ' ').toUpperCase()}`}
          data={values}
          registerType="input"
          className="transition-transform hover:scale-[1.01]"
        />
      ))}
    </div>
  );
}