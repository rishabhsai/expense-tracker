import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://prtaibxmqwhxiwkgebgx.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydGFpYnhtcXdoeGl3a2dlYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NjQ5MTIsImV4cCI6MjA2ODE0MDkxMn0.s_W3COF8yVaLSga6tfYXaG2EwfEipI7Seul866fT_rI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Expense = {
  id: string
  name: string
  project: string
  cost: number
  billing: "monthly" | "yearly"
  category: string
  created_at: string
  updated_at: string
}
