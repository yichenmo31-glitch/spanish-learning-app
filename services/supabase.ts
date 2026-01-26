import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhdpvltpqyoplmqqswtk.supabase.co';
const supabaseKey = 'sb_publishable_fn4v5I0rVryLejCWKEprxg_IgdfSiHo';

export const supabase = createClient(supabaseUrl, supabaseKey);