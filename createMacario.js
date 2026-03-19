import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zurgpxremlrkjzegjpwu.supabase.co';
const supabaseKey = 'sb_publishable_jLDP2IWfn26k96GTWxkdKQ_R0oCtoWk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'macario@duke.com',
    password: 'master',
    options: {
      data: { name: 'Macario', role: 'Admin' }
    }
  });

  if (error) {
    console.error('Error in signUp:', error.message);
    return;
  }

  if (data.user) {
    // Upsert para asegurarnos de que se actualiza o crea en perfiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      name: 'Macario',
      role: 'Admin',
      status: 'Active',
      last_access: 'Nunca'
    });
    
    if (profileError) {
      console.error('Error creating/updating profile:', profileError.message);
    } else {
      console.log('Admin account macario@duke.com created successfully with password: master');
    }
  }
}

createAdmin();
