import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useAITraining } from "@/hooks/useAITraining";
import { useDeviceSelection } from "@/hooks/useDeviceSelection";

export function ModelTraining() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { trainModel, isTraining } = useAITraining();
  const selectedDeviceId = useDeviceSelection();

  const handleTraining = async () => {
    if (!selectedDeviceId || !startDate || !endDate) {
      return;
    }

    await trainModel(selectedDeviceId, {
      start: startDate,
      end: endDate
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Train AI Model</h3>
      
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
        onClick={handleTraining} 
        disabled={isTraining || !selectedDeviceId || !startDate || !endDate}
        className="w-full"
      >
        {isTraining ? 'Training in Progress...' : 'Start Training'}
      </Button>
    </Card>
  );
}