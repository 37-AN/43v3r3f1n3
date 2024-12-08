import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://ipglcejtzonamkpsbwgz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ2xjZWp0em9uYW1rcHNid2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0NjM4ODIsImV4cCI6MjA0OTAzOTg4Mn0.qcLyGr2mWtKw1oWv0l7HPdmXOCuCtu-jyRSPt_nLnuk";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});