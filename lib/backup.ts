
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function exportUserData(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: seizures } = await supabase
      .from('seizures')
      .select('*')
      .eq('user_id', userId)

    const { data: medications } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)

    // Return sanitized data export
    return {
      profile: {
        id: profile?.id,
        email: profile?.email,
        full_name: profile?.full_name,
        account_type: profile?.account_type,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at
      },
      seizures: seizures?.map(seizure => ({
        id: seizure.id,
        type: seizure.type,
        duration: seizure.duration,
        severity: seizure.severity,
        triggers: seizure.triggers,
        notes: seizure.notes,
        date: seizure.date,
        created_at: seizure.created_at
      })),
      medications: medications?.map(medication => ({
        id: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        notes: medication.notes,
        created_at: medication.created_at
      }))
    }
  } catch (error) {
    console.error('Error exporting user data:', error)
    throw new Error('Failed to export user data')
  }
}

export async function deleteUserData(userId: string) {
  try {
    // Delete in correct order to handle foreign key constraints
    await supabase.from('seizures').delete().eq('user_id', userId)
    await supabase.from('medications').delete().eq('user_id', userId)
    await supabase.from('user_profiles').delete().eq('id', userId)
    
    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting user data:', error)
    throw new Error('Failed to delete user data')
  }
}
