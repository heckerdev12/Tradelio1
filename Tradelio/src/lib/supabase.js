import { createClient } from '@supabase/supabase-js'

// HARDCODE directly (temporary test)
const supabaseUrl = 'https://qwdutoshgwcsriunodxj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZHV0b3NoZ3djc3JpdW5vZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU4NTE3MiwiZXhwIjoyMDg0MTYxMTcyfQ.6CTFCVNzlv-lV3CdxqSAOYhBi-CIBQA2V9LhJD3AlMk' // Replace this!

console.log('URL:', supabaseUrl);
console.log('Key (first 30):', supabaseAnonKey.substring(0, 30));

export const supabase = createClient(supabaseUrl, supabaseAnonKey)