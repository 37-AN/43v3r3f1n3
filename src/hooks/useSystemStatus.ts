import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemStatus {
  isConnected: boolean;
  lastHeartbeat?: Date;
  error?: string;
}

export function useSystemStatus() {
  const [refineryStatus, setRefineryStatus] = useState<SystemStatus>({
    isConnected: false
  });
  const [mesStatus, setMesStatus] = useState<SystemStatus>({
    isConnected: false
  });

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // Check AI Refinery status
        const { data: refineryData, error: refineryError } = await supabase.functions.invoke(
          'industrial-data-refinery',
          { 
            body: { action: 'health-check' }
          }
        );

        setRefineryStatus({
          isConnected: !refineryError && refineryData?.status === 'healthy',
          lastHeartbeat: new Date(),
          error: refineryError?.message
        });

        // Check MES Engine status
        const { data: mesData, error: mesError } = await supabase.functions.invoke(
          'mes-tokenization-engine',
          { 
            body: { action: 'health-check' }
          }
        );

        setMesStatus({
          isConnected: !mesError && mesData?.status === 'healthy',
          lastHeartbeat: new Date(),
          error: mesError?.message
        });

      } catch (error) {
        console.error('Error checking system status:', error);
        toast.error('Failed to check system status');
      }
    };

    // Initial check
    checkSystemStatus();

    // Set up periodic checks
    const interval = setInterval(checkSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    refineryStatus,
    mesStatus
  };
}