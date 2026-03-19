import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zurgpxremlrkjzegjpwu.supabase.co';
const supabaseKey = 'sb_publishable_jLDP2IWfn26k96GTWxkdKQ_R0oCtoWk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'Admin' })
    .eq('email', 'macario@duke.com');
  
  if (error) {
    console.error('Error updating role:', error.message);
  } else {
    console.log('Role updated to Admin for macario@duke.com.');
  }
}

updateProfile();
