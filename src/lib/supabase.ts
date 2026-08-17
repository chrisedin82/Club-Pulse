import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://nizcyjpdkihaitdewyej.supabase.co";
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  ?? "sb_publishable_0JuHOsa8fe6bF31mc20mtw_eCEJyd5m";

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Club Pulse database configuration is missing.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
