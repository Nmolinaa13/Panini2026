import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oeawnkeautxcqrtmhkor.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYXdua2VhdXR4Y3FydG1oa29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Nzc3NDEsImV4cCI6MjA5MzI1Mzc0MX0.bjE5STdpYfRLUr70mW3mmmld0-M112vCtQUW1ZuYkoU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
