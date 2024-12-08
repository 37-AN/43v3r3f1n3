interface DashboardHeaderProps {
  title: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  return (
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
  );
};