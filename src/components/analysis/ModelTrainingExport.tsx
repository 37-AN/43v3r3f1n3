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
      console.log('Starting export process...');

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        return;
      }

      console.log('Session found:', session.user.email);

      // Set default date range if not provided (last 30 days for more data)
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      // Ensure we have the full day range
      const queryStartDate = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : defaultStartDate;
      const queryEndDate = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : new Date();
      
      console.log('Query date range:', { 
        start: queryStartDate.toISOString(), 
        end: queryEndDate.toISOString() 
      });

      // First verify we can access the table
      console.log('Verifying table access...');
      const { data: testData, error: testError } = await supabase
        .from('arduino_plc_data')
        .select('id')
        .limit(1)
        .single();

      if (testError) {
        console.error('Table access test failed:', testError);
        throw new Error('Failed to access PLC data table');
      }

      console.log('Table access verified');

      // Fetch PLC data with detailed logging
      console.log('Fetching PLC data...');
      const { data: plcData, error: plcError } = await supabase
        .from('arduino_plc_data')
        .select(`
          id,
          device_id,
          data_type,
          value,
          timestamp,
          plc_devices(name)
        `)
        .gte('timestamp', queryStartDate.toISOString())
        .lte('timestamp', queryEndDate.toISOString())
        .order('timestamp', { ascending: true });

      if (plcError) {
        console.error('Error fetching PLC data:', plcError);
        throw plcError;
      }

      console.log('PLC data fetch response:', {
        hasData: !!plcData,
        recordCount: plcData?.length || 0,
        firstRecord: plcData?.[0],
        lastRecord: plcData?.[plcData?.length - 1]
      });

      if (!plcData || plcData.length === 0) {
        console.log('No data found in range:', {
          start: queryStartDate,
          end: queryEndDate,
        });
        toast.error('No data found for the specified date range');
        return;
      }

      // Format data for export
      const formattedData = plcData.map(record => ({
        id: record.id,
        timestamp: record.timestamp,
        device: record.plc_devices?.name || 'Unknown Device',
        device_id: record.device_id,
        type: record.data_type,
        value: record.value
      }));

      console.log('Formatted data sample:', formattedData[0]);

      // Create and download file
      const blob = new Blob([JSON.stringify(formattedData, null, 2)], {
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
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data: ' + (error as Error).message);
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