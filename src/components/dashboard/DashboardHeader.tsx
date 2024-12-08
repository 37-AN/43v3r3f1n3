interface DashboardHeaderProps {
  title: string;
}

export const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
        {title}
      </h1>
      <div className="flex items-center space-x-4">
        <div className="status-indicator active" />
        <span className="text-sm text-gray-600 dark:text-gray-400">System Online</span>
      </div>
    </div>
  );
};