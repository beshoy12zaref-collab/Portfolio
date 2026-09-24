const SUPABASE_URL = "https://zjubgmvcxysnhodvdwcy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_AHsFa1otUVA8xFUIGOxh7A_6rWlQsYf";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
