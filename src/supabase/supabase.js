import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwpbffyiggkomneomtch.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cGJmZnlpZ2drb21uZW9tdGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzQ3NjIsImV4cCI6MjA3OTAxMDc2Mn0.KrKtx23tflFy8ehIC_7jKh-Y4NDUNOvgQ9AoMlAu-I0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
