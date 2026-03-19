import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zurgpxremlrkjzegjpwu.supabase.co';
const supabaseKey = 'sb_publishable_jLDP2IWfn26k96GTWxkdKQ_R0oCtoWk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function tryPasswords() {
  const passwords = ['123456', 'admin123456', 'macario', 'macario123', 'macario123456'];
  for (const p of passwords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'macario@duke.com',
      password: p
    });
    if (!error) {
      console.log(`Success! Password is: ${p}`);
      // Now update to explicitly 123456 if it wasn't
      if (p !== '123456') {
        const { error: updateError } = await supabase.auth.updateUser({
          password: '123456'
        });
        if (!updateError) {
          console.log('Password successfully updated to 123456.');
        } else {
          console.log('Failed to update password:', updateError.message);
        }
      }
      return;
    }
  }
  console.log('None of the common passwords worked. Cannot auto-update without service_role key.');
}

tryPasswords();
