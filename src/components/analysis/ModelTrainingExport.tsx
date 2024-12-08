import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthState } from "@/hooks/useAuthState";

export function ModelTrainingExport() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const isAuthenticated = useAuthState();

  const handleExport = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to export data');
      return;
    }

    try {
      setIsExporting(true);
      console.log('Starting export with auth check...');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        return;
      }

      // Set default date range if not provided (last 7 days)
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      
      const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
      const queryEndDate = endDate ? new Date(endDate) : new Date();

      // Ensure full day range
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate.setHours(23, 59, 59, 999);

      console.log('Querying with date range:', {
        start: queryStartDate.toISOString(),
        end: queryEndDate.toISOString()
      });

      // First try to fetch any record to verify table access
      const { data: testData, error: testError } = await supabase
        .from('arduino_plc_data')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Table access test failed:', testError);
        toast.error('Unable to access data. Please check your permissions.');
        return;
      }

      // Fetch actual data
      const { data: plcData, error: plcError } = await supabase
        .from('arduino_plc_data')
        .select('*, plc_devices(name)')
        .gte('timestamp', queryStartDate.toISOString())
        .lte('timestamp', queryEndDate.toISOString());

      if (plcError) {
        console.error('Error fetching PLC data:', plcError);
        toast.error('Failed to fetch data');
        return;
      }

      if (!plcData?.length) {
        console.log('No data found in range:', {
          start: queryStartDate,
          end: queryEndDate,
          testDataExists: testData?.length > 0
        });
        toast.error('No data found for the selected date range');
        return;
      }

      // Format the data for export
      const exportData = plcData.map(record => ({
        timestamp: record.timestamp,
        device: record.plc_devices?.name || 'Unknown Device',
        type: record.data_type,
        value: record.value,
        metadata: record.metadata
      }));

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plc-data-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Export Training Data</h3>
      
      <div className="flex gap-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-500">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-500">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button 
        onClick={handleExport} 
        className="w-full"
        disabled={isExporting || !isAuthenticated}
      >
        {isExporting ? 'Exporting...' : 'Export Data'}
      </Button>
    </div>
  );
}