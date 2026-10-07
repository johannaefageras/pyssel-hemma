import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';

/** The typed client. Server code gets it from `locals`, pages from `data.supabase`. */
export type Supabase = SupabaseClient<Database>;
